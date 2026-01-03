import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variaveis de ambiente nao configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    console.log("Webhook subscription recebido:", JSON.stringify(body));

    const { type, data } = body;

    // Tipos de notificacao de assinatura
    if (type === "subscription_preapproval" || type === "subscription_authorized_payment") {
      const preapprovalId = data.id;

      // Buscar detalhes do preapproval
      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          },
        }
      );

      if (!mpResponse.ok) {
        console.error("Erro ao buscar preapproval:", await mpResponse.text());
        throw new Error("Erro ao buscar preapproval no MP");
      }

      const preapproval = await mpResponse.json();
      console.log("Preapproval:", JSON.stringify(preapproval));

      const { status, external_reference } = preapproval;

      // Extrair house_id e plan_id do external_reference
      // Formato: house_{house_id}_plan_{plan_id}
      const match = external_reference?.match(/house_(.+)_plan_(.+)/);
      if (!match) {
        console.error("external_reference invalido:", external_reference);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const [, house_id, plan_id] = match;

      // Mapear status do MP para status interno
      let subscriptionStatus = "pending";
      if (status === "authorized") {
        subscriptionStatus = "active";
      } else if (status === "paused") {
        subscriptionStatus = "paused";
      } else if (status === "cancelled") {
        subscriptionStatus = "canceled";
      }

      const now = new Date();

      // Atualizar casa
      const updateData: Record<string, any> = {
        mp_preapproval_id: preapprovalId,
        subscription_status: subscriptionStatus,
      };

      if (status === "authorized") {
        updateData.plan_id = plan_id;
        updateData.subscription_started_at = now.toISOString();
        updateData.pending_plan_id = null;
        updateData.pending_plan_effective_at = null;
        updateData.subscription_canceled_at = null;
        updateData.subscription_ends_at = null;
      }

      const { error: updateError } = await supabase
        .from("houses")
        .update(updateData)
        .eq("id", house_id);

      if (updateError) {
        console.error("Erro ao atualizar casa:", updateError);
      }

      // Registrar no historico
      await supabase.from("house_subscription_history").insert({
        house_id: house_id,
        plan_id: plan_id,
        action: status === "authorized" ? "activated" : status,
        notes: `Status MP: ${status}`,
      });

      console.log(`Casa ${house_id} atualizada para status: ${subscriptionStatus}`);
    }

    // Pagamento de assinatura
    if (type === "subscription_authorized_payment") {
      const paymentId = data.id;

      // Buscar detalhes do pagamento
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          },
        }
      );

      if (paymentResponse.ok) {
        const payment = await paymentResponse.json();
        console.log("Pagamento de assinatura:", JSON.stringify(payment));

        // Extrair house_id do external_reference
        const match = payment.external_reference?.match(/house_(.+)_plan_(.+)/);
        if (match) {
          const [, house_id, plan_id] = match;

          // Registrar pagamento
          if (payment.status === "approved") {
            await supabase.from("house_subscription_history").insert({
              house_id: house_id,
              plan_id: plan_id,
              action: "payment",
              amount_cents: Math.round(payment.transaction_amount * 100),
              notes: `Pagamento recorrente aprovado - MP ID: ${paymentId}`,
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro no webhook:", error);
    // Retornar 200 mesmo com erro para o MP nao reenviar
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});

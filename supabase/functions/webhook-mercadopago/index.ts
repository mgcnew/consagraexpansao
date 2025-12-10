import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variáveis de ambiente não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pegar dados do webhook
    const body = await req.json();
    console.log("Webhook recebido:", JSON.stringify(body));

    // Mercado Pago envia diferentes tipos de notificação
    const { type, data } = body;

    if (type === "payment") {
      const paymentId = data.id;

      // Buscar detalhes do pagamento na API do Mercado Pago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          },
        }
      );

      if (!mpResponse.ok) {
        console.error("Erro ao buscar pagamento:", await mpResponse.text());
        throw new Error("Erro ao buscar pagamento no MP");
      }

      const payment = await mpResponse.json();
      console.log("Pagamento:", JSON.stringify(payment));

      const {
        status,
        status_detail,
        external_reference,
        payment_method_id,
        date_approved,
      } = payment;

      // Atualizar pagamento no banco
      const { error: updateError } = await supabase
        .from("pagamentos")
        .update({
          mp_payment_id: paymentId.toString(),
          mp_status: status,
          mp_status_detail: status_detail,
          mp_payment_method: payment_method_id,
          paid_at: status === "approved" ? date_approved || new Date().toISOString() : null,
        })
        .eq("mp_external_reference", external_reference);

      if (updateError) {
        console.error("Erro ao atualizar pagamento:", updateError);
      }

      // Se aprovado, atualizar inscrição como paga
      if (status === "approved") {
        // Buscar o pagamento para pegar inscricao_id
        const { data: pagamento } = await supabase
          .from("pagamentos")
          .select("inscricao_id")
          .eq("mp_external_reference", external_reference)
          .single();

        if (pagamento?.inscricao_id) {
          const { error: inscricaoError } = await supabase
            .from("inscricoes")
            .update({ pago: true })
            .eq("id", pagamento.inscricao_id);

          if (inscricaoError) {
            console.error("Erro ao atualizar inscrição:", inscricaoError);
          } else {
            console.log("Inscrição marcada como paga:", pagamento.inscricao_id);
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
    // Retornar 200 mesmo com erro para o MP não reenviar
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});

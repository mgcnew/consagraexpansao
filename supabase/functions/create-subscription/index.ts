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
    const APP_URL = Deno.env.get("APP_URL") || "https://ahoo.vercel.app";

    if (!MP_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variaveis de ambiente nao configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verificar autenticacao
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Nao autorizado");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Usuario nao autenticado");
    }

    const body = await req.json();
    const { house_id, plan_id } = body;

    if (!house_id || !plan_id) {
      throw new Error("house_id e plan_id sao obrigatorios");
    }

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabase
      .from("house_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      throw new Error("Plano nao encontrado");
    }

    // Buscar dados da casa
    const { data: house, error: houseError } = await supabase
      .from("houses")
      .select("id, name, owner_id")
      .eq("id", house_id)
      .single();

    if (houseError || !house) {
      throw new Error("Casa nao encontrada");
    }

    // Verificar se usuario e dono da casa
    if (house.owner_id !== user.id) {
      throw new Error("Apenas o dono da casa pode assinar");
    }

    // Criar preapproval (assinatura recorrente) no Mercado Pago
    const preapprovalData = {
      reason: `Assinatura ${plan.name} - ${house.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: plan.billing_period === "yearly" ? "years" : "months",
        transaction_amount: plan.price_cents / 100,
        currency_id: "BRL",
      },
      back_url: `${APP_URL}/configuracoes?tab=assinatura`,
      payer_email: user.email,
      external_reference: `house_${house_id}_plan_${plan_id}`,
    };

    const mpResponse = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preapprovalData),
      }
    );

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Erro MP:", errorText);
      throw new Error("Erro ao criar assinatura no Mercado Pago");
    }

    const preapproval = await mpResponse.json();
    console.log("Preapproval criado:", preapproval.id);

    // Salvar referencia na casa
    const { error: updateError } = await supabase
      .from("houses")
      .update({
        mp_preapproval_id: preapproval.id,
        pending_plan_id: plan_id,
      })
      .eq("id", house_id);

    if (updateError) {
      console.error("Erro ao atualizar casa:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        init_point: preapproval.init_point,
        preapproval_id: preapproval.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

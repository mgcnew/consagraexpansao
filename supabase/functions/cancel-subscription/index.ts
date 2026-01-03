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
    const { house_id } = body;

    if (!house_id) {
      throw new Error("house_id e obrigatorio");
    }

    // Buscar dados da casa
    const { data: house, error: houseError } = await supabase
      .from("houses")
      .select("id, name, owner_id, mp_preapproval_id")
      .eq("id", house_id)
      .single();

    if (houseError || !house) {
      throw new Error("Casa nao encontrada");
    }

    // Verificar se usuario e dono da casa
    if (house.owner_id !== user.id) {
      throw new Error("Apenas o dono da casa pode cancelar");
    }

    if (!house.mp_preapproval_id) {
      throw new Error("Nenhuma assinatura ativa encontrada");
    }

    // Cancelar preapproval no Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${house.mp_preapproval_id}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      }
    );

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Erro MP:", errorText);
      // Continuar mesmo com erro no MP
    }

    // Atualizar status no banco
    const now = new Date();
    const { error: updateError } = await supabase
      .from("houses")
      .update({
        subscription_status: "canceled",
        subscription_canceled_at: now.toISOString(),
      })
      .eq("id", house_id);

    if (updateError) {
      throw new Error("Erro ao atualizar status");
    }

    // Registrar no historico
    await supabase.from("house_subscription_history").insert({
      house_id: house_id,
      plan_id: house.plan_id,
      action: "canceled",
      notes: "Cancelamento via Mercado Pago",
    });

    return new Response(
      JSON.stringify({ success: true }),
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

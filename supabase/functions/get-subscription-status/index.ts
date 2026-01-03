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

    const url = new URL(req.url);
    const house_id = url.searchParams.get("house_id");

    if (!house_id) {
      throw new Error("house_id e obrigatorio");
    }

    // Buscar dados da casa
    const { data: house, error: houseError } = await supabase
      .from("houses")
      .select("id, mp_preapproval_id, subscription_status")
      .eq("id", house_id)
      .single();

    if (houseError || !house) {
      throw new Error("Casa nao encontrada");
    }

    let mpStatus = null;

    // Se tiver preapproval, buscar status no MP
    if (house.mp_preapproval_id) {
      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${house.mp_preapproval_id}`,
        {
          headers: {
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          },
        }
      );

      if (mpResponse.ok) {
        const preapproval = await mpResponse.json();
        mpStatus = {
          id: preapproval.id,
          status: preapproval.status,
          date_created: preapproval.date_created,
          last_modified: preapproval.last_modified,
          next_payment_date: preapproval.next_payment_date,
        };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription_status: house.subscription_status,
        mp_status: mpStatus,
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

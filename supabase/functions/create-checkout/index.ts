import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  inscricao_id: string;
  cerimonia_id: string;
  cerimonia_nome: string;
  valor_centavos: number;
  user_email: string;
  user_name: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "https://seu-app.lovable.app";

    if (!MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN não configurado");
    }

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verificar usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Pegar dados do request
    const body: CheckoutRequest = await req.json();
    const { inscricao_id, cerimonia_id, cerimonia_nome, valor_centavos, user_email, user_name } = body;

    if (!inscricao_id || !valor_centavos) {
      throw new Error("Dados incompletos");
    }

    // Gerar referência externa única
    const external_reference = `cerimonia_${inscricao_id}_${Date.now()}`;

    // Criar preferência no Mercado Pago
    const preference = {
      items: [
        {
          id: cerimonia_id,
          title: `Inscrição: ${cerimonia_nome}`,
          description: `Inscrição na cerimônia ${cerimonia_nome}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: valor_centavos / 100, // MP espera em reais
        },
      ],
      payer: {
        email: user_email,
        name: user_name,
      },
      external_reference,
      back_urls: {
        success: `${APP_URL}/cerimonias?payment=success`,
        failure: `${APP_URL}/cerimonias?payment=failure`,
        pending: `${APP_URL}/cerimonias?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
    };

    // Chamar API do Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error("Erro MP:", errorData);
      throw new Error(`Erro ao criar preferência: ${mpResponse.status}`);
    }

    const mpData = await mpResponse.json();

    // Salvar pagamento no banco
    const { error: insertError } = await supabase.from("pagamentos").insert({
      user_id: user.id,
      inscricao_id,
      tipo: "cerimonia",
      valor_centavos,
      descricao: `Inscrição: ${cerimonia_nome}`,
      mp_preference_id: mpData.id,
      mp_external_reference: external_reference,
      mp_status: "pending",
    });

    if (insertError) {
      console.error("Erro ao salvar pagamento:", insertError);
      // Não falhar, o pagamento foi criado no MP
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: mpData.init_point,
        sandbox_url: mpData.sandbox_init_point,
        preference_id: mpData.id,
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

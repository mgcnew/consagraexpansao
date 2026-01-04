import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequestCerimonia {
  tipo?: 'cerimonia';
  inscricao_id: string;
  cerimonia_id: string;
  cerimonia_nome: string;
  valor_centavos: number;
  valor_original?: number;
  forma_pagamento_mp?: string;
  user_email: string;
  user_name: string;
  house_id: string;
}

interface CheckoutRequestProduto {
  tipo: 'produto';
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  valor_centavos: number;
  valor_original?: number;
  forma_pagamento_mp?: string;
  user_email: string;
  user_name: string;
  house_id: string;
}

interface CheckoutRequestCurso {
  tipo: 'curso';
  inscricao_curso_id: string;
  curso_id: string;
  curso_nome: string;
  valor_centavos: number;
  valor_original?: number;
  forma_pagamento_mp?: string;
  user_email: string;
  user_name: string;
  house_id: string;
}

type CheckoutRequest = CheckoutRequestCerimonia | CheckoutRequestProduto | CheckoutRequestCurso;

// Buscar credenciais MP da casa e calcular comissao
async function getHouseMPConfig(supabase: any, houseId: string, tipo: string) {
  // Buscar credenciais OAuth da casa
  const { data: credentials } = await supabase
    .from("house_mp_credentials")
    .select("mp_user_id, mp_access_token, is_active")
    .eq("house_id", houseId)
    .eq("is_active", true)
    .single();

  // Buscar plano da casa para pegar comissao
  const { data: house } = await supabase
    .from("houses")
    .select("plan_id, house_plans(commission_ceremonies_percent, commission_products_percent, commission_courses_percent)")
    .eq("id", houseId)
    .single();

  let commissionPercent = 10; // Default 10%
  if (house?.house_plans) {
    const plan = Array.isArray(house.house_plans) ? house.house_plans[0] : house.house_plans;
    if (tipo === 'cerimonia') {
      commissionPercent = plan.commission_ceremonies_percent || 10;
    } else if (tipo === 'produto') {
      commissionPercent = plan.commission_products_percent || 15;
    } else if (tipo === 'curso') {
      commissionPercent = plan.commission_courses_percent || 12;
    }
  }

  return {
    hasCredentials: !!credentials?.mp_user_id && !!credentials?.mp_access_token,
    mpUserId: credentials?.mp_user_id,
    commissionPercent,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "https://ahoo.vercel.app";

    if (!MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN nao configurado");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Nao autorizado");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Usuario nao autenticado");
    }

    const body: CheckoutRequest = await req.json();
    const tipo = body.tipo || 'cerimonia';
    const houseId = body.house_id;

    // Buscar configuracao MP da casa
    let mpConfig = { hasCredentials: false, mpUserId: null as string | null, commissionPercent: 10 };
    if (houseId) {
      mpConfig = await getHouseMPConfig(supabase, houseId, tipo);
    }

    let preference: any;
    let external_reference: string;
    let pagamentoData: Record<string, unknown>;
    let backUrlPath: string;
    let splitData: Record<string, unknown> | null = null;

    if (tipo === 'produto') {
      const { produto_id, produto_nome, quantidade, valor_centavos, valor_original, forma_pagamento_mp, user_email, user_name } = body as CheckoutRequestProduto;

      if (!produto_id || !valor_centavos) {
        throw new Error("Dados incompletos");
      }

      external_reference = `produto_${produto_id}_${user.id}_${Date.now()}`;
      backUrlPath = '/loja';

      preference = {
        items: [
          {
            id: produto_id,
            title: produto_nome,
            description: `Compra: ${produto_nome}`,
            quantity: quantidade,
            currency_id: "BRL",
            unit_price: (valor_centavos / quantidade) / 100,
          },
        ],
        payer: {
          email: user_email,
          name: user_name,
        },
        external_reference,
        back_urls: {
          success: `${APP_URL}${backUrlPath}?payment=success`,
          failure: `${APP_URL}${backUrlPath}?payment=failure`,
          pending: `${APP_URL}${backUrlPath}?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
      };

      // Calcular split se casa tem MP conectado
      if (mpConfig.hasCredentials && mpConfig.mpUserId) {
        const portalAmount = Math.round(valor_centavos * mpConfig.commissionPercent / 100);
        const houseAmount = valor_centavos - portalAmount;

        preference.marketplace_fee = portalAmount / 100; // Em reais
        
        splitData = {
          house_id: houseId,
          total_amount_cents: valor_centavos,
          portal_amount_cents: portalAmount,
          house_amount_cents: houseAmount,
          commission_percent: mpConfig.commissionPercent,
          commission_type: 'product',
          transfer_status: 'pending',
        };
      }

      pagamentoData = {
        house_id: houseId,
        user_id: user.id,
        produto_id,
        tipo: "produto",
        valor_centavos,
        descricao: `Compra: ${produto_nome} (${quantidade}x)`,
        mp_external_reference: external_reference,
        mp_status: "pending",
        metadata: { 
          quantidade,
          valor_original: valor_original || valor_centavos,
          forma_pagamento_mp: forma_pagamento_mp || 'nao_informado',
          taxa_aplicada: valor_centavos - (valor_original || valor_centavos),
          has_split: mpConfig.hasCredentials,
          commission_percent: mpConfig.commissionPercent,
        },
      };

    } else if (tipo === 'curso') {
      const { inscricao_curso_id, curso_id, curso_nome, valor_centavos, valor_original, forma_pagamento_mp, user_email, user_name } = body as CheckoutRequestCurso;

      if (!inscricao_curso_id || !valor_centavos) {
        throw new Error("Dados incompletos");
      }

      external_reference = `curso_${inscricao_curso_id}_${user.id}_${Date.now()}`;
      backUrlPath = '/cursos';

      preference = {
        items: [
          {
            id: curso_id,
            title: `Inscricao: ${curso_nome}`,
            description: `Inscricao no curso/evento ${curso_nome}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: valor_centavos / 100,
          },
        ],
        payer: {
          email: user_email,
          name: user_name,
        },
        external_reference,
        back_urls: {
          success: `${APP_URL}${backUrlPath}?payment=success`,
          failure: `${APP_URL}${backUrlPath}?payment=failure`,
          pending: `${APP_URL}${backUrlPath}?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
      };

      // Calcular split se casa tem MP conectado
      if (mpConfig.hasCredentials && mpConfig.mpUserId) {
        const portalAmount = Math.round(valor_centavos * mpConfig.commissionPercent / 100);
        const houseAmount = valor_centavos - portalAmount;

        preference.marketplace_fee = portalAmount / 100;
        
        splitData = {
          house_id: houseId,
          total_amount_cents: valor_centavos,
          portal_amount_cents: portalAmount,
          house_amount_cents: houseAmount,
          commission_percent: mpConfig.commissionPercent,
          commission_type: 'course',
          transfer_status: 'pending',
        };
      }

      pagamentoData = {
        house_id: houseId,
        user_id: user.id,
        curso_id,
        tipo: "curso",
        valor_centavos,
        descricao: `Inscricao: ${curso_nome}`,
        mp_external_reference: external_reference,
        mp_status: "pending",
        metadata: {
          inscricao_curso_id,
          curso_id,
          valor_original: valor_original || valor_centavos,
          forma_pagamento_mp: forma_pagamento_mp || 'nao_informado',
          taxa_aplicada: valor_centavos - (valor_original || valor_centavos),
          has_split: mpConfig.hasCredentials,
          commission_percent: mpConfig.commissionPercent,
        },
      };

    } else {
      const { inscricao_id, cerimonia_id, cerimonia_nome, valor_centavos, valor_original, forma_pagamento_mp, user_email, user_name } = body as CheckoutRequestCerimonia;

      if (!inscricao_id || !valor_centavos) {
        throw new Error("Dados incompletos");
      }

      external_reference = `cerimonia_${inscricao_id}_${user.id}_${Date.now()}`;
      backUrlPath = '/cerimonias';

      preference = {
        items: [
          {
            id: cerimonia_id,
            title: `Inscricao: ${cerimonia_nome}`,
            description: `Inscricao na cerimonia ${cerimonia_nome}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: valor_centavos / 100,
          },
        ],
        payer: {
          email: user_email,
          name: user_name,
        },
        external_reference,
        back_urls: {
          success: `${APP_URL}${backUrlPath}?payment=success`,
          failure: `${APP_URL}${backUrlPath}?payment=failure`,
          pending: `${APP_URL}${backUrlPath}?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
      };

      // Calcular split se casa tem MP conectado
      if (mpConfig.hasCredentials && mpConfig.mpUserId) {
        const portalAmount = Math.round(valor_centavos * mpConfig.commissionPercent / 100);
        const houseAmount = valor_centavos - portalAmount;

        preference.marketplace_fee = portalAmount / 100;
        
        splitData = {
          house_id: houseId,
          total_amount_cents: valor_centavos,
          portal_amount_cents: portalAmount,
          house_amount_cents: houseAmount,
          commission_percent: mpConfig.commissionPercent,
          commission_type: 'ceremony',
          transfer_status: 'pending',
        };
      }

      pagamentoData = {
        house_id: houseId,
        user_id: user.id,
        inscricao_id,
        tipo: "cerimonia",
        valor_centavos,
        descricao: `Inscricao: ${cerimonia_nome}`,
        mp_external_reference: external_reference,
        mp_status: "pending",
        metadata: {
          valor_original: valor_original || valor_centavos,
          forma_pagamento_mp: forma_pagamento_mp || 'nao_informado',
          taxa_aplicada: valor_centavos - (valor_original || valor_centavos),
          has_split: mpConfig.hasCredentials,
          commission_percent: mpConfig.commissionPercent,
        },
      };
    }

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
      throw new Error(`Erro ao criar preferencia: ${mpResponse.status}`);
    }

    const mpData = await mpResponse.json();

    // Salvar pagamento no banco
    const { data: pagamento, error: insertError } = await supabase
      .from("pagamentos")
      .insert({
        ...pagamentoData,
        mp_preference_id: mpData.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Erro ao salvar pagamento:", insertError);
    }

    // Salvar dados de split se houver
    if (splitData && pagamento?.id) {
      const { error: splitError } = await supabase
        .from("payment_splits")
        .insert({
          ...splitData,
          payment_id: pagamento.id,
        });

      if (splitError) {
        console.error("Erro ao salvar split:", splitError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: mpData.init_point,
        sandbox_url: mpData.sandbox_init_point,
        preference_id: mpData.id,
        has_split: mpConfig.hasCredentials,
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

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const MP_CLIENT_ID = Deno.env.get("MP_CLIENT_ID");
    const MP_CLIENT_SECRET = Deno.env.get("MP_CLIENT_SECRET");
    const APP_URL = Deno.env.get("APP_URL") || "https://ahoo.vercel.app";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variaveis de ambiente do Supabase nao configuradas");
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
    const { action, house_id, code, state } = body;

    // Verificar se usuario e dono da casa
    if (house_id) {
      const { data: house, error: houseError } = await supabase
        .from("houses")
        .select("id, name, owner_id")
        .eq("id", house_id)
        .single();

      if (houseError || !house) {
        throw new Error("Casa nao encontrada");
      }

      if (house.owner_id !== user.id) {
        throw new Error("Apenas o dono da casa pode gerenciar conexao MP");
      }
    }

    // ACAO: authorize - Gerar URL de autorizacao OAuth
    if (action === "authorize") {
      if (!MP_CLIENT_ID) {
        throw new Error("MP_CLIENT_ID nao configurado");
      }

      const redirectUri = `${APP_URL}/configuracoes?mp_callback=true`;
      const stateParam = `${house_id}_${Date.now()}`;
      
      const authUrl = new URL("https://auth.mercadopago.com.br/authorization");
      authUrl.searchParams.set("client_id", MP_CLIENT_ID);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("platform_id", "mp");
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("state", stateParam);

      return new Response(
        JSON.stringify({
          success: true,
          auth_url: authUrl.toString(),
          state: stateParam,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ACAO: callback - Trocar code por tokens
    if (action === "callback") {
      if (!code) {
        throw new Error("Codigo de autorizacao nao fornecido");
      }

      if (!MP_CLIENT_ID || !MP_CLIENT_SECRET) {
        throw new Error("Credenciais MP nao configuradas");
      }

      const redirectUri = `${APP_URL}/configuracoes?mp_callback=true`;

      // Trocar code por access_token
      const tokenResponse = await fetch("https://api.mercadopago.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: MP_CLIENT_ID,
          client_secret: MP_CLIENT_SECRET,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Erro ao trocar code:", errorText);
        throw new Error("Erro ao obter tokens do Mercado Pago");
      }

      const tokenData = await tokenResponse.json();
      console.log("Token obtido para user_id:", tokenData.user_id);

      // Buscar dados do usuario MP
      const userResponse = await fetch("https://api.mercadopago.com/users/me", {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
        },
      });

      let mpUserData = null;
      if (userResponse.ok) {
        mpUserData = await userResponse.json();
      }

      // Calcular expiracao do token
      const expiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      // Salvar credenciais no banco
      const { error: upsertError } = await supabase
        .from("house_mp_credentials")
        .upsert({
          house_id: house_id,
          mp_user_id: String(tokenData.user_id),
          mp_access_token: tokenData.access_token,
          mp_refresh_token: tokenData.refresh_token || null,
          mp_public_key: tokenData.public_key || null,
          mp_token_expires_at: expiresAt,
          mp_email: mpUserData?.email || null,
          mp_nickname: mpUserData?.nickname || null,
          connected_at: new Date().toISOString(),
          disconnected_at: null,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "house_id",
        });

      if (upsertError) {
        console.error("Erro ao salvar credenciais:", upsertError);
        throw new Error("Erro ao salvar credenciais");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Conta Mercado Pago conectada com sucesso",
          mp_email: mpUserData?.email,
          mp_nickname: mpUserData?.nickname,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ACAO: disconnect - Desconectar conta MP
    if (action === "disconnect") {
      const { error: updateError } = await supabase
        .from("house_mp_credentials")
        .update({
          is_active: false,
          disconnected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("house_id", house_id);

      if (updateError) {
        throw new Error("Erro ao desconectar conta");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Conta Mercado Pago desconectada",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ACAO: status - Verificar status da conexao
    if (action === "status") {
      const { data: credentials, error: credError } = await supabase
        .from("house_mp_credentials")
        .select("*")
        .eq("house_id", house_id)
        .eq("is_active", true)
        .single();

      if (credError || !credentials) {
        return new Response(
          JSON.stringify({
            success: true,
            connected: false,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // Verificar se token expirou
      const isExpired = credentials.mp_token_expires_at 
        ? new Date(credentials.mp_token_expires_at) < new Date()
        : false;

      return new Response(
        JSON.stringify({
          success: true,
          connected: true,
          mp_email: credentials.mp_email,
          mp_nickname: credentials.mp_nickname,
          mp_user_id: credentials.mp_user_id,
          connected_at: credentials.connected_at,
          token_expired: isExpired,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error("Acao invalida");

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

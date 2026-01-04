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

    // Verificar autenticacao (apenas super_admin pode executar)
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

    // Verificar se e super_admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("roles(role)")
      .eq("user_id", user.id)
      .single();

    if ((userRole?.roles as any)?.role !== "super_admin") {
      throw new Error("Apenas super_admin pode executar transferencias");
    }

    const body = await req.json();
    const { action, house_id, split_ids, amount_cents } = body;

    // ACAO: transfer - Executar transferencia PIX
    if (action === "transfer") {
      if (!house_id || !split_ids || split_ids.length === 0) {
        throw new Error("house_id e split_ids sao obrigatorios");
      }

      // Buscar dados da casa
      const { data: house, error: houseError } = await supabase
        .from("houses")
        .select("id, name, pix_key, pix_key_type, pix_holder_name")
        .eq("id", house_id)
        .single();

      if (houseError || !house) {
        throw new Error("Casa nao encontrada");
      }

      if (!house.pix_key) {
        throw new Error("Casa nao tem chave PIX cadastrada");
      }

      // Calcular valor total dos splits
      const { data: splits, error: splitsError } = await supabase
        .from("payment_splits")
        .select("id, house_amount_cents")
        .in("id", split_ids)
        .eq("transfer_status", "pending");

      if (splitsError || !splits || splits.length === 0) {
        throw new Error("Nenhum split pendente encontrado");
      }

      const totalAmount = splits.reduce((sum, s) => sum + s.house_amount_cents, 0);

      // Criar transferencia PIX via API do Mercado Pago
      // Documentacao: https://www.mercadopago.com.br/developers/pt/reference/pix-transfers/_pix_transfers/post
      const pixTransferData = {
        amount: totalAmount / 100, // Valor em reais
        description: `Repasse ${house.name} - ${splits.length} pagamento(s)`,
        receiver: {
          pix_key: house.pix_key,
          pix_key_type: house.pix_key_type?.toUpperCase() || "CPF",
        },
        external_reference: `repasse_${house_id}_${Date.now()}`,
      };

      console.log("Iniciando transferencia PIX:", pixTransferData);

      // Chamar API do Mercado Pago para transferencia PIX
      const mpResponse = await fetch("https://api.mercadopago.com/v1/pix/transfers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": pixTransferData.external_reference,
        },
        body: JSON.stringify(pixTransferData),
      });

      const mpResult = await mpResponse.json();
      console.log("Resposta MP:", mpResult);

      if (!mpResponse.ok) {
        // Se a API de PIX nao estiver disponivel, marcar como pendente manual
        console.error("Erro na API PIX:", mpResult);
        
        // Atualizar splits como pendente_manual com erro
        await supabase
          .from("payment_splits")
          .update({
            transfer_status: "pending_manual",
            transfer_error: mpResult.message || "Erro na API PIX do Mercado Pago",
            updated_at: new Date().toISOString(),
          })
          .in("id", split_ids);

        return new Response(
          JSON.stringify({
            success: false,
            error: "API PIX indisponivel. Transferencia marcada como pendente manual.",
            mp_error: mpResult,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Sucesso - atualizar splits como transferidos
      const { error: updateError } = await supabase
        .from("payment_splits")
        .update({
          transfer_status: "completed",
          transferred_at: new Date().toISOString(),
          transfer_reference: mpResult.id || pixTransferData.external_reference,
          updated_at: new Date().toISOString(),
        })
        .in("id", split_ids);

      if (updateError) {
        console.error("Erro ao atualizar splits:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Transferencia de R$ ${(totalAmount / 100).toFixed(2)} realizada para ${house.name}`,
          transfer_id: mpResult.id,
          amount: totalAmount,
          splits_count: splits.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ACAO: check_balance - Verificar saldo disponivel no MP
    if (action === "check_balance") {
      const balanceResponse = await fetch("https://api.mercadopago.com/users/me", {
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        },
      });

      if (!balanceResponse.ok) {
        throw new Error("Erro ao verificar saldo");
      }

      const userData = await balanceResponse.json();

      // Buscar saldo da conta
      const accountResponse = await fetch("https://api.mercadopago.com/v1/account/balance", {
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        },
      });

      let balance = null;
      if (accountResponse.ok) {
        balance = await accountResponse.json();
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: userData.id,
          nickname: userData.nickname,
          email: userData.email,
          balance: balance,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ACAO: mark_manual - Marcar como transferido manualmente
    if (action === "mark_manual") {
      if (!split_ids || split_ids.length === 0) {
        throw new Error("split_ids sao obrigatorios");
      }

      const reference = body.reference || `MANUAL_${Date.now()}`;

      const { error: updateError } = await supabase
        .from("payment_splits")
        .update({
          transfer_status: "completed",
          transferred_at: new Date().toISOString(),
          transfer_reference: reference,
          updated_at: new Date().toISOString(),
        })
        .in("id", split_ids);

      if (updateError) {
        throw new Error("Erro ao atualizar splits");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Repasses marcados como transferidos",
          reference,
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

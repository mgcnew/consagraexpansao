import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyMercadoPagoSignature(
  req: Request,
  secret: string
): Promise<boolean> {
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  
  if (!signature || !requestId) return false;

  const body = await req.text();
  const hmac = createHmac("sha256", secret);
  hmac.update(`${requestId}.${body}`);
  const computed = hmac.digest("hex");
  
  return computed === signature;
}

async function processPaymentSplit(supabase: any, pagamentoId: string) {
  const { data: split, error: splitError } = await supabase
    .from("payment_splits")
    .select("*, houses:house_id(name)")
    .eq("payment_id", pagamentoId)
    .single();

  if (splitError || !split) {
    console.log("Sem split para este pagamento");
    return;
  }

  const { data: credentials } = await supabase
    .from("house_mp_credentials")
    .select("mp_user_id, mp_access_token")
    .eq("house_id", split.house_id)
    .eq("is_active", true)
    .single();

  if (!credentials) {
    console.log("Casa sem credenciais MP ativas");
    await supabase
      .from("payment_splits")
      .update({
        transfer_status: "pending_manual",
        transfer_error: "Casa sem MP conectado - transferencia manual necessaria",
        updated_at: new Date().toISOString(),
      })
      .eq("id", split.id);
    return;
  }

  await supabase
    .from("payment_splits")
    .update({
      transfer_status: "completed",
      transferred_at: new Date().toISOString(),
      transfer_reference: `auto_split_mp`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", split.id);

  console.log(`Split processado: R$ ${split.house_amount_cents / 100} para casa ${split.houses?.name}`);
}

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
    console.log("Webhook recebido:", JSON.stringify(body));

    const { type, data } = body;

    if (type === "payment") {
      const paymentId = data.id;

      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
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
        fee_details,
        transaction_details,
      } = payment;

      // Buscar pagamento existente
      const { data: pagamentoExistente } = await supabase
        .from("pagamentos")
        .select("id, inscricao_id, produto_id, curso_id, user_id, tipo, house_id, metadata")
        .eq("mp_external_reference", external_reference)
        .single();

      if (!pagamentoExistente) {
        console.log("Pagamento nao encontrado para external_reference:", external_reference);
        return new Response(
          JSON.stringify({ success: false, error: "Pagamento nao encontrado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Atualizar pagamento
      await supabase
        .from("pagamentos")
        .update({
          mp_payment_id: paymentId.toString(),
          mp_status: status,
          mp_status_detail: status_detail,
          mp_payment_method: payment_method_id,
          paid_at: status === "approved" ? date_approved || new Date().toISOString() : null,
        })
        .eq("id", pagamentoExistente.id);

      // Se aprovado, processar conforme o tipo
      if (status === "approved") {
        await processPaymentSplit(supabase, pagamentoExistente.id);

        // CERIMONIA: Criar inscricao se ainda nao existe
        if (pagamentoExistente.tipo === "cerimonia" && pagamentoExistente.metadata) {
          const meta = pagamentoExistente.metadata as any;
          const cerimoniaId = meta.cerimonia_id;
          const userId = meta.user_id || pagamentoExistente.user_id;
          const houseId = pagamentoExistente.house_id;

          if (cerimoniaId && userId) {
            // Verificar se ja existe inscricao
            const { data: inscricaoExistente } = await supabase
              .from("inscricoes")
              .select("id")
              .eq("user_id", userId)
              .eq("cerimonia_id", cerimoniaId)
              .single();

            if (inscricaoExistente) {
              // Atualizar inscricao existente
              await supabase
                .from("inscricoes")
                .update({ pago: true, forma_pagamento: "online" })
                .eq("id", inscricaoExistente.id);
              
              // Atualizar pagamento com inscricao_id
              await supabase
                .from("pagamentos")
                .update({ inscricao_id: inscricaoExistente.id })
                .eq("id", pagamentoExistente.id);
              
              console.log("Inscricao existente atualizada:", inscricaoExistente.id);
            } else {
              // Criar nova inscricao
              const { data: novaInscricao, error: inscricaoError } = await supabase
                .from("inscricoes")
                .insert({
                  user_id: userId,
                  cerimonia_id: cerimoniaId,
                  house_id: houseId,
                  forma_pagamento: "online",
                  pago: true,
                })
                .select("id")
                .single();

              if (inscricaoError) {
                console.error("Erro ao criar inscricao:", inscricaoError);
              } else {
                // Atualizar pagamento com inscricao_id
                await supabase
                  .from("pagamentos")
                  .update({ inscricao_id: novaInscricao.id })
                  .eq("id", pagamentoExistente.id);
                
                console.log("Nova inscricao criada:", novaInscricao.id);
              }
            }
          }
        }

        // Se ja tinha inscricao_id (fluxo antigo), apenas marcar como pago
        if (pagamentoExistente.inscricao_id) {
          await supabase
            .from("inscricoes")
            .update({ pago: true })
            .eq("id", pagamentoExistente.inscricao_id);
          console.log("Inscricao marcada como paga:", pagamentoExistente.inscricao_id);
        }

        // CURSO: marcar inscricao do curso como paga
        if (pagamentoExistente.curso_id && pagamentoExistente.metadata) {
          const meta = pagamentoExistente.metadata as any;
          const inscricaoCursoId = meta.inscricao_curso_id;
          if (inscricaoCursoId) {
            await supabase
              .from("inscricoes_cursos")
              .update({ pago: true })
              .eq("id", inscricaoCursoId);
            console.log("Inscricao curso marcada como paga:", inscricaoCursoId);
          }
        }

        // PRODUTO: verificar se e ebook e liberar na biblioteca
        if (pagamentoExistente.produto_id && pagamentoExistente.user_id) {
          const { data: produto } = await supabase
            .from("produtos")
            .select("is_ebook, house_id")
            .eq("id", pagamentoExistente.produto_id)
            .single();

          if (produto?.is_ebook) {
            await supabase
              .from("biblioteca_usuario")
              .upsert({
                user_id: pagamentoExistente.user_id,
                produto_id: pagamentoExistente.produto_id,
                pagamento_id: pagamentoExistente.id,
                house_id: produto.house_id,
                pagina_atual: 1,
                progresso: 0,
              }, { onConflict: "user_id,produto_id" });
            console.log("Ebook liberado na biblioteca:", pagamentoExistente.produto_id);
          }
        }

        // Notificacao para o dono da casa
        if (pagamentoExistente.house_id) {
          const { data: house } = await supabase
            .from("houses")
            .select("owner_id, name")
            .eq("id", pagamentoExistente.house_id)
            .single();

          if (house?.owner_id) {
            await supabase.from("notificacoes").insert({
              user_id: house.owner_id,
              house_id: pagamentoExistente.house_id,
              tipo: "pagamento_recebido",
              titulo: "Novo pagamento recebido!",
              mensagem: `Um pagamento de ${pagamentoExistente.tipo} foi aprovado.`,
              dados: {
                pagamento_id: pagamentoExistente.id,
                tipo: pagamentoExistente.tipo,
              },
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Erro no webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Processar split de pagamento - transferir para a casa
async function processPaymentSplit(supabase: any, pagamentoId: string) {
  // Buscar dados do split
  const { data: split, error: splitError } = await supabase
    .from("payment_splits")
    .select("*, houses:house_id(name)")
    .eq("payment_id", pagamentoId)
    .single();

  if (splitError || !split) {
    console.log("Sem split para este pagamento");
    return;
  }

  // Buscar credenciais da casa
  const { data: credentials } = await supabase
    .from("house_mp_credentials")
    .select("mp_user_id, mp_access_token")
    .eq("house_id", split.house_id)
    .eq("is_active", true)
    .single();

  if (!credentials) {
    console.log("Casa sem credenciais MP ativas");
    // Marcar como pendente de transferencia manual
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

  // O split automatico do MP ja foi configurado na preferencia
  // Aqui apenas atualizamos o status
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
        fee_details,
        transaction_details,
      } = payment;

      // Atualizar pagamento no banco
      const { data: pagamentoAtualizado, error: updateError } = await supabase
        .from("pagamentos")
        .update({
          mp_payment_id: paymentId.toString(),
          mp_status: status,
          mp_status_detail: status_detail,
          mp_payment_method: payment_method_id,
          paid_at: status === "approved" ? date_approved || new Date().toISOString() : null,
          metadata: supabase.sql`metadata || ${JSON.stringify({
            fee_details: fee_details,
            net_received_amount: transaction_details?.net_received_amount,
          })}::jsonb`,
        })
        .eq("mp_external_reference", external_reference)
        .select("id, inscricao_id, produto_id, curso_id, user_id, tipo, house_id")
        .single();

      if (updateError) {
        console.error("Erro ao atualizar pagamento:", updateError);
      }

      // Se aprovado, processar conforme o tipo
      if (status === "approved" && pagamentoAtualizado) {
        // Processar split de pagamento
        await processPaymentSplit(supabase, pagamentoAtualizado.id);

        // Se for cerimonia, marcar inscricao como paga
        if (pagamentoAtualizado.inscricao_id) {
          const { error: inscricaoError } = await supabase
            .from("inscricoes")
            .update({ pago: true })
            .eq("id", pagamentoAtualizado.inscricao_id);

          if (inscricaoError) {
            console.error("Erro ao atualizar inscricao:", inscricaoError);
          } else {
            console.log("Inscricao marcada como paga:", pagamentoAtualizado.inscricao_id);
          }
        }

        // Se for curso, marcar inscricao do curso como paga
        if (pagamentoAtualizado.curso_id) {
          // Buscar inscricao_curso_id do metadata
          const { data: pagamentoCompleto } = await supabase
            .from("pagamentos")
            .select("metadata")
            .eq("id", pagamentoAtualizado.id)
            .single();

          const inscricaoCursoId = pagamentoCompleto?.metadata?.inscricao_curso_id;
          if (inscricaoCursoId) {
            const { error: cursoError } = await supabase
              .from("inscricoes_cursos")
              .update({ pago: true })
              .eq("id", inscricaoCursoId);

            if (cursoError) {
              console.error("Erro ao atualizar inscricao curso:", cursoError);
            } else {
              console.log("Inscricao curso marcada como paga:", inscricaoCursoId);
            }
          }
        }

        // Se for produto, verificar se e ebook e liberar na biblioteca
        if (pagamentoAtualizado.produto_id && pagamentoAtualizado.user_id) {
          const { data: produto } = await supabase
            .from("produtos")
            .select("is_ebook, house_id")
            .eq("id", pagamentoAtualizado.produto_id)
            .single();

          if (produto?.is_ebook) {
            const { error: bibliotecaError } = await supabase
              .from("biblioteca_usuario")
              .upsert({
                user_id: pagamentoAtualizado.user_id,
                produto_id: pagamentoAtualizado.produto_id,
                pagamento_id: pagamentoAtualizado.id,
                house_id: produto.house_id,
                pagina_atual: 1,
                progresso: 0,
              }, { onConflict: "user_id,produto_id" });

            if (bibliotecaError) {
              console.error("Erro ao adicionar a biblioteca:", bibliotecaError);
            } else {
              console.log("Ebook liberado na biblioteca:", pagamentoAtualizado.produto_id);
            }
          }
        }

        // Criar notificacao para o dono da casa
        if (pagamentoAtualizado.house_id) {
          const { data: house } = await supabase
            .from("houses")
            .select("owner_id, name")
            .eq("id", pagamentoAtualizado.house_id)
            .single();

          if (house?.owner_id) {
            await supabase.from("notificacoes").insert({
              user_id: house.owner_id,
              house_id: pagamentoAtualizado.house_id,
              tipo: "pagamento_recebido",
              titulo: "Novo pagamento recebido!",
              mensagem: `Um pagamento de ${pagamentoAtualizado.tipo} foi aprovado.`,
              dados: {
                pagamento_id: pagamentoAtualizado.id,
                tipo: pagamentoAtualizado.tipo,
              },
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
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});

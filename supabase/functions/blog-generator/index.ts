import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Voce e um redator especializado em criar artigos para o blog do Ahoo - uma plataforma de gestao para casas de consagracao e cerimonias com medicinas sagradas.

## SEU PAPEL

Criar artigos de blog otimizados para SEO sobre:
- Gestao de casas de consagracao
- Medicinas sagradas (Ayahuasca, Rape, Sananga, Kambo)
- Preparacao para cerimonias
- Dicas para donos de casas
- Espiritualidade e consciencia
- Boas praticas de gestao

## FORMATO DO ARTIGO

Retorne SEMPRE um JSON valido com esta estrutura:
{
  "title": "Titulo do artigo (max 60 caracteres)",
  "slug": "titulo-do-artigo-em-slug",
  "excerpt": "Resumo do artigo em 1-2 frases (max 160 caracteres)",
  "content": "<p>Conteudo HTML do artigo...</p>",
  "meta_title": "Titulo SEO (max 60 caracteres)",
  "meta_description": "Descricao SEO (max 160 caracteres)",
  "tags": ["tag1", "tag2", "tag3"]
}

## REGRAS PARA O CONTEUDO HTML

1. Use tags HTML semanticas: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>
2. Estruture com subtitulos <h2> e <h3>
3. Paragrafos curtos (3-4 linhas)
4. Use listas quando apropriado
5. Inclua uma introducao e conclusao
6. Tamanho ideal: 800-1500 palavras
7. Tom: profissional mas acolhedor
8. NAO use acentos no conteudo (use "e" em vez de "é", etc.)

## REGRAS SEO

1. Titulo com palavra-chave principal
2. Meta description com call-to-action
3. Subtitulos com palavras-chave secundarias
4. Tags relevantes (3-5 tags)
5. Conteudo original e util

## EXEMPLO DE ESTRUTURA HTML

<p>Introducao do artigo...</p>

<h2>Primeiro Subtitulo</h2>
<p>Conteudo do primeiro topico...</p>

<h2>Segundo Subtitulo</h2>
<p>Conteudo do segundo topico...</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

<h2>Conclusao</h2>
<p>Fechamento do artigo...</p>`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type = 'full' } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let userPrompt = '';
    
    if (type === 'full') {
      userPrompt = `Crie um artigo completo sobre: "${prompt}"

Retorne APENAS o JSON valido, sem markdown ou texto adicional.`;
    } else if (type === 'improve') {
      userPrompt = `Melhore e expanda este conteudo de artigo: "${prompt}"

Retorne APENAS o JSON valido com o artigo melhorado.`;
    } else if (type === 'seo') {
      userPrompt = `Gere apenas os campos SEO (meta_title, meta_description, tags) para este artigo: "${prompt}"

Retorne APENAS um JSON com: { "meta_title": "...", "meta_description": "...", "tags": [...] }`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate article');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    // Tentar parsear o JSON da resposta
    let articleData;
    try {
      // Remover possíveis marcadores de código markdown
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      articleData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse article data');
    }

    return new Response(
      JSON.stringify({ success: true, data: articleData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Blog generator error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

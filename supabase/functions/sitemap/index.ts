import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://ahoo.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar casas publicas ativas
    const { data: houses, error } = await supabase
      .from("houses")
      .select("slug, updated_at")
      .eq("active", true)
      .eq("visibility", "public");

    if (error) throw error;

    // Paginas estaticas
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "weekly" },
      { url: "/buscar-casas", priority: "0.9", changefreq: "daily" },
      { url: "/auth", priority: "0.5", changefreq: "monthly" },
    ];

    // Gerar XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Adicionar paginas estaticas
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Adicionar paginas das casas
    if (houses) {
      for (const house of houses) {
        const lastmod = house.updated_at 
          ? new Date(house.updated_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        
        xml += `  <url>
    <loc>${SITE_URL}/casa/${house.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate sitemap" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

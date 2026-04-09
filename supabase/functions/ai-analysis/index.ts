import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;

    // Check admin role
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sbAdmin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await sbAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch data for analysis
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [bookingsRes, prevBookingsRes, toursRes, reviewsRes, leadsRes] = await Promise.all([
      sbAdmin.from("bookings").select("item_name, final_total, status, type, pay_method, created_at").gte("created_at", startOfMonth),
      sbAdmin.from("bookings").select("item_name, final_total, status, type").gte("created_at", prevMonthStart).lt("created_at", startOfMonth),
      sbAdmin.from("tours").select("name, price, pix_discount, rating, reviews_count").eq("active", true),
      sbAdmin.from("reviews").select("rating, created_at").gte("created_at", prevMonthStart),
      sbAdmin.from("marketing_leads").select("status, source, score"),
    ]);

    const bookings = bookingsRes.data || [];
    const prevBookings = prevBookingsRes.data || [];
    const tours = toursRes.data || [];
    const reviews = reviewsRes.data || [];
    const leads = leadsRes.data || [];

    // Build analysis context
    const totalRevenue = bookings.reduce((a, b) => a + (b.final_total || 0), 0);
    const prevRevenue = prevBookings.reduce((a, b) => a + (b.final_total || 0), 0);
    const confirmed = bookings.filter(b => b.status === "confirmada").length;
    const convRate = bookings.length > 0 ? ((confirmed / bookings.length) * 100).toFixed(1) : "0";
    const pixCount = bookings.filter(b => b.pay_method === "pix").length;
    const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "N/A";
    const hotLeads = leads.filter(l => l.status === "quente").length;

    // Tour demand
    const tourMap: Record<string, number> = {};
    bookings.filter(b => b.type === "passeio").forEach(b => {
      tourMap[b.item_name] = (tourMap[b.item_name] || 0) + 1;
    });
    const topTours = Object.entries(tourMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const dataContext = `
DADOS DO MÊS ATUAL:
- Reservas: ${bookings.length} (mês anterior: ${prevBookings.length})
- Receita: R$ ${(totalRevenue / 100).toFixed(2)} (mês anterior: R$ ${(prevRevenue / 100).toFixed(2)})
- Taxa de conversão: ${convRate}%
- Pagamentos PIX: ${pixCount} de ${bookings.length}
- Avaliação média: ${avgRating}/5 (${reviews.length} avaliações recentes)
- Leads quentes: ${hotLeads} de ${leads.length} total

PASSEIOS MAIS RESERVADOS:
${topTours.map(([name, count], i) => `${i + 1}. ${name}: ${count} reservas`).join("\n")}

PASSEIOS CADASTRADOS: ${tours.length}
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um analista de negócios especializado em turismo de aventura. Analise os dados da LençóisTour e forneça insights acionáveis em português brasileiro. Seja direto e objetivo. Use formatação Markdown com headers ##, bullet points e **negrito** para destaque. Organize em seções: Resumo Executivo, Tendências, Oportunidades, Riscos e Ações Recomendadas. Máximo 500 palavras.`,
          },
          {
            role: "user",
            content: `Analise os seguintes dados operacionais e gere um relatório de insights:\n${dataContext}`,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "Sem dados suficientes para análise.";

    return new Response(JSON.stringify({ analysis: content, data: { totalRevenue, prevRevenue, bookings: bookings.length, prevBookings: prevBookings.length, convRate, pixCount, avgRating, hotLeads, totalLeads: leads.length, topTours } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-analysis error:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

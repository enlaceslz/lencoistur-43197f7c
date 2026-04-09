import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Você é a assistente virtual da LençóisTour, a principal agência de turismo dos Lençóis Maranhenses, em Santo Amaro do Maranhão, Brasil.

Seu papel:
- Ajudar turistas com informações sobre passeios, preços, datas e roteiros
- Sugerir passeios baseado nas preferências do turista
- Responder dúvidas sobre a região dos Lençóis Maranhenses e Santo Amaro
- Auxiliar no processo de reserva

Informações gerais:
- Melhor época: Junho a Setembro (lagoas cheias)
- Base: Santo Amaro do Maranhão, MA
- Site: lencoistur.lovable.app
- WhatsApp: (98) 99999-9999

Regras:
- Sempre responda em português brasileiro, mas entenda perguntas em inglês, espanhol e francês
- Seja simpático, acolhedor e entusiasta
- Use emojis moderadamente
- Quando o turista demonstrar interesse, sugira reservar pelo site ou WhatsApp
- Se não souber algo, diga que vai verificar com a equipe
- Não invente informações sobre preços ou disponibilidade além do fornecido
- Mantenha respostas concisas (máx 300 palavras)`;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;
const VALID_ROLES = ["user", "assistant"];

// Cache tour/transfer data for 5 minutes
let cachedPrompt: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function buildSystemPrompt(): Promise<string> {
  const now = Date.now();
  if (cachedPrompt && now - cacheTime < CACHE_TTL) return cachedPrompt;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const [toursRes, transfersRes] = await Promise.all([
      sb.from("tours").select("name, price, duration, location, category, pix_discount, description").eq("active", true).order("name"),
      sb.from("transfer_routes").select("origin, destination, price, duration, vehicle_type, pix_discount").eq("active", true).order("origin"),
    ]);

    let tourSection = "";
    if (toursRes.data?.length) {
      tourSection = "\n\nPasseios disponíveis:\n" + toursRes.data.map((t, i) => {
        const price = (t.price / 100).toFixed(0);
        const pix = t.pix_discount > 0 ? ` (${t.pix_discount}% desc. PIX)` : "";
        return `${i + 1}. ${t.name} - R$${price}/pessoa${pix} - ${t.duration || "Meio dia"} - ${t.location || "Santo Amaro"}${t.description ? ` - ${t.description.slice(0, 100)}` : ""}`;
      }).join("\n");
    }

    let transferSection = "";
    if (transfersRes.data?.length) {
      transferSection = "\n\nTranslados:\n" + transfersRes.data.map((t) => {
        const price = (t.price / 100).toFixed(0);
        const pix = t.pix_discount > 0 ? ` (${t.pix_discount}% desc. PIX)` : "";
        return `- ${t.origin} → ${t.destination}: R$${price}${pix} (${t.vehicle_type || "Van"}, ${t.duration || "N/A"})`;
      }).join("\n");
    }

    cachedPrompt = BASE_SYSTEM_PROMPT + tourSection + transferSection;
    cacheTime = now;
    return cachedPrompt;
  } catch (err) {
    console.error("Failed to load dynamic data:", err);
    return BASE_SYSTEM_PROMPT;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: `Máximo de ${MAX_MESSAGES} mensagens permitidas.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedMessages = [];
    for (const msg of messages) {
      if (!msg || typeof msg.content !== "string" || typeof msg.role !== "string") {
        return new Response(JSON.stringify({ error: "Formato de mensagem inválido." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!VALID_ROLES.includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Role de mensagem inválido." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(JSON.stringify({ error: `Mensagem excede ${MAX_MESSAGE_LENGTH} caracteres.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sanitizedMessages.push({ role: msg.role, content: msg.content.trim() });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = await buildSystemPrompt();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

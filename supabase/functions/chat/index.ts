import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a assistente virtual da LençóisTour, a principal agência de turismo dos Lençóis Maranhenses, no Maranhão, Brasil.

Seu papel:
- Ajudar turistas com informações sobre passeios, preços, datas e roteiros
- Sugerir passeios baseado nas preferências do turista
- Responder dúvidas sobre a região dos Lençóis Maranhenses
- Auxiliar no processo de reserva

Passeios disponíveis:
1. Lagoa Azul (dia inteiro) - R$180/pessoa - O mais famoso dos Lençóis
2. Lagoa Bonita (meio dia) - R$160/pessoa - Vista panorâmica incrível  
3. Atins & Caburé (dia inteiro) - R$220/pessoa - Vila de pescadores + farol
4. Santo Amaro (dia inteiro) - R$380/pessoa - Lagoas desertas e exclusivas
5. Sobrevoo de Avião - R$450/pessoa - Vista aérea dos Lençóis
6. Passeio de Barco Rio Preguiças - R$150/pessoa - Fauna e flora
7. Trilha do Morro do Boi - R$120/pessoa - Caminhada com vista
8. Kitesurf em Atins - R$280/pessoa - Esporte radical

Translados:
- São Luís → Barreirinhas: R$120 (Van, 4h)
- Barreirinhas → Atins: R$80 (Lancha/4x4, 1h30)

Informações gerais:
- Melhor época: Junho a Setembro (lagoas cheias)
- Base: Barreirinhas, MA
- WhatsApp: (98) 99999-9999

Regras:
- Sempre responda em português brasileiro
- Seja simpático, acolhedor e entusiasta
- Use emojis moderadamente
- Quando o turista demonstrar interesse, sugira reservar pelo site ou WhatsApp
- Se não souber algo, diga que vai verificar com a equipe
- Não invente informações sobre preços ou disponibilidade além do fornecido`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

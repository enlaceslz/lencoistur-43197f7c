import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function previewEmail(email: string): string {
  const [local = "", domain = ""] = email.toLowerCase().split("@");
  return `${local.slice(0, 3)}***@${domain || "***"}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", claimsData.claims.sub)
      .eq("role", "admin")
      .limit(1);

    if (roleError || !roleRows?.length) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const { customerEmail, customerName, signUrl, tourName } = await req.json();
    const normalizedEmail = typeof customerEmail === "string" ? customerEmail.trim().toLowerCase() : "";

    if (
      !isValidEmail(normalizedEmail) ||
      typeof customerName !== "string" || customerName.trim().length < 2 || customerName.trim().length > 120 ||
      typeof tourName !== "string" || tourName.trim().length < 2 || tourName.trim().length > 160 ||
      typeof signUrl !== "string" || signUrl.length > 2000
    ) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(signUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!(parsedUrl.protocol === "https:" || parsedUrl.hostname === "localhost")) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // This function will eventually use Resend or another provider.
    // For now, it logs the action.
    console.log("Authorized term email request", {
      customerEmail: previewEmail(normalizedEmail),
      tourName: tourName.trim().slice(0, 120),
      signPath: `${parsedUrl.pathname}${parsedUrl.search}`,
      requestedBy: claimsData.claims.sub,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

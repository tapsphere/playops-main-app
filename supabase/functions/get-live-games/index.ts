import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  try {
    const { data, error } = await supabase
      .from("brand_customizations")
      .select(
        `
        id,
        template_id,
        brand_id,
        published_at,
        primary_color,
        secondary_color
        `
      )
      .not("published_at", "is", null);

    if (error) {
      console.error("Supabase query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    const liveGames = data.map((item: any) => ({
      id: item.id,
      unique_code: item.id, // Using customization id as unique code
      brand_id: item.brand_id,
      logo_url: null, // Not fetched in simplified query
      primary_color: item.primary_color || "#00ff00", // Default if not set
      secondary_color: item.secondary_color || "#ff00ff", // Default if not set
      brand_name: null, // Not fetched in simplified query
      game_templates: {
        name: "Simplified Game", // Placeholder for simplified query
        preview_image: null, // Not fetched in simplified query
      },
    }));

    return new Response(JSON.stringify(liveGames), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
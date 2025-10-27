import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customizationId, published, live_start_date, live_end_date, visibility } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser((req.headers.get('Authorization') || '').replace('Bearer ', ''));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: existingCustomization, error: selectError } = await supabase
      .from('brand_customizations')
      .select('brand_id')
      .eq('id', customizationId)
      .single();

    if (selectError || !existingCustomization) {
      return new Response(JSON.stringify({ error: 'Customization not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (existingCustomization.brand_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const updateData: any = {};
    if (published !== undefined) {
      updateData.published_at = published ? new Date().toISOString() : null;
    }
    if (live_start_date) {
      updateData.live_start_date = live_start_date;
    }
    if (live_end_date) {
      updateData.live_end_date = live_end_date;
    }
    if (visibility) {
      updateData.visibility = visibility;
    }

    const { error: updateError } = await supabase
      .from('brand_customizations')
      .update(updateData)
      .eq('id', customizationId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Game updated successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

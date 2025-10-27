
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The combined SQL from the two migration files
const MIGRATION_SQL = `
  -- From 20251025100000_add_admin_role.sql
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

  DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Users can insert their own roles on signup" ON public.user_roles;
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

  CREATE POLICY "Users can manage their own roles" 
  ON public.user_roles FOR ALL
  USING (auth.uid() = user_id);

  CREATE POLICY "Admins have full access to user_roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

  CREATE POLICY "Users can manage their own profile" 
  ON public.profiles FOR ALL
  USING (auth.uid() = user_id);

  CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

  CREATE POLICY "Admins can manage all game_templates"
  ON public.game_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

  CREATE POLICY "Admins can manage all brand_customizations"
  ON public.brand_customizations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

  CREATE POLICY "Admins can manage all game_results"
  ON public.game_results FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

  -- From 20251025150000_fix_rls_policies.sql
  DROP POLICY IF EXISTS "Users can manage their own roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins have full access to user_roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

  CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own roles on signup"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Admins can manage all user_roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

  CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Executing migration SQL...');
    const { error } = await supabase.rpc('eval', { value: MIGRATION_SQL });

    if (error) {
      console.error('Migration error:', error);
      throw error;
    }

    console.log('Migrations applied successfully!');

    return new Response(
      JSON.stringify({ success: true, message: 'Migrations applied successfully!' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in migration function:', error);
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

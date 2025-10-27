-- Add 'admin' to the app_role enum
ALTER TYPE public.app_role ADD VALUE 'admin';

-- RLS Policies for Admin
-- Grant admins full access to all major tables.

-- Stop existing policies from blocking admin access
-- We will re-apply more permissive policies below
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles on signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- New Permissive Policies

-- For user_roles
CREATE POLICY "Users can manage their own roles" 
ON public.user_roles FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to user_roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- For profiles
CREATE POLICY "Users can manage their own profile" 
ON public.profiles FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to profiles"
ON public.profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- For other tables, we can just add admin policies alongside existing ones.

CREATE POLICY "Admins can manage all game_templates"
ON public.game_templates FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all brand_customizations"
ON public.brand_customizations FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all game_results"
ON public.game_results FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

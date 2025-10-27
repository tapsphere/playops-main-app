CREATE OR REPLACE FUNCTION public.get_users_by_role(role_name TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    p.full_name,
    p.wallet_address,
    u.created_at
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.user_id
  JOIN public.user_roles ur ON u.id = ur.user_id
  WHERE ur.role = role_name::public.app_role;
END;
$$ LANGUAGE plpgsql;

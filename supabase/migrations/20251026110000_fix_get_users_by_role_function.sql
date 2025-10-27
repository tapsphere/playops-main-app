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
  WHERE u.raw_user_meta_data->>'role' = role_name;
END;
$$ LANGUAGE plpgsql;

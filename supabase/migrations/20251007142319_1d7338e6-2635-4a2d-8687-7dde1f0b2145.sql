-- Add RLS policy to allow public to see brand profiles for live games
CREATE POLICY "Public can view brand profiles for live games"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM brand_customizations 
    WHERE brand_customizations.brand_id = profiles.user_id
    AND brand_customizations.published_at IS NOT NULL
    AND brand_customizations.unique_code IS NOT NULL
  )
);
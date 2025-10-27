-- Add live timeframe fields to brand_customizations
ALTER TABLE public.brand_customizations
ADD COLUMN live_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN live_end_date TIMESTAMP WITH TIME ZONE;

-- Add index for querying live games
CREATE INDEX idx_brand_customizations_live_dates 
ON public.brand_customizations(live_start_date, live_end_date) 
WHERE published_at IS NOT NULL;
-- Add DELETE policy for work_preferences table
-- This allows users to delete their own work preference data
CREATE POLICY "Users can delete their own preferences"
ON public.work_preferences
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
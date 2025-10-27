import { supabase } from '@/integrations/supabase/client';

export const uploadFile = async (file: File) => {
  if (!file) return null;

  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return publicUrl;
};
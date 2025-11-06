import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const OnboardingForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
    bio: '',
    company_name: '',
    company_description: '',
    wallet_address: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { completePlayerOnboarding } = useAuth();

  useEffect(() => {
    const fetchUserWallet = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata.wallet_address) {
        setFormData(prev => ({ ...prev, wallet_address: user.user_metadata.wallet_address }));
      }
    };
    fetchUserWallet();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.name === 'avatar_url') {
        setAvatarFile(e.target.files[0]);
      } else if (e.target.name === 'company_logo_url') {
        setCompanyLogoFile(e.target.files[0]);
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast({ title: 'Please enter a name.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await completePlayerOnboarding(formData, avatarFile, companyLogoFile);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({ title: 'Failed to create profile', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-gray-900 border-neon-green">
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'hsl(var(--neon-green))' }}>
          Complete Your Profile
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Tell us a bit about yourself to get started.
        </p>
        
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div>
            <Label htmlFor="full_name" className="text-white">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Your Name or Nickname"
              value={formData.full_name}
              onChange={handleInputChange}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="wallet_address" className="text-white">Wallet Address</Label>
            <Input
              id="wallet_address"
              name="wallet_address"
              value={formData.wallet_address}
              disabled
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="avatar_url" className="text-white">Profile Picture</Label>
            <Input id="avatar_url" name="avatar_url" type="file" onChange={handleFileChange} className="bg-gray-800 border-gray-700 text-white file:text-gray-400" />
          </div>

          <Separator className="my-6 bg-gray-700" />

          <div>
            <Label htmlFor="location" className="text-white">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., City, Country"
              value={formData.location}
              onChange={handleInputChange}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="bio" className="text-white">Short Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="A short bio about yourself"
              value={formData.bio}
              onChange={handleInputChange}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <Separator className="my-6 bg-gray-700" />

          <h2 className="text-lg font-semibold text-center text-gray-400">Company Information (Optional)</h2>

          <div>
            <Label htmlFor="company_name" className="text-white">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Your Company"
              value={formData.company_name}
              onChange={handleInputChange}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="company_description" className="text-white">Company Description</Label>
            <Textarea
              id="company_description"
              name="company_description"
              placeholder="What your company does"
              value={formData.company_description}
              onChange={handleInputChange}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label htmlFor="company_logo_url" className="text-white">Company Logo</Label>
            <Input id="company_logo_url" name="company_logo_url" type="file" onChange={handleFileChange} className="bg-gray-800 border-gray-700 text-white file:text-gray-400" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save and Enter'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
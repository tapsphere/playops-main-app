import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { uploadFile } from '@/utils/supabase';

import { useAuth } from '@/contexts/AuthContext';

export const OnboardingForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
    bio: '',
    company_name: '',
    company_description: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { completeOnboarding } = useAuth();

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

  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleProfileUpdate = async () => {
    if (!formData.full_name.trim()) {
      toast({ title: 'Please enter a name.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile);
      }

      let companyLogoUrl = null;
      if (companyLogoFile) {
        companyLogoUrl = await uploadFile(companyLogoFile);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          location: formData.location,
          bio: formData.bio,
          company_name: formData.company_name,
          company_description: formData.company_description,
          avatar_url: avatarUrl,
          company_logo_url: companyLogoUrl,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Profile created successfully!' });
      completeOnboarding();
      navigate(redirectPath || '/lobby');

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({ title: 'Failed to create profile', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gray-900/50 border-neon-green/30 space-y-6">
      {step === 1 && (
        <div>
          <h3 className="text-xl font-bold text-white">Basic Information</h3>
          <div className="grid gap-4 py-4">
            <Input
              id="full_name"
              name="full_name"
              placeholder="Your Name or Nickname"
              value={formData.full_name}
              onChange={handleInputChange}
            />
            <div>
              <label htmlFor="avatar_url" className="text-sm font-medium text-gray-400">Profile Picture</label>
              <Input id="avatar_url" name="avatar_url" type="file" onChange={handleFileChange} />
            </div>
          </div>
          <Button onClick={handleNextStep}>Next</Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-xl font-bold text-white">Professional Information</h3>
          <div className="grid gap-4 py-4">
            <Input
              id="location"
              name="location"
              placeholder="Your Location (e.g., City, Country)"
              value={formData.location}
              onChange={handleInputChange}
            />
            <Textarea
              id="bio"
              name="bio"
              placeholder="A short bio about yourself"
              value={formData.bio}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStep}>Back</Button>
            <Button onClick={handleNextStep}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="text-xl font-bold text-white">Company Information (Optional)</h3>
          <div className="grid gap-4 py-4">
            <Input
              id="company_name"
              name="company_name"
              placeholder="Company Name"
              value={formData.company_name}
              onChange={handleInputChange}
            />
            <Textarea
              id="company_description"
              name="company_description"
              placeholder="Company Description"
              value={formData.company_description}
              onChange={handleInputChange}
            />
            <div>
              <label htmlFor="company_logo_url" className="text-sm font-medium text-gray-400">Company Logo</label>
              <Input id="company_logo_url" name="company_logo_url" type="file" onChange={handleFileChange} />
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStep}>Back</Button>
            <Button onClick={handleProfileUpdate} disabled={loading}>
              {loading ? 'Saving...' : 'Save and Enter'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
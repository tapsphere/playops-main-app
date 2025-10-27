
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const BrandOnboardingForm = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    usage: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async () => {
    if (!formData.company_name.trim() || !formData.industry.trim()) {
      toast({ title: 'Please fill out all required fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: formData.company_name,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      // You might want a separate table for this extra brand info too.
      console.log('Brand onboarding data:', formData);

      toast({ title: 'Brand profile updated!' });
      completeOnboarding();
      navigate('/platform/brand');

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({ title: 'Failed to update profile', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gray-900/50 border-neon-green/30 space-y-6 max-w-lg mx-auto">
        <div>
          <h3 className="text-xl font-bold text-white">Brand Onboarding</h3>
          <p className="text-gray-400">Tell us about your company.</p>
          <div className="grid gap-4 py-4">
            <Input
              id="company_name"
              name="company_name"
              placeholder="Your company's name"
              value={formData.company_name}
              onChange={handleInputChange}
            />
            <Input
              id="industry"
              name="industry"
              placeholder="Your company's industry"
              value={formData.industry}
              onChange={handleInputChange}
            />
            <Textarea
              id="usage"
              name="usage"
              placeholder="How do you plan to use the game templates?"
              value={formData.usage}
              onChange={handleInputChange}
            />
          </div>
          <Button onClick={handleProfileUpdate} disabled={loading}>
            {loading ? 'Saving...' : 'Complete Onboarding'}
          </Button>
        </div>
    </Card>
  );
};

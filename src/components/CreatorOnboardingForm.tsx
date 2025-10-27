
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const CreatorOnboardingForm = () => {
  const [formData, setFormData] = useState({
    expertise: '',
    interest: '',
    portfolio: '',
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
    if (!formData.expertise.trim() || !formData.interest.trim()) {
      toast({ title: 'Please fill out all required fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Here you would typically save this extra info to a 'creator_profiles' table
      // For now, we'll just log it and complete the onboarding.
      console.log('Creator onboarding data:', formData);

      toast({ title: 'Creator profile updated!' });
      completeOnboarding();
      navigate('/platform/creator');

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
          <h3 className="text-xl font-bold text-white">Creator Onboarding</h3>
          <p className="text-gray-400">Tell us a bit about your skills and interests.</p>
          <div className="grid gap-4 py-4">
            <Input
              id="expertise"
              name="expertise"
              placeholder="Primary area of expertise (e.g., Game Design)"
              value={formData.expertise}
              onChange={handleInputChange}
            />
            <Textarea
              id="interest"
              name="interest"
              placeholder="Describe the types of game templates you want to create."
              value={formData.interest}
              onChange={handleInputChange}
            />
            <Input
              id="portfolio"
              name="portfolio"
              placeholder="Portfolio or work examples (optional)"
              value={formData.portfolio}
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

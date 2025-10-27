import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Upload } from 'lucide-react';

export default function BrandProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, company_description, company_logo_url')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCompanyName(data.company_name || '');
        setCompanyDescription(data.company_description || '');
        setCompanyLogoUrl(data.company_logo_url || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: companyName,
          company_description: companyDescription,
          company_logo_url: companyLogoUrl,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Company profile updated successfully!');
      navigate('/platform/brand');
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate('/platform/brand')}
        className="mb-6"
        style={{ color: 'hsl(var(--neon-green))' }}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card className="bg-gray-900 border-gray-800 p-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'hsl(var(--neon-green))' }}>
          Edit Company Profile
        </h2>

        <div className="space-y-6">
          {/* Company Logo Preview */}
          <div>
            <Label className="text-white mb-2">Company Logo</Label>
            <div className="flex items-center gap-4 mt-2">
              <div
                className="w-24 h-24 rounded-lg border-2 flex items-center justify-center bg-black/50"
                style={{ borderColor: 'hsl(var(--neon-green))' }}
              >
                {companyLogoUrl ? (
                  <img
                    src={companyLogoUrl}
                    alt="Company Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Building2 className="w-12 h-12" style={{ color: 'hsl(var(--neon-green))' }} />
                )}
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Logo URL (e.g., https://example.com/logo.png)"
                  value={companyLogoUrl}
                  onChange={(e) => setCompanyLogoUrl(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL to your company logo image
                </p>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="company-name" className="text-white mb-2">
              Company Name *
            </Label>
            <Input
              id="company-name"
              placeholder="Your Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Company Description */}
          <div>
            <Label htmlFor="company-description" className="text-white mb-2">
              Company Description *
            </Label>
            <Textarea
              id="company-description"
              placeholder="Tell players about your company and what makes your games special..."
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
            />
          </div>

          {/* Preview Link */}
          {userId && companyName && (
            <div className="bg-black/50 border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Your public brand page will be at:</p>
              <code className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green))' }}>
                {window.location.origin}/brand/{userId}
              </code>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/platform/brand')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !companyName || !companyDescription}
              className="flex-1 bg-neon-green text-white hover:bg-neon-green/90"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

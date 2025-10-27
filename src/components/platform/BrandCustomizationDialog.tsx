import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, Copy, Palette } from 'lucide-react';

interface BrandCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    id: string;
    name: string;
    description: string | null;
    base_prompt: string | null;
  };
  onSuccess: () => void;
}

export const BrandCustomizationDialog = ({
  open,
  onOpenChange,
  template,
  onSuccess,
}: BrandCustomizationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#00FF00');
  const [secondaryColor, setSecondaryColor] = useState('#9945FF');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editablePrompt, setEditablePrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [gamePreviewUrl, setGamePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (template.base_prompt && !editablePrompt) {
      setEditablePrompt(template.base_prompt);
    }
  }, [template]);

  useEffect(() => {
    if (editablePrompt) {
      generateBrandedPrompt();
    }
  }, [editablePrompt, primaryColor, secondaryColor]);

  const generateBrandedPrompt = () => {
    const brandSection = `

🎨 BRAND CUSTOMIZATION:

Brand Colors:
• Primary: ${primaryColor}
• Secondary: ${secondaryColor}

UI Styling Instructions:
• Use ${primaryColor} for primary actions, highlights, and key UI elements
• Use ${secondaryColor} for secondary elements and accents
• ${logoPreview ? 'Display brand logo prominently in the corner' : 'Reserve space for brand logo placement'}
• Maintain high contrast for accessibility
• Apply brand colors to buttons, progress bars, and success states
`;

    const modifiedPrompt = editablePrompt + '\n\n' + brandSection;
    setGeneratedPrompt(modifiedPrompt);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    toast.success('Branded prompt copied! Paste it into Lovable to build your custom validator.');
  };

  const handleSaveCustomization = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let logoUrl = null;

      // Upload logo if provided
      if (logoFile) {
        const fileName = `${user.id}/${Date.now()}-${logoFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('brand-logos')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('brand-logos')
          .getPublicUrl(fileName);

        logoUrl = publicUrl;
      }

      // Save customization
      const { data: customizationData, error } = await supabase
        .from('brand_customizations')
        .insert({
          brand_id: user.id,
          template_id: template.id,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: logoUrl,
          customization_prompt: generatedPrompt,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Customization saved! Generating your game...');

      // Call edge function to generate game
      const { data: gameData, error: gameError } = await supabase.functions.invoke('generate-game', {
        body: {
          templatePrompt: editablePrompt,
          primaryColor,
          secondaryColor,
          logoUrl,
          customizationId: customizationData.id,
        }
      });

      if (gameError) {
        console.error('Game generation error:', gameError);
        toast.error('Game generation failed. You can try again later from your dashboard.');
      } else {
        toast.success('Game generated successfully! 🎮');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-neon-green text-white">
        <DialogHeader>
          <DialogTitle className="text-neon-green text-glow-green">
            Customize "{template.name}" with Your Brand
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Editable AI Prompt Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                ✨ AI Prompt
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditablePrompt(template.base_prompt || '')}
                className="text-xs"
              >
                Reset to Original
              </Button>
            </div>
            
            <Textarea
              value={editablePrompt}
              onChange={(e) => setEditablePrompt(e.target.value)}
              rows={8}
              className="bg-gray-800 border-gray-700 font-mono text-sm"
              placeholder="Edit the validator design prompt here..."
            />
            
            <p className="text-xs text-gray-400">
              Edit this prompt to customize the validator for your brand. Add specific requirements, adjust the theme, or modify the gameplay mechanics.
            </p>
          </div>

          {/* Brand Colors */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-neon-green" />
              Brand Colors
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-400 mb-3">Preview:</p>
              <div className="flex gap-4">
                <div
                  className="w-20 h-20 rounded-lg border-2"
                  style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                />
                <div
                  className="w-20 h-20 rounded-lg border-2"
                  style={{ backgroundColor: secondaryColor, borderColor: secondaryColor }}
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-neon-green" />
              Brand Logo
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-400">
                  {logoFile ? logoFile.name : 'PNG, JPG, SVG (max 2MB)'}
                </span>
              </div>

              {logoPreview && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Logo Preview:</p>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-w-[200px] max-h-[100px] object-contain"
                  />
                </div>
              )}
            </div>
          </div>


          {/* Final Branded Prompt Preview */}
          <div className="space-y-4 border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Final Branded Prompt</Label>
              <Button
                type="button"
                onClick={handleCopyPrompt}
                className="gap-2 bg-neon-green text-white hover:bg-neon-green/90"
              >
                <Copy className="h-4 w-4" />
                Copy to Build in Lovable
              </Button>
            </div>
            <div className="bg-black border border-neon-green/30 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                {generatedPrompt}
              </pre>
            </div>
            <p className="text-xs text-gray-400">
              This is your complete branded validator prompt. Copy it and paste into Lovable to generate the validator with your brand identity.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end border-t border-gray-700 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomization}
              disabled={loading}
              className="bg-neon-green text-white hover:bg-neon-green/90"
            >
              {loading ? 'Generating Game...' : 'Generate & Save Game'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
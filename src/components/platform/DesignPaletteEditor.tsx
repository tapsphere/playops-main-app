import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';

interface DesignPaletteEditorProps {
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    highlight: string;
    text: string;
    font: string;
  };
  onChange: (palette: any) => void;
  showAvatar?: boolean;
  avatarUrl?: string;
  onAvatarChange?: (url: string) => void;
  showParticles?: boolean;
  particleEffect?: string;
  onParticleChange?: (effect: string) => void;
}

export const DesignPaletteEditor = ({ 
  palette, 
  onChange, 
  showAvatar = false,
  avatarUrl = '',
  onAvatarChange,
  showParticles = false,
  particleEffect = 'sparkles',
  onParticleChange
}: DesignPaletteEditorProps) => {
  
  const colorPresets = [
    {
      name: 'Zen Calm (Default)',
      colors: {
        primary: '#C8DBDB',
        secondary: '#6C8FA4',
        accent: '#2D5556',
        background: '#F5EDD3',
        highlight: '#F0C7A0',
        text: '#2D5556',
        font: 'Inter, sans-serif'
      }
    },
    {
      name: 'Neon Gaming',
      colors: {
        primary: '#00FF00',
        secondary: '#9945FF',
        accent: '#FF5722',
        background: '#1A1A1A',
        highlight: '#FFD700',
        text: '#FFFFFF',
        font: 'Inter, sans-serif'
      }
    },
    {
      name: 'Ocean Blue',
      colors: {
        primary: '#00B4D8',
        secondary: '#0077B6',
        accent: '#023E8A',
        background: '#CAF0F8',
        highlight: '#90E0EF',
        text: '#03045E',
        font: 'Inter, sans-serif'
      }
    }
  ];

  return (
    <div className="space-y-4 p-4 border border-gray-800 rounded-lg bg-gray-900/50">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-neon-purple" />
        <h3 className="font-semibold text-white">Design Palette</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {colorPresets.map((preset) => (
          <Button
            key={preset.name}
            variant="outline"
            size="sm"
            onClick={() => onChange(preset.colors)}
            className="text-xs"
          >
            {preset.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm text-gray-300">Primary (Buttons)</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={palette.primary}
              onChange={(e) => onChange({ ...palette, primary: e.target.value })}
              className="w-16 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={palette.primary}
              onChange={(e) => onChange({ ...palette, primary: e.target.value })}
              className="flex-1"
              placeholder="#C8DBDB"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-gray-300">Secondary (Supporting)</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={palette.secondary}
              onChange={(e) => onChange({ ...palette, secondary: e.target.value })}
              className="w-16 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={palette.secondary}
              onChange={(e) => onChange({ ...palette, secondary: e.target.value })}
              className="flex-1"
              placeholder="#6C8FA4"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-gray-300">Accent (Emphasis)</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={palette.accent}
              onChange={(e) => onChange({ ...palette, accent: e.target.value })}
              className="w-16 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={palette.accent}
              onChange={(e) => onChange({ ...palette, accent: e.target.value })}
              className="flex-1"
              placeholder="#2D5556"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-gray-300">Background</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={palette.background}
              onChange={(e) => onChange({ ...palette, background: e.target.value })}
              className="w-16 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={palette.background}
              onChange={(e) => onChange({ ...palette, background: e.target.value })}
              className="flex-1"
              placeholder="#F5EDD3"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-gray-300">Highlight (Success)</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={palette.highlight}
              onChange={(e) => onChange({ ...palette, highlight: e.target.value })}
              className="w-16 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={palette.highlight}
              onChange={(e) => onChange({ ...palette, highlight: e.target.value })}
              className="flex-1"
              placeholder="#F0C7A0"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-gray-300">Text Color</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="color"
              value={palette.text}
              onChange={(e) => onChange({ ...palette, text: e.target.value })}
              className="w-16 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={palette.text}
              onChange={(e) => onChange({ ...palette, text: e.target.value })}
              className="flex-1"
              placeholder="#2D5556"
            />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm text-gray-300">Font Family</Label>
        <select
          value={palette.font}
          onChange={(e) => onChange({ ...palette, font: e.target.value })}
          className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
        >
          <option value="Inter, sans-serif">Inter (Clean, Modern)</option>
          <option value="'Roboto', sans-serif">Roboto (Friendly, Readable)</option>
          <option value="'Poppins', sans-serif">Poppins (Playful, Bold)</option>
          <option value="'Montserrat', sans-serif">Montserrat (Professional)</option>
          <option value="'Open Sans', sans-serif">Open Sans (Neutral, Clear)</option>
        </select>
      </div>

      {showParticles && onParticleChange && (
        <div>
          <Label className="text-sm text-gray-300 mb-3 block">Particle Effect</Label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'sparkles', label: '✨ Sparkles', desc: 'Classic twinkling stars' },
              { value: 'coins', label: '🪙 Coins', desc: 'Flying golden coins' },
              { value: 'stars', label: '⭐ Stars', desc: 'Bursting star shapes' },
              { value: 'hearts', label: '❤️ Hearts', desc: 'Floating hearts' },
              { value: 'confetti', label: '🎉 Confetti', desc: 'Colorful celebration' },
              { value: 'lightning', label: '⚡ Lightning', desc: 'Electric bolts' },
            ].map((effect) => (
              <button
                key={effect.value}
                type="button"
                onClick={() => onParticleChange(effect.value)}
                className={`p-6 rounded-lg border-2 transition-all text-center ${
                  particleEffect === effect.value
                    ? 'border-neon-green bg-gray-800 text-white'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-5xl mb-2">{effect.label}</div>
                <div className="text-sm">{effect.desc}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Particles burst on interactions, correct answers, and celebrations
          </p>
        </div>
      )}

      <div className="p-3 bg-gray-800 rounded border border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Preview:</p>
        <div 
          className="p-4 rounded" 
          style={{ 
            backgroundColor: palette.background,
            color: palette.text,
            fontFamily: palette.font
          }}
        >
          <button
            style={{
              backgroundColor: palette.primary,
              color: palette.text,
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: '600',
              marginRight: '8px'
            }}
          >
            Primary Button
          </button>
          <span style={{ color: palette.secondary }}>Secondary text</span>
          <div style={{ 
            marginTop: '8px', 
            color: palette.accent,
            fontWeight: '500'
          }}>
            Accent text
          </div>
        </div>
      </div>
    </div>
  );
};

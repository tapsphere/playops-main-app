import { Card } from '@/components/ui/card';
import { Sparkles, Upload } from 'lucide-react';

interface TemplateTypeSelectorProps {
  selectedType: 'ai_generated' | 'custom_upload';
  onTypeChange: (type: 'ai_generated' | 'custom_upload') => void;
}

export const TemplateTypeSelector = ({ selectedType, onTypeChange }: TemplateTypeSelectorProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card
        className={`p-6 cursor-pointer transition-all ${
          selectedType === 'ai_generated'
            ? 'bg-neon-green/10 border-neon-green shadow-lg shadow-neon-green/20'
            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
        }`}
        onClick={() => onTypeChange('ai_generated')}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            selectedType === 'ai_generated' ? 'bg-neon-green text-black' : 'bg-gray-700 text-gray-400'
          }`}>
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg mb-2 ${
              selectedType === 'ai_generated' ? 'text-neon-green' : 'text-white'
            }`}>
              AI-Generated
            </h3>
            <p className="text-sm text-gray-400">
              Use AI prompts to generate interactive validators. Perfect for rapid prototyping and
              non-technical creators.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-gray-500">
              <li>✓ No coding required</li>
              <li>✓ Fast creation</li>
              <li>✓ Brands can customize easily</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card
        className={`p-6 cursor-pointer transition-all ${
          selectedType === 'custom_upload'
            ? 'bg-neon-purple/10 border-neon-purple shadow-lg shadow-neon-purple/20'
            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
        }`}
        onClick={() => onTypeChange('custom_upload')}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            selectedType === 'custom_upload' ? 'bg-neon-purple text-white' : 'bg-gray-700 text-gray-400'
          }`}>
            <Upload className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg mb-2 ${
              selectedType === 'custom_upload' ? 'text-neon-purple' : 'text-white'
            }`}>
              Custom Upload
            </h3>
            <p className="text-sm text-gray-400">
              Upload your own HTML5 game. Full control for developers who want to build
              sophisticated validators.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-gray-500">
              <li>✓ Complete creative control</li>
              <li>✓ Advanced features</li>
              <li>✓ Professional quality</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

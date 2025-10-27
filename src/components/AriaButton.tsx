import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Globe, Mic } from 'lucide-react';

export const AriaButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate('/voice-chat')}
      className="fixed top-4 left-4 z-40 gap-2 border-2 bg-black/80 backdrop-blur-sm hover:bg-primary/20 transition-all"
      style={{ 
        borderColor: 'hsl(var(--neon-green))',
        color: 'hsl(var(--neon-green))'
      }}
      size="sm"
    >
      <Globe className="w-4 h-4" style={{ color: 'hsl(var(--neon-green))' }} />
      <span className="text-xs font-mono font-bold">ARIA</span>
    </Button>
  );
};

import { Zap, Coins } from 'lucide-react';
import { AriaButton } from '@/components/AriaButton';

interface PlayerHeaderProps {
  totalXp: number;
  totalPlyo: number;
}

const PlayerHeader = ({ totalXp, totalPlyo }: PlayerHeaderProps) => {
  return (
    <>
      {/* ARIA Access Button */}
      <AriaButton />
      
      {/* Header */}
      <div
        className="border-b-2 p-4"
        style={{ borderColor: 'hsl(var(--neon-green))' }}
      >
        <div className="max-w-7xl mx-auto">
          {/* XP Display */}
          <div className="flex justify-end gap-2">
            <div className="bg-black/50 border-2 rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ borderColor: 'hsl(var(--neon-green))' }}>
              <Zap className="w-4 h-4" style={{ color: 'hsl(var(--neon-green))' }} fill="hsl(var(--neon-green))" />
              <div className="text-right">
                <div className="text-xs font-mono" style={{ color: 'hsl(var(--neon-green) / 0.7)' }}>XP</div>
                <div className="text-sm font-bold" style={{ color: 'hsl(var(--neon-green))' }}>{totalXp}</div>
              </div>
            </div>
            <div className="bg-black/50 border-2 rounded-lg px-3 py-1.5 flex items-center gap-2" style={{ borderColor: 'hsl(var(--neon-magenta))' }}>
              <Coins className="w-4 h-4" style={{ color: 'hsl(var(--neon-magenta))' }} />
              <div className="text-right">
                <div className="text-xs font-mono" style={{ color: 'hsl(var(--neon-magenta) / 0.7)' }}>PLYO</div>
                <div className="text-sm font-bold" style={{ color: 'hsl(var(--neon-magenta))' }}>{totalPlyo}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayerHeader;

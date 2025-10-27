import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { initAudioContext, playAmbientSound, playApocalypseSound, stopAmbientSound } from '@/utils/ambientSound';
import { GridPerspective } from '@/components/GridPerspective';

interface LoadingScreenProps {
  onProgressUpdate?: (progress: number) => void;
  onFlip?: () => void;
  onPhaseChange?: (phase: 'initial' | 'loading' | 'ready' | 'complete') => void;
}

export const LoadingScreen = ({ onProgressUpdate, onFlip, onPhaseChange }: LoadingScreenProps) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'initial' | 'loading' | 'ready' | 'complete'>('initial');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Connecting...');
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(phase);
    }
  }, [phase, onPhaseChange]);

  useEffect(() => {
    if (phase === 'loading') {
      const statuses = [
        'Connecting...',
        'Loading assets...',
        'Initializing grid...',
        'Calibrating systems...',
        'Ready'
      ];
      
      let currentStatus = 0;
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1;
          
          // Update parent component
          if (onProgressUpdate) {
            onProgressUpdate(next);
          }
          
          if (next % 20 === 0 && currentStatus < statuses.length - 1) {
            currentStatus++;
            setStatus(statuses[currentStatus]);
          }
          
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsFlipped(true);
              setPhase('ready'); // Show ready state with button
            }, 500);
          }
          
          return Math.min(next, 100);
        });
      }, 30);

      return () => clearInterval(interval);
    }
  }, [phase, onProgressUpdate, onFlip]);

  const handleInitialize = () => {
    // Initialize audio context and start sounds
    initAudioContext();
    playApocalypseSound();
    playAmbientSound();
    setPhase('loading');
  };

  const handleProceedToGrid = () => {
    // Stop ambient music completely
    stopAmbientSound();
    
    setTimeout(() => {
      setPhase('complete');
      if (onFlip) {
        onFlip();
      }
    }, 100);
  };

  const handleEnterLobby = () => {
    navigate('/lobby');
  };

  return (
    <>
      <div className={`fixed inset-0 flex flex-col items-center z-10 px-4 ${phase === 'loading' ? 'justify-end pb-12' : 'justify-center'}`}>
        {phase === 'initial' && (
          <div className="text-center space-y-8 animate-fade-in -mt-24">
            <h1 className="text-4xl md:text-6xl font-bold tracking-wider">
              <span className="text-white" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>PLAY</span>
              <span className="text-glow-green" style={{ color: 'hsl(var(--neon-green))' }}>OPS</span>
            </h1>

            <h2 
              className="text-xl md:text-2xl font-light tracking-widest text-glow-green"
              style={{ color: 'hsl(var(--neon-green))' }}
            >
              The Rise of Human Proof
            </h2>

            <Button
              variant="outline"
              size="lg"
              onClick={handleInitialize}
              className="border-2 border-glow-green bg-transparent hover:bg-primary/20 text-lg tracking-widest px-12 py-6 font-bold transition-all duration-300 mt-8"
              style={{ 
                borderColor: 'hsl(var(--neon-green))',
                color: 'hsl(var(--neon-green))'
              }}
            >
              INITIALIZE
            </Button>
          </div>
        )}

        {phase === 'loading' && (
          <>
            {/* Top accent line */}
            <div 
              className="fixed top-0 left-0 right-0 h-1 animate-pulse"
              style={{ background: 'linear-gradient(90deg, hsl(var(--neon-magenta)), hsl(var(--neon-purple)), hsl(var(--neon-green)))' }}
            />

            {/* Loading content */}
            <div className="w-full max-w-md space-y-6">
              <p 
                className="text-sm tracking-wider text-center font-mono"
                style={{ color: 'hsl(var(--neon-green))' }}
              >
                LOADING ASSETS...
              </p>
              
              <Progress 
                value={progress} 
                className="h-6 bg-black border-2 rounded-none"
                style={{ borderColor: 'hsl(var(--neon-green))' }}
              />
              
              <p 
                className="text-2xl font-mono text-center"
                style={{ color: 'hsl(var(--neon-green))' }}
              >
                {progress}%
              </p>
              
              <p 
                className="text-sm tracking-wider text-center animate-pulse font-mono"
                style={{ color: 'hsl(var(--neon-green))' }}
              >
                {status}
              </p>
            </div>

            {/* Bottom accent line */}
            <div 
              className="fixed bottom-0 left-0 right-0 h-1 animate-pulse"
              style={{ background: 'linear-gradient(90deg, hsl(var(--neon-green)), hsl(var(--neon-purple)), hsl(var(--neon-magenta)))' }}
            />
          </>
        )}

        {phase === 'ready' && (
          <div className="text-center space-y-8 animate-fade-in" style={{ marginTop: '450px' }}>
            <Button
              variant="outline"
              size="lg"
              onClick={handleProceedToGrid}
              className="border-2 border-glow-green bg-transparent hover:bg-primary/20 text-lg tracking-widest px-12 py-6 font-bold transition-all duration-300"
              style={{ 
                borderColor: 'hsl(var(--neon-green))',
                color: 'hsl(var(--neon-green))',
                animation: 'subtle-pulse 2s ease-in-out infinite'
              }}
            >
              SYSTEM ONLINE
            </Button>
            
            <p 
              className="text-sm md:text-base font-mono tracking-wide"
              style={{ color: 'hsl(var(--neon-green) / 0.8)' }}
            >
              Grid calibration complete. Ready to proceed.
            </p>
          </div>
        )}

        {phase === 'complete' && (
          <>
            {/* Grid Background */}
            <GridPerspective isFlipped={false} />
            
            {/* Full Screen Splash */}
            <div className="fixed inset-0 flex flex-col animate-fade-in z-20" style={{ animation: 'fade-in 0.3s ease-out, spin-in 1s ease-out' }}>
              {/* Top Banner */}
              <div 
                className="border-b-4 p-6"
                style={{ borderColor: 'hsl(var(--neon-green))' }}
              >
                <p 
                  className="text-center text-3xl md:text-5xl tracking-widest font-bold text-glow-green"
                  style={{ color: 'hsl(var(--neon-green))' }}
                >
                  THE GRID ACCESS GRANTED
                </p>
              </div>

              {/* Center Content */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-4">
                <div className="text-center space-y-6">
                  {/* YouTube Video */}
                  <div className="mb-2 -mt-12">
                    <iframe
                      width="400"
                      height="225"
                      src="https://www.youtube.com/embed/tlRPjo3NWyY?autoplay=1&loop=1&playlist=tlRPjo3NWyY&controls=1"
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="mx-auto rounded-lg"
                    />
                  </div>
                  
                  <h1 
                    className="text-xl md:text-2xl font-bold tracking-wider text-glow-green whitespace-nowrap"
                    style={{ color: 'hsl(var(--neon-green))' }}
                  >
                    Season One : Zero Proof
                  </h1>
                  <p 
                    className="text-[10px] md:text-xs font-mono tracking-wide whitespace-nowrap"
                    style={{ color: 'hsl(var(--neon-green) / 0.8)' }}
                  >
                    Systems Online • Grid Stable • Ready for Operations
                  </p>
                </div>

                {/* Decorative lines around button */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnterLobby}
                    className="relative border-2 bg-black/50 hover:bg-primary/20 text-sm tracking-widest px-6 py-2 font-bold transition-all duration-300"
                    style={{ 
                      borderColor: 'hsl(var(--neon-green))',
                      color: 'hsl(var(--neon-green))',
                      animation: 'subtle-pulse 3s ease-in-out infinite'
                    }}
                  >
                    ACCESS THE GRID
                  </Button>
                </div>
              </div>

              {/* Bottom Status Bar */}
              <div 
                className="border-t-4 p-4"
                style={{ borderColor: 'hsl(var(--neon-green))' }}
              >
                <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8 text-[10px] md:text-xs font-mono">
                  <span className="text-left" style={{ color: 'hsl(var(--neon-green))' }}>
                    STATUS: <span className="font-bold">ACTIVE</span>
                  </span>
                  <span className="text-center" style={{ color: 'hsl(var(--neon-green))' }}>
                    GRID: <span className="font-bold">OPERATIONAL</span>
                  </span>
                  <span className="text-right" style={{ color: 'hsl(var(--neon-green))' }}>
                    LATENCY: <span className="font-bold">0ms</span>
                  </span>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes spin-in {
                0% {
                  transform: rotate(180deg) scale(0.5);
                  opacity: 0;
                }
                100% {
                  transform: rotate(0deg) scale(1);
                  opacity: 1;
                }
              }
              
              @keyframes subtle-pulse {
                0%, 100% {
                  transform: scale(1);
                  box-shadow: 0 0 10px hsl(var(--neon-green) / 0.5);
                }
                50% {
                  transform: scale(1.08);
                  box-shadow: 0 0 20px hsl(var(--neon-green) / 0.7);
                }
              }
            `}</style>
          </>
        )}
      </div>

      {/* Pass flip state to parent if needed */}
      <div className="hidden">{isFlipped ? 'flipped' : 'normal'}</div>
    </>
  );
};

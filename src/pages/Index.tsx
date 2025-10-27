import { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Globe } from '@/components/GlobeScene';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Mic, X, Volume2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [phase, setPhase] = useState<'initial' | 'loading' | 'ready' | 'complete'>('initial');
  const [voiceActive, setVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userClosed, setUserClosed] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setMousePosition({ 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY 
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Stop speech when voiceActive becomes false - be VERY aggressive
  useEffect(() => {
    if (!voiceActive) {
      // Stop speech synthesis multiple times to ensure it stops
      const stopSpeech = () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.cancel(); // Call twice
        }
      };
      
      stopSpeech();
      setTimeout(stopSpeech, 100);
      setTimeout(stopSpeech, 200);
      setTimeout(stopSpeech, 500);
    }
  }, [voiceActive]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Starfield background with parallax */}
      <div 
        className={`absolute inset-0 z-0 ${phase === 'complete' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="stars-small" />
        <div className="stars-medium" />
        <div className="stars-large" />
      </div>

      {/* 3D Globe Canvas with post-processing */}
      <div 
        className={`absolute inset-0 z-5 ${phase === 'complete' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        style={{
          transform: `translate(${-mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          className="w-full h-full"
          style={{ background: 'transparent' }}
          gl={{ 
            antialias: true,
            powerPreference: 'high-performance'
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 3, 5]} intensity={2.5} color="#ffffff" castShadow />
          <directionalLight position={[-5, -3, -5]} intensity={0.3} color="#1a2a4a" />
          <pointLight position={[-3, 0, 3]} intensity={1.2} color="#4a90e2" />
          <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" />
          <Suspense fallback={null}>
            <Globe 
              progress={progress} 
              mousePosition={mousePosition}
              isSpeaking={isSpeaking}
              onEarthClick={() => {}}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Loading UI Overlay */}
      <LoadingScreen 
        onProgressUpdate={setProgress}
        onFlip={() => setIsFlipped(true)}
        onPhaseChange={(newPhase) => {
          console.log('Phase changed to:', newPhase, 'userClosed:', userClosed);
          setPhase(newPhase);
          // Activate voice operator when ready phase is reached (only if user hasn't closed it)
          if (newPhase === 'ready' && !userClosed) {
            // Clear any existing timeout first
            if (voiceTimeoutRef.current) {
              clearTimeout(voiceTimeoutRef.current);
            }
            voiceTimeoutRef.current = setTimeout(() => {
              if (!userClosed) {
                setVoiceActive(true);
              }
            }, 500);
          }
          // Deactivate voice operator and stop all speech immediately
          if (newPhase === 'complete') {
            if (voiceTimeoutRef.current) {
              clearTimeout(voiceTimeoutRef.current);
            }
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            setVoiceActive(false);
            setIsSpeaking(false);
          }
        }}
      />

      {/* Voice Operator Interface */}
      <div 
        className="fixed top-8 left-0 right-0 z-50 flex justify-center pointer-events-none transition-opacity duration-300"
        style={{ 
          opacity: voiceActive ? 1 : 0,
          pointerEvents: voiceActive ? 'auto' : 'none',
          visibility: voiceActive ? 'visible' : 'hidden'
        }}
      >
        <div className="pointer-events-auto flex flex-col items-center gap-3 bg-black/80 backdrop-blur-sm p-6 rounded-lg border border-primary/30">
          <div className="flex items-center gap-3">
            {isSpeaking && <Volume2 className="w-6 h-6 text-primary animate-pulse" />}
            <h2 className="text-xl font-bold text-primary">ARIA SYSTEM</h2>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              variant="default"
              onClick={() => {
                navigate('/voice-chat');
              }}
              className="gap-2 w-24"
            >
              <Mic className="w-5 h-5" />
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // IMMEDIATELY stop all speech - don't wait for anything
                if (window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.cancel(); // Call twice for safety
                }
                
                // Cancel any pending timeout
                if (voiceTimeoutRef.current) {
                  clearTimeout(voiceTimeoutRef.current);
                  voiceTimeoutRef.current = null;
                }
                
                // Set all state at once
                setUserClosed(true);
                setIsSpeaking(false);
                setVoiceActive(false);
                
                // Force additional speech stops after a delay
                setTimeout(() => {
                  if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                }, 100);
              }}
              className="w-24"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center max-w-sm">
            {isSpeaking ? "ARIA speaking..." : "Click microphone to talk to ARIA"}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-30px) translateX(15px); }
          50% { transform: translateY(-15px) translateX(-15px); }
          75% { transform: translateY(-45px) translateX(8px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 1; }
        }
        
        .stars-small,
        .stars-medium,
        .stars-large {
          position: absolute;
          inset: 0;
          background: transparent;
          pointer-events: none;
        }
        
        .stars-small {
          background-image: 
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%);
          background-position: 20% 30%, 60% 70%, 50% 50%, 80% 10%, 90% 60%, 15% 80%, 40% 15%, 75% 45%, 25% 65%, 55% 25%, 35% 85%, 85% 35%, 5% 55%, 95% 75%, 45% 5%, 12% 42%;
          background-size: 4px 4px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px, 3px 3px;
          background-repeat: no-repeat;
          animation: twinkle 2s infinite ease-in-out, float 15s infinite ease-in-out;
        }
        
        .stars-medium {
          background-image:
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%);
          background-position: 30% 80%, 70% 20%, 40% 40%, 85% 65%, 10% 15%, 65% 55%, 45% 90%, 92% 42%, 18% 68%, 72% 8%;
          background-size: 6px 6px, 5px 5px, 5px 5px, 5px 5px, 5px 5px, 5px 5px, 5px 5px, 5px 5px, 5px 5px, 5px 5px;
          background-repeat: no-repeat;
          animation: twinkle 3s infinite ease-in-out, float 20s infinite ease-in-out reverse;
        }
        
        .stars-large {
          background-image:
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%),
            radial-gradient(circle, #ffffff 0%, #ffffff 40%, transparent 60%);
          background-position: 10% 50%, 85% 85%, 25% 25%, 95% 15%, 50% 90%, 12% 72%, 78% 48%, 33% 58%;
          background-size: 8px 8px, 6px 6px, 6px 6px, 6px 6px, 6px 6px, 6px 6px, 6px 6px, 6px 6px;
          background-repeat: no-repeat;
          animation: pulse 4s infinite ease-in-out, float 25s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Index;

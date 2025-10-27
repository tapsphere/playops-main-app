import { useEffect, useRef } from 'react';

interface AtmosphericEffectsProps {
  progress: number;
}

export const AtmosphericEffects = ({ progress }: AtmosphericEffectsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let scanLineOffset = 0;
    let glitchTimer = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Distance fog - gets lighter as you progress
      const fogOpacity = 0.1 + (progress / 100) * 0.2;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      gradient.addColorStop(0, `rgba(0, 255, 102, 0)`);
      gradient.addColorStop(0.5, `rgba(0, 255, 102, ${fogOpacity * 0.05})`);
      gradient.addColorStop(1, `rgba(0, 255, 102, ${fogOpacity * 0.15})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scan lines
      scanLineOffset += 1;
      if (scanLineOffset > 4) scanLineOffset = 0;
      
      for (let i = scanLineOffset; i < canvas.height; i += 4) {
        ctx.fillStyle = 'rgba(0, 255, 102, 0.02)';
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // Enhanced glow on edges
      const edgeGlow = ctx.createLinearGradient(0, 0, 0, canvas.height);
      edgeGlow.addColorStop(0, `rgba(0, 255, 102, ${0.1 + (progress / 100) * 0.1})`);
      edgeGlow.addColorStop(0.5, 'rgba(0, 255, 102, 0)');
      edgeGlow.addColorStop(1, `rgba(0, 255, 102, ${0.1 + (progress / 100) * 0.1})`);
      ctx.fillStyle = edgeGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Random glitch effect
      glitchTimer++;
      if (glitchTimer > 180 && Math.random() > 0.98) {
        const glitchY = Math.random() * canvas.height;
        const glitchHeight = 2 + Math.random() * 8;
        const glitchOffset = (Math.random() - 0.5) * 20;
        
        ctx.fillStyle = 'rgba(0, 255, 102, 0.3)';
        ctx.fillRect(glitchOffset, glitchY, canvas.width, glitchHeight);
        
        glitchTimer = 0;
      }

      // Vignette effect
      const vignette = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.7
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bloom effect - pulsing green glow
      const pulse = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
      const bloomGlow = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.4
      );
      bloomGlow.addColorStop(0, `rgba(0, 255, 102, ${pulse * 0.1})`);
      bloomGlow.addColorStop(1, 'rgba(0, 255, 102, 0)');
      ctx.fillStyle = bloomGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[5]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

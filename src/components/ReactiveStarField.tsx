import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  baseX: number;
  baseY: number;
}

interface ReactiveStarFieldProps {
  mousePosition: { x: number; y: number };
}

export const ReactiveStarField = ({ mousePosition }: ReactiveStarFieldProps) => {
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

    const stars: Star[] = [];
    const numStars = 200;

    // Initialize stars
    for (let i = 0; i < numStars; i++) {
      const x = Math.random() * canvas.width - canvas.width / 2;
      const y = Math.random() * canvas.height - canvas.height / 2;
      stars.push({
        x,
        y,
        z: Math.random() * canvas.width,
        size: Math.random() * 2,
        baseX: x,
        baseY: y,
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Mouse influence strength
      const mouseInfluence = 50;

      stars.forEach((star) => {
        star.z -= 2;
        if (star.z <= 0) {
          star.z = canvas.width;
          star.baseX = Math.random() * canvas.width - canvas.width / 2;
          star.baseY = Math.random() * canvas.height - canvas.height / 2;
          star.x = star.baseX;
          star.y = star.baseY;
        }

        // React to mouse position
        const distX = mousePosition.x - (cx + star.x);
        const distY = mousePosition.y - (cy + star.y);
        const distance = Math.sqrt(distX * distX + distY * distY);
        const maxDistance = 300;

        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * mouseInfluence;
          star.x += (distX / distance) * force * 0.01;
          star.y += (distY / distance) * force * 0.01;
        } else {
          // Slowly return to base position
          star.x += (star.baseX - star.x) * 0.01;
          star.y += (star.baseY - star.y) * 0.01;
        }

        const k = 128 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;
        const size = (1 - star.z / canvas.width) * star.size * 2;

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
          const opacity = 1 - star.z / canvas.width;
          
          // Brighter near mouse
          const mouseDistScreen = Math.sqrt(
            Math.pow(px - mousePosition.x, 2) + Math.pow(py - mousePosition.y, 2)
          );
          const brightnessBoost = Math.max(0, 1 - mouseDistScreen / 200);
          
          ctx.fillStyle = `rgba(0, 255, 102, ${(opacity * 0.8) + (brightnessBoost * 0.3)})`;
          ctx.fillRect(px, py, size, size);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: '#000' }}
    />
  );
};

import { useEffect, useRef } from 'react';

interface GridPerspectiveProps {
  isFlipped: boolean;
}

export const GridPerspective = ({ isFlipped }: GridPerspectiveProps) => {
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

    let rotationAngle = 0;
    const targetRotation = isFlipped ? Math.PI : 0;

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = isFlipped ? canvas.height * 0.2 : canvas.height * 0.6;
      const gridSize = 20;
      const lines = 20;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationAngle);
      ctx.translate(-centerX, -centerY);

      // Draw horizontal lines
      for (let i = -lines; i <= lines; i++) {
        const y = centerY + i * gridSize;
        const perspective = 1 - Math.abs(i) / lines;
        const width = canvas.width * perspective;
        
        ctx.strokeStyle = `rgba(0, 255, 102, ${0.3 * perspective})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - width / 2, y);
        ctx.lineTo(centerX + width / 2, y);
        ctx.stroke();
      }

      // Draw vertical lines
      for (let i = -lines; i <= lines; i++) {
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX + i * gridSize, centerY - lines * gridSize);
        ctx.lineTo(centerX + i * gridSize * 0.5, centerY + lines * gridSize);
        ctx.stroke();
      }

      ctx.restore();
    };

    const animate = () => {
      // Smooth rotation animation
      if (Math.abs(rotationAngle - targetRotation) > 0.01) {
        rotationAngle += (targetRotation - rotationAngle) * 0.05;
      }
      drawGrid();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [isFlipped]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

import { useEffect, useRef, useState } from 'react';

interface ParallaxGridProps {
  isFlipped: boolean;
  progress: number;
  mousePosition: { x: number; y: number };
}

export const ParallaxGrid = ({ isFlipped, progress, mousePosition }: ParallaxGridProps) => {
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

    // Camera zoom based on progress (0 = far, 100 = close)
    const cameraZ = 1 + (progress / 100) * 2; // Zoom from 1x to 3x

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = isFlipped ? canvas.height * 0.2 : canvas.height * 0.6;
      const gridSize = 20 * cameraZ;
      const lines = 20;

      // Mouse influence - grid bends toward cursor
      const mouseInfluenceX = (mousePosition.x - centerX) * 0.0002;
      const mouseInfluenceY = (mousePosition.y - centerY) * 0.0002;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationAngle + mouseInfluenceX);
      ctx.translate(-centerX, -centerY);

      // Draw 3 layers for parallax depth
      const layers = [
        { depth: 0.7, opacity: 0.15, offset: -40 },
        { depth: 1.0, opacity: 0.3, offset: 0 },
        { depth: 1.3, opacity: 0.2, offset: 40 }
      ];

      layers.forEach((layer) => {
        const layerGridSize = gridSize * layer.depth;
        const layerCenterY = centerY + layer.offset + mouseInfluenceY * layer.depth * 1000;

        // Horizontal lines
        for (let i = -lines; i <= lines; i++) {
          const y = layerCenterY + i * layerGridSize;
          const perspective = 1 - Math.abs(i) / lines;
          const width = canvas.width * perspective * layer.depth;
          
          ctx.strokeStyle = `rgba(0, 255, 102, ${layer.opacity * perspective})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX - width / 2, y);
          ctx.lineTo(centerX + width / 2, y);
          ctx.stroke();
        }

        // Vertical lines
        for (let i = -lines; i <= lines; i++) {
          ctx.strokeStyle = `rgba(0, 255, 102, ${layer.opacity * 0.6})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX + i * layerGridSize, layerCenterY - lines * layerGridSize);
          ctx.lineTo(centerX + i * layerGridSize * 0.5, layerCenterY + lines * layerGridSize);
          ctx.stroke();
        }
      });

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
  }, [isFlipped, progress, mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

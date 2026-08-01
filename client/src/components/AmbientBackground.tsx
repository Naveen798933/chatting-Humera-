import React, { useEffect, useRef } from 'react';
import { useUniverse } from '../context/UniverseContext';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  char?: string;
  rotation: number;
  rotationSpeed: number;
}

export const AmbientBackground: React.FC = () => {
  const { ambientEffect } = useUniverse();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ambientEffect === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const count = ambientEffect === 'galaxy' ? 120 : ambientEffect === 'rain' ? 100 : ambientEffect === 'snow' ? 80 : 45;

    const colors = {
      hearts: ['#ff70a6', '#f43f5e', '#a855f7', '#ec4899', '#ffffff'],
      stars: ['#ffffff', '#fbbf24', '#e0e7ff', '#a855f7'],
      galaxy: ['#a855f7', '#8b5cf6', '#38bdf8', '#ff70a6', '#ffffff'],
      rain: ['#38bdf8', '#8b5cf6', '#cbd5e1'],
      snow: ['#ffffff', '#f1f5f9', '#e2e8f0']
    };

    const currentColors = colors[ambientEffect] || colors.hearts;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: ambientEffect === 'hearts' ? Math.random() * 12 + 10 : ambientEffect === 'snow' ? Math.random() * 4 + 2 : Math.random() * 3 + 1,
        speedX: ambientEffect === 'rain' ? 0.5 : ambientEffect === 'snow' ? (Math.random() - 0.5) * 0.8 : (Math.random() - 0.5) * 0.4,
        speedY: ambientEffect === 'rain' ? Math.random() * 8 + 4 : ambientEffect === 'snow' ? Math.random() * 1.5 + 0.8 : (Math.random() - 0.5) * 0.4 - (ambientEffect === 'hearts' ? 0.3 : 0),
        opacity: Math.random() * 0.7 + 0.2,
        color: currentColors[Math.floor(Math.random() * currentColors.length)],
        char: ambientEffect === 'hearts' ? (Math.random() > 0.3 ? '❤️' : '✨') : undefined,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        ctx.save();
        ctx.globalAlpha = p.opacity;

        if (ambientEffect === 'hearts' && p.char) {
          ctx.font = `${p.size}px sans-serif`;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillText(p.char, 0, 0);
        } else if (ambientEffect === 'rain') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.size * 5);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [ambientEffect]);

  if (ambientEffect === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      id="ambient-canvas"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};

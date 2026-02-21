"use client";

import { useEffect, useRef } from "react";

interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  rgbString: string;
  angle: number;
  speedVariance: number;
  opacityFactor: number;
  sizeFactor: number;
}

const CONFIG = {
  density: 13,
  size: 19,
  jitter: 3.5,
  speed: 0.23,
  opacity: 0.7,
};

export default function ParticleCanvas({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles: Particle[] = [];
      const step = Math.floor(CONFIG.density);

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const index = (y * canvas.width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          if (a > 128) {
            particles.push({
              originX: x,
              originY: y,
              x,
              y,
              rgbString: `rgb(${r},${g},${b})`,
              angle: Math.random() * Math.PI * 2,
              speedVariance: Math.random() * 0.5 + 0.5,
              opacityFactor: Math.random() * 0.7 + 0.3,
              sizeFactor: Math.random() * 0.6 + 0.4,
            });
          }
        }
      }

      particlesRef.current = particles;

      function animate() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particlesRef.current) {
          p.angle += CONFIG.speed * p.speedVariance;
          p.x = p.originX + Math.cos(p.angle) * CONFIG.jitter;
          p.y = p.originY + Math.sin(p.angle) * CONFIG.jitter;

          ctx.beginPath();
          ctx.arc(p.x, p.y, CONFIG.size * p.sizeFactor, 0, Math.PI * 2);
          ctx.save();
          ctx.globalAlpha = CONFIG.opacity * p.opacityFactor;
          ctx.fillStyle = p.rgbString;
          ctx.fill();
          ctx.restore();
        }

        animationRef.current = requestAnimationFrame(animate);
      }

      animate();
    };

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

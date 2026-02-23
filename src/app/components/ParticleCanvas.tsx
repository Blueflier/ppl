"use client";

import { useEffect, useRef, useCallback } from "react";

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

const DEFAULT_CONFIG = {
  density: 7,
  size: 9,
  jitter: 2.5,
  speed: 0.08,
  opacity: 1,
};

export default function ParticleCanvas({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const imageDataRef = useRef<{ data: Uint8ClampedArray; width: number; height: number } | null>(null);
  const configRef = useRef(DEFAULT_CONFIG);

  const rebuildParticles = useCallback(() => {
    const imgData = imageDataRef.current;
    if (!imgData) return;
    const { data, width, height } = imgData;
    const particles: Particle[] = [];
    const step = Math.floor(configRef.current.density);

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = (y * width + x) * 4;
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
  }, []);

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      imageDataRef.current = { data: imageData.data, width: canvas.width, height: canvas.height };
      rebuildParticles();

      function animate() {
        if (!ctx || !canvas) return;
        const cfg = configRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particlesRef.current) {
          p.angle += cfg.speed * p.speedVariance;
          p.x = p.originX + Math.cos(p.angle) * cfg.jitter;
          p.y = p.originY + Math.sin(p.angle) * cfg.jitter;

          ctx.beginPath();
          ctx.arc(p.x, p.y, cfg.size * p.sizeFactor, 0, Math.PI * 2);
          ctx.save();
          ctx.globalAlpha = cfg.opacity * p.opacityFactor;
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
  }, [src, rebuildParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

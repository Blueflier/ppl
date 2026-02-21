"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface ParticleConfig {
  density: number;
  size: number;
  jitter: number;
  speed: number;
  opacity: number;
}

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

type ParticleCardProps = {
  initialConfig?: Partial<ParticleConfig>;
  label: string;
  width?: number;
  height?: number;
  debug?: boolean;
} & (
  | { drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; src?: never }
  | { src: string; drawFn?: never }
);

const DEFAULT_CONFIG: ParticleConfig = {
  density: 6,
  size: 5,
  jitter: 1.5,
  speed: 0.12,
  opacity: 0.8,
};

export default function ParticleCard(props: ParticleCardProps) {
  const {
    initialConfig,
    label,
    width = 400,
    height = 320,
    debug = false,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const configRef = useRef<ParticleConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [config, setConfig] = useState<ParticleConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  // Keep configRef in sync for animation loop
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const samplePixels = useCallback((srcCanvas: HTMLCanvasElement, w: number, h: number) => {
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
    if (!srcCtx) return [];

    const imageData = srcCtx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const particles: Particle[] = [];
    const step = Math.max(1, Math.floor(config.density));

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const index = (y * w + x) * 4;
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
    return particles;
  }, [config.density]);

  // Load image when src is provided
  useEffect(() => {
    if (!props.src) return;
    const source = sourceRef.current;
    if (!source) return;
    const srcCtx = source.getContext("2d", { willReadFrequently: true });
    if (!srcCtx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Scale image to fit canvas dimensions while preserving aspect ratio
      const scale = Math.min(width / img.width, height / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      const ox = (width - sw) / 2;
      const oy = (height - sh) / 2;

      source.width = width;
      source.height = height;
      srcCtx.clearRect(0, 0, width, height);
      srcCtx.drawImage(img, ox, oy, sw, sh);
      setImageLoaded((prev) => !prev); // toggle to trigger rebuild
    };
    img.src = props.src;
  }, [props.src, width, height]);

  // Build particles from drawFn
  const buildFromDrawFn = useCallback(() => {
    if (!props.drawFn) return;
    const source = sourceRef.current;
    if (!source) return;
    const srcCtx = source.getContext("2d", { willReadFrequently: true });
    if (!srcCtx) return;

    source.width = width;
    source.height = height;
    srcCtx.clearRect(0, 0, width, height);
    props.drawFn(srcCtx, width, height);

    particlesRef.current = samplePixels(source, width, height);
  }, [props.drawFn, width, height, samplePixels]);

  // Build particles from image
  const buildFromImage = useCallback(() => {
    if (!props.src) return;
    const source = sourceRef.current;
    if (!source) return;
    particlesRef.current = samplePixels(source, width, height);
  }, [props.src, width, height, samplePixels]);

  // Main effect: build particles + start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    if (props.drawFn) {
      buildFromDrawFn();
    } else {
      buildFromImage();
    }

    function animate() {
      if (!ctx || !canvas) return;
      const c = configRef.current;
      ctx.clearRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        p.angle += c.speed * p.speedVariance;
        p.x = p.originX + Math.cos(p.angle) * c.jitter;
        p.y = p.originY + Math.sin(p.angle) * c.jitter;

        ctx.beginPath();
        ctx.arc(p.x, p.y, c.size * p.sizeFactor, 0, Math.PI * 2);
        ctx.save();
        ctx.globalAlpha = c.opacity * p.opacityFactor;
        ctx.fillStyle = p.rgbString;
        ctx.fill();
        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildFromDrawFn, buildFromImage, width, height, imageLoaded]);

  const updateConfig = (key: keyof ParticleConfig, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const ranges: Record<keyof ParticleConfig, { min: number; max: number; step: number }> = {
    density: { min: 2, max: 20, step: 1 },
    size: { min: 1, max: 20, step: 0.5 },
    jitter: { min: 0, max: 10, step: 0.25 },
    speed: { min: 0.01, max: 0.5, step: 0.01 },
    opacity: { min: 0.1, max: 1, step: 0.05 },
  };

  return (
    <div className="relative">
      <canvas ref={sourceRef} className="hidden" />
      <canvas
        ref={canvasRef}
        className="h-auto w-full rounded-2xl"
        style={{ aspectRatio: `${width}/${height}` }}
      />

      {/* Debug toggle */}
      {debug && (
        <button
          onClick={() => setDebugOpen(!debugOpen)}
          className="absolute top-2 right-2 z-20 rounded-md bg-black/60 px-2 py-1 text-[10px] font-mono text-white hover:bg-black/80 transition-colors"
        >
          {debugOpen ? "✕" : `⚙ ${label}`}
        </button>
      )}

      {/* Debug panel */}
      {debug && debugOpen && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-b-2xl bg-black/85 p-3 text-[11px] font-mono text-white backdrop-blur-sm">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
            {label}
          </div>
          {(Object.keys(ranges) as (keyof ParticleConfig)[]).map((key) => {
            const r = ranges[key];
            return (
              <label key={key} className="mb-1.5 flex items-center gap-2">
                <span className="w-14 text-white/70">{key}</span>
                <input
                  type="range"
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  value={config[key]}
                  onChange={(e) => updateConfig(key, parseFloat(e.target.value))}
                  className="h-1 flex-1 appearance-none rounded bg-white/20 accent-white"
                />
                <span className="w-10 text-right tabular-nums text-white/70">
                  {config[key].toFixed(2)}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

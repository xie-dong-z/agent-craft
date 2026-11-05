import { useEffect, useRef, type FC } from 'react';
import {
  burstParticles,
  createParticles,
  getParticleCount,
  stepParticle,
  type Particle,
} from './particleEngine';

export type AestheticMode = 'ink' | 'chromatic';

interface ParticleBackgroundProps {
  mode?: AestheticMode;
}

const INTERACTIVE_SELECTOR =
  'button,a,input,textarea,select,[role="dialog"],[role="button"],[contenteditable="true"]';
const PARTICLE_SEED = 20261104;
const FRAME_MS = 1000 / 60;
const RESIZE_THRESHOLD = 32;

export const ParticleBackground: FC<ParticleBackgroundProps> = ({ mode = 'ink' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<AestheticMode>(mode);

  useEffect(() => {
    modeRef.current = mode;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = mode === 'chromatic' ? 'rgb(255, 255, 255)' : 'rgb(244, 241, 234)';
    ctx.fillRect(0, 0, width, height);
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    let width = Math.max(1, window.innerWidth);
    let height = Math.max(1, window.innerHeight);
    let particles: Particle[] = [];
    let targetCount = getParticleCount(width, height);
    let animationFrameId: number | null = null;
    let resizeFrame: number | null = null;
    let tap: { pointerId: number; x: number; y: number; startedAt: number } | null = null;
    let sampledFrames = 0;
    let sampleStartedAt = performance.now();
    const pointer = { x: width / 2, y: height / 2, active: false };

    // 4 preallocated batch buckets to eliminate garbage collection & minimize stroke calls
    const b1: Particle[] = [];
    const b2: Particle[] = [];
    const b3: Particle[] = [];
    const b4: Particle[] = [];

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const drawFrame = (timestamp: number, advance: boolean, sample = advance) => {
      if (advance) {
        for (let i = 0; i < particles.length; i += 1) {
          stepParticle(particles[i], { width, height, time: timestamp, pointer });
        }
      }

      const scrollProgress = Math.min(1, window.scrollY / Math.max(1, height * 0.9));
      const contrast = 1 - scrollProgress * 0.78;
      const trailFade = width < 640 ? 0.05 : 0.026;
      const currentMode = modeRef.current;

      // Soft trail clearing
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle =
        currentMode === 'chromatic'
          ? `rgba(255, 255, 255, ${trailFade * 1.3})`
          : `rgba(244, 241, 234, ${trailFade})`;
      ctx.fillRect(0, 0, width, height);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      b1.length = 0;
      b2.length = 0;
      b3.length = 0;
      b4.length = 0;

      // Partition particles into 4 optimized rendering tiers
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        if (p.tone === 'red') {
          b4.push(p);
        } else if (p.size <= 1.15) {
          b1.push(p);
        } else if (p.size <= 1.8) {
          b2.push(p);
        } else {
          b3.push(p);
        }
      }

      if (currentMode === 'chromatic') {
        // Chromatic Aurora Mode: 4 radiant spectrum strokes
        if (b1.length > 0) {
          ctx.beginPath();
          for (let i = 0; i < b1.length; i += 1) {
            ctx.moveTo(b1[i].px, b1[i].py);
            ctx.lineTo(b1[i].x, b1[i].y);
          }
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.45 * contrast})`; // Vivid Cyan
          ctx.stroke();
        }

        if (b2.length > 0) {
          ctx.beginPath();
          for (let i = 0; i < b2.length; i += 1) {
            ctx.moveTo(b2[i].px, b2[i].py);
            ctx.lineTo(b2[i].x, b2[i].y);
          }
          ctx.lineWidth = 1.9;
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.55 * contrast})`; // Electric Indigo
          ctx.stroke();
        }

        if (b3.length > 0) {
          ctx.beginPath();
          for (let i = 0; i < b3.length; i += 1) {
            ctx.moveTo(b3[i].px, b3[i].py);
            ctx.lineTo(b3[i].x, b3[i].y);
          }
          ctx.lineWidth = 2.6;
          ctx.strokeStyle = `rgba(236, 72, 153, ${0.68 * contrast})`; // Radiant Magenta/Pink
          ctx.stroke();
        }

        if (b4.length > 0) {
          ctx.beginPath();
          for (let i = 0; i < b4.length; i += 1) {
            ctx.moveTo(b4[i].px, b4[i].py);
            ctx.lineTo(b4[i].x, b4[i].y);
          }
          ctx.lineWidth = 2.0;
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.75 * contrast})`; // Warm Amber Gold
          ctx.stroke();
        }
      } else {
        // Editorial Ink Mode: 3 ink tiers + 1 vermilion tier (total 4 strokes)
        ctx.globalCompositeOperation = 'multiply';

        if (b1.length > 0) {
          ctx.beginPath();
          for (let i = 0; i < b1.length; i += 1) {
            ctx.moveTo(b1[i].px, b1[i].py);
            ctx.lineTo(b1[i].x, b1[i].y);
          }
          ctx.lineWidth = 1.1;
          ctx.strokeStyle = `rgba(31, 37, 34, ${0.28 * contrast})`;
          ctx.stroke();
        }

        if (b2.length > 0) {
          ctx.beginPath();
          for (let i = 0; i < b2.length; i += 1) {
            ctx.moveTo(b2[i].px, b2[i].py);
            ctx.lineTo(b2[i].x, b2[i].y);
          }
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = `rgba(31, 37, 34, ${0.46 * contrast})`;
          ctx.stroke();
        }

        if (b3.length > 0) {
          ctx.beginPath();
          for (let i = 0; i < b3.length; i += 1) {
            ctx.moveTo(b3[i].px, b3[i].py);
            ctx.lineTo(b3[i].x, b3[i].y);
          }
          ctx.lineWidth = 2.6;
          ctx.strokeStyle = `rgba(31, 37, 34, ${0.65 * contrast})`;
          ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
        if (b4.length > 0) {
          ctx.beginPath();
          for (let i = 0; i < b4.length; i += 1) {
            ctx.moveTo(b4[i].px, b4[i].py);
            ctx.lineTo(b4[i].x, b4[i].y);
          }
          ctx.lineWidth = 2.1;
          ctx.strokeStyle = `rgba(185, 45, 30, ${0.85 * contrast})`; // Vermilion
          ctx.stroke();
        }
      }

      // Performance Monitor: sample every 45 frames (0.75s)
      if (sample) {
        sampledFrames += 1;
        if (sampledFrames === 45) {
          const elapsed = timestamp - sampleStartedAt;
          const averageFps = elapsed > 0 ? 45000 / elapsed : 60;
          // Promptly downscale if device is struggling
          if (averageFps < 45 && particles.length > 180) {
            particles.length = Math.max(180, Math.floor(particles.length * 0.75));
          }
          sampledFrames = 0;
          sampleStartedAt = timestamp;
        }
      }
    };

    const animate = (timestamp: number) => {
      drawFrame(timestamp, true);
      animationFrameId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (animationFrameId !== null || document.hidden || reducedMotion) return;
      sampledFrames = 0;
      sampleStartedAt = performance.now();
      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      const nextWidth = Math.max(1, window.innerWidth);
      const nextHeight = Math.max(1, window.innerHeight);
      if (
        particles.length > 0 &&
        Math.abs(nextWidth - width) <= RESIZE_THRESHOLD &&
        Math.abs(nextHeight - height) <= RESIZE_THRESHOLD
      ) return;

      width = nextWidth;
      height = nextHeight;
      targetCount = getParticleCount(width, height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = createParticles(width, height, targetCount, PARTICLE_SEED);
      sampledFrames = 0;

      // Purely mathematical warm-up (0.1ms) without blocking GPU/canvas drawing
      const warmupSteps = width < 640 ? 30 : 60;
      for (let step = 0; step < warmupSteps; step += 1) {
        for (let i = 0; i < particles.length; i += 1) {
          stepParticle(particles[i], { width, height, time: step * FRAME_MS, pointer });
        }
      }

      // Initial clear and single paint
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = modeRef.current === 'chromatic' ? 'rgb(255, 255, 255)' : 'rgb(244, 241, 234)';
      ctx.fillRect(0, 0, width, height);
      drawFrame(performance.now(), false, false);
      sampleStartedAt = performance.now();
    };

    const requestResize = () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        resizeCanvas();
      });
    };

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));

    const handlePointerDown = (event: PointerEvent) => {
      if (reducedMotion || event.button !== 0 || isInteractiveTarget(event.target)) return;
      if (window.scrollY > window.innerHeight * 0.9) return;
      tap = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startedAt: performance.now(),
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;

      if (tap?.pointerId === event.pointerId) {
        const distance = Math.hypot(event.clientX - tap.x, event.clientY - tap.y);
        if (distance > 12) tap = null;
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!tap || tap.pointerId !== event.pointerId) {
        if (event.pointerType === 'touch') pointer.active = false;
        return;
      }
      const elapsed = performance.now() - tap.startedAt;
      const distance = Math.hypot(event.clientX - tap.x, event.clientY - tap.y);
      if (elapsed <= 500 && distance <= 12 && !isInteractiveTarget(event.target)) {
        burstParticles(particles, tap.x, tap.y, 8);
      }
      tap = null;
      if (event.pointerType === 'touch') {
        pointer.active = false;
      }
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (tap?.pointerId === event.pointerId) tap = null;
      pointer.active = false;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      tap = null;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else if (!reducedMotion) {
        startAnimation();
      }
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stopAnimation();
        drawFrame(performance.now(), false);
      } else if (!document.hidden) {
        startAnimation();
      }
    };

    window.addEventListener('resize', requestResize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    window.addEventListener('blur', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionQuery.addEventListener('change', handleMotionChange);

    resizeCanvas();
    startAnimation();

    return () => {
      stopAnimation();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', requestResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('blur', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 w-full h-full will-change-transform transform-gpu"
    />
  );
};

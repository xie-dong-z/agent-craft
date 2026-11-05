export interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  speed: number;
  band: 0 | 1;
  tone: 'ink' | 'red';
}

export interface StepContext {
  width: number;
  height: number;
  time: number;
  pointer: { x: number; y: number; active: boolean };
}

const TAU = Math.PI * 2;
const MIN_DISTANCE = 0.001;
const POINTER_RADIUS = 220;

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getVortexCenter(band: 0 | 1, width: number, height: number, time: number) {
  if (band === 0) {
    return {
      x: width * 0.74 + Math.sin(time * 0.00007) * width * 0.015,
      y: height * 0.43 + Math.cos(time * 0.00009) * height * 0.012,
    };
  }

  return {
    x: width * 0.23 + Math.cos(time * 0.00008) * width * 0.012,
    y: height * 0.78 + Math.sin(time * 0.00006) * height * 0.015,
  };
}

export function getParticleCount(width: number, height: number): number {
  if (width < 640) return 180;
  return Math.min(520, Math.max(300, Math.floor((width * height) / 2800)));
}

export function createParticles(width: number, height: number, count: number, seed: number): Particle[] {
  const random = createRandom(seed);
  const particles: Particle[] = [];
  const total = Math.max(0, Math.floor(count));

  for (let index = 0; index < total; index += 1) {
    const band: 0 | 1 = random() < 0.7 ? 0 : 1;
    const angle = random() * TAU;
    const radial = Math.pow(random(), 0.65);
    const center = getVortexCenter(band, width, height, 0);
    const radiusX = width * (band === 0 ? 0.08 + radial * 0.34 : 0.06 + radial * 0.26);
    const radiusY = height * (band === 0 ? 0.08 + radial * 0.34 : 0.05 + radial * 0.24);
    const x = center.x + Math.cos(angle) * radiusX;
    const y = center.y + Math.sin(angle) * radiusY;
    const speed = 0.55 + random() * 0.85;
    const direction = band === 0 ? 1 : -1;
    const orbitSpeed = (1.8 + random() * 2.8) * direction;
    const tangentX = -Math.sin(angle) * radiusX;
    const tangentY = Math.cos(angle) * radiusY;
    const tangentLength = Math.max(MIN_DISTANCE, Math.hypot(tangentX, tangentY));

    particles.push({
      x,
      y,
      px: x,
      py: y,
      vx: (tangentX / tangentLength) * orbitSpeed,
      vy: (tangentY / tangentLength) * orbitSpeed,
      size: 0.65 + random() * 1.55,
      alpha: 0.16 + random() * 0.38,
      speed,
      band,
      tone: random() < 0.035 ? 'red' : 'ink',
    });
  }

  return particles;
}

export function stepParticle(particle: Particle, context: StepContext): void {
  const { width, height, time, pointer } = context;
  const center = getVortexCenter(particle.band, width, height, time);
  const dx = particle.x - center.x;
  const dy = particle.y - center.y;
  const distance = Math.max(MIN_DISTANCE, Math.hypot(dx, dy));
  const nx = dx / distance;
  const ny = dy / distance;
  const direction = particle.band === 0 ? 1 : -1;
  const radialRatio = distance / Math.max(1, Math.min(width, height) * 0.25);
  const tangentSpeed = Math.max(0, (-particle.vx * ny + particle.vy * nx) * direction);
  const orbitalForce = Math.min(0.16, (tangentSpeed * tangentSpeed) / distance);
  const inwardForce = orbitalForce * 0.86 + 0.0018 * Math.min(2, radialRatio) * particle.speed;
  const tangentForce = 0.038 * particle.speed;

  particle.vx += -nx * inwardForce - ny * tangentForce * direction;
  particle.vy += -ny * inwardForce + nx * tangentForce * direction;

  if (pointer.active) {
    const pointerDx = pointer.x - particle.x;
    const pointerDy = pointer.y - particle.y;
    const pointerDistance = Math.max(MIN_DISTANCE, Math.hypot(pointerDx, pointerDy));

    if (pointerDistance < POINTER_RADIUS) {
      const force = (1 - pointerDistance / POINTER_RADIUS) * 0.32;
      const pointerNx = pointerDx / pointerDistance;
      const pointerNy = pointerDy / pointerDistance;
      particle.vx += pointerNx * force - pointerNy * force * 0.28;
      particle.vy += pointerNy * force + pointerNx * force * 0.28;
    }
  }

  particle.vx *= 0.985;
  particle.vy *= 0.985;
  particle.px = particle.x;
  particle.py = particle.y;
  particle.x += particle.vx;
  particle.y += particle.vy;

  const margin = 60;
  let wrapped = false;
  if (particle.x < -margin) {
    particle.x = width + margin;
    wrapped = true;
  } else if (particle.x > width + margin) {
    particle.x = -margin;
    wrapped = true;
  }
  if (particle.y < -margin) {
    particle.y = height + margin;
    wrapped = true;
  } else if (particle.y > height + margin) {
    particle.y = -margin;
    wrapped = true;
  }
  if (wrapped) {
    particle.px = particle.x;
    particle.py = particle.y;
  }
}

export function burstParticles(particles: Particle[], x: number, y: number, strength: number): void {
  for (const particle of particles) {
    const dx = particle.x - x;
    const dy = particle.y - y;
    const distance = Math.max(MIN_DISTANCE, Math.hypot(dx, dy));
    const velocity = strength / (1 + distance / 140);
    particle.vx += (dx / distance) * velocity;
    particle.vy += (dy / distance) * velocity;
  }
}

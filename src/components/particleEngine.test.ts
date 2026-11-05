/// <reference types="node" />

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  burstParticles,
  createParticles,
  getParticleCount,
  stepParticle,
  type Particle,
} from './particleEngine.ts';

test('getParticleCount follows mobile, desktop, and maximum rules', () => {
  assert.equal(getParticleCount(390, 844), 180);
  assert.equal(getParticleCount(1440, 900), 462);
  assert.equal(getParticleCount(5000, 3000), 520);
});

test('createParticles is deterministic and uses only ink and red tones', () => {
  const first = createParticles(1440, 900, 40, 12345);
  const second = createParticles(1440, 900, 40, 12345);

  assert.equal(first.length, 40);
  assert.deepEqual(first, second);
  assert.ok(first.every((particle) => particle.tone === 'ink' || particle.tone === 'red'));
});

test('createParticles gives initial particles visible orbital velocity', () => {
  const particles = createParticles(1440, 900, 120, 98765);

  assert.ok(particles.some((particle) => Math.hypot(particle.vx, particle.vy) > 1.5));
});

test('stepParticle remains finite when particle and pointer coincide', () => {
  const particle: Particle = {
    x: 400,
    y: 300,
    px: 400,
    py: 300,
    vx: 0,
    vy: 0,
    size: 1,
    alpha: 0.5,
    speed: 1,
    band: 0,
    tone: 'ink',
  };

  stepParticle(particle, {
    width: 800,
    height: 600,
    time: 0,
    pointer: { x: 400, y: 300, active: true },
  });

  assert.ok(Number.isFinite(particle.x));
  assert.ok(Number.isFinite(particle.y));
  assert.ok(Number.isFinite(particle.vx));
  assert.ok(Number.isFinite(particle.vy));
});

test('burstParticles applies finite radial velocity with distance falloff', () => {
  const particles = createParticles(800, 600, 20, 54321);

  burstParticles(particles, 400, 300, 8);

  assert.ok(particles.every((particle) => Number.isFinite(particle.vx) && Number.isFinite(particle.vy)));
  assert.ok(particles.some((particle) => Math.hypot(particle.vx, particle.vy) > 0.1));
});

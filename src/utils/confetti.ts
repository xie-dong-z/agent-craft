import confetti from 'canvas-confetti';

/**
 * Triggers a celebratory confetti shower upon submitting a new creation.
 * Uses refined warm vermilion, gold, ink, and cream palette matching the editorial theme.
 */
export function triggerSubmitConfetti() {
  const colors = ['#c84732', '#171714', '#d4af37', '#e8dfcf'];

  // Left side burst
  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    origin: { x: 0.15, y: 0.65 },
    colors,
    ticks: 200,
    gravity: 1.1,
    scalar: 0.9,
    disableForReducedMotion: true,
  });

  // Right side burst
  confetti({
    particleCount: 50,
    angle: 120,
    spread: 55,
    origin: { x: 0.85, y: 0.65 },
    colors,
    ticks: 200,
    gravity: 1.1,
    scalar: 0.9,
    disableForReducedMotion: true,
  });
}

/**
 * Triggers a subtle mini burst of vermilion sparks when liking a project.
 */
export function triggerLikeConfetti(clientX?: number, clientY?: number) {
  const x = clientX !== undefined ? clientX / window.innerWidth : 0.5;
  const y = clientY !== undefined ? clientY / window.innerHeight : 0.5;

  confetti({
    particleCount: 18,
    angle: 90,
    spread: 45,
    startVelocity: 16,
    origin: { x, y },
    colors: ['#c84732', '#e0604b', '#171714'],
    ticks: 120,
    gravity: 1.2,
    scalar: 0.65,
    disableForReducedMotion: true,
  });
}

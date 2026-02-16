// Haptic feedback utility
// - Android: uses navigator.vibrate() API
// - iOS: no web haptics API exists — vibrate() is not supported in Safari/WebKit
//   We use short AudioContext ticks as subtle tactile audio feedback instead

const hasVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Tiny inaudible tick via AudioContext — triggers iOS audio engine
// which gives a subtle "system activity" feel even without real haptics
function iosTick(durationMs = 8, freq = 4000, gain = 0.015) {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {}
}

export function hapticLight() {
  if (hasVibrate) {
    navigator.vibrate(10);
  } else if (isIOS) {
    iosTick(6, 4000, 0.01);
  }
}

export function hapticMedium() {
  if (hasVibrate) {
    navigator.vibrate(20);
  } else if (isIOS) {
    iosTick(10, 3500, 0.02);
  }
}

export function hapticHeavy() {
  if (hasVibrate) {
    navigator.vibrate(40);
  } else if (isIOS) {
    iosTick(15, 3000, 0.03);
  }
}

export function hapticSuccess() {
  if (hasVibrate) {
    navigator.vibrate([10, 30, 10]);
  } else if (isIOS) {
    iosTick(8, 4500, 0.015);
    setTimeout(() => iosTick(8, 5000, 0.015), 40);
  }
}

export function hapticError() {
  if (hasVibrate) {
    navigator.vibrate([40, 30, 40]);
  } else if (isIOS) {
    iosTick(12, 2500, 0.025);
    setTimeout(() => iosTick(12, 2000, 0.025), 50);
  }
}

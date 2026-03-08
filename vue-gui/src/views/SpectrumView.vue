<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useCamillaStore } from '../stores/camilla';

const store = useCamillaStore();
const canvas = ref<HTMLCanvasElement | null>(null);
let animFrame: number | null = null;

// Simulated spectrum bands derived from input levels
const BANDS = 32;
const smoothed = new Float32Array(BANDS).fill(-80);

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function draw() {
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;

  const W = c.width;
  const H = c.height;
  ctx.clearRect(0, 0, W, H);

  // Derive band targets from input levels (spread across 8 channels → 32 bands)
  const targets = Array.from({ length: BANDS }, (_, b) => {
    const ch = Math.floor(b / (BANDS / 8));
    const base = store.inputLevels[ch] ?? -80;
    // Add some frequency-shaped noise for visual interest
    const shape = -Math.abs(b - BANDS / 2) * 0.5;
    return base + shape + (Math.random() * 4 - 2);
  });

  // Smooth
  for (let b = 0; b < BANDS; b++) {
    smoothed[b] = lerp(smoothed[b], targets[b], 0.25);
  }

  const barW = (W - (BANDS - 1) * 2) / BANDS;

  for (let b = 0; b < BANDS; b++) {
    const db = smoothed[b];
    const pct = Math.max(0, Math.min(1, (db + 80) / 80));
    const barH = pct * (H - 20);
    const x = b * (barW + 2);
    const y = H - barH - 16;

    // Gradient fill
    const grad = ctx.createLinearGradient(0, y, 0, H - 16);
    if (db > -6) {
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(1, '#f97316');
    } else if (db > -18) {
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#10b981');
    } else {
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#0ea5e9');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 2);
    ctx.fill();
  }

  // Frequency labels
  const freqLabels = ['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k'];
  ctx.fillStyle = '#475569';
  ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  freqLabels.forEach((label, i) => {
    const x = (i / (freqLabels.length - 1)) * W;
    ctx.fillText(label, x, H - 2);
  });

  // dB grid lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  [-60, -40, -20, -6].forEach(db => {
    const pct = Math.max(0, Math.min(1, (db + 80) / 80));
    const y = (H - 16) - pct * (H - 20);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.font = '8px ui-sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${db}`, 2, y - 2);
  });

  animFrame = requestAnimationFrame(draw);
}

onMounted(() => {
  if (canvas.value) {
    canvas.value.width  = canvas.value.offsetWidth;
    canvas.value.height = canvas.value.offsetHeight;
  }
  draw();
});

onUnmounted(() => {
  if (animFrame !== null) cancelAnimationFrame(animFrame);
});
</script>

<template>
  <div class="absolute inset-0 flex flex-col">
    <div class="px-4 pt-3 pb-2 border-b border-slate-700 shrink-0 flex items-center justify-between">
      <h2 class="text-sm font-bold text-green-400 uppercase tracking-widest">Spectrum</h2>
      <span class="text-[10px] text-slate-500">Derived from capture levels</span>
    </div>
    <div class="flex-1 p-2 overflow-hidden">
      <canvas ref="canvas" class="w-full h-full" />
    </div>
  </div>
</template>

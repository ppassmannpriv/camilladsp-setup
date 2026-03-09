<script setup lang="ts">
import { computed } from 'vue';
import { useCamillaStore } from '../stores/camilla';
import { useSocket } from '../composables/useSocket';
import * as yaml from "yaml";

const store = useCamillaStore();
const { sendCmd } = useSocket();

// Convert dB level (-100..0) to a 0–100% bar height
function dbToPercent(db: number): number {
  return Math.max(0, Math.min(100, (db + 100) * 100 / 100));
}

function barColor(db: number): string {
  if (db > -6)  return 'bg-red-500';
  if (db > -18) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function toggleMute(type: 'input' | 'output', idx: number) {
  if (type === 'input') {
    store.inputMutes[idx] = !store.inputMutes[idx];
    if (store.config === null) return;
    const mixers = store.config.mixers;
    for (const mixerKey in mixers) {
      const mixer = mixers[mixerKey];

      if (mixer === undefined || mixer.mapping === undefined || mixer.mapping[idx] === undefined) continue;
      const channelMapping = mixer.mapping[idx];
      channelMapping.mute = !store.inputMutes[idx];
      mixer.mapping[idx].mute = !mixer.mapping[idx].mute;
    }
    //@TODO: Oh wow this worked lmao
    sendCmd({ SetConfig: yaml.stringify(store.config) });
    sendCmd({ SetInputMute: { channel: idx, mute: store.inputMutes[idx] } });
  } else {
    store.outputMutes[idx] = !store.outputMutes[idx];
    sendCmd({ SetOutputMute: { channel: idx, mute: store.outputMutes[idx] } });
  }
}

const channels = computed(() => Array.from({ length: 8 }, (_, i) => i));
</script>

<template>
  <div class="absolute inset-0 flex flex-col">
    <!-- Section header row -->
    <div class="grid grid-cols-2 divide-x divide-slate-700 shrink-0 border-b border-slate-700">
      <div class="px-3 py-1 text-[9px] uppercase tracking-widest text-slate-500 font-bold">Capture In</div>
      <div class="px-3 py-1 text-[9px] uppercase tracking-widest text-slate-500 font-bold">Playback Out</div>
    </div>

    <!-- Meter columns -->
    <div class="flex-1 grid grid-cols-2 divide-x divide-slate-700 overflow-hidden">

      <!-- Input meters -->
      <div class="flex items-end justify-around px-2 pb-2 pt-1 gap-1">
        <div
          v-for="i in channels" :key="'in-' + i"
          class="flex flex-col items-center gap-1 flex-1 h-full"
        >
          <!-- Bar -->
          <div class="flex-1 w-full flex flex-col justify-end bg-slate-800 rounded-sm overflow-hidden min-h-0">
            <div
              class="w-full rounded-sm meter-fill"
              :class="barColor(store.inputLevels[i])"
              :style="{ height: dbToPercent(store.inputLevels[i]) + '%' }"
            />
            <div
              class="w-full rounded-sm h-1 peak-indicator"
              :class="barColor(store.inputLevels[i])"
              :style="{ bottom: dbToPercent(store.inputPeakLevels[i]) + '%' }"
            />
          </div>
          <!-- dB label -->
          <span class="text-[8px] font-mono text-slate-400 leading-none">
            {{ store.inputLevels[i] > -99 ? store.inputLevels[i].toFixed(0) : '-∞' }}
          </span>
          <!-- Mute button -->
          <button
            class="w-full text-[8px] font-bold py-0.5 rounded border transition-colors touch-manipulation"
            :class="store.inputMutes[i] ? 'mute-active' : 'mute-inactive'"
            @click="toggleMute('input', i)"
          >M</button>
          <!-- Channel label -->
          <span class="text-[8px] text-slate-500">{{ i + 1 }}</span>
        </div>
      </div>

      <!-- Output meters -->
      <div class="flex items-end justify-around px-2 pb-2 pt-1 gap-1">
        <div
          v-for="i in channels" :key="'out-' + i"
          class="flex flex-col items-center gap-1 flex-1 h-full"
        >
          <div class="flex-1 w-full flex flex-col justify-end bg-slate-800 rounded-sm overflow-hidden min-h-0">
            <div
              class="w-full rounded-sm meter-fill"
              :class="barColor(store.outputLevels[i])"
              :style="{ height: dbToPercent(store.outputLevels[i]) + '%' }"
            />
            <div
                class="w-full rounded-sm h-1 peak-indicator"
                :class="barColor(store.inputLevels[i])"
                :style="{ bottom: dbToPercent(store.outputPeakLevels[i]) + '%' }"
            />
          </div>
          <span class="text-[8px] font-mono text-slate-400 leading-none">
            {{ store.outputLevels[i] > -99 ? store.outputLevels[i].toFixed(0) : '-∞' }}
          </span>
          <button
            class="w-full text-[8px] font-bold py-0.5 rounded border transition-colors touch-manipulation"
            :class="store.outputMutes[i] ? 'mute-active' : 'mute-inactive'"
            @click="toggleMute('output', i)"
          >M</button>
          <span class="text-[8px] text-slate-500">{{ i + 1 }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

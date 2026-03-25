<script setup lang="ts">
import { computed } from 'vue';
import { useCamillaDspStore } from '../stores/useCamillaDspStore';

const store = useCamillaDspStore();

// Convert dB level (-100..0) to a 0–100% bar height
function dbToPercent(db: number): number {
  return Math.max(0, Math.min(100, (db + 100) * 100 / 100));
}

function barColor(db: number, muted?: boolean): string {
  if (muted) return 'bg-slate-700';
  if (db > -6)  return 'bg-red-500';
  if (db > -18) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function auxFaders() {
  console.log(store.dspSocket?.getFaders());
}

function toggleMute(type: 'input' | 'output', idx: number) {
  if (type === 'input') {
    store.toggleMuteInputChannel(idx);
  } else {
    store.toggleMuteOutputChannel(idx);
  }
}

const configLoaded = computed(() => store.$state.config !== null);

const inputGroups = computed(() => Array.from({ length: 4 }, (_, i) => i));

const channels = computed(() => Array.from({ length: 8 }, (_, i) => i));

</script>

<template>
  <div class="absolute inset-0 flex flex-col">
    <!-- Section header row -->
    <div class="grid grid-cols-1 divide-x divide-slate-700 shrink-0 border-b border-slate-700">
      <div class="px-3 py-1 text-[9px] uppercase tracking-widest text-slate-500 font-bold">Source Groups</div>
    </div>

    <div class="flex-1 grid grid-cols-1 divide-x divide-slate-700 overflow-hidden">

      <!-- Input meters -->
      <div class="flex items-end justify-around px-2 pb-2 pt-1 gap-1">
        <div
            v-for="i in inputGroups" :key="'in-' + i"
            class="flex flex-col items-center gap-1 flex-1 h-full"
        >
          <!-- Bar -->
          <div class="flex-1 w-full flex flex-col justify-end bg-slate-800 rounded-sm overflow-hidden min-h-0">
            <div
                class="w-full rounded-sm meter-fill"
                :class="barColor(store.inputLevels[i], store.inputMutes[i])"
                :style="{ height: dbToPercent(store.inputLevels[i]) + '%' }"
            />
            <div
                class="w-full rounded-sm h-1 peak-indicator"
                :class="barColor(store.inputLevels[i], store.inputMutes[i])"
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
    </div>

    <!-- Section header row -->
    <div class="grid grid-cols-1 divide-x divide-slate-700 shrink-0 border-b border-slate-700">
      <div class="px-3 py-1 text-[9px] uppercase tracking-widest text-slate-500 font-bold">Output Groups</div>
    </div>

    <!-- Meter columns -->
    <div class="flex-1 grid grid-cols-1 divide-x divide-slate-700 overflow-hidden">

      <!-- Output meters -->
      <div class="flex items-end justify-around px-2 pb-2 pt-1 gap-1">
        <div
          v-for="i in channels" :key="'out-' + i"
          class="flex flex-col items-center gap-1 flex-1 h-full"
        >
          <div class="flex-1 w-full flex flex-col justify-end bg-slate-800 rounded-sm overflow-hidden min-h-0">
            <div
              class="w-full rounded-sm meter-fill"
              :class="barColor(store.outputLevels[i], store.outputMutes[i])"
              :style="{ height: dbToPercent(store.outputLevels[i]) + '%' }"
            />
            <div
                class="w-full rounded-sm h-1 peak-indicator"
                :class="barColor(store.outputLevels[i], store.outputMutes[i])"
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
          <span v-if="configLoaded" class="text-[12px] text-slate-500">{{ store.outputChannels[i].label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

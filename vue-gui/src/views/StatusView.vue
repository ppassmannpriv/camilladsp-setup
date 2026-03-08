<script setup lang="ts">
import { useCamillaStore } from '../stores/camilla';

const store = useCamillaStore();

const stats = [
  { id: 'state',   label: 'State',          color: 'text-emerald-400', value: () => store.systemState },
  { id: 'sr',      label: 'Sample Rate',     color: 'text-sky-300',     value: () => store.samplerate ? store.samplerate + ' Hz' : '--' },
  { id: 'buf',     label: 'Buffer Size',     color: 'text-slate-300',   value: () => store.bufferSize || '--' },
  { id: 'ver',     label: 'Version',         color: 'text-slate-300',   value: () => store.version },
];
</script>

<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden">
    <div class="px-4 pt-3 pb-2 border-b border-slate-700 shrink-0">
      <h2 class="text-sm font-bold text-teal-400 uppercase tracking-widest">Status</h2>
    </div>

    <div class="flex-1 overflow-auto p-3 grid grid-cols-2 gap-3 content-start">
      <!-- Stat cards -->
      <div
        v-for="s in stats" :key="s.id"
        class="bg-slate-800/60 border border-slate-700 rounded-lg p-3"
      >
        <div class="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-1">{{ s.label }}</div>
        <div class="text-lg font-mono" :class="s.color">{{ s.value() }}</div>
      </div>

      <!-- Capture device (full width) -->
      <div class="bg-slate-800/60 border border-slate-700 rounded-lg p-3 col-span-2">
        <div class="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-1">Capture Device</div>
        <div class="text-sm font-mono text-slate-300 truncate">{{ store.captureDevice }}</div>
      </div>

      <!-- Playback device (full width) -->
      <div class="bg-slate-800/60 border border-slate-700 rounded-lg p-3 col-span-2">
        <div class="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-1">Playback Device</div>
        <div class="text-sm font-mono text-slate-300 truncate">{{ store.playbackDevice }}</div>
      </div>

      <!-- Active config (full width) -->
      <div class="bg-slate-800/60 border border-slate-700 rounded-lg p-3 col-span-2">
        <div class="text-[9px] uppercase text-slate-500 font-bold tracking-widest mb-1">Active Config</div>
        <div class="text-sm font-mono text-slate-300 truncate">{{ store.activeConfig }}</div>
      </div>
    </div>
  </div>
</template>

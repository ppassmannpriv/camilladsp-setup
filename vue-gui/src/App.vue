<script setup lang="ts">
import { onMounted } from 'vue';
import { useCamillaStore } from './stores/camilla';
import { useSocket } from './composables/useSocket';
import type { ViewName } from './types';

import MetersView   from './views/MetersView.vue';
import PipelineView from './views/PipelineView.vue';
import SpectrumView from './views/SpectrumView.vue';
import FiltersView  from './views/FiltersView.vue';
import ConfigsView  from './views/ConfigsView.vue';
import StatusView   from './views/StatusView.vue';
import SettingsView from './views/SettingsView.vue';

const store = useCamillaStore();
const { connect, sendCmd } = useSocket();

onMounted(() => connect());

const views: { id: ViewName; label: string; color: string; icon: string }[] = [
  { id: 'meters',   label: 'Meters',   color: 'text-sky-400',    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'pipeline', label: 'Pipeline', color: 'text-purple-400', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { id: 'spectrum', label: 'Spectrum', color: 'text-green-400',  icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14' },
  { id: 'filters',  label: 'Filters',  color: 'text-yellow-400', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z' },
  { id: 'configs',  label: 'Configs',  color: 'text-orange-400', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
  { id: 'status',   label: 'Status',   color: 'text-teal-400',   icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'settings', label: 'Settings', color: 'text-slate-400',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function setVolume(v: number) {
  store.volume = v;
  sendCmd({ SetVolume: v });
}
</script>

<template>
  <div class="w-[800px] h-[480px] bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative select-none">

    <!-- ── Top bar ── -->
    <header class="h-10 shrink-0 flex items-center justify-between px-3 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm z-10">
      <!-- Hamburger -->
      <button
        class="p-1.5 hover:bg-slate-700 rounded transition-colors touch-manipulation"
        @click="store.menuOpen = true"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <!-- Title / active view -->
      <span class="text-xs font-bold uppercase tracking-widest text-slate-400">
        {{ store.view }}
      </span>

      <!-- Status + volume -->
      <div class="flex items-center gap-3">
        <span class="text-xs font-mono" :class="store.statusColor">
          {{ store.connected ? store.systemState : 'offline' }}
        </span>
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3"/>
          </svg>
          <input
            type="range" min="-100" max="0" step="1"
            :value="store.volume"
            class="w-20 accent-sky-500"
            @input="setVolume(+($event.target as HTMLInputElement).value)"
          />
          <span class="text-xs font-mono text-sky-400 w-10 text-right">{{ store.volume }} dB</span>
        </div>
      </div>
    </header>

    <!-- ── View container ── -->
    <main class="flex-1 overflow-hidden relative">
      <MetersView   v-if="store.view === 'meters'"   />
      <PipelineView v-else-if="store.view === 'pipeline'" />
      <SpectrumView v-else-if="store.view === 'spectrum'" />
      <FiltersView  v-else-if="store.view === 'filters'"  />
      <ConfigsView  v-else-if="store.view === 'configs'"  />
      <StatusView   v-else-if="store.view === 'status'"   />
      <SettingsView v-else-if="store.view === 'settings'" />
    </main>

    <!-- ── Slide-in menu overlay ── -->
    <Transition
      enter-active-class="transition-transform duration-200 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="store.menuOpen"
        class="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col"
      >
        <!-- Menu header -->
        <div class="h-10 flex items-center justify-between px-4 border-b border-slate-700 shrink-0">
          <span class="font-bold text-sky-400">Menu</span>
          <button
            class="p-1.5 hover:bg-slate-700 rounded transition-colors touch-manipulation"
            @click="store.menuOpen = false"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Menu grid -->
        <nav class="flex-1 grid grid-cols-3 gap-2 p-4 content-start">
          <button
            v-for="v in views"
            :key="v.id"
            class="flex flex-col items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-xl transition-colors touch-manipulation"
            :class="store.view === v.id ? 'ring-2 ring-sky-500' : ''"
            @click="store.setView(v.id)"
          >
            <svg class="w-7 h-7" :class="v.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="v.icon"/>
            </svg>
            <span class="text-xs font-semibold">{{ v.label }}</span>
          </button>
        </nav>
      </div>
    </Transition>

  </div>
</template>

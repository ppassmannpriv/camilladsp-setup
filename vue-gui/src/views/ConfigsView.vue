<script setup lang="ts">
import { useCamillaStore } from '../stores/camilla';
import { useSocket } from '../composables/useSocket';

const store = useCamillaStore();
const { sendCmd } = useSocket();

function loadConfig(name: string) {
  sendCmd({ SetConfigFilePath: name });
  sendCmd({ Reload: null });
}
</script>

<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden">
    <div class="px-4 pt-3 pb-2 border-b border-slate-700 shrink-0 flex items-center justify-between">
      <h2 class="text-sm font-bold text-orange-400 uppercase tracking-widest">Configs</h2>
      <span class="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">{{ store.activeConfig }}</span>
    </div>

    <div v-if="store.configs.length === 0" class="flex-1 flex items-center justify-center text-slate-600 text-sm">
      No configs available
    </div>

    <div v-else class="flex-1 overflow-y-auto p-3 space-y-2">
      <button
        v-for="cfg in store.configs" :key="cfg"
        class="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors touch-manipulation"
        :class="cfg === store.activeConfig
          ? 'bg-orange-900/30 border-orange-600/60 text-orange-300'
          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'"
        @click="loadConfig(cfg)"
      >
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 shrink-0" :class="cfg === store.activeConfig ? 'text-orange-400' : 'text-slate-500'"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span class="text-sm font-mono">{{ cfg }}</span>
        </div>
        <div v-if="cfg === store.activeConfig" class="flex items-center gap-1 text-[10px] text-orange-400 font-bold">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          ACTIVE
        </div>
        <div v-else class="text-[10px] text-slate-600">tap to load</div>
      </button>
    </div>
  </div>
</template>

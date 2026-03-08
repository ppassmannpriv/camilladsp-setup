<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCamillaStore } from '../stores/camilla';

const store = useCamillaStore();
const selected = ref<string | null>(null);

const filters = computed(() => Object.entries(store.config?.filters ?? {}));

function typeColor(type: string) {
  const map: Record<string, string> = {
    Biquad: 'text-sky-400',
    BiquadCombo: 'text-blue-400',
    Delay: 'text-purple-400',
    Volume: 'text-emerald-400',
    Loudness: 'text-amber-400',
    DiffEq: 'text-rose-400',
  };
  return map[type] ?? 'text-slate-400';
}

function typeBadge(type: string) {
  const map: Record<string, string> = {
    Biquad: 'bg-sky-900/40 border-sky-700/50',
    BiquadCombo: 'bg-blue-900/40 border-blue-700/50',
    Delay: 'bg-purple-900/40 border-purple-700/50',
    Volume: 'bg-emerald-900/40 border-emerald-700/50',
    Loudness: 'bg-amber-900/40 border-amber-700/50',
    DiffEq: 'bg-rose-900/40 border-rose-700/50',
  };
  return map[type] ?? 'bg-slate-800/40 border-slate-700/50';
}

const selectedFilter = computed(() =>
  selected.value ? store.config?.filters?.[selected.value] : null
);
</script>

<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden">
    <div class="px-4 pt-3 pb-2 border-b border-slate-700 shrink-0">
      <h2 class="text-sm font-bold text-yellow-400 uppercase tracking-widest">Filters</h2>
    </div>

    <div v-if="filters.length === 0" class="flex-1 flex items-center justify-center text-slate-600 text-sm">
      No config loaded
    </div>

    <div v-else class="flex-1 flex overflow-hidden">
      <!-- Filter list -->
      <div class="w-48 shrink-0 border-r border-slate-700 overflow-y-auto">
        <button
          v-for="[name, def] in filters" :key="name"
          class="w-full text-left px-3 py-2 border-b border-slate-800 hover:bg-slate-800 transition-colors touch-manipulation"
          :class="selected === name ? 'bg-slate-800 border-l-2 border-l-yellow-500' : ''"
          @click="selected = name"
        >
          <div class="text-xs font-mono text-slate-200 truncate">{{ name }}</div>
          <div class="text-[9px] mt-0.5" :class="typeColor(def.type)">{{ def.type }}</div>
        </button>
      </div>

      <!-- Filter detail -->
      <div class="flex-1 overflow-y-auto p-3">
        <div v-if="!selected" class="h-full flex items-center justify-center text-slate-600 text-sm">
          Select a filter
        </div>
        <div v-else-if="selectedFilter">
          <div class="flex items-start gap-2 mb-3">
            <div>
              <div class="text-base font-mono font-bold text-slate-100">{{ selected }}</div>
              <div
                class="inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-1"
                :class="[typeColor(selectedFilter.type), typeBadge(selectedFilter.type)]"
              >{{ selectedFilter.type }}</div>
            </div>
          </div>

          <div v-if="selectedFilter.description" class="text-xs text-slate-400 mb-3 italic">
            {{ selectedFilter.description }}
          </div>

          <div v-if="selectedFilter.parameters" class="space-y-1">
            <div class="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Parameters</div>
            <div
              v-for="(val, key) in selectedFilter.parameters" :key="key"
              class="flex items-start justify-between bg-slate-800/60 rounded px-2 py-1.5 gap-2"
            >
              <span class="text-[10px] text-slate-400 font-mono shrink-0">{{ key }}</span>
              <span class="text-[10px] text-slate-200 font-mono text-right break-all">
                {{ Array.isArray(val) ? '[' + (val as number[]).map((v: number) => v.toFixed(2)).join(', ') + ']' : String(val) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

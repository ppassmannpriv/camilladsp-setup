<script setup lang="ts">
import { computed } from 'vue';
import { useCamillaStore } from '../stores/camilla';

const store = useCamillaStore();

const pipeline = computed(() => store.config?.pipeline ?? []);

function nodeClass(type: string) {
  if (type === 'Filter')    return 'pipeline-node-filter';
  if (type === 'Mixer')     return 'pipeline-node-mixer';
  if (type === 'Processor') return 'pipeline-node-processor';
  return 'border-slate-600 bg-slate-800/40';
}

function nodeColor(type: string) {
  if (type === 'Filter')    return 'text-yellow-400';
  if (type === 'Mixer')     return 'text-purple-400';
  if (type === 'Processor') return 'text-teal-400';
  return 'text-slate-400';
}
</script>

<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden">
    <div class="px-4 pt-3 pb-2 border-b border-slate-700 shrink-0">
      <h2 class="text-sm font-bold text-purple-400 uppercase tracking-widest">Pipeline</h2>
    </div>

    <div v-if="pipeline.length === 0" class="flex-1 flex items-center justify-center text-slate-600 text-sm">
      No config loaded
    </div>

    <div v-else class="flex-1 overflow-auto p-3">
      <!-- Horizontal scrollable pipeline chain -->
      <div class="flex items-start gap-2 min-w-max pb-2">
        <template v-for="(step, idx) in pipeline" :key="idx">
          <!-- Arrow connector -->
          <div v-if="idx > 0" class="flex items-center self-center text-slate-600 shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>

          <!-- Pipeline node -->
          <div
            class="border rounded-lg p-2 min-w-[90px] max-w-[130px] shrink-0"
            :class="[nodeClass(step.type), step.bypassed ? 'opacity-40' : '']"
          >
            <div class="text-[9px] font-bold uppercase tracking-widest mb-1" :class="nodeColor(step.type)">
              {{ step.type }}
            </div>

            <!-- Mixer node -->
            <template v-if="step.type === 'Mixer'">
              <div class="text-xs font-mono text-slate-300 truncate">{{ step.name }}</div>
            </template>

            <!-- Filter node -->
            <template v-else-if="step.type === 'Filter'">
              <div class="text-[10px] text-slate-500 mb-1">ch {{ step.channel }}</div>
              <div
                v-for="name in step.names" :key="name"
                class="text-[10px] font-mono text-slate-300 truncate bg-slate-900/50 rounded px-1 py-0.5 mb-0.5"
              >{{ name }}</div>
            </template>

            <!-- Processor node -->
            <template v-else>
              <div class="text-xs font-mono text-slate-300 truncate">{{ step.name }}</div>
            </template>

            <div v-if="step.bypassed" class="text-[8px] text-amber-400 mt-1 font-bold">BYPASSED</div>
          </div>
        </template>
      </div>

      <!-- Mixers detail -->
      <div v-if="store.config?.mixers" class="mt-4">
        <div class="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Mixer Mappings</div>
        <div class="space-y-2">
          <div
            v-for="(mixer, name) in store.config.mixers" :key="name"
            class="bg-slate-800/60 border border-purple-600/30 rounded-lg p-2"
          >
            <div class="text-xs font-bold text-purple-400 mb-1">{{ name }}
              <span class="text-slate-500 font-normal ml-1">
                ({{ mixer.channels?.in }}→{{ mixer.channels?.out }})
              </span>
            </div>
            <div class="grid grid-cols-4 gap-1">
              <div
                v-for="map in mixer.mapping" :key="map.dest"
                class="bg-slate-900/60 rounded px-1.5 py-1 text-[9px]"
              >
                <span class="text-purple-300">→{{ map.dest }}</span>
                <span class="text-slate-500 ml-1">
                  from {{ map.sources.map(s => s.channel).join(',') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

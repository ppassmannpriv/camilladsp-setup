<script setup lang="ts">
//import { useCamillaStore } from '../stores/camilla';
//import { useSocket } from '../composables/useSocket';

//const store = useCamillaStore();
//const { connect } = useSocket();

function onDevModeChange(e: Event) {
//  store.devMode = (e.target as HTMLInputElement).checked;
//  connect();
}

function onPollChange(e: Event) {
  store.pollInterval = Number((e.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden">
    <div class="px-4 pt-3 pb-2 border-b border-slate-700 shrink-0">
      <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest">Settings</h2>
    </div>

    <div class="flex-1 overflow-auto p-3 space-y-3">

      <!-- Dev Mode Toggle -->
      <div class="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold">Developer Mode</div>
          <div class="text-[10px] text-slate-500">Use mock data — no real CamillaDSP needed</div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            class="sr-only peer"
            :checked="store.devMode"
            @change="onDevModeChange"
          />
          <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer
            peer-checked:after:translate-x-full peer-checked:after:border-white
            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
            after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
            peer-checked:bg-amber-500">
          </div>
        </label>
      </div>

      <!-- Host Address -->
      <div class="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
        <div class="text-sm font-semibold">CamillaDSP Host</div>
        <div class="text-[10px] text-slate-500">WebSocket address (host:port)</div>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="store.host"
            placeholder="localhost:5011"
            class="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm font-mono
              focus:outline-none focus:border-sky-500"
          />
          <button
            class="bg-sky-600 hover:bg-sky-500 active:bg-sky-700 px-4 py-2 rounded text-sm font-bold
              transition-colors touch-manipulation"
            @click="connect()"
          >
            Connect
          </button>
        </div>
      </div>

      <!-- Poll Interval -->
      <div class="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold">Level Poll Interval</div>
          <span class="text-sm font-mono text-sky-400">{{ store.pollInterval }} ms</span>
        </div>
        <input
          type="range" min="50" max="500" step="50"
          :value="store.pollInterval"
          class="w-full accent-sky-500"
          @input="onPollChange"
        />
      </div>

      <!-- Connection status -->
      <div class="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
        <div class="text-sm font-semibold">Connection</div>
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full"
            :class="store.connected ? 'bg-emerald-400' : 'bg-red-500'"
          />
          <span class="text-sm font-mono" :class="store.connected ? 'text-emerald-400' : 'text-red-400'">
            {{ store.connected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

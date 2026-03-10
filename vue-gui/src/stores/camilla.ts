import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as yaml  from 'yaml';
import type { CamillaConfig, ViewName } from '../types';
import { WsReply } from "../bridge/camilla-dsp-ws-bridge.ts";

export const useCamillaStore = defineStore('camilla', () => {
  // ── Connection ────────────────────────────────────────────────────────────
  const connected = ref(false);
  const devMode = ref(false);
  const host = ref('192.168.1.75:1234');
  const pollInterval = ref(100);

  // ── Navigation ────────────────────────────────────────────────────────────
  const view = ref<ViewName>('meters');
  const menuOpen = ref(false);

  // ── Signal levels ─────────────────────────────────────────────────────────
  const inputLevels = ref<number[]>(Array(8).fill(-100));
  const outputLevels = ref<number[]>(Array(8).fill(-100));
  const inputPeakLevels = ref<number[]>(Array(8).fill(-100));
  const outputPeakLevels = ref<number[]>(Array(8).fill(-100));
  const inputMutes = ref<boolean[]>(Array(8).fill(false));
  const outputMutes = ref<boolean[]>(Array(8).fill(false));

  // ── DSP state ─────────────────────────────────────────────────────────────
  const volume = ref(-20);
  const samplerate = ref(0);
  const systemState = ref('--');
  const version = ref('--');
  const bufferSize = ref(0);
  const captureDevice = ref('--');
  const playbackDevice = ref('--');

  // ── Config ────────────────────────────────────────────────────────────────
  const config = ref<CamillaConfig | null>(null);
  const configs = ref<string[]>([]);
  const activeConfig = ref('--');

  // ── Computed ──────────────────────────────────────────────────────────────
  const statusColor = computed(() => {
    if (!connected.value) return 'text-red-400';
    if (systemState.value === 'Running') return 'text-emerald-400';
    if (systemState.value === 'Paused') return 'text-amber-400';
    return 'text-slate-400';
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setView(v: ViewName) {
    view.value = v;
    menuOpen.value = false;
  }

  function handleMessage(msg: WsReply | Record<string, unknown>) {
    for (const [key, payload] of Object.entries(msg)) {
      const p = payload as Record<string, unknown>;
      if (p?.result !== 'Ok') continue;
      const val = p.value;

      switch (key) {
        case 'GetVersion':       version.value = String(val ?? '--'); break;
        case 'GetState':         systemState.value = String(val ?? '--'); break;
        case 'GetCaptureSampleRate': samplerate.value = Number(val ?? 0); break;
        case 'GetVolume':        volume.value = Number(val ?? -100); break;
        case 'GetBufferSize':    bufferSize.value = Number(val ?? 0); break;
        case 'GetConfigFilePath': activeConfig.value = String(val ?? '--'); break;
        case 'GetAvailableConfigFiles': configs.value = (val as string[]) ?? []; break;
        case 'GetConfig': {
          if (typeof val === "string") {
            const configYaml = yaml.parseDocument(val);
            config.value = configYaml.toJS() as CamillaConfig ?? null;
          } else {
            console.log("GetConfig: not a string.");
          }
          break;
        }
        case 'GetCaptureDevice': captureDevice.value = String(val ?? '--'); break;
        case 'GetPlaybackDevice': playbackDevice.value = String(val ?? '--'); break;
        case 'GetCaptureSignalLevels': {
          const lvl = (val as { level?: number[] })?.level;
          if (Array.isArray(lvl)) inputLevels.value = lvl;
          break;
        }
        case 'GetSignalLevels': {
          const { capture_peak, capture_rms, playback_peak, playback_rms } = val as {
            capture_peak?: number[],
            capture_rms?: number[],
            playback_peak?: number[],
            playback_rms?: number[],
          };
          if (Array.isArray(playback_rms)) outputLevels.value = playback_rms.map((n) => parseFloat(String(n)));
          if (Array.isArray(playback_peak)) outputPeakLevels.value = playback_peak.map((n) => parseFloat(String(n)));
          if (Array.isArray(capture_rms)) inputLevels.value = capture_rms.map((n) => parseFloat(String(n)));
          if (Array.isArray(capture_peak)) inputPeakLevels.value = capture_peak.map((n) => parseFloat(String(n)));
          break;
        }
      }
    }
  }

  return {
    connected, devMode, host, pollInterval,
    view, menuOpen,
    inputLevels, inputPeakLevels, outputLevels, outputPeakLevels, inputMutes, outputMutes,
    volume, samplerate, systemState, version, bufferSize,
    captureDevice, playbackDevice,
    config, configs, activeConfig,
    statusColor,
    setView, handleMessage,
  };
});

import { defineStore } from 'pinia';
import type { ViewName } from '../types';
import { CamillaDspWsBridge, MessageHandler, WsReply } from '../bridge/camilla-dsp-ws-bridge.ts';

let pollTimer: ReturnType<typeof setInterval> | null = null;

export const useCamillaDspStore = defineStore('camilladsp', {
    state: () => ({
        // DSP Connection
        connected: false,
        devMode: false,
        host: '192.168.1.75:1234',
        pollInterval: 100,
        dspSocket: null as CamillaDspWsBridge | null,
        // Navigation
        view: 'meters' as ViewName,
        menuOpen: false,
        // Signal levels
        inputLevels: Array(8).fill(-100),
        outputLevels: Array(8).fill(-100),
        inputPeakLevels: Array(8).fill(-100),
        outputPeakLevels: Array(8).fill(-100),
        inputMutes: Array(8).fill(false),
        outputMutes: Array(8).fill(false),
        // DSP state
        volume: -20,
        samplerate: 0,
        config: null as string | null,
        version: 'unknown',
        dspState: 'stopped',
        bufferSize: 0,
    }),
    actions: {
        onMessage(msg: WsReply) {
            for (const [key, payload] of Object.entries(msg)) {
                const p = payload as Record<string, unknown>;
                if (p?.result !== 'Ok') continue;
                switch (key) {
                    case 'GetSignalLevels': { this.getSignalLevels(p.value as {}); break; }
                    case 'GetVolume': { this.volume = p.value as number; break; }
                    case 'GetVersion': { this.version = p.value as string; break; }
                    case 'GetState': { this.dspState = p.value as string; break; }
                    case 'GetCaptureRate': { this.samplerate = p.value as number; break; }
                    case 'GetConfig': { this.config = p.value as string; break; }
                    case 'GetBufferLevel': { this.bufferSize = p.value as number; break; }
                    default: { console.log('Received message:', msg); }
                }
            }
        },
        onConnect() {
            this.connected = true;
            this.dspSocket?.getVersion();
            this.dspSocket?.getVolume();
            this.dspSocket?.getState();
            this.dspSocket?.getCaptureRate();
            this.dspSocket?.getConfig();
            this.dspSocket?.getBufferLevel();
        },
        onDisconnect() {
            console.log('WebSocket closed');
        },
        startPolling() {
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(() => {
                if (!this.connected) return;

                this.dspSocket?.getSignalLevels();
                if (this.view === 'status') {
                    this.dspSocket?.getState();
                    this.dspSocket?.getCaptureRate();
                }
            }, this.pollInterval);
        },
        connect() {
            this.dspSocket = new CamillaDspWsBridge({
                onMessage: this.onMessage,
                onConnect: this.onConnect,
                onDisconnect: this.onDisconnect
            });
            this.dspSocket.connect(this.host);
            this.startPolling();
        },
        setVolume(v: number) {
            this.volume = v;
        },
        getSignalLevels({ capture_peak, capture_rms, playback_peak, playback_rms }: {
            capture_peak?: number[],
                capture_rms?: number[],
                playback_peak?: number[],
                playback_rms?: number[],
        }) {
            if (Array.isArray(playback_rms)) this.outputLevels = playback_rms.map((n) => parseFloat(String(n)));
            if (Array.isArray(playback_peak)) this.outputPeakLevels = playback_peak.map((n) => parseFloat(String(n)));
            if (Array.isArray(capture_rms)) this.inputLevels = capture_rms.map((n) => parseFloat(String(n)));
            if (Array.isArray(capture_peak)) this.inputPeakLevels = capture_peak.map((n) => parseFloat(String(n)));
        }
    },
    getters: {
        getDspHost: (state) => {
            return {
                dspHost: state.host,
                dspPort: 1234,
                dspPollInterval: state.pollInterval
            }
        }
    }
});
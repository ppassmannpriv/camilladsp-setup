/**
 * CamillaDSP WebSocket Bridge — Mock
 *
 * Drop-in replacement for CamillaDspWsBridge for UI development without a running server.
 * Simulates realistic responses for every command so the UI can be developed and tested offline.
 */

import type { MessageHandler } from './camilla-dsp-ws-bridge';

// ─── Mock state ───────────────────────────────────────────────────────────────

interface MockState {
  connected:      boolean;
  volume:         number;
  muted:          boolean;
  faders:         { volume: number; mute: boolean }[];
  updateInterval: number;
  configFilePath: string | null;
  stateFilePath:  string | null;
  configYaml:     string;
  processingState: 'Running' | 'Paused' | 'Inactive' | 'Starting' | 'Stalled';
  clippedSamples: number;
  signalPeaksSinceStart: { playback: number[]; capture: number[] };
}

const NUM_CHANNELS = 8;

function makeChannels(base: number, spread = 10): number[] {
  return Array.from({ length: NUM_CHANNELS }, (_, i) => base - i * (spread / NUM_CHANNELS));
}

const MOCK_CONFIG_YAML = `---
devices:
  samplerate: 48000
  chunksize: 1024
  capture:
    type: Alsa
    channels: 8
    device: "hw:0"
    format: S32LE
  playback:
    type: Alsa
    channels: 8
    device: "hw:0"
    format: S32LE
mixers: {}
filters: {}
pipeline: []
`;

// ─── Mock Bridge class ────────────────────────────────────────────────────────

export class CamillaDspWsBridgeMock {
  private onMessage:    MessageHandler;
  private onConnect?:   () => void;
  private onDisconnect?: () => void;

  private _connected = false;
  private _intervalHandle: ReturnType<typeof setInterval> | null = null;

  private state: MockState = {
    connected:      false,
    volume:         -20,
    muted:          false,
    faders:         Array.from({ length: 4 }, () => ({ volume: -20, mute: false })),
    updateInterval: 500,
    configFilePath: '/etc/camilladsp/config.yml',
    stateFilePath:  '/etc/camilladsp/state.yml',
    configYaml:     MOCK_CONFIG_YAML,
    processingState: 'Running',
    clippedSamples: 0,
    signalPeaksSinceStart: {
      playback: makeChannels(-3),
      capture:  makeChannels(-6),
    },
  };

  constructor(options: {
    onMessage:    MessageHandler;
    onConnect?:   () => void;
    onDisconnect?: () => void;
  }) {
    this.onMessage    = options.onMessage;
    this.onConnect    = options.onConnect;
    this.onDisconnect = options.onDisconnect;
  }

  // ─── Connection ─────────────────────────────────────────────────────────────

  get wsState(): number {
    // Mirror WebSocket.OPEN (1) / CLOSED (3)
    return this._connected ? 1 : 3;
  }

  get connected(): boolean {
    return this._connected;
  }

  connect(_host: string): void {
    this.disconnect();
    // Simulate async connection handshake
    setTimeout(() => {
      this._connected = true;
      this.state.connected = true;
      this.onConnect?.();
    }, 80);
  }

  disconnect(): void {
    if (this._intervalHandle !== null) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = null;
    }
    if (this._connected) {
      this._connected = false;
      this.state.connected = false;
      this.onDisconnect?.();
    }
  }

  // ─── Internal reply helper ───────────────────────────────────────────────────

  private reply(msg: object): void {
    setTimeout(() => this.onMessage(msg as any), 10);
  }

  // ─── Simulated live signal levels ───────────────────────────────────────────

  /** Call this to start pushing periodic GetSignalLevels-style updates. */
  startSignalLevelUpdates(): void {
    if (this._intervalHandle !== null) return;
    this._intervalHandle = setInterval(() => {
      if (!this._connected) return;
      const rms  = makeChannels(-30 + Math.random() * 10, 8);
      const peak = rms.map(v => v + 3 + Math.random() * 2);
      this.reply({
        GetSignalLevels: {
          result: 'Ok',
          value: {
            playback_rms:  rms,
            playback_peak: peak,
            capture_rms:   rms.map(v => v - 2),
            capture_peak:  peak.map(v => v - 2),
          },
        },
      });
    }, this.state.updateInterval);
  }

  stopSignalLevelUpdates(): void {
    if (this._intervalHandle !== null) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = null;
    }
  }

  // ─── Config commands ─────────────────────────────────────────────────────────

  setConfigFilePath(path: string): void {
    this.state.configFilePath = path;
    this.reply({ SetConfigFilePath: { result: 'Ok' } });
  }

  setConfig(configYaml: string): void {
    this.state.configYaml = configYaml;
    this.reply({ SetConfig: { result: 'Ok' } });
  }

  setConfigJson(configJson: string): void {
    this.reply({ SetConfigJson: { result: 'Ok' } });
  }

  reload(): void {
    this.reply({ Reload: { result: 'Ok' } });
  }

  getConfig(): void {
    this.reply({ GetConfig: { result: 'Ok', value: this.state.configYaml } });
  }

  getConfigTitle(): void {
    this.reply({ GetConfigTitle: { result: 'Ok', value: 'Mock Config' } });
  }

  getConfigDescription(): void {
    this.reply({ GetConfigDescription: { result: 'Ok', value: 'Mock CamillaDSP configuration for development' } });
  }

  getPreviousConfig(): void {
    this.reply({ GetPreviousConfig: { result: 'Ok', value: this.state.configYaml } });
  }

  readConfig(configYaml: string): void {
    this.reply({ ReadConfig: { result: 'Ok', value: configYaml } });
  }

  readConfigFile(path: string): void {
    this.reply({ ReadConfigFile: { result: 'Ok', value: this.state.configYaml } });
  }

  validateConfig(configYaml: string): void {
    this.reply({ ValidateConfig: { result: 'Ok', value: 'OK' } });
  }

  getConfigJson(): void {
    this.reply({ GetConfigJson: { result: 'Ok', value: JSON.stringify({ mock: true }) } });
  }

  getConfigFilePath(): void {
    this.reply({ GetConfigFilePath: { result: 'Ok', value: this.state.configFilePath } });
  }

  // ─── State file commands ─────────────────────────────────────────────────────

  getStateFilePath(): void {
    this.reply({ GetStateFilePath: { result: 'Ok', value: this.state.stateFilePath } });
  }

  getStateFileUpdated(): void {
    this.reply({ GetStateFileUpdated: { result: 'Ok', value: false } });
  }

  // ─── Signal level commands ────────────────────────────────────────────────────

  getSignalRange(): void {
    this.reply({ GetSignalRange: { result: 'Ok', value: 2.0 } });
  }

  getCaptureSignalRms(): void {
    this.reply({ GetCaptureSignalRms: { result: 'Ok', value: makeChannels(-28) } });
  }

  getCaptureSignalRmsSince(seconds: number): void {
    this.reply({ GetCaptureSignalRmsSince: { result: 'Ok', value: makeChannels(-28) } });
  }

  getCaptureSignalRmsSinceLast(): void {
    this.reply({ GetCaptureSignalRmsSinceLast: { result: 'Ok', value: makeChannels(-28) } });
  }

  getCaptureSignalPeak(): void {
    this.reply({ GetCaptureSignalPeak: { result: 'Ok', value: makeChannels(-20) } });
  }

  getCaptureSignalPeakSince(seconds: number): void {
    this.reply({ GetCaptureSignalPeakSince: { result: 'Ok', value: makeChannels(-20) } });
  }

  getCaptureSignalPeakSinceLast(): void {
    this.reply({ GetCaptureSignalPeakSinceLast: { result: 'Ok', value: makeChannels(-20) } });
  }

  getPlaybackSignalRms(): void {
    this.reply({ GetPlaybackSignalRms: { result: 'Ok', value: makeChannels(-25) } });
  }

  getPlaybackSignalRmsSince(seconds: number): void {
    this.reply({ GetPlaybackSignalRmsSince: { result: 'Ok', value: makeChannels(-25) } });
  }

  getPlaybackSignalRmsSinceLast(): void {
    this.reply({ GetPlaybackSignalRmsSinceLast: { result: 'Ok', value: makeChannels(-25) } });
  }

  getPlaybackSignalPeak(): void {
    this.reply({ GetPlaybackSignalPeak: { result: 'Ok', value: makeChannels(-18) } });
  }

  getPlaybackSignalPeakSince(seconds: number): void {
    this.reply({ GetPlaybackSignalPeakSince: { result: 'Ok', value: makeChannels(-18) } });
  }

  getPlaybackSignalPeakSinceLast(): void {
    this.reply({ GetPlaybackSignalPeakSinceLast: { result: 'Ok', value: makeChannels(-18) } });
  }

  getSignalLevels(): void {
    this.reply({
      GetSignalLevels: {
        result: 'Ok',
        value: {
          playback_rms:  makeChannels(-25),
          playback_peak: makeChannels(-18),
          capture_rms:   makeChannels(-28),
          capture_peak:  makeChannels(-20),
        },
      },
    });
  }

  getSignalLevelsSince(seconds: number): void {
    this.getSignalLevels();
  }

  getSignalLevelsSinceLast(): void {
    this.getSignalLevels();
  }

  getSignalPeaksSinceStart(): void {
    this.reply({ GetSignalPeaksSinceStart: { result: 'Ok', value: this.state.signalPeaksSinceStart } });
  }

  resetSignalPeaksSinceStart(): void {
    this.state.signalPeaksSinceStart = {
      playback: new Array(NUM_CHANNELS).fill(-144),
      capture:  new Array(NUM_CHANNELS).fill(-144),
    };
    this.reply({ ResetSignalPeaksSinceStart: { result: 'Ok' } });
  }

  // ─── Rate / interval commands ─────────────────────────────────────────────────

  getCaptureRate(): void {
    this.reply({ GetCaptureRate: { result: 'Ok', value: 48000 } });
  }

  getUpdateInterval(): void {
    this.reply({ GetUpdateInterval: { result: 'Ok', value: this.state.updateInterval } });
  }

  setUpdateInterval(ms: number): void {
    this.state.updateInterval = ms;
    this.reply({ SetUpdateInterval: { result: 'Ok' } });
  }

  // ─── Volume / mute commands ───────────────────────────────────────────────────

  getVolume(): void {
    this.reply({ GetVolume: { result: 'Ok', value: this.state.volume } });
  }

  setVolume(db: number): void {
    this.state.volume = db;
    this.reply({ SetVolume: { result: 'Ok' } });
  }

  adjustVolume(step: number, min?: number, max?: number): void {
    let v = this.state.volume + step;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    this.state.volume = v;
    this.reply({ AdjustVolume: { result: 'Ok', value: this.state.volume } });
  }

  getMute(): void {
    this.reply({ GetMute: { result: 'Ok', value: this.state.muted } });
  }

  setMute(muted: boolean): void {
    this.state.muted = muted;
    this.reply({ SetMute: { result: 'Ok' } });
  }

  toggleMute(): void {
    this.state.muted = !this.state.muted;
    this.reply({ ToggleMute: { result: 'Ok', value: this.state.muted } });
  }

  // ─── Fader commands ───────────────────────────────────────────────────────────

  getFaders(): void {
    this.reply({ GetFaders: { result: 'Ok', value: this.state.faders } });
  }

  getFaderVolume(index: number): void {
    this.reply({ GetFaderVolume: { result: 'Ok', value: [index, this.state.faders[index]?.volume ?? 0] } });
  }

  setFaderVolume(index: number, db: number): void {
    if (this.state.faders[index]) this.state.faders[index].volume = db;
    this.reply({ SetFaderVolume: { result: 'Ok' } });
  }

  setFaderExternalVolume(index: number, db: number): void {
    if (this.state.faders[index]) this.state.faders[index].volume = db;
    this.reply({ SetFaderExternalVolume: { result: 'Ok' } });
  }

  adjustFaderVolume(index: number, step: number, min?: number, max?: number): void {
    if (this.state.faders[index]) {
      let v = this.state.faders[index].volume + step;
      if (min !== undefined) v = Math.max(min, v);
      if (max !== undefined) v = Math.min(max, v);
      this.state.faders[index].volume = v;
    }
    this.reply({ AdjustFaderVolume: { result: 'Ok', value: [index, this.state.faders[index]?.volume ?? 0] } });
  }

  getFaderMute(index: number): void {
    this.reply({ GetFaderMute: { result: 'Ok', value: [index, this.state.faders[index]?.mute ?? false] } });
  }

  setFaderMute(index: number, muted: boolean): void {
    if (this.state.faders[index]) this.state.faders[index].mute = muted;
    this.reply({ SetFaderMute: { result: 'Ok' } });
  }

  toggleFaderMute(index: number): void {
    if (this.state.faders[index]) this.state.faders[index].mute = !this.state.faders[index].mute;
    this.reply({ ToggleFaderMute: { result: 'Ok', value: [index, this.state.faders[index]?.mute ?? false] } });
  }

  // ─── Status / info commands ───────────────────────────────────────────────────

  getVersion(): void {
    this.reply({ GetVersion: { result: 'Ok', value: '2.0.0-mock' } });
  }

  getState(): void {
    this.reply({ GetState: { result: 'Ok', value: this.state.processingState } });
  }

  getStopReason(): void {
    this.reply({ GetStopReason: { result: 'Ok', value: 'None' } });
  }

  getRateAdjust(): void {
    this.reply({ GetRateAdjust: { result: 'Ok', value: 1.0 } });
  }

  getBufferLevel(): void {
    this.reply({ GetBufferLevel: { result: 'Ok', value: 512 } });
  }

  getClippedSamples(): void {
    this.reply({ GetClippedSamples: { result: 'Ok', value: this.state.clippedSamples } });
  }

  resetClippedSamples(): void {
    this.state.clippedSamples = 0;
    this.reply({ ResetClippedSamples: { result: 'Ok' } });
  }

  getProcessingLoad(): void {
    this.reply({ GetProcessingLoad: { result: 'Ok', value: 12.5 } });
  }

  // ─── Device commands ──────────────────────────────────────────────────────────

  getSupportedDeviceTypes(): void {
    this.reply({
      GetSupportedDeviceTypes: {
        result: 'Ok',
        value: [
          ['Alsa', 'Pulse', 'Jack', 'File', 'Stdin'],
          ['Alsa', 'Pulse', 'Jack', 'File', 'Stdout'],
        ],
      },
    });
  }

  getAvailableCaptureDevices(deviceType: string): void {
    this.reply({
      GetAvailableCaptureDevices: {
        result: 'Ok',
        value: [
          ['hw:0', 'Mock Capture Device 1'],
          ['hw:1', 'Mock Capture Device 2'],
        ],
      },
    });
  }

  getAvailablePlaybackDevices(deviceType: string): void {
    this.reply({
      GetAvailablePlaybackDevices: {
        result: 'Ok',
        value: [
          ['hw:0', 'Mock Playback Device 1'],
          ['hw:1', 'Mock Playback Device 2'],
        ],
      },
    });
  }

  // ─── Control commands ─────────────────────────────────────────────────────────

  stop(): void {
    this.state.processingState = 'Inactive';
    this.reply({ Stop: { result: 'Ok' } });
  }

  exit(): void {
    this.reply({ Exit: { result: 'Ok' } });
    setTimeout(() => this.disconnect(), 50);
  }
}

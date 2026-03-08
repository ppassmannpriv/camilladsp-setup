import type { CamillaConfig } from './types';

export const MOCK_CONFIG: CamillaConfig = {
  devices: {
    capture: { type: 'Alsa', channels: 8, device: 'hw:RaspiAudio,0', format: 'S32LE' },
    playback: { type: 'Alsa', channels: 8, device: 'hw:RaspiAudio,0', format: 'S32LE' },
    samplerate: 48000,
    buffersize: 1024,
    capture_samplerate: 48000,
    enable_rate_adjust: true,
    target_level: 512,
    adjust_period: 10,
    silence_threshold: -60,
    silence_timeout: 3,
  },
  filters: {
    'HighPass_L': { type: 'Biquad', parameters: { type: 'Highpass', freq: 80, q: 0.707 }, description: 'High-pass filter Left' },
    'HighPass_R': { type: 'Biquad', parameters: { type: 'Highpass', freq: 80, q: 0.707 }, description: 'High-pass filter Right' },
    'LowPass_Sub': { type: 'Biquad', parameters: { type: 'Lowpass', freq: 80, q: 0.707 }, description: 'Low-pass for subwoofer' },
    'EQ_L': { type: 'BiquadCombo', parameters: { type: 'GraphicEqualizer', gains: [0, 1.5, 2, 0, -1, 0, 0, 0, 0, 0] }, description: 'Graphic EQ Left' },
    'EQ_R': { type: 'BiquadCombo', parameters: { type: 'GraphicEqualizer', gains: [0, 1.5, 2, 0, -1, 0, 0, 0, 0, 0] }, description: 'Graphic EQ Right' },
    'Delay_L': { type: 'Delay', parameters: { delay: 0.5, unit: 'ms', subsample: false }, description: 'Delay Left channel' },
    'Delay_R': { type: 'Delay', parameters: { delay: 0.5, unit: 'ms', subsample: false }, description: 'Delay Right channel' },
    'Volume': { type: 'Volume', parameters: { ramp_time: 200 }, description: 'Master volume' },
    'Loudness': { type: 'Loudness', parameters: { reference_level: -20, high_boost: 10, low_boost: 10 }, description: 'Loudness compensation' },
    'DiffEQ_L': { type: 'DiffEq', parameters: { a: [1.0, -1.9], b: [0.95, -0.95] }, description: 'Diff EQ Left' },
  },
  mixers: {
    'InputMixer': {
      channels: { in: 8, out: 8 },
      mapping: [
        { dest: 0, sources: [{ channel: 0, gain: 0, inverted: false }] },
        { dest: 1, sources: [{ channel: 1, gain: 0, inverted: false }] },
        { dest: 2, sources: [{ channel: 0, gain: -6, inverted: false }, { channel: 1, gain: -6, inverted: false }] },
        { dest: 3, sources: [{ channel: 2, gain: 0, inverted: false }] },
        { dest: 4, sources: [{ channel: 3, gain: 0, inverted: false }] },
        { dest: 5, sources: [{ channel: 4, gain: 0, inverted: false }] },
        { dest: 6, sources: [{ channel: 5, gain: 0, inverted: false }] },
        { dest: 7, sources: [{ channel: 6, gain: 0, inverted: false }] },
      ],
    },
  },
  pipeline: [
    { type: 'Mixer', name: 'InputMixer' },
    { type: 'Filter', channel: 0, names: ['Volume', 'EQ_L', 'HighPass_L', 'Delay_L'] },
    { type: 'Filter', channel: 1, names: ['Volume', 'EQ_R', 'HighPass_R', 'Delay_R'] },
    { type: 'Filter', channel: 2, names: ['LowPass_Sub'] },
    { type: 'Filter', channel: 3, names: ['Loudness'] },
    { type: 'Filter', channel: 4, names: ['Loudness'] },
  ],
};

export const MOCK_CONFIGS = [
  'stereo_hifi.yml',
  'surround_5_1.yml',
  'headphones.yml',
  'party_mode.yml',
  'flat_response.yml',
];

type MessageHandler = (msg: Record<string, unknown>) => void;

export class MockCamillaDSP {
  private handler: MessageHandler;
  private levelTimer: ReturnType<typeof setInterval> | null = null;
  private stateTimer: ReturnType<typeof setInterval> | null = null;

  constructor(handler: MessageHandler) {
    this.handler = handler;
  }

  connect() {
    // Simulate initial state responses
    setTimeout(() => {
      this.handler({ GetVersion: { result: 'Ok', value: '2.0.0-mock' } });
      this.handler({ GetState: { result: 'Ok', value: 'Running' } });
      this.handler({ GetCaptureSampleRate: { result: 'Ok', value: 48000 } });
      this.handler({ GetVolume: { result: 'Ok', value: -20 } });
      this.handler({ GetConfigFilePath: { result: 'Ok', value: 'stereo_hifi.yml' } });
      this.handler({ GetAvailableConfigFiles: { result: 'Ok', value: MOCK_CONFIGS } });
      this.handler({ GetConfig: { result: 'Ok', value: MOCK_CONFIG } });
      this.handler({ GetBufferSize: { result: 'Ok', value: 1024 } });
      this.handler({
        GetCaptureDevice: { result: 'Ok', value: 'hw:RaspiAudio,0 (Alsa, S32LE, 8ch)' },
      });
      this.handler({
        GetPlaybackDevice: { result: 'Ok', value: 'hw:RaspiAudio,0 (Alsa, S32LE, 8ch)' },
      });
    }, 100);

    // Simulate level polling
    this.levelTimer = setInterval(() => {
      const mkLevels = () =>
        Array.from({ length: 8 }, () => -Math.random() * 60 - 3);
      this.handler({ GetCaptureSignalLevels: { result: 'Ok', value: { level: mkLevels() } } });
      this.handler({ GetSignalLevels: { result: 'Ok', value: { level: mkLevels() } } });
    }, 100);

    // Simulate state polling
    this.stateTimer = setInterval(() => {
      this.handler({ GetState: { result: 'Ok', value: 'Running' } });
      this.handler({ GetCaptureSampleRate: { result: 'Ok', value: 48000 } });
    }, 2000);
  }

  send(cmd: Record<string, unknown>) {
    const key = Object.keys(cmd)[0];
    setTimeout(() => {
      switch (key) {
        case 'SetVolume':
          this.handler({ SetVolume: { result: 'Ok' } });
          break;
        case 'SetMute':
          this.handler({ SetMute: { result: 'Ok' } });
          break;
        case 'SetConfigFilePath':
          this.handler({ SetConfigFilePath: { result: 'Ok' } });
          this.handler({ GetConfigFilePath: { result: 'Ok', value: cmd['SetConfigFilePath'] } });
          break;
        case 'Reload':
          this.handler({ Reload: { result: 'Ok' } });
          break;
        default:
          break;
      }
    }, 50);
  }

  disconnect() {
    if (this.levelTimer) clearInterval(this.levelTimer);
    if (this.stateTimer) clearInterval(this.stateTimer);
    this.levelTimer = null;
    this.stateTimer = null;
  }
}

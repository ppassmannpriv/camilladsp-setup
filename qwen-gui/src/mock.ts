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
    'HighPass_L': {
      type: 'Biquad',
      parameters: { type: 'Highpass', freq: 80, q: 0.707 },
      description: 'High-pass filter Left',
    },
    'HighPass_R': {
      type: 'Biquad',
      parameters: { type: 'Highpass', freq: 80, q: 0.707 },
      description: 'High-pass filter Right',
    },
    'LowPass_Sub': {
      type: 'Biquad',
      parameters: { type: 'Lowpass', freq: 80, q: 0.707 },
      description: 'Low-pass for subwoofer',
    },
    'EQ_L': {
      type: 'BiquadCombo',
      parameters: {
        type: 'GraphicEqualizer',
        gains: [0, 1.5, 2, 0, -1, 0, 0, 0, 0, 0],
      },
      description: 'Graphic EQ Left',
    },
    'EQ_R': {
      type: 'BiquadCombo',
      parameters: {
        type: 'GraphicEqualizer',
        gains: [0, 1.5, 2, 0, -1, 0, 0, 0, 0, 0],
      },
      description: 'Graphic EQ Right',
    },
    'Delay_L': {
      type: 'Delay',
      parameters: { delay: 0.5, unit: 'ms', subsample: false },
      description: 'Delay Left channel',
    },
    'Delay_R': {
      type: 'Delay',
      parameters: { delay: 0.5, unit: 'ms', subsample: false },
      description: 'Delay Right channel',
    },
    'Volume': {
      type: 'Volume',
      parameters: { ramp_time: 200 },
      description: 'Master volume',
    },
    'Loudness': {
      type: 'Loudness',
      parameters: { reference_level: -20, high_boost: 10, low_boost: 10 },
      description: 'Loudness compensation',
    },
    'DiffEQ_L': {
      type: 'DiffEq',
      parameters: { a: [1.0, -1.9], b: [0.95, -0.95] },
      description: 'Diff EQ Left',
    },
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
  private phase = 0;
  private connected = false;

  constructor(handler: MessageHandler) {
    this.handler = handler;
  }

  connect() {
    this.connected = true;
    // Simulate initial handshake
    setTimeout(() => {
      this.handler({ GetVersion: { value: '2.0.3' } });
      this.handler({ GetState: { value: 'Running' } });
      this.handler({ GetVolume: { value: -20 } });
      this.handler({ GetConfigName: { value: 'stereo_hifi.yml' } });
      this.handler({ GetConfig: { value: MOCK_CONFIG } });
      this.handler({ ListConfigs: { value: MOCK_CONFIGS } });
      this.handler({ GetCaptureDevice: { value: 'hw:RaspiAudio,0 (Alsa)' } });
      this.handler({ GetPlaybackDevice: { value: 'hw:RaspiAudio,0 (Alsa)' } });
      this.handler({ GetCaptureSampleRate: { value: 48000 } });
      this.handler({ GetBufferSize: { value: 1024 } });
    }, 200);

    // Simulate live level updates
    this.levelTimer = setInterval(() => {
      if (!this.connected) return;
      this.phase += 0.08;
      const t = this.phase;

      // Simulate 8 input channels with some activity
      const inputLevels = [
        -20 + Math.sin(t) * 15 + Math.random() * 3,
        -22 + Math.sin(t + 0.5) * 14 + Math.random() * 3,
        -60 + Math.random() * 5,
        -60 + Math.random() * 5,
        -45 + Math.sin(t * 0.7) * 10 + Math.random() * 4,
        -45 + Math.sin(t * 0.7 + 0.3) * 10 + Math.random() * 4,
        -80 + Math.random() * 3,
        -80 + Math.random() * 3,
      ];

      // Simulate 8 output channels
      const outputLevels = [
        -18 + Math.sin(t + 0.1) * 14 + Math.random() * 3,
        -20 + Math.sin(t + 0.6) * 13 + Math.random() * 3,
        -28 + Math.sin(t * 0.5) * 8 + Math.random() * 3,
        -60 + Math.random() * 5,
        -50 + Math.sin(t * 0.6) * 9 + Math.random() * 4,
        -50 + Math.sin(t * 0.6 + 0.4) * 9 + Math.random() * 4,
        -80 + Math.random() * 3,
        -80 + Math.random() * 3,
      ];

      this.handler({ GetCaptureSignalLevels: { value: inputLevels } });
      this.handler({ GetPlaybackSignalLevels: { value: outputLevels } });
    }, 100);

    // Simulate occasional state updates
    this.stateTimer = setInterval(() => {
      if (!this.connected) return;
      this.handler({ GetCaptureSampleRate: { value: 48000 } });
    }, 5000);
  }

  send(cmd: Record<string, unknown>) {
    const key = Object.keys(cmd)[0];
    const val = cmd[key];

    setTimeout(() => {
      switch (key) {
        case 'GetVersion':
          this.handler({ GetVersion: { value: '2.0.3' } });
          break;
        case 'GetConfig':
          this.handler({ GetConfig: { value: MOCK_CONFIG } });
          break;
        case 'GetState':
          this.handler({ GetState: { value: 'Running' } });
          break;
        case 'GetVolume':
          this.handler({ GetVolume: { value: -20 } });
          break;
        case 'SetVolume':
          this.handler({ SetVolume: { value: val } });
          break;
        case 'GetConfigName':
          this.handler({ GetConfigName: { value: 'stereo_hifi.yml' } });
          break;
        case 'SetConfigName':
          this.handler({ SetConfigName: { value: val } });
          break;
        case 'Reload':
          this.handler({ Reload: { value: 'Ok' } });
          this.handler({ GetConfig: { value: MOCK_CONFIG } });
          break;
        case 'ListConfigs':
          this.handler({ ListConfigs: { value: MOCK_CONFIGS } });
          break;
        case 'GetCaptureDevice':
          this.handler({ GetCaptureDevice: { value: 'hw:RaspiAudio,0 (Alsa)' } });
          break;
        case 'GetPlaybackDevice':
          this.handler({ GetPlaybackDevice: { value: 'hw:RaspiAudio,0 (Alsa)' } });
          break;
        case 'GetCaptureSampleRate':
          this.handler({ GetCaptureSampleRate: { value: 48000 } });
          break;
        case 'GetBufferSize':
          this.handler({ GetBufferSize: { value: 1024 } });
          break;
        case 'SetMute':
          this.handler({ SetMute: { value: 'Ok' } });
          break;
        default:
          break;
      }
    }, 30);
  }

  disconnect() {
    this.connected = false;
    if (this.levelTimer) clearInterval(this.levelTimer);
    if (this.stateTimer) clearInterval(this.stateTimer);
    this.levelTimer = null;
    this.stateTimer = null;
  }
}

export interface CamillaConfig {
  devices?: {
    capture?: { type?: string; channels?: number; device?: string; format?: string };
    playback?: { type?: string; channels?: number; device?: string; format?: string };
    samplerate?: number;
    buffersize?: number;
    capture_samplerate?: number;
    resampler?: unknown;
    enable_rate_adjust?: boolean;
    target_level?: number;
    adjust_period?: number;
    silence_threshold?: number;
    silence_timeout?: number;
  };
  filters?: Record<string, FilterDef>;
  mixers?: Record<string, MixerDef>;
  processors?: Record<string, ProcessorDef>;
  pipeline?: PipelineStep[];
}

export interface FilterDef {
  type: string;
  parameters?: Record<string, unknown>;
  description?: string;
}

export interface MixerDef {
  channels?: { in: number; out: number };
  mapping?: MixerMapping[];
  description?: string;
}

export interface MixerMapping {
  dest: number;
  sources: { channel: number; gain?: number; inverted?: boolean; mute?: boolean }[];
}

export interface ProcessorDef {
  type: string;
  parameters?: Record<string, unknown>;
}

export interface PipelineStep {
  type: 'Filter' | 'Mixer' | 'Processor';
  channel?: number;
  names?: string[];
  name?: string;
  bypassed?: boolean;
}

export type ViewName = 'meters' | 'pipeline' | 'spectrum' | 'filters' | 'configs' | 'status' | 'settings';

import './style.css';
import { MockCamillaDSP } from './mock';
import type { AppState, CamillaConfig, ViewName } from './types';

// ── State ────────────────────────────────────────────────────────────────────
const state: AppState = {
  view: 'meters',
  devMode: true,
  connected: false,
  inputLevels: Array(8).fill(-100),
  outputLevels: Array(8).fill(-100),
  inputMutes: Array(8).fill(false),
  outputMutes: Array(8).fill(false),
  config: null,
  volume: -20,
  samplerate: 0,
  systemState: '--',
  version: '--',
  configs: [],
  activeConfig: '--',
  captureDevice: '--',
  playbackDevice: '--',
  bufferSize: 0,
  pollInterval: 100,
};

// ── DOM helpers ───────────────────────────────────────────────────────────────
function $<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── WebSocket / Mock ──────────────────────────────────────────────────────────
type AnySocket = MockCamillaDSP | WebSocket;
let socket: AnySocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function connect() {
  if (socket) {
    if (socket instanceof MockCamillaDSP) socket.disconnect();
    else socket.close();
    socket = null;
  }
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

  if (state.devMode) {
    const mock = new MockCamillaDSP(handleMessage);
    socket = mock;
    mock.connect();
    setConnected(true);
  } else {
    const addr = ($<HTMLInputElement>('host-input')).value.trim() || 'localhost:5011';
    try {
      const ws = new WebSocket(`ws://${addr}`);
      socket = ws;
      ws.onopen = () => {
        setConnected(true);
        sendCmd({ GetVersion: null });
      };
      ws.onmessage = (ev) => {
        try { handleMessage(JSON.parse(ev.data)); } catch { /* ignore */ }
      };
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
    } catch {
      setConnected(false);
    }
  }
}

function sendCmd(cmd: Record<string, unknown>) {
  if (!socket) return;
  if (socket instanceof MockCamillaDSP) {
    socket.send(cmd);
  } else if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(cmd));
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (!state.connected) return;
    sendCmd({ GetCaptureSignalLevels: null });
    sendCmd({ GetPlaybackSignalLevels: null });
    if (state.view === 'status') {
      sendCmd({ GetState: null });
      sendCmd({ GetCaptureSampleRate: null });
    }
  }, state.pollInterval);
}

// ── Message handler ───────────────────────────────────────────────────────────
function handleMessage(msg: Record<string, unknown>) {
  const unwrap = (key: string) => {
    const v = msg[key];
    if (v && typeof v === 'object' && 'value' in (v as object)) return (v as { value: unknown }).value;
    return v;
  };

  if ('GetVersion' in msg) {
    state.version = String(unwrap('GetVersion') ?? '--');
    sendCmd({ GetConfig: null });
    sendCmd({ GetVolume: null });
    sendCmd({ GetConfigName: null });
    sendCmd({ ListConfigs: null });
    sendCmd({ GetCaptureDevice: null });
    sendCmd({ GetPlaybackDevice: null });
    sendCmd({ GetCaptureSampleRate: null });
    sendCmd({ GetBufferSize: null });
    sendCmd({ GetState: null });
    updateStatusView();
  }
  if ('GetConfig' in msg) {
    state.config = unwrap('GetConfig') as CamillaConfig;
    renderPipeline();
    renderFilters();
  }
  if ('GetCaptureSignalLevels' in msg) {
    state.inputLevels = unwrap('GetCaptureSignalLevels') as number[];
    updateMeterLevels();
    if (state.view === 'spectrum') renderSpectrum();
  }
  if ('GetPlaybackSignalLevels' in msg) {
    state.outputLevels = unwrap('GetPlaybackSignalLevels') as number[];
    updateMeterLevels();
  }
  if ('GetState' in msg) {
    state.systemState = String(unwrap('GetState') ?? '--');
    updateHeaderStatus();
    updateStatusView();
  }
  if ('GetVolume' in msg) {
    state.volume = Number(unwrap('GetVolume') ?? -20);
    updateVolumeUI();
  }
  if ('GetCaptureSampleRate' in msg) {
    state.samplerate = Number(unwrap('GetCaptureSampleRate') ?? 0);
    updateHeaderStatus();
    updateStatusView();
  }
  if ('GetBufferSize' in msg) {
    state.bufferSize = Number(unwrap('GetBufferSize') ?? 0);
    updateStatusView();
  }
  if ('ListConfigs' in msg) {
    state.configs = unwrap('ListConfigs') as string[];
    renderConfigs();
  }
  if ('GetConfigName' in msg) {
    state.activeConfig = String(unwrap('GetConfigName') ?? '--');
    const el = $('active-config-name');
    if (el) el.textContent = state.activeConfig;
    updateStatusView();
  }
  if ('GetCaptureDevice' in msg) {
    state.captureDevice = String(unwrap('GetCaptureDevice') ?? '--');
    updateStatusView();
  }
  if ('GetPlaybackDevice' in msg) {
    state.playbackDevice = String(unwrap('GetPlaybackDevice') ?? '--');
    updateStatusView();
  }
  if ('Reload' in msg) {
    showToast('Config reloaded');
    sendCmd({ GetConfig: null });
    sendCmd({ GetConfigName: null });
  }
}

// ── Connection status ─────────────────────────────────────────────────────────
function setConnected(connected: boolean) {
  state.connected = connected;
  const green = 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]';
  const red = 'bg-red-500';
  const cls = connected ? green : red;

  const dot = $('conn-dot');
  dot.className = `w-2.5 h-2.5 rounded-full transition-colors duration-300 ${cls}`;

  const menuDot = $('menu-conn-dot');
  menuDot.className = `w-2 h-2 rounded-full ${cls}`;
  $('menu-conn-text').textContent = connected ? 'Connected' : 'Disconnected';

  if (connected) startPolling();
}

function updateHeaderStatus() {
  $('footer-state').textContent = state.systemState !== '--' ? state.systemState : '';
  $('footer-sr').textContent = state.samplerate > 0 ? `${(state.samplerate / 1000).toFixed(1)}k` : '';
}

// ── Volume UI ─────────────────────────────────────────────────────────────────
function updateVolumeUI() {
  const slider = $<HTMLInputElement>('vol-slider');
  const text = $('vol-text');
  slider.value = String(state.volume);
  text.textContent = state.volume.toFixed(1);
}

// ── Meters ────────────────────────────────────────────────────────────────────
function buildMeters() {
  const inputEl = $('input-meters');
  const outputEl = $('output-meters');
  if (inputEl.children.length > 0) return; // already built

  for (let i = 0; i < 8; i++) inputEl.appendChild(createMeterEl(i, 'in'));
  for (let i = 0; i < 8; i++) outputEl.appendChild(createMeterEl(i, 'out'));
}

function createMeterEl(index: number, type: 'in' | 'out'): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'flex flex-col items-center gap-0.5 flex-1 min-w-0 h-full';

  // dB label top
  const dbLabel = document.createElement('div');
  dbLabel.id = `${type}-db-${index}`;
  dbLabel.className = 'text-[8px] font-mono text-slate-600 h-3 leading-3';
  dbLabel.textContent = '';

  // Meter bar
  const bg = document.createElement('div');
  bg.className = 'flex-1 w-full bg-slate-800 rounded-sm overflow-hidden relative border border-slate-700/50 min-h-0';

  // Peak hold line
  const peak = document.createElement('div');
  peak.id = `${type}-peak-${index}`;
  peak.className = 'absolute left-0 w-full h-[2px] bg-white/60 transition-none';
  peak.style.bottom = '0%';

  const fill = document.createElement('div');
  fill.id = `${type}-fill-${index}`;
  fill.className = 'absolute bottom-0 left-0 w-full meter-fill';
  fill.style.height = '0%';
  fill.style.background = 'linear-gradient(to top, #0ea5e9 0%, #38bdf8 60%, #4ade80 85%, #facc15 93%, #ef4444 100%)';

  bg.appendChild(fill);
  bg.appendChild(peak);

  // Mute button
  const mute = document.createElement('button');
  mute.id = `${type}-mute-${index}`;
  mute.className = 'w-full h-6 rounded text-[9px] font-bold border transition-colors touch-manipulation mute-inactive';
  mute.textContent = 'M';
  mute.title = `Mute ${type === 'in' ? 'Input' : 'Output'} ${index + 1}`;
  mute.addEventListener('click', () => toggleMute(index, type));

  // Channel label
  const label = document.createElement('div');
  label.className = 'text-[9px] font-mono text-slate-500';
  label.textContent = String(index + 1);

  wrap.appendChild(dbLabel);
  wrap.appendChild(bg);
  wrap.appendChild(mute);
  wrap.appendChild(label);
  return wrap;
}

// Peak hold state
const peakHold: { in: number[]; out: number[] } = {
  in: Array(8).fill(-100),
  out: Array(8).fill(-100),
};
const peakDecayTimer: { in: ReturnType<typeof setTimeout>[]; out: ReturnType<typeof setTimeout>[] } = {
  in: [],
  out: [],
};

function updateMeterLevels() {
  (['in', 'out'] as const).forEach((type) => {
    const levels = type === 'in' ? state.inputLevels : state.outputLevels;
    const mutes = type === 'in' ? state.inputMutes : state.outputMutes;
    levels.forEach((lvl, i) => {
      const fill = $(`${type}-fill-${i}`);
      const peakEl = $(`${type}-peak-${i}`);
      const dbEl = $(`${type}-db-${i}`);
      const muteBtn = $(`${type}-mute-${i}`);
      if (!fill) return;

      const muted = mutes[i];
      const effectiveLvl = muted ? -100 : lvl;
      const pct = Math.max(0, Math.min(100, (effectiveLvl + 80) / 80 * 100));
      fill.style.height = `${pct}%`;

      // Peak hold
      if (effectiveLvl > peakHold[type][i]) {
        peakHold[type][i] = effectiveLvl;
        if (peakDecayTimer[type][i]) clearTimeout(peakDecayTimer[type][i]);
        peakDecayTimer[type][i] = setTimeout(() => {
          peakHold[type][i] = -100;
        }, 1500);
      }
      const peakPct = Math.max(0, Math.min(100, (peakHold[type][i] + 80) / 80 * 100));
      if (peakEl) peakEl.style.bottom = `${peakPct}%`;

      // dB label (only show if active)
      if (dbEl) {
        dbEl.textContent = effectiveLvl > -79 ? `${effectiveLvl.toFixed(0)}` : '';
      }

      // Mute button style
      if (muteBtn) {
        muteBtn.className = `w-full h-6 rounded text-[9px] font-bold border transition-colors touch-manipulation ${muted ? 'mute-active' : 'mute-inactive'}`;
      }
    });
  });
}

function toggleMute(index: number, type: 'in' | 'out') {
  if (type === 'in') {
    state.inputMutes[index] = !state.inputMutes[index];
    sendCmd({ SetMute: { channel: index, value: state.inputMutes[index] } });
  } else {
    state.outputMutes[index] = !state.outputMutes[index];
    sendCmd({ SetMute: { channel: index + 8, value: state.outputMutes[index] } });
  }
  updateMeterLevels();
}

// ── Spectrum ──────────────────────────────────────────────────────────────────
let spectrumAnimFrame: number | null = null;
const spectrumBars: number[] = Array(64).fill(0);
const spectrumPeaks: number[] = Array(64).fill(0);

function renderSpectrum() {
  const canvas = $<HTMLCanvasElement>('spectrum-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;
  const N = 64;
  const barW = W / N;

  const l1 = state.inputLevels[0] ?? -100;
  const l2 = state.inputLevels[1] ?? -100;
  const baseLevel = (l1 + l2) / 2;

  // Generate pseudo-spectrum from level
  for (let i = 0; i < N; i++) {
    const freq = 20 * Math.pow(1000, i / N);
    const rolloff = i < 5 ? (i / 5) : i > N * 0.85 ? (1 - (i - N * 0.85) / (N * 0.15)) : 1;
    const noise = (Math.random() - 0.5) * 8;
    const target = baseLevel + noise * rolloff + Math.sin(i * 0.4 + Date.now() * 0.001) * 3 * rolloff;
    spectrumBars[i] = spectrumBars[i] * 0.7 + Math.max(-100, target) * 0.3;
    if (spectrumBars[i] > spectrumPeaks[i]) spectrumPeaks[i] = spectrumBars[i];
    else spectrumPeaks[i] -= 0.3;
    void freq;
  }

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let db = -80; db <= 0; db += 20) {
    const y = H - (db + 80) / 80 * H;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.font = '9px monospace';
    ctx.fillText(`${db}`, 2, y - 2);
  }

  // Bars
  for (let i = 0; i < N; i++) {
    const barH = Math.max(1, (spectrumBars[i] + 80) / 80 * H);
    const hue = 200 + (i / N) * 60;
    const sat = 70 + (spectrumBars[i] + 80) / 80 * 20;
    const lit = 40 + (spectrumBars[i] + 80) / 80 * 20;
    ctx.fillStyle = `hsl(${hue},${sat}%,${lit}%)`;
    ctx.fillRect(i * barW + 1, H - barH, barW - 2, barH);

    // Peak dot
    const peakH = Math.max(1, (spectrumPeaks[i] + 80) / 80 * H);
    ctx.fillStyle = '#fff4';
    ctx.fillRect(i * barW + 1, H - peakH - 1, barW - 2, 2);
  }

  // Freq labels
  const freqLabels = ['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k'];
  const freqPositions = [0, 5, 10, 17, 26, 35, 42, 51, 57, 63];
  ctx.fillStyle = '#475569';
  ctx.font = '8px monospace';
  freqPositions.forEach((pos, fi) => {
    ctx.fillText(freqLabels[fi], pos * barW, H - 2);
  });

  if (state.view === 'spectrum') {
    spectrumAnimFrame = requestAnimationFrame(renderSpectrum);
  }
}

function startSpectrum() {
  if (spectrumAnimFrame) cancelAnimationFrame(spectrumAnimFrame);
  spectrumAnimFrame = requestAnimationFrame(renderSpectrum);
}

function stopSpectrum() {
  if (spectrumAnimFrame) { cancelAnimationFrame(spectrumAnimFrame); spectrumAnimFrame = null; }
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
function renderPipeline() {
  const container = $('pipeline-container');
  if (!container) return;
  container.innerHTML = '';

  if (!state.config?.pipeline?.length) {
    container.innerHTML = '<div class="text-slate-500 text-sm text-center mt-8">No pipeline data available</div>';
    return;
  }

  // Horizontal scrollable pipeline
  const scroll = document.createElement('div');
  scroll.className = 'flex items-start gap-0 overflow-x-auto pb-2';

  state.config.pipeline.forEach((step, idx) => {
    // Arrow between steps
    if (idx > 0) {
      const arrow = document.createElement('div');
      arrow.className = 'flex items-center self-center shrink-0 text-slate-600 px-1';
      arrow.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`;
      scroll.appendChild(arrow);
    }

    const node = document.createElement('div');
    const typeClass = step.type === 'Filter' ? 'pipeline-node-filter'
      : step.type === 'Mixer' ? 'pipeline-node-mixer'
      : 'pipeline-node-processor';

    node.className = `shrink-0 border rounded-lg p-2 min-w-[110px] max-w-[140px] ${typeClass}`;

    const badge = document.createElement('div');
    const badgeColor = step.type === 'Filter' ? 'text-yellow-400'
      : step.type === 'Mixer' ? 'text-purple-400'
      : 'text-teal-400';
    badge.className = `text-[9px] font-bold uppercase tracking-widest ${badgeColor} mb-1`;
    badge.textContent = step.type;

    const title = document.createElement('div');
    title.className = 'text-xs font-semibold text-white truncate';
    title.textContent = step.name ?? (step.channel !== undefined ? `Ch ${step.channel + 1}` : `Step ${idx}`);

    node.appendChild(badge);
    node.appendChild(title);

    if (step.names?.length) {
      const filters = document.createElement('div');
      filters.className = 'mt-1 space-y-0.5';
      step.names.forEach(name => {
        const f = document.createElement('div');
        f.className = 'text-[9px] text-slate-400 bg-slate-900/50 rounded px-1 py-0.5 truncate';
        const def = state.config?.filters?.[name];
        f.textContent = def ? `${name} (${def.type})` : name;
        filters.appendChild(f);
      });
      node.appendChild(filters);
    }

    if (step.bypassed) {
      const byp = document.createElement('div');
      byp.className = 'mt-1 text-[9px] text-amber-400 font-bold';
      byp.textContent = '⚠ BYPASSED';
      node.appendChild(byp);
    }

    scroll.appendChild(node);
  });

  container.appendChild(scroll);

  // Mixer details
  if (state.config.mixers) {
    const mixerSection = document.createElement('div');
    mixerSection.className = 'mt-4';
    const mixerTitle = document.createElement('div');
    mixerTitle.className = 'text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2';
    mixerTitle.textContent = 'Mixers';
    mixerSection.appendChild(mixerTitle);

    Object.entries(state.config.mixers).forEach(([name, mixer]) => {
      const card = document.createElement('div');
      card.className = 'bg-slate-800/60 border border-purple-700/40 rounded-lg p-3 mb-2';
      card.innerHTML = `
        <div class="text-xs font-bold text-purple-300 mb-1">${name}</div>
        <div class="text-[10px] text-slate-400">In: ${mixer.channels?.in ?? '?'} → Out: ${mixer.channels?.out ?? '?'}</div>
        <div class="text-[10px] text-slate-500 mt-1">${mixer.mapping?.length ?? 0} mappings</div>
      `;
      mixerSection.appendChild(card);
    });
    container.appendChild(mixerSection);
  }
}

// ── Filters ───────────────────────────────────────────────────────────────────
function renderFilters() {
  const container = $('filters-container');
  if (!container) return;
  container.innerHTML = '';

  if (!state.config?.filters || Object.keys(state.config.filters).length === 0) {
    container.innerHTML = '<div class="text-slate-500 text-sm text-center mt-8">No filters in current config</div>';
    return;
  }

  const typeColors: Record<string, string> = {
    Biquad: 'text-sky-400 border-sky-700/50 bg-sky-900/20',
    BiquadCombo: 'text-blue-400 border-blue-700/50 bg-blue-900/20',
    Delay: 'text-green-400 border-green-700/50 bg-green-900/20',
    Volume: 'text-yellow-400 border-yellow-700/50 bg-yellow-900/20',
    Loudness: 'text-orange-400 border-orange-700/50 bg-orange-900/20',
    DiffEq: 'text-purple-400 border-purple-700/50 bg-purple-900/20',
    Conv: 'text-teal-400 border-teal-700/50 bg-teal-900/20',
  };

  // Grid layout for filters
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 gap-2';

  Object.entries(state.config.filters).forEach(([name, filter]) => {
    const colorClass = typeColors[filter.type] ?? 'text-slate-300 border-slate-700 bg-slate-800/40';
    const card = document.createElement('div');
    card.className = `border rounded-lg p-2 ${colorClass}`;

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-1';
    header.innerHTML = `
      <span class="text-xs font-bold truncate">${name}</span>
      <span class="text-[9px] font-mono opacity-70 shrink-0 ml-1">${filter.type}</span>
    `;
    card.appendChild(header);

    if (filter.description) {
      const desc = document.createElement('div');
      desc.className = 'text-[9px] text-slate-500 mb-1 truncate';
      desc.textContent = filter.description;
      card.appendChild(desc);
    }

    if (filter.parameters) {
      const params = document.createElement('div');
      params.className = 'text-[9px] font-mono text-slate-400 space-y-0.5';
      Object.entries(filter.parameters).forEach(([k, v]) => {
        if (Array.isArray(v)) return; // skip arrays
        const row = document.createElement('div');
        row.className = 'flex justify-between gap-1';
        row.innerHTML = `<span class="text-slate-500">${k}</span><span>${v}</span>`;
        params.appendChild(row);
      });
      card.appendChild(params);
    }

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ── Configs ───────────────────────────────────────────────────────────────────
function renderConfigs() {
  const list = $('configs-list');
  if (!list) return;
  list.innerHTML = '';

  if (!state.configs.length) {
    list.innerHTML = '<div class="text-slate-500 text-sm text-center mt-8">No configurations found</div>';
    return;
  }

  state.configs.forEach(conf => {
    const btn = document.createElement('button');
    const isActive = conf === state.activeConfig;
    btn.className = `w-full text-left p-3 rounded-lg border flex items-center justify-between transition-colors touch-manipulation ${
      isActive
        ? 'bg-sky-900/40 border-sky-600/60 text-sky-300'
        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
    }`;
    btn.innerHTML = `
      <div class="flex items-center gap-2">
        ${isActive ? '<div class="w-1.5 h-1.5 rounded-full bg-sky-400"></div>' : '<div class="w-1.5 h-1.5 rounded-full bg-slate-600"></div>'}
        <span class="text-sm font-mono">${conf}</span>
      </div>
      ${isActive ? '<span class="text-[10px] text-sky-500 font-bold">ACTIVE</span>' : '<span class="text-[10px] text-slate-500">Apply</span>'}
    `;
    btn.addEventListener('click', () => {
      sendCmd({ SetConfigName: conf });
      sendCmd({ Reload: null });
      state.activeConfig = conf;
      showToast(`Applying: ${conf}`);
      renderConfigs();
    });
    list.appendChild(btn);
  });
}

// ── Status view ───────────────────────────────────────────────────────────────
function updateStatusView() {
  const set = (id: string, val: string) => {
    const el = $(id);
    if (el) el.textContent = val;
  };
  set('st-state', state.systemState);
  set('st-sr', state.samplerate > 0 ? `${state.samplerate} Hz` : '--');
  set('st-buf', state.bufferSize > 0 ? String(state.bufferSize) : '--');
  set('st-ver', state.version);
  set('st-cap', state.captureDevice);
  set('st-play', state.playbackDevice);
  set('st-conf', state.activeConfig);
}

// ── View switching ────────────────────────────────────────────────────────────
const VIEWS: ViewName[] = ['meters', 'pipeline', 'spectrum', 'filters', 'configs', 'status', 'settings'];

function switchView(name: ViewName) {
  state.view = name;
  VIEWS.forEach(v => {
    const el = $(`view-${v}`);
    if (el) el.classList.toggle('hidden', v !== name);
  });
  closeMenu();

  if (name === 'spectrum') startSpectrum();
  else stopSpectrum();

  if (name === 'pipeline') renderPipeline();
  if (name === 'filters') renderFilters();
  if (name === 'configs') renderConfigs();
  if (name === 'status') updateStatusView();
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function openMenu() {
  $('menu-overlay').classList.remove('translate-x-full');
}
function closeMenu() {
  $('menu-overlay').classList.add('translate-x-full');
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer: ReturnType<typeof setTimeout> | null = null;
function showToast(msg: string) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 2500);
}

// ── Dev mode badge ────────────────────────────────────────────────────────────
function updateDevBadges() {
  [$('dev-badge'), $('menu-dev-badge')].forEach(el => {
    if (!el) return;
    el.classList.toggle('hidden', !state.devMode);
  });
}

// ── Event listeners ───────────────────────────────────────────────────────────
$('menu-btn').addEventListener('click', openMenu);
$('close-menu').addEventListener('click', closeMenu);

document.querySelectorAll<HTMLButtonElement>('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.getAttribute('data-view') as ViewName;
    if (view) switchView(view);
  });
});

$<HTMLInputElement>('vol-slider').addEventListener('input', (e) => {
  const val = parseFloat((e.target as HTMLInputElement).value);
  state.volume = val;
  $('vol-text').textContent = val.toFixed(1);
  sendCmd({ SetVolume: val });
});

$<HTMLInputElement>('dev-toggle').addEventListener('change', (e) => {
  state.devMode = (e.target as HTMLInputElement).checked;
  updateDevBadges();
  connect();
});

$('reconnect-btn').addEventListener('click', () => {
  state.devMode = false;
  ($<HTMLInputElement>('dev-toggle')).checked = false;
  updateDevBadges();
  connect();
});

$('pipeline-refresh').addEventListener('click', () => {
  sendCmd({ GetConfig: null });
  showToast('Refreshing pipeline…');
});

$<HTMLInputElement>('poll-slider').addEventListener('input', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  state.pollInterval = val;
  $('poll-val').textContent = `${val} ms`;
  if (state.connected) startPolling();
});

// ── Init ──────────────────────────────────────────────────────────────────────
buildMeters();
updateDevBadges();
connect();

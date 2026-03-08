import './index.css';
import { MockCamillaDSP } from './mock';

// --- Types ---
interface State {
    view: 'meters' | 'pipeline' | 'spectrum' | 'configs' | 'status' | 'settings';
    connected: boolean;
    devMode: boolean;
    inputLevels: number[];
    outputLevels: number[];
    mutes: boolean[];
    config: any;
    volume: number;
    samplerate: number;
    systemState: string;
    configs: string[];
    captureDevice: string;
    playbackDevice: string;
}

// --- App State ---
const state: State = {
    view: 'meters',
    connected: false,
    devMode: true, // Default to true for development
    inputLevels: Array(8).fill(-100),
    outputLevels: Array(8).fill(-100),
    mutes: Array(16).fill(false),
    config: null,
    volume: -20,
    samplerate: 0,
    systemState: 'Unknown',
    configs: [],
    captureDevice: '--',
    playbackDevice: '--',
};

// --- DOM Elements ---
const el = {
    menuBtn: document.getElementById('menu-btn')!,
    closeMenu: document.getElementById('close-menu')!,
    menuOverlay: document.getElementById('menu-overlay')!,
    mainView: document.getElementById('main-view')!,
    pipelineView: document.getElementById('pipeline-view')!,
    spectrumView: document.getElementById('spectrum-view')!,
    configsView: document.getElementById('configs-view')!,
    statusView: document.getElementById('status-view')!,
    settingsView: document.getElementById('settings-view')!,
    pipelineContainer: document.getElementById('pipeline-container')!,
    spectrumCanvas: document.getElementById('spectrum-canvas') as HTMLCanvasElement,
    inputMeters: document.getElementById('input-meters')!,
    outputMeters: document.getElementById('output-meters')!,
    statusIndicator: document.getElementById('status-indicator')!,
    statusText: document.getElementById('status-text')!,
    devModeBadge: document.getElementById('dev-mode-badge')!,
    devModeToggle: document.getElementById('dev-mode-toggle') as HTMLInputElement,
    addressInput: document.getElementById('address-input') as HTMLInputElement,
    reconnectBtn: document.getElementById('reconnect-btn')!,
    menuItems: document.querySelectorAll('.menu-item'),
    volumeSlider: document.getElementById('volume-slider') as HTMLInputElement,
    volumeText: document.getElementById('volume-text')!,
    configsList: document.getElementById('configs-list')!,
    statusSamplerate: document.getElementById('status-samplerate')!,
    statusState: document.getElementById('status-state')!,
    statusCapture: document.getElementById('status-capture')!,
    statusPlayback: document.getElementById('status-playback')!,
    footerSamplerate: document.getElementById('footer-samplerate')!,
    footerState: document.getElementById('footer-state')!,
    footerMsg: document.getElementById('footer-msg')!,
    footerStatusIndicator: document.getElementById('footer-status-indicator')!,
    footerStatusText: document.getElementById('footer-status-text')!,
};

// --- WebSocket / Communication ---
let socket: WebSocket | MockCamillaDSP | null = null;

function connect() {
    if (socket) {
        if (state.devMode) (socket as MockCamillaDSP).disconnect();
        else (socket as WebSocket).close();
    }

    if (state.devMode) {
        socket = new MockCamillaDSP(handleMessage);
        (socket as MockCamillaDSP).connect();
        updateConnectionStatus(true);
        el.devModeBadge.classList.remove('hidden');
    } else {
        const addr = el.addressInput.value || 'localhost:5011';
        el.devModeBadge.classList.add('hidden');
        try {
            socket = new WebSocket(`ws://${addr}`);
            socket.onopen = () => {
                updateConnectionStatus(true);
                sendCommand({ GetVersion: null });
            };
            socket.onmessage = (ev) => handleMessage(JSON.parse(ev.data));
            socket.onclose = () => updateConnectionStatus(false);
            socket.onerror = () => updateConnectionStatus(false);
        } catch (e) {
            console.error("WS Connect error:", e);
            updateConnectionStatus(false);
        }
    }
}

function handleMessage(msg: any) {
    if (msg.GetVersion) {
        sendCommand({ GetConfig: null });
        sendCommand({ ListConfigs: null });
        sendCommand({ GetCaptureDevice: null });
        sendCommand({ GetPlaybackDevice: null });
    }
    if (msg.GetConfig) {
        state.config = msg.GetConfig.value;
        renderPipeline();
    }
    if (msg.GetCaptureSignalLevels) {
        state.inputLevels = msg.GetCaptureSignalLevels.value;
        renderMeters();
        if (state.view === 'spectrum') renderSpectrum();
    }
    if (msg.GetPlaybackSignalLevels) {
        state.outputLevels = msg.GetPlaybackSignalLevels.value;
        renderMeters();
    }
    if (msg.GetState) {
        state.systemState = msg.GetState.value;
        updateStatusView();
    }
    if (msg.GetVolume) {
        state.volume = msg.GetVolume.value;
        updateVolumeUI();
    }
    if (msg.GetCaptureSampleRate) {
        state.samplerate = msg.GetCaptureSampleRate.value;
        updateStatusView();
    }
    if (msg.ListConfigs) {
        state.configs = msg.ListConfigs.value;
        renderConfigs();
    }
    if (msg.GetCaptureDevice) {
        state.captureDevice = msg.GetCaptureDevice.value;
        updateStatusView();
    }
    if (msg.GetPlaybackDevice) {
        state.playbackDevice = msg.GetPlaybackDevice.value;
        updateStatusView();
    }
}

function updateVolumeUI() {
    el.volumeSlider.value = state.volume.toString();
    el.volumeText.innerText = state.volume.toFixed(1);
}

function updateStatusView() {
    el.statusSamplerate.innerText = `${state.samplerate} Hz`;
    el.statusState.innerText = state.systemState;
    el.statusCapture.innerText = state.captureDevice;
    el.statusPlayback.innerText = state.playbackDevice;

    el.footerSamplerate.innerText = `SR: ${state.samplerate}`;
    el.footerState.innerText = `State: ${state.systemState}`;
}

function renderConfigs() {
    el.configsList.innerHTML = '';
    state.configs.forEach(conf => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex justify-between items-center transition-colors';
        btn.innerHTML = `<span>${conf}</span> <span class="text-xs text-slate-500">Apply</span>`;
        btn.onclick = () => {
            sendCommand({ SetConfigName: conf });
            sendCommand({ Reload: null });
            el.footerMsg.innerText = `Applied ${conf}`;
            setTimeout(() => el.footerMsg.innerText = 'Idle', 3000);
        };
        el.configsList.appendChild(btn);
    });
}

function renderPipeline() {
    if (!state.config || !state.config.pipeline) return;
    el.pipelineContainer.innerHTML = '';
    
    state.config.pipeline.forEach((step: any, idx: number) => {
        const node = document.createElement('div');
        node.className = 'p-3 bg-slate-700 border border-slate-600 rounded flex flex-col gap-1';
        
        const title = document.createElement('div');
        title.className = 'font-bold text-sky-300 flex justify-between';
        title.innerHTML = `<span>${step.type || 'Filter'}</span> <span class="text-xs text-slate-400">#${idx}</span>`;
        
        const details = document.createElement('div');
        details.className = 'text-xs text-slate-300';
        if (step.names) details.innerText = `Filters: ${step.names.join(', ')}`;
        else if (step.channel !== undefined) details.innerText = `Channel: ${step.channel}`;

        node.appendChild(title);
        node.appendChild(details);
        el.pipelineContainer.appendChild(node);

        if (idx < state.config.pipeline.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'flex justify-center text-slate-500 py-1';
            arrow.innerHTML = '↓';
            el.pipelineContainer.appendChild(arrow);
        }
    });
}

function renderSpectrum() {
    const ctx = el.spectrumCanvas.getContext('2d');
    if (!ctx) return;

    const w = el.spectrumCanvas.width = el.spectrumCanvas.clientWidth;
    const h = el.spectrumCanvas.height = el.spectrumCanvas.clientHeight;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Simulated spectrum based on current levels for In 1/2
    const level1 = state.inputLevels[0] || -100;
    const level2 = state.inputLevels[1] || -100;

    const barWidth = w / 32;
    for (let i = 0; i < 32; i++) {
        const magnitude = (level1 + level2) / 2 + (Math.random() * 20 - 10);
        const barHeight = Math.max(2, (magnitude + 100) / 100 * h);
        
        ctx.fillStyle = `hsl(${200 + i * 2}, 70%, 50%)`;
        ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
    }
}

function sendCommand(command: any) {
    if (socket) {
        if (state.devMode) {
            (socket as MockCamillaDSP).send(command);
        } else {
            (socket as WebSocket).send(JSON.stringify(command));
        }
    }
}

function toggleMute(index: number) {
    state.mutes[index] = !state.mutes[index];
    // In CamillaDSP, you'd usually set mute via SetConfig or a specific command if supported by the version
    // Mocking it for now.
    sendCommand({ SetMute: { channel: index, value: state.mutes[index] } });
    renderMeters();
}

function updateConnectionStatus(connected: boolean) {
    state.connected = connected;
    const color = connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500';
    el.statusIndicator.className = `w-3 h-3 rounded-full ${color}`;
    el.statusText.innerText = connected ? 'Connected' : 'Disconnected';
    
    el.footerStatusIndicator.className = `w-2 h-2 rounded-full ${color}`;
    el.footerStatusText.innerText = connected ? 'ONLINE' : 'OFFLINE';
}

// --- UI Logic ---
function switchView(viewName: State['view']) {
    state.view = viewName;
    el.mainView.classList.add('hidden');
    el.pipelineView.classList.add('hidden');
    el.spectrumView.classList.add('hidden');
    el.configsView.classList.add('hidden');
    el.statusView.classList.add('hidden');
    el.settingsView.classList.add('hidden');

    if (viewName === 'meters') el.mainView.classList.remove('hidden');
    else if (viewName === 'pipeline') el.pipelineView.classList.remove('hidden');
    else if (viewName === 'spectrum') el.spectrumView.classList.remove('hidden');
    else if (viewName === 'configs') el.configsView.classList.remove('hidden');
    else if (viewName === 'status') el.statusView.classList.remove('hidden');
    else if (viewName === 'settings') el.settingsView.classList.remove('hidden');

    el.menuOverlay.classList.add('translate-x-full');
}

function createMeter(index: number, type: 'in' | 'out') {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center gap-1 w-full max-w-[40px] h-full';
    
    const meterBg = document.createElement('div');
    meterBg.className = 'flex-1 w-4 bg-slate-800 rounded-sm overflow-hidden relative border border-slate-700';
    
    const fill = document.createElement('div');
    fill.id = `${type}-fill-${index}`;
    fill.className = 'absolute bottom-0 left-0 w-full bg-gradient-to-t from-sky-600 via-sky-400 to-emerald-400 transition-all duration-75';
    fill.style.height = '0%';
    
    meterBg.appendChild(fill);
    
    const muteBtn = document.createElement('button');
    muteBtn.id = `${type}-mute-${index}`;
    muteBtn.className = `w-8 h-8 rounded-md flex items-center justify-center border transition-colors ${state.mutes[type === 'in' ? index : index + 8] ? 'bg-red-600 border-red-400' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`;
    muteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
    `;
    muteBtn.onclick = () => toggleMute(type === 'in' ? index : index + 8);
    
    const label = document.createElement('span');
    label.className = 'text-[10px] text-slate-500 font-mono';
    label.innerText = (index + 1).toString();

    container.appendChild(meterBg);
    container.appendChild(muteBtn);
    container.appendChild(label);
    
    return container;
}

function renderMeters() {
    // Initial render of meter elements if they don't exist
    if (el.inputMeters.children.length === 0) {
        for (let i = 0; i < 8; i++) el.inputMeters.appendChild(createMeter(i, 'in'));
        for (let i = 0; i < 8; i++) el.outputMeters.appendChild(createMeter(i, 'out'));
    }

    // Update fill levels
    state.inputLevels.forEach((lvl, i) => {
        const fill = document.getElementById(`in-fill-${i}`);
        if (fill) {
            const pct = Math.max(0, Math.min(100, (lvl + 100) / 100 * 100)); // Map -100..0 to 0..100
            fill.style.height = `${pct}%`;
        }
    });
    state.outputLevels.forEach((lvl, i) => {
        const fill = document.getElementById(`out-fill-${i}`);
        if (fill) {
            const pct = Math.max(0, Math.min(100, (lvl + 100) / 100 * 100));
            fill.style.height = `${pct}%`;
        }
    });

    // Update mute button classes
    for (let i = 0; i < 8; i++) {
        const inMute = document.getElementById(`in-mute-${i}`);
        if (inMute) {
            inMute.className = `w-8 h-8 rounded-md flex items-center justify-center border transition-colors ${state.mutes[i] ? 'bg-red-600 border-red-400' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`;
        }
        const outMute = document.getElementById(`out-mute-${i}`);
        if (outMute) {
            outMute.className = `w-8 h-8 rounded-md flex items-center justify-center border transition-colors ${state.mutes[i+8] ? 'bg-red-600 border-red-400' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`;
        }
    }
}

// --- Event Listeners ---
el.menuBtn.onclick = () => el.menuOverlay.classList.remove('translate-x-full');
el.closeMenu.onclick = () => el.menuOverlay.classList.add('translate-x-full');

el.devModeToggle.onchange = (e) => {
    state.devMode = (e.target as HTMLInputElement).checked;
    connect();
};

el.reconnectBtn.onclick = () => connect();

el.volumeSlider.oninput = (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    state.volume = val;
    el.volumeText.innerText = val.toFixed(1);
    sendCommand({ SetVolume: val });
};

el.menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const view = (e.currentTarget as HTMLElement).getAttribute('data-view') as State['view'];
        switchView(view);
    });
});

// --- Init ---
connect();
renderMeters();
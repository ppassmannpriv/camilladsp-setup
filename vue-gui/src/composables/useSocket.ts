import { onUnmounted } from 'vue';
import { useCamillaStore } from '../stores/camilla';
import { MockCamillaDSP } from '../mock';

type AnySocket = MockCamillaDSP | WebSocket;

let socket: AnySocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

export function useSocket() {
  const store = useCamillaStore();

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
      if (!store.connected) return;
      sendCmd({ GetSignalLevels: null });
      if (store.view === 'status') {
        sendCmd({ GetState: null });
        sendCmd({ GetCaptureSampleRate: null });
      }
    }, store.pollInterval);
  }

  function connect() {
    // Tear down existing connection
    if (socket) {
      if (socket instanceof MockCamillaDSP) socket.disconnect();
      else socket.close();
      socket = null;
    }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

    if (store.devMode) {
      const mock = new MockCamillaDSP(store.handleMessage);
      socket = mock;
      mock.connect();
      store.connected = true;
      startPolling();
    } else {
      try {
        const ws = new WebSocket(`ws://${store.host}`);
        socket = ws;
        ws.onopen = () => {
          store.connected = true;
          sendCmd({ GetVersion: null });
          sendCmd({ GetVolume: null });
          sendCmd({ GetState: null });
          sendCmd({ GetCaptureSampleRate: null });
          sendCmd({ GetConfigFilePath: null });
          sendCmd({ GetAvailableConfigFiles: null });
          sendCmd({ GetConfig: null });
          sendCmd({ GetBufferSize: null });
          sendCmd({ GetCaptureDevice: null });
          sendCmd({ GetPlaybackDevice: null });
          startPolling();
        };
        ws.onmessage = (ev) => {
          try { store.handleMessage(JSON.parse(ev.data)); } catch { /* ignore */ }
        };
        ws.onclose = () => { store.connected = false; };
        ws.onerror = () => { store.connected = false; };
      } catch {
        store.connected = false;
      }
    }
  }

  function disconnect() {
    if (socket) {
      if (socket instanceof MockCamillaDSP) socket.disconnect();
      else socket.close();
      socket = null;
    }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    store.connected = false;
  }

  onUnmounted(disconnect);

  return { connect, disconnect, sendCmd };
}

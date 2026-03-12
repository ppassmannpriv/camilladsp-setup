import { onUnmounted } from 'vue';
import { useCamillaStore } from '../stores/camilla';
import { CamillaDspWsBridge, MessageHandler, WsReply } from '../bridge/camilla-dsp-ws-bridge.ts';

let pollTimer: ReturnType<typeof setInterval> | null = null;
let socket: CamillaDspWsBridge | null = null;

export function useSocket() {
  const store = useCamillaStore();

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (!store.connected) return;

      socket?.getSignalLevels();
      if (store.view === 'status') {
        socket?.getState();
        socket?.getCaptureRate();
      }
    }, store.pollInterval);
  }

  const onConnect = () => {
    store.connected = true;
    socket?.getVersion();
    socket?.getVolume();
    socket?.getState();
    socket?.getCaptureRate();
    socket?.getConfigFilePath();
    // socket?.getAvailableConfigFiles();
    socket?.getConfig();
    socket?.getBufferLevel();
    // socket?.getCaptureDevice();
    // socket?.getPlaybackDevice();
    startPolling();
  };

  const onMessage: MessageHandler = (reply: WsReply) => {
    try { store.handleMessage(reply); } catch { console.error('Error handling message', reply); }
  };

  const onDisconnect = () => { store.connected = false; };

  function connect(): CamillaDspWsBridge | null {
    // Tear down existing connection
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

    if (store.devMode) {
      store.connected = true;
      startPolling();
    } else {
      try {
        socket = new CamillaDspWsBridge({
          onMessage,
          onConnect,
          onDisconnect,
        });

        socket.connect(store.host);
      } catch {
        store.connected = false;
      }
    }
    return socket;
  }

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    store.connected = false;
  }

  function setVolume(vol: number) {
    socket?.setVolume(vol);
  }

  function setGlobalMute(mute: boolean) {
    socket?.setMute(mute);
  }

  function getVolume() {
    socket?.getVolume();
  }

  onUnmounted(disconnect);

  return {
    connect, disconnect,

  };
}

export class MockCamillaDSP {
    onMessage;
    isConnected = false;
    interval;
    numInputs = 8;
    numOutputs = 8;
    mutes = Array(16).fill(false);
    config = {
        pipeline: [
            { type: "Filter", names: ["Sub Gain", "Sub Delay"] },
            { type: "Filter", names: ["Kick Gain", "Kick Delay"] },
            { type: "Filter", names: ["Top Gain", "Top Delay"] },
            { type: "Mixer", channel: 0 }
        ]
    };
    volume = -20.0;
    samplerate = 44100;
    state = "Running";
    configs = ["default.yml", "night.yml", "testing.yml"];
    captureDevice = "USB Audio Class 2.0";
    playbackDevice = "ALSA: hw:PCH,0";
    constructor(onMessage) {
        this.onMessage = onMessage;
    }
    connect() {
        this.isConnected = true;
        this.startSendingUpdates();
        setTimeout(() => {
            this.onMessage({ GetVersion: { value: "1.0.0-mock" } });
        }, 100);
    }
    startSendingUpdates() {
        this.interval = setInterval(() => {
            if (!this.isConnected)
                return;
            const levels = [];
            for (let i = 0; i < this.numInputs + this.numOutputs; i++) {
                // Generate some random dB levels between -60 and 0
                levels.push(Math.random() * -60);
            }
            this.onMessage({
                GetState: {
                    value: this.state,
                },
                GetCaptureSignalLevels: {
                    value: levels.slice(0, this.numInputs)
                },
                GetPlaybackSignalLevels: {
                    value: levels.slice(this.numInputs)
                },
                GetVolume: {
                    value: this.volume
                },
                GetCaptureSampleRate: {
                    value: this.samplerate
                }
            });
        }, 100);
    }
    send(command) {
        console.log("Mock received command:", command);
        if (command.GetConfig !== undefined) {
            setTimeout(() => this.onMessage({ GetConfig: { value: this.config } }), 50);
        }
        if (command.SetMute) {
            // Handle mute simulation if needed
        }
        if (command.SetVolume !== undefined) {
            this.volume = command.SetVolume;
            this.onMessage({ GetVolume: { value: this.volume } });
        }
        if (command.ListConfigs !== undefined) {
            setTimeout(() => this.onMessage({ ListConfigs: { value: this.configs } }), 50);
        }
        if (command.GetCaptureHardwareSamplerate !== undefined) {
            setTimeout(() => this.onMessage({ GetCaptureHardwareSamplerate: { value: this.samplerate } }), 50);
        }
        if (command.GetCaptureDevice !== undefined) {
            setTimeout(() => this.onMessage({ GetCaptureDevice: { value: this.captureDevice } }), 50);
        }
        if (command.GetPlaybackDevice !== undefined) {
            setTimeout(() => this.onMessage({ GetPlaybackDevice: { value: this.playbackDevice } }), 50);
        }
    }
    disconnect() {
        this.isConnected = false;
        clearInterval(this.interval);
    }
}
//# sourceMappingURL=mock.js.map
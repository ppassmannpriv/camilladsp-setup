/**
 * CamillaDSP WebSocket Bridge
 *
 * TypeScript representation of the CamillaDSP websocket server protocol.
 * Source: https://github.com/HEnquist/camilladsp/blob/master/src/socketserver.rs
 *
 * All commands map 1-to-1 to the WsCommand enum in socketserver.rs.
 * All reply types map 1-to-1 to the WsReply enum in socketserver.rs.
 */

// ─── Result & shared value types ─────────────────────────────────────────────

export type WsResult = 'Ok' | 'Error';

export interface AllLevels {
  playback_rms: number[];
  playback_peak: number[];
  capture_rms: number[];
  capture_peak: number[];
}

export interface PbCapLevels {
  playback: number[];
  capture: number[];
}

export interface Fader {
  volume: number;
  mute: boolean;
}

// ─── Reply types (WsReply enum in socketserver.rs) ───────────────────────────

export interface ReplySetConfigFilePath       { SetConfigFilePath:       { result: WsResult } }
export interface ReplySetConfig               { SetConfig:               { result: WsResult } }
export interface ReplySetConfigJson           { SetConfigJson:           { result: WsResult } }
export interface ReplyReload                  { Reload:                  { result: WsResult } }
export interface ReplyGetConfig               { GetConfig:               { result: WsResult; value: string } }
export interface ReplyGetConfigTitle          { GetConfigTitle:          { result: WsResult; value: string } }
export interface ReplyGetConfigDescription    { GetConfigDescription:    { result: WsResult; value: string } }
export interface ReplyGetPreviousConfig       { GetPreviousConfig:       { result: WsResult; value: string } }
export interface ReplyReadConfig              { ReadConfig:              { result: WsResult; value: string } }
export interface ReplyReadConfigFile          { ReadConfigFile:          { result: WsResult; value: string } }
export interface ReplyValidateConfig          { ValidateConfig:          { result: WsResult; value: string } }
export interface ReplyGetConfigJson           { GetConfigJson:           { result: WsResult; value: string } }
export interface ReplyGetConfigFilePath       { GetConfigFilePath:       { result: WsResult; value: string | null } }
export interface ReplyGetStateFilePath        { GetStateFilePath:        { result: WsResult; value: string | null } }
export interface ReplyGetStateFileUpdated     { GetStateFileUpdated:     { result: WsResult; value: boolean } }
export interface ReplyGetSignalRange          { GetSignalRange:          { result: WsResult; value: number } }
export interface ReplyGetPlaybackSignalRms    { GetPlaybackSignalRms:    { result: WsResult; value: number[] } }
export interface ReplyGetPlaybackSignalRmsSince     { GetPlaybackSignalRmsSince:     { result: WsResult; value: number[] } }
export interface ReplyGetPlaybackSignalRmsSinceLast { GetPlaybackSignalRmsSinceLast: { result: WsResult; value: number[] } }
export interface ReplyGetPlaybackSignalPeak   { GetPlaybackSignalPeak:   { result: WsResult; value: number[] } }
export interface ReplyGetPlaybackSignalPeakSince     { GetPlaybackSignalPeakSince:     { result: WsResult; value: number[] } }
export interface ReplyGetPlaybackSignalPeakSinceLast { GetPlaybackSignalPeakSinceLast: { result: WsResult; value: number[] } }
export interface ReplyGetCaptureSignalRms    { GetCaptureSignalRms:    { result: WsResult; value: number[] } }
export interface ReplyGetCaptureSignalRmsSince     { GetCaptureSignalRmsSince:     { result: WsResult; value: number[] } }
export interface ReplyGetCaptureSignalRmsSinceLast { GetCaptureSignalRmsSinceLast: { result: WsResult; value: number[] } }
export interface ReplyGetCaptureSignalPeak   { GetCaptureSignalPeak:   { result: WsResult; value: number[] } }
export interface ReplyGetCaptureSignalPeakSince     { GetCaptureSignalPeakSince:     { result: WsResult; value: number[] } }
export interface ReplyGetCaptureSignalPeakSinceLast { GetCaptureSignalPeakSinceLast: { result: WsResult; value: number[] } }
export interface ReplyGetSignalLevels         { GetSignalLevels:         { result: WsResult; value: AllLevels } }
export interface ReplyGetSignalLevelsSince    { GetSignalLevelsSince:    { result: WsResult; value: AllLevels } }
export interface ReplyGetSignalLevelsSinceLast{ GetSignalLevelsSinceLast:{ result: WsResult; value: AllLevels } }
export interface ReplyGetSignalPeaksSinceStart{ GetSignalPeaksSinceStart:{ result: WsResult; value: PbCapLevels } }
export interface ReplyResetSignalPeaksSinceStart { ResetSignalPeaksSinceStart: { result: WsResult } }
export interface ReplyGetCaptureRate          { GetCaptureRate:          { result: WsResult; value: number } }
export interface ReplyGetUpdateInterval       { GetUpdateInterval:       { result: WsResult; value: number } }
export interface ReplySetUpdateInterval       { SetUpdateInterval:       { result: WsResult } }
export interface ReplySetVolume               { SetVolume:               { result: WsResult } }
export interface ReplyGetVolume               { GetVolume:               { result: WsResult; value: number } }
export interface ReplyAdjustVolume            { AdjustVolume:            { result: WsResult; value: number } }
export interface ReplySetMute                 { SetMute:                 { result: WsResult } }
export interface ReplyGetMute                 { GetMute:                 { result: WsResult; value: boolean } }
export interface ReplyToggleMute              { ToggleMute:              { result: WsResult; value: boolean } }
export interface ReplySetFaderVolume          { SetFaderVolume:          { result: WsResult } }
export interface ReplySetFaderExternalVolume  { SetFaderExternalVolume:  { result: WsResult } }
export interface ReplyGetFaders               { GetFaders:               { result: WsResult; value: Fader[] } }
/** value is [faderIndex, volume] */
export interface ReplyGetFaderVolume          { GetFaderVolume:          { result: WsResult; value: [number, number] } }
/** value is [faderIndex, volume] */
export interface ReplyAdjustFaderVolume       { AdjustFaderVolume:       { result: WsResult; value: [number, number] } }
export interface ReplySetFaderMute            { SetFaderMute:            { result: WsResult } }
/** value is [faderIndex, muted] */
export interface ReplyGetFaderMute            { GetFaderMute:            { result: WsResult; value: [number, boolean] } }
/** value is [faderIndex, muted] */
export interface ReplyToggleFaderMute         { ToggleFaderMute:         { result: WsResult; value: [number, boolean] } }
export interface ReplyGetVersion              { GetVersion:              { result: WsResult; value: string } }
export interface ReplyGetState                { GetState:                { result: WsResult; value: ProcessingState } }
export interface ReplyGetStopReason           { GetStopReason:           { result: WsResult; value: StopReason } }
export interface ReplyGetRateAdjust           { GetRateAdjust:           { result: WsResult; value: number } }
export interface ReplyGetBufferLevel          { GetBufferLevel:          { result: WsResult; value: number } }
export interface ReplyGetClippedSamples       { GetClippedSamples:       { result: WsResult; value: number } }
export interface ReplyResetClippedSamples     { ResetClippedSamples:     { result: WsResult } }
/** value is [captureTypes, playbackTypes] */
export interface ReplyGetSupportedDeviceTypes { GetSupportedDeviceTypes: { result: WsResult; value: [string[], string[]] } }
/** value is array of [name, description] tuples */
export interface ReplyGetAvailableCaptureDevices  { GetAvailableCaptureDevices:  { result: WsResult; value: [string, string][] } }
/** value is array of [name, description] tuples */
export interface ReplyGetAvailablePlaybackDevices { GetAvailablePlaybackDevices: { result: WsResult; value: [string, string][] } }
export interface ReplyGetProcessingLoad       { GetProcessingLoad:       { result: WsResult; value: number } }
export interface ReplyExit                    { Exit:                    { result: WsResult } }
export interface ReplyStop                    { Stop:                    { result: WsResult } }

export type WsReply =
  | ReplySetConfigFilePath
  | ReplySetConfig
  | ReplySetConfigJson
  | ReplyReload
  | ReplyGetConfig
  | ReplyGetConfigTitle
  | ReplyGetConfigDescription
  | ReplyGetPreviousConfig
  | ReplyReadConfig
  | ReplyReadConfigFile
  | ReplyValidateConfig
  | ReplyGetConfigJson
  | ReplyGetConfigFilePath
  | ReplyGetStateFilePath
  | ReplyGetStateFileUpdated
  | ReplyGetSignalRange
  | ReplyGetPlaybackSignalRms
  | ReplyGetPlaybackSignalRmsSince
  | ReplyGetPlaybackSignalRmsSinceLast
  | ReplyGetPlaybackSignalPeak
  | ReplyGetPlaybackSignalPeakSince
  | ReplyGetPlaybackSignalPeakSinceLast
  | ReplyGetCaptureSignalRms
  | ReplyGetCaptureSignalRmsSince
  | ReplyGetCaptureSignalRmsSinceLast
  | ReplyGetCaptureSignalPeak
  | ReplyGetCaptureSignalPeakSince
  | ReplyGetCaptureSignalPeakSinceLast
  | ReplyGetSignalLevels
  | ReplyGetSignalLevelsSince
  | ReplyGetSignalLevelsSinceLast
  | ReplyGetSignalPeaksSinceStart
  | ReplyResetSignalPeaksSinceStart
  | ReplyGetCaptureRate
  | ReplyGetUpdateInterval
  | ReplySetUpdateInterval
  | ReplySetVolume
  | ReplyGetVolume
  | ReplyAdjustVolume
  | ReplySetMute
  | ReplyGetMute
  | ReplyToggleMute
  | ReplySetFaderVolume
  | ReplySetFaderExternalVolume
  | ReplyGetFaders
  | ReplyGetFaderVolume
  | ReplyAdjustFaderVolume
  | ReplySetFaderMute
  | ReplyGetFaderMute
  | ReplyToggleFaderMute
  | ReplyGetVersion
  | ReplyGetState
  | ReplyGetStopReason
  | ReplyGetRateAdjust
  | ReplyGetBufferLevel
  | ReplyGetClippedSamples
  | ReplyResetClippedSamples
  | ReplyGetSupportedDeviceTypes
  | ReplyGetAvailableCaptureDevices
  | ReplyGetAvailablePlaybackDevices
  | ReplyGetProcessingLoad
  | ReplyExit
  | ReplyStop;

// ─── State enums (from camilladsp crate) ─────────────────────────────────────

export type ProcessingState = 'Running' | 'Paused' | 'Inactive' | 'Starting' | 'Stalled';

export type StopReason =
  | 'None'
  | 'Done'
  | { CaptureError: string }
  | { PlaybackError: string }
  | { CaptureFormatChange: number }
  | { PlaybackFormatChange: number };

// ─── Bridge class ─────────────────────────────────────────────────────────────

export type MessageHandler = (reply: WsReply) => void;

export class CamillaDspWsBridge {
  private ws: WebSocket | null = null;
  private onMessage: MessageHandler;
  private onConnect?: () => void;
  private onDisconnect?: () => void;

  constructor(options: {
    onMessage: MessageHandler;
    onConnect?: () => void;
    onDisconnect?: () => void;
  }) {
    this.onMessage = options.onMessage;
    this.onConnect = options.onConnect;
    this.onDisconnect = options.onDisconnect;
  }

  get wsState(): number {
    return this.ws?.readyState ?? 3;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(host: string): void {
    this.disconnect();
    const ws = new WebSocket(`ws://${host}`);
    this.ws = ws;

    ws.onopen = () => this.onConnect?.();
    ws.onclose = () => { this.ws = null; this.onDisconnect?.(); };
    ws.onerror = () => { this.ws = null; this.onDisconnect?.(); };
    ws.onmessage = (ev) => {
      try {
        const reply = JSON.parse(ev.data as string) as WsReply;
        this.onMessage(reply);
      } catch {
        // ignore malformed messages
        console.error('Received malformed message from Camilla DSP:', ev.data);
      }
    };
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  private send(cmd: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(cmd));
    }
  }

  // ─── Config commands ───────────────────────────────────────────────────────

  setConfigFilePath(path: string): void        { this.send({ SetConfigFilePath: path }); }
  setConfig(configYaml: string): void          { this.send({ SetConfig: configYaml }); }
  setConfigJson(configJson: string): void      { this.send({ SetConfigJson: configJson }); }
  reload(): void                               { this.send('Reload'); }
  getConfig(): void                            { this.send('GetConfig'); }
  getConfigTitle(): void                       { this.send('GetConfigTitle'); }
  getConfigDescription(): void                 { this.send('GetConfigDescription'); }
  getPreviousConfig(): void                    { this.send('GetPreviousConfig'); }
  readConfig(configYaml: string): void         { this.send({ ReadConfig: configYaml }); }
  readConfigFile(path: string): void           { this.send({ ReadConfigFile: path }); }
  validateConfig(configYaml: string): void     { this.send({ ValidateConfig: configYaml }); }
  getConfigJson(): void                        { this.send('GetConfigJson'); }
  getConfigFilePath(): void                    { this.send('GetConfigFilePath'); }

  // ─── State file commands ───────────────────────────────────────────────────

  getStateFilePath(): void                     { this.send('GetStateFilePath'); }
  getStateFileUpdated(): void                  { this.send('GetStateFileUpdated'); }

  // ─── Signal level commands ─────────────────────────────────────────────────

  getSignalRange(): void                       { this.send('GetSignalRange'); }
  getCaptureSignalRms(): void                  { this.send('GetCaptureSignalRms'); }
  getCaptureSignalRmsSince(seconds: number): void    { this.send({ GetCaptureSignalRmsSince: seconds }); }
  getCaptureSignalRmsSinceLast(): void         { this.send('GetCaptureSignalRmsSinceLast'); }
  getCaptureSignalPeak(): void                 { this.send('GetCaptureSignalPeak'); }
  getCaptureSignalPeakSince(seconds: number): void   { this.send({ GetCaptureSignalPeakSince: seconds }); }
  getCaptureSignalPeakSinceLast(): void        { this.send('GetCaptureSignalPeakSinceLast'); }
  getPlaybackSignalRms(): void                 { this.send('GetPlaybackSignalRms'); }
  getPlaybackSignalRmsSince(seconds: number): void   { this.send({ GetPlaybackSignalRmsSince: seconds }); }
  getPlaybackSignalRmsSinceLast(): void        { this.send('GetPlaybackSignalRmsSinceLast'); }
  getPlaybackSignalPeak(): void                { this.send('GetPlaybackSignalPeak'); }
  getPlaybackSignalPeakSince(seconds: number): void  { this.send({ GetPlaybackSignalPeakSince: seconds }); }
  getPlaybackSignalPeakSinceLast(): void       { this.send('GetPlaybackSignalPeakSinceLast'); }
  getSignalLevels(): void                      { this.send('GetSignalLevels'); }
  getSignalLevelsSince(seconds: number): void  { this.send({ GetSignalLevelsSince: seconds }); }
  getSignalLevelsSinceLast(): void             { this.send('GetSignalLevelsSinceLast'); }
  getSignalPeaksSinceStart(): void             { this.send('GetSignalPeaksSinceStart'); }
  resetSignalPeaksSinceStart(): void           { this.send('ResetSignalPeaksSinceStart'); }

  // ─── Rate / interval commands ──────────────────────────────────────────────

  getCaptureRate(): void                       { this.send('GetCaptureRate'); }
  getUpdateInterval(): void                    { this.send('GetUpdateInterval'); }
  setUpdateInterval(ms: number): void          { this.send({ SetUpdateInterval: ms }); }

  // ─── Volume / mute commands ────────────────────────────────────────────────

  getVolume(): void                            { this.send('GetVolume'); }
  setVolume(db: number): void                  { this.send({ SetVolume: db }); }
  /** Adjust volume by step. Optionally clamp to [min, max]. */
  adjustVolume(step: number, min?: number, max?: number): void {
    if (min !== undefined && max !== undefined) {
      this.send({ AdjustVolume: [step, min, max] });
    } else {
      this.send({ AdjustVolume: step });
    }
  }
  getMute(): void                              { this.send('GetMute'); }
  setMute(muted: boolean): void                { this.send({ SetMute: muted }); }
  toggleMute(): void                           { this.send('ToggleMute'); }

  // ─── Fader commands ────────────────────────────────────────────────────────

  getFaders(): void                            { this.send('GetFaders'); }
  getFaderVolume(index: number): void          { this.send({ GetFaderVolume: index }); }
  setFaderVolume(index: number, db: number): void { this.send({ SetFaderVolume: [index, db] }); }
  setFaderExternalVolume(index: number, db: number): void { this.send({ SetFaderExternalVolume: [index, db] }); }
  /** Adjust fader volume by step. Optionally clamp to [min, max]. */
  adjustFaderVolume(index: number, step: number, min?: number, max?: number): void {
    if (min !== undefined && max !== undefined) {
      this.send({ AdjustFaderVolume: [index, step, min, max] });
    } else {
      this.send({ AdjustFaderVolume: [index, step] });
    }
  }
  getFaderMute(index: number): void            { this.send({ GetFaderMute: index }); }
  setFaderMute(index: number, muted: boolean): void { this.send({ SetFaderMute: [index, muted] }); }
  toggleFaderMute(index: number): void         { this.send({ ToggleFaderMute: index }); }

  // ─── Status / info commands ────────────────────────────────────────────────

  getVersion(): void                           { this.send('GetVersion'); }
  getState(): void                             { this.send('GetState'); }
  getStopReason(): void                        { this.send('GetStopReason'); }
  getRateAdjust(): void                        { this.send('GetRateAdjust'); }
  getBufferLevel(): void                       { this.send('GetBufferLevel'); }
  getClippedSamples(): void                    { this.send('GetClippedSamples'); }
  resetClippedSamples(): void                  { this.send('ResetClippedSamples'); }
  getProcessingLoad(): void                    { this.send('GetProcessingLoad'); }

  // ─── Device commands ───────────────────────────────────────────────────────

  getSupportedDeviceTypes(): void              { this.send('GetSupportedDeviceTypes'); }
  getAvailableCaptureDevices(deviceType: string): void  { this.send({ GetAvailableCaptureDevices: deviceType }); }
  getAvailablePlaybackDevices(deviceType: string): void { this.send({ GetAvailablePlaybackDevices: deviceType }); }

  // ─── Control commands ──────────────────────────────────────────────────────

  stop(): void                                 { this.send('Stop'); }
  exit(): void                                 { this.send('Exit'); }
}

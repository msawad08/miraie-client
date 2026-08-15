import { Device, DeviceCommand, DeviceState } from './types';

export interface MiraieClientOptions {
  username?: string;
  password?: string;
  host?: string;
  token?: string;
}

export class MiraieClient {
  private opts: MiraieClientOptions;
  private connected = false;

  constructor(opts: MiraieClientOptions = {}) {
    this.opts = opts;
  }

  async connect(): Promise<void> {
    // TODO: implement auth/session
    this.connected = true;
  }

  async getDevices(): Promise<Device[]> {
    if (!this.connected) await this.connect();
    return [];
  }

  async getDeviceState(deviceId: string): Promise<DeviceState | null> {
    if (!this.connected) await this.connect();
    return null;
  }

  async executeCommand(deviceId: string, command: DeviceCommand): Promise<any> {
    if (!this.connected) await this.connect();
    return { success: false, message: 'Not implemented' };
  }
}

export default MiraieClient;

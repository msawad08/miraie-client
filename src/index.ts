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
export * from './types';
export { MirAIeBroker } from './broker';
export { MirAIeDevice } from './device';

import { MirAIeDevice } from './device';
import { MirAIeBroker } from './broker';
import axios from 'axios';

export class MiraieClient {
  private opts: MiraieClientOptions;
  public hubDevices: MirAIeDevice[] = [];
  public broker: MirAIeBroker | null = null;
  private connected = false;

  constructor(opts: MiraieClientOptions = {}) {
    this.opts = opts;
  }

  async connect(): Promise<void> {
    // TODO: implement authentication with MirAIe endpoints
    this.broker = new MirAIeBroker();
    await this.broker.connect();
    this.connected = true;
  }

  async init(phone: string, password: string, broker?: MirAIeBroker): Promise<void> {
    this.opts.username = phone;
    this.opts.password = password;
    if (broker) this.broker = broker;
    await this.connect();
  }

  async close(): Promise<void> {
    if (this.broker) await this.broker.close();
    this.connected = false;
  }

  // placeholder: discover devices via hub API / broker
  async discover(): Promise<void> {
    if (!this.connected) await this.connect();
    // TODO: query API and populate hubDevices
    this.hubDevices = [];
  }
}

export default MiraieClient;

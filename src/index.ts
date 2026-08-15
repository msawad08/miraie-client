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

let MiraieAcJs: any | null = null;
try {
  // optional runtime dependency
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MiraieAcJs = require('miraie-ac-js');
} catch (e) {
  MiraieAcJs = null;
}

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

    if (MiraieAcJs) {
      // Use existing library for auth and session
      const session = await MiraieAcJs.createSession({ username: phone, password });
      await session.connect();
      this.hubDevices = await session.getDevices();
      this.broker = this.broker || new MirAIeBroker({ mqttUrl: session.brokerUrl });
      await this.broker.connect();
      // store the session for delegation
      (this as any)._session = session;
      this.connected = true;
      return;
    }

    await this.connect();
  }

  async close(): Promise<void> {
    if (this.broker) await this.broker.close();
    this.connected = false;
  }

  // placeholder: discover devices via hub API / broker
  async discover(): Promise<void> {
    if (!this.connected) await this.connect();
    if ((this as any)._session) {
      this.hubDevices = await (this as any)._session.getDevices();
      return;
    }

    // TODO: fallback implementation using raw HTTP endpoints
    this.hubDevices = [];
  }
}

export default MiraieClient;

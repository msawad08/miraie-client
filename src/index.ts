import { Device, DeviceCommand, DeviceState } from './types';
import { MirAIeDevice } from './device';
import { MirAIeBroker } from './broker';
import axios from 'axios';

export interface MiraieClientOptions {
  username?: string;
  password?: string;
  host?: string;
  token?: string;
}

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
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private userId: string | null = null;

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

    // Fallback: perform HTTP auth + discovery
    await this._authenticate(phone, password);
    await this.discover();
    // ensure broker connected
    this.broker = this.broker || new MirAIeBroker({ mqttUrl: 'mqtts://mqtt.miraie.in:8883' });
    await this.broker.connect();
    this.connected = true;
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
    // Fallback: call homes endpoint and populate devices
    if (!this.accessToken) throw new Error('not authenticated');

    try {
      const homesUrl = 'https://app.miraie.in/simplifi/v1/homeManagement/homes';
      const resp = await axios.get(homesUrl, { headers: { Authorization: `Bearer ${this.accessToken}` } });
      const data = resp.data;
      // data may be { homes: [...] } or an array; search for devices in spaces
      const devices: MirAIeDevice[] = [];
      const homes = Array.isArray(data) ? data : (data.homes || data.data || []);
      for (const home of homes) {
        const spaces = home.spaces || [];
        for (const space of spaces) {
          const devs = space.devices || [];
          for (const d of devs) {
            const id = d.deviceId || d.id || d.device_id;
            const name = d.deviceName || d.name || d.device_name || 'miraie-device';
            const model = d.model || d.deviceModel;
            const md = new MirAIeDevice(String(id), String(name), model);
            md.setMeta(d);
            devices.push(md);
          }
        }
      }
      this.hubDevices = devices;
    } catch (err: any) {
      // fallback to empty
      this.hubDevices = [];
    }
  }

  private isEmail(input: string) {
    return /@/.test(input);
  }

  private async _authenticate(username: string, password: string): Promise<void> {
    const url = 'https://auth.miraie.in/simplifi/v1/userManagement/login';
    const clientId = 'PBcMcfG19njNCL8AOgvRzIC8AjQa';
    const scope = 'an_14214235325';
    const body: any = { clientId, password, scope };
    if (this.isEmail(username)) body.email = username; else body.mobile = username;

    const resp = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    const d = resp.data || {};
    // try common shapes
    const payload = d.data || d || {};
    this.accessToken = payload.accessToken || payload.access_token || null;
    this.refreshToken = payload.refreshToken || payload.refresh_token || null;
    this.userId = payload.userId || payload.user_id || null;
    const expiresIn = payload.expiresIn || payload.expires_in || null;
    if (expiresIn) this.tokenExpiresAt = Date.now() + Number(expiresIn) * 1000;
  }

  async get_token(): Promise<string | null> {
    if (!this.accessToken) return null;
    if (this.tokenExpiresAt && Date.now() > this.tokenExpiresAt - 30000) {
      // re-auth using stored creds
      if (this.opts.username && this.opts.password) {
        await this._authenticate(this.opts.username, this.opts.password);
      }
    }
    return this.accessToken;
  }
}

export * from './types';
export { MirAIeBroker } from './broker';
export { MirAIeDevice } from './device';

export default MiraieClient;

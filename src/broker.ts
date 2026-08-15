import mqtt, { MqttClient } from 'mqtt';
import EventEmitter from 'eventemitter3';

export interface BrokerOptions {
  host?: string;
  mqttUrl?: string;
  clientId?: string;
  username?: string;
  password?: string;
}

export class MirAIeBroker extends EventEmitter {
  public client: MqttClient | null = null;
  private opts: BrokerOptions;

  constructor(opts: BrokerOptions = {}) {
    super();
    this.opts = opts;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.opts.mqttUrl || 'mqtt://broker.hivemq.com';
      const connectOpts: any = {};
      if (this.opts.clientId) connectOpts.clientId = this.opts.clientId;
      if (this.opts.username) connectOpts.username = this.opts.username;
      if (this.opts.password) connectOpts.password = this.opts.password;

      this.client = mqtt.connect(url, connectOpts);
      this.client.on('connect', () => {
        this.client?.on('message', (topic, payload) => {
          let msg: string | null = null;
          try { msg = payload.toString(); } catch (e) { msg = null; }
          this.emit('message', topic, msg);
        });
        resolve();
      });
      this.client.on('error', (err) => this.emit('error', err));
      // forward close/reconnect events
      this.client.on('close', () => this.emit('close'));
      this.client.on('reconnect', () => this.emit('reconnect'));
    });
  }

  subscribe(topics: string[] | string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) return reject(new Error('not connected'));
      const t = Array.isArray(topics) ? topics : [topics];
      this.client.subscribe(t, { qos: 1 }, (err, granted) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    if (!this.client) return;
    return new Promise((resolve) => {
      this.client?.end(true, {}, () => {
        this.client = null;
        resolve();
      });
    });
  }
}

export default MirAIeBroker;

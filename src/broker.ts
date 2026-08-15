import mqtt, { MqttClient } from 'mqtt';

export interface BrokerOptions {
  host?: string;
  mqttUrl?: string;
}

export class MirAIeBroker {
  public client: MqttClient | null = null;
  private opts: BrokerOptions;

  constructor(opts: BrokerOptions = {}) {
    this.opts = opts;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.opts.mqttUrl || 'mqtt://broker.hivemq.com';
      this.client = mqtt.connect(url);
      this.client.on('connect', () => resolve());
      this.client.on('error', (err) => reject(err));
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

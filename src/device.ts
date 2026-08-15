import { DeviceState, DeviceCommand } from './types';

export class MirAIeDevice {
  id: string;
  name: string;
  model?: string;
  state: DeviceState | null = null;
  // raw metadata from hub discovery
  meta?: any;
  // optional underlying fluent device from miraie-ac-js
  fluent?: any;

  constructor(id: string, name: string, model?: string) {
    this.id = id;
    this.name = name;
    this.model = model;
  }

  setMeta(meta: any) {
    this.meta = meta;
  }

  updateFromPayload(topic: string, payload: any) {
    // payload expected to be parsed JSON or string
    const obj = typeof payload === 'string' ? (() => {
      try { return JSON.parse(payload); } catch (e) { return { raw: payload }; }
    })() : payload;

    // simple heuristics to map fields
    const state: any = this.state || {};
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      const lk = k.toLowerCase();
      if (lk.includes('temp')) {
        const n = Number(v);
        if (!isNaN(n)) state.temperature = n;
      } else if (lk.includes('power') || lk === 'on' || lk === 'pwr') {
        state.power = !!v;
      } else if (lk.includes('mode')) {
        state.mode = String(v);
      } else if (lk.includes('fan')) {
        state.fan = String(v);
      }
    }

    this.state = state;
    // store last raw payload
    this.meta = this.meta || {};
    this.meta._lastStatus = obj;
  }

  async refresh(): Promise<void> {
    // return last cached state from broker messages or meta
    if (this.meta && this.meta._lastStatus) {
      this.updateFromPayload('', this.meta._lastStatus);
      return;
    }
    return;
  }

  async execute(command: DeviceCommand): Promise<any> {
    // If we have a fluent device (from miraie-ac-js), delegate to its API
    if (this.fluent) {
      try {
        const cmd = command.type;
        const p = command.payload || {};
        switch (cmd) {
          case 'power':
            if (p.on) return { success: true, result: await this.fluent.turnOn() };
            return { success: true, result: await this.fluent.turnOff() };
          case 'turn_on':
            return { success: true, result: await this.fluent.turnOn() };
          case 'turn_off':
            return { success: true, result: await this.fluent.turnOff() };
          case 'set_temperature':
          case 'temperature': {
            const temp = p.temperature ?? p.temp ?? p.t;
            if (typeof temp === 'undefined') return { success: false, message: 'temperature missing' };
            return { success: true, result: await this.fluent.setTemperature(Number(temp)) };
          }
          default:
            // attempt to call a similarly-named method on the fluent device
            if (typeof this.fluent[cmd] === 'function') {
              return { success: true, result: await this.fluent[cmd](p) };
            }
            return { success: false, message: `unsupported command: ${cmd}` };
        }
      } catch (err: any) {
        return { success: false, message: err?.message || String(err) };
      }
    }

    return { success: false, message: 'Not implemented' };
  }

  async turn_off(): Promise<any> {
    return this.execute({ type: 'power', payload: { on: false } });
  }

  async turn_on(): Promise<any> {
    return this.execute({ type: 'power', payload: { on: true } });
  }
}

export default MirAIeDevice;

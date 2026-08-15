import { DeviceState, DeviceCommand } from './types';

export class MirAIeDevice {
  id: string;
  name: string;
  model?: string;
  state: DeviceState | null = null;
  // optional underlying fluent device from miraie-ac-js
  fluent?: any;

  constructor(id: string, name: string, model?: string) {
    this.id = id;
    this.name = name;
    this.model = model;
  }

  async refresh(): Promise<void> {
    // TODO: implement fetching latest state from hub/broker
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

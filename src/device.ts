import { DeviceState, DeviceCommand } from './types';

export class MirAIeDevice {
  id: string;
  name: string;
  model?: string;
  state: DeviceState | null = null;

  constructor(id: string, name: string, model?: string) {
    this.id = id;
    this.name = name;
    this.model = model;
  }

  async refresh(): Promise<void> {
    // TODO: implement fetching latest state from hub/broker
  }

  async execute(command: DeviceCommand): Promise<any> {
    // TODO: implement command execution
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

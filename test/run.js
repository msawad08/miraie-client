#!/usr/bin/env node
const [,, username, password, temp] = process.argv;

if (!username || !password || !temp) {
  console.error('Usage: node test/run.js <username> <password> <temperature>');
  process.exit(1);
}

async function run() {
  // prefer local client if available
  let MiraieClient = null;
  try {
    MiraieClient = require('..').default;
  } catch (e) {
    // ignore
  }

  if (MiraieClient) {
    const client = new MiraieClient();
    await client.init(username, password);
    const devices = client.hubDevices || [];
    if (!devices || devices.length === 0) {
      console.error('No devices found for this account');
      await client.close();
      process.exit(3);
    }
    const d = devices[0];
    console.log('Targeting device:', d.name || d.id);
    try {
      await client.executeCommand(d.id, { type: 'set_temperature', payload: { temperature: Number(temp) } });
      console.log('Set temperature to', temp);
    } catch (err) {
      console.error('Command failed:', err);
    }
    await client.close();
    return;
  }

  // fallback to upstream package
  let MiraieAcJs = null;
  try { MiraieAcJs = require('miraie-ac-js'); } catch (e) { MiraieAcJs = null; }
  if (!MiraieAcJs) {
    console.error('Neither local client nor miraie-ac-js is installed. Install with `npm i miraie-ac-js` or build the package.');
    process.exit(2);
  }

  const session = await MiraieAcJs.createSession({ username, password });
  await session.connect();

  const devices = await session.getDevices();
  if (!devices || devices.length === 0) {
    console.error('No devices found for this account');
    await session.close();
    process.exit(3);
  }

  const dev = devices[0];
  console.log('Targeting device:', dev.getFriendlyName ? dev.getFriendlyName() : dev.data?.deviceName || dev.data?.topic);

  // ensure it's on and set temperature
  try {
    await dev.turnOn();
    await dev.setTemperature(Number(temp));
    console.log('Set temperature to', temp);
  } catch (err) {
    console.error('Command failed:', err);
  }

  await session.close();
}

run().catch(err => { console.error(err); process.exit(99); });

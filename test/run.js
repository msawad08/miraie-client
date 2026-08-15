#!/usr/bin/env node
const MiraieAcJs = (() => {
  try { return require('miraie-ac-js'); } catch (e) { return null; }
})();

const [,, username, password, temp] = process.argv;

if (!username || !password || !temp) {
  console.error('Usage: node test/run.js <username> <password> <temperature>');
  process.exit(1);
}

async function run() {
  if (!MiraieAcJs) {
    console.error('miraie-ac-js is not installed. Install it with `npm i miraie-ac-js`');
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

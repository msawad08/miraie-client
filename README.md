# @msawad08/miraie-client

Node.js / TypeScript client for Panasonic MirAIe AC devices.

This repository is the standalone package scaffold. It exports `MiraieClient` which will handle authentication, discovery, state, and commands.

Quickstart (dev):

```bash
cd d:/Workspace/HA/miraie-client
npm install
npm run build
```

Test runner
---------

The repo includes a simple test runner that uses `miraie-ac-js` to connect and change the first device's temperature.

1. Install dependencies and optionally the helper library:

```bash
npm install
# optional: install the upstream helper for convenience
npm install miraie-ac-js
```

2. Run the Node test runner:

```bash
node test/run.js <username> <password> <temperature>
# example:
node test/run.js +911234567890 mypassword 24.5
```

3. Or use the provided Python wrapper which calls the Node runner:

```bash
python test/run.py <username> <password> <temperature>
```

If `miraie-ac-js` is not installed, the test runner will prompt that it's required. The TypeScript client also implements an HTTP fallback for authentication and discovery, so you can use the library directly without `miraie-ac-js`.

Next steps:
- Implement authentication and session handling
- Implement device discovery and state polling
- Implement command protocol
- Add tests and CI

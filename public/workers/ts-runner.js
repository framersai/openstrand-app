/* eslint-disable no-restricted-globals */
// Minimal JS/TS runner worker. For TS, users should write JS-compatible snippets for now.
// Future: integrate WASM transpiler to compile TS before execution.

self.onmessage = async (ev) => {
  const { code, timeoutMs = 2000 } = ev.data || {};
  const logs = [];

  const originalConsole = self.console;
  const sandboxConsole = {
    log: (...args) => {
      try {
        logs.push(args.map(String).join(' '));
      } catch {
        logs.push('[unprintable]');
      }
    },
    error: (...args) => {
      try {
        logs.push('[error] ' + args.map(String).join(' '));
      } catch {
        logs.push('[error] [unprintable]');
      }
    },
    warn: (...args) => {
      try {
        logs.push('[warn] ' + args.map(String).join(' '));
      } catch {
        logs.push('[warn] [unprintable]');
      }
    },
    info: (...args) => {
      try {
        logs.push('[info] ' + args.map(String).join(' '));
      } catch {
        logs.push('[info] [unprintable]');
      }
    },
  };

  let timer = null;
  try {
    // Timeout guard
    await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Execution timeout')), timeoutMs);
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function('console', `'use strict';\n${String(code)}`);
        const result = fn(sandboxConsole);
        clearTimeout(timer);
        resolve(result);
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });

    self.postMessage({ ok: true, logs });
  } catch (error) {
    const message = error && error.message ? String(error.message) : 'Unknown error';
    logs.push('[exception] ' + message);
    self.postMessage({ ok: false, logs, error: message });
  } finally {
    if (timer) clearTimeout(timer);
    // restore
    // eslint-disable-next-line no-global-assign
    self.console = originalConsole;
  }
};



/* eslint-disable no-restricted-globals */
// Pyodide loader placeholder. Replace indexURL with local-bundled assets when enabled.
let pyodide = null;
let initializing = false;

async function ensurePyodide(indexURL) {
  if (pyodide) return pyodide;
  if (initializing) {
    // naive wait; in practice coordinate with a promise
    while (initializing) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return pyodide;
  }
  try {
    initializing = true;
    if (typeof loadPyodide !== 'function') {
      throw new Error('Pyodide not bundled');
    }
    pyodide = await loadPyodide({ indexURL });
    return pyodide;
  } finally {
    initializing = false;
  }
}

self.onmessage = async (ev) => {
  const { code, indexURL = '/pyodide', timeoutMs = 3000 } = ev.data || {};
  const logs = [];

  const write = (line) => {
    try {
      logs.push(String(line));
    } catch {
      logs.push('[unprintable]');
    }
  };

  let timer = null;
  try {
    await ensurePyodide(indexURL);
    if (!pyodide) {
      throw new Error('Pyodide not available');
    }

    timer = setTimeout(() => {
      throw new Error('Execution timeout');
    }, timeoutMs);

    // Redirect print by injecting a small wrapper
    const wrapped = `
import sys
from js import console
class _Capture:
    def write(self, s):
        if s and s.strip():
            console.log(s)
    def flush(self): pass
sys.stdout = _Capture()
sys.stderr = _Capture()
del _Capture
` + String(code);

    // Bridge console.log in worker
    const originalConsole = self.console.log;
    self.console.log = (...args) => write(args.join(' '));

    await pyodide.runPythonAsync(wrapped);

    clearTimeout(timer);
    self.console.log = originalConsole;
    self.postMessage({ ok: true, logs });
  } catch (error) {
    if (timer) clearTimeout(timer);
    const message = error && error.message ? String(error.message) : 'Unknown error';
    logs.push('[exception] ' + message);
    self.postMessage({ ok: false, logs, error: message });
  }
};



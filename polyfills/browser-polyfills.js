// Browser polyfills for Node.js built-ins

// Global polyfills
if (typeof globalThis === 'undefined') {
  if (typeof window !== 'undefined') {
    window.globalThis = window;
  } else if (typeof global !== 'undefined') {
    global.globalThis = global;
  } else if (typeof self !== 'undefined') {
    self.globalThis = self;
  }
}

// Process polyfill
if (typeof process === 'undefined') {
  globalThis.process = {
    env: { NODE_ENV: 'production' },
    version: 'v18.0.0',
    platform: 'browser',
    arch: 'x64',
    versions: { node: '18.0.0' },
    argv: [],
    pid: 1,
    ppid: 0,
    execPath: '/usr/bin/node',
    execArgv: [],
    nextTick: (fn, ...args) => Promise.resolve().then(() => fn(...args)),
    cwd: () => '/',
    chdir: () => {},
    umask: () => 0,
    memoryUsage: () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0 }),
    uptime: () => 0,
    hrtime: () => [0, 0],
    exit: () => {},
    kill: () => {},
    stdin: null,
    stdout: null,
    stderr: null
  };
}

// Buffer polyfill check
if (typeof Buffer === 'undefined') {
  try {
    const { Buffer } = require('buffer');
    globalThis.Buffer = Buffer;
  } catch (e) {
    // Fallback Buffer implementation
    globalThis.Buffer = {
      from: (data) => new Uint8Array(data),
      alloc: (size) => new Uint8Array(size),
      isBuffer: () => false
    };
  }
}

// Crypto polyfill
if (typeof crypto === 'undefined') {
  globalThis.crypto = {
    getRandomValues: function(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomBytes: function(size) {
      const arr = new Uint8Array(size);
      return this.getRandomValues(arr);
    }
  };
}

// TextEncoder/TextDecoder polyfills
if (typeof TextEncoder === 'undefined') {
  globalThis.TextEncoder = class TextEncoder {
    encode(str) {
      const utf8 = [];
      for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        if (charCode < 0x80) utf8.push(charCode);
        else if (charCode < 0x800) {
          utf8.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
        } else if (charCode < 0xd800 || charCode >= 0xe000) {
          utf8.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
        } else {
          i++;
          charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charCode >> 18), 0x80 | ((charCode >> 12) & 0x3f), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
        }
      }
      return new Uint8Array(utf8);
    }
  };
}

if (typeof TextDecoder === 'undefined') {
  globalThis.TextDecoder = class TextDecoder {
    decode(bytes) {
      let result = '';
      let i = 0;
      while (i < bytes.length) {
        let c = bytes[i++];
        if (c > 127) {
          if (c > 191 && c < 224) {
            c = (c & 31) << 6 | bytes[i++] & 63;
          } else if (c > 223 && c < 240) {
            c = (c & 15) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
          } else if (c > 239 && c < 248) {
            c = (c & 7) << 18 | (bytes[i++] & 63) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
          }
        }
        result += String.fromCharCode(c);
      }
      return result;
    }
  };
}

// FormData polyfill for Node.js environment
export default defineNuxtPlugin(() => {
  // 只在伺服器端運行
  if (process.server) {
    // 為 Node.js 環境提供 FormData polyfill
    if (typeof globalThis.FormData === 'undefined') {
      try {
        // 嘗試使用 Node.js 的 FormData (Node.js 16+)
        const { FormData } = require('formdata-node');
        globalThis.FormData = FormData;
      } catch (e) {
        // 如果 formdata-node 不可用，創建一個簡單的 polyfill
        globalThis.FormData = class FormData {
          constructor() {
            this.data = new Map();
          }
          
          append(key, value) {
            if (this.data.has(key)) {
              const existing = this.data.get(key);
              if (Array.isArray(existing)) {
                existing.push(value);
              } else {
                this.data.set(key, [existing, value]);
              }
            } else {
              this.data.set(key, value);
            }
          }
          
          get(key) {
            const value = this.data.get(key);
            return Array.isArray(value) ? value[0] : value;
          }
          
          getAll(key) {
            const value = this.data.get(key);
            return Array.isArray(value) ? value : [value];
          }
          
          has(key) {
            return this.data.has(key);
          }
          
          set(key, value) {
            this.data.set(key, value);
          }
          
          delete(key) {
            this.data.delete(key);
          }
          
          forEach(callback) {
            this.data.forEach(callback);
          }
          
          keys() {
            return this.data.keys();
          }
          
          values() {
            return this.data.values();
          }
          
          entries() {
            return this.data.entries();
          }
        };
      }
    }
    
    // 確保 window 和 self 在 Node.js 環境中有定義
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = globalThis;
    }
    if (typeof globalThis.self === 'undefined') {
      globalThis.self = globalThis;
    }
  }
}); 
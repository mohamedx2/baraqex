/**
 * Server Performance Benchmarks
 * Tests the performance of Server initialization, startup, shutdown, and memory usage
 */

import { describe, it, expect } from '@jest/globals';
import { Server } from '../src/server/index';

describe('Server Performance Benchmarks', () => {
  let server: Server;

  describe('Server Creation Performance', () => {
    it('should create a dev server in < 100ms', () => {
      const startTime = performance.now();
      server = new Server({ isDev: true });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
      console.log(`✅ Dev server creation: ${duration.toFixed(2)}ms`);
    });

    it('should create a production server in < 100ms', () => {
      const startTime = performance.now();
      server = new Server({ isDev: false });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
      console.log(`✅ Production server creation: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Server Startup Performance', () => {
    beforeEach(() => {
      server = new Server({ isDev: true });
    });

    afterEach(async () => {
      if (server) {
        await server.stop();
      }
    });

    it('should start a server in < 1000ms', async () => {
      const startTime = performance.now();
      await server.start();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
      console.log(`✅ Server startup: ${duration.toFixed(2)}ms`);
    }, 15000);
  });

  describe('Server Shutdown Performance', () => {
    beforeEach(async () => {
      server = new Server({ isDev: true });
      await server.start();
    }, 15000);

    it('should shutdown a server in < 500ms', async () => {
      const startTime = performance.now();
      await server.stop();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
      console.log(`✅ Server shutdown: ${duration.toFixed(2)}ms`);
    }, 15000);
  });

  describe('Server Restart Performance', () => {
    beforeEach(async () => {
      server = new Server({ isDev: true });
      await server.start();
    }, 15000);

    afterEach(async () => {
      if (server) {
        await server.stop();
      }
    }, 15000);

    it('should restart a server in < 1500ms', async () => {
      const startTime = performance.now();
      await server.stop();
      server = new Server({ isDev: true });
      await server.start();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1500);
      console.log(`✅ Server restart: ${duration.toFixed(2)}ms`);
    }, 15000);
  });

  describe('Server Memory Usage', () => {
    it('should maintain reasonable memory footprint with multiple servers', () => {
      const servers: Server[] = [];
      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      // Create 5 servers
      for (let i = 0; i < 5; i++) {
        servers.push(new Server({ isDev: true }));
      }

      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(50); // Should use less than 50MB for 5 servers
      console.log(`✅ Memory increase for 5 servers: ${memoryIncrease.toFixed(2)}MB`);

      // Cleanup
      servers.forEach(s => {
        // Cleanup if needed
      });
    });
  });
});

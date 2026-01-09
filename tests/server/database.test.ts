/**
 * Database Module Tests
 * Tests for database adapters (MongoDB, PostgreSQL, MySQL)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Database, DbConfig } from '../../src/server/database';

describe('Database', () => {
  describe('constructor', () => {
    it('should create a Database instance with MongoDB config', () => {
      const config: DbConfig = {
        type: 'mongodb',
        url: 'mongodb://localhost:27017/test'
      };
      const db = new Database(config);
      expect(db).toBeInstanceOf(Database);
    });

    it('should create a Database instance with MySQL config', () => {
      const config: DbConfig = {
        type: 'mysql',
        url: 'mysql://localhost:3306/test'
      };
      const db = new Database(config);
      expect(db).toBeInstanceOf(Database);
    });

    it('should create a Database instance with PostgreSQL config', () => {
      const config: DbConfig = {
        type: 'postgres',
        url: 'postgresql://localhost:5432/test'
      };
      const db = new Database(config);
      expect(db).toBeInstanceOf(Database);
    });
  });

  describe('getMongoDb', () => {
    it('should return null before connection', () => {
      const config: DbConfig = {
        type: 'mongodb',
        url: 'mongodb://localhost:27017/test'
      };
      const db = new Database(config);
      expect(db.getMongoDb()).toBeNull();
    });
  });

  describe('getMysqlPool', () => {
    it('should return null before connection', () => {
      const config: DbConfig = {
        type: 'mysql',
        url: 'mysql://localhost:3306/test'
      };
      const db = new Database(config);
      expect(db.getMysqlPool()).toBeNull();
    });
  });

  describe('getPgPool', () => {
    it('should return null before connection', () => {
      const config: DbConfig = {
        type: 'postgres',
        url: 'postgresql://localhost:5432/test'
      };
      const db = new Database(config);
      expect(db.getPgPool()).toBeNull();
    });
  });

  describe('connect', () => {
    it('should throw error for unsupported database type', async () => {
      const config = {
        type: 'unsupported' as any,
        url: 'invalid://localhost/test'
      };
      const db = new Database(config);
      
      await expect(db.connect()).rejects.toThrow('Unsupported database type');
    });
  });

  describe('disconnect', () => {
    it('should handle disconnect when not connected (MongoDB)', async () => {
      const config: DbConfig = {
        type: 'mongodb',
        url: 'mongodb://localhost:27017/test'
      };
      const db = new Database(config);
      
      // Should not throw when disconnecting without connection
      await expect(db.disconnect()).resolves.toBeUndefined();
    });

    it('should handle disconnect when not connected (MySQL)', async () => {
      const config: DbConfig = {
        type: 'mysql',
        url: 'mysql://localhost:3306/test'
      };
      const db = new Database(config);
      
      await expect(db.disconnect()).resolves.toBeUndefined();
    });

    it('should handle disconnect when not connected (PostgreSQL)', async () => {
      const config: DbConfig = {
        type: 'postgres',
        url: 'postgresql://localhost:5432/test'
      };
      const db = new Database(config);
      
      await expect(db.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('query', () => {
    it('should throw error for MongoDB when using query()', async () => {
      const config: DbConfig = {
        type: 'mongodb',
        url: 'mongodb://localhost:27017/test'
      };
      const db = new Database(config);
      
      await expect(db.query('SELECT * FROM test')).rejects.toThrow(
        'For MongoDB, use getMongoDb() instead of query()'
      );
    });

    it('should throw error for MySQL when not connected', async () => {
      const config: DbConfig = {
        type: 'mysql',
        url: 'mysql://localhost:3306/test'
      };
      const db = new Database(config);
      
      await expect(db.query('SELECT * FROM test')).rejects.toThrow(
        'MySQL not connected'
      );
    });

    it('should throw error for PostgreSQL when not connected', async () => {
      const config: DbConfig = {
        type: 'postgres',
        url: 'postgresql://localhost:5432/test'
      };
      const db = new Database(config);
      
      await expect(db.query('SELECT * FROM test')).rejects.toThrow(
        'PostgreSQL not connected'
      );
    });

    it('should throw error for unsupported database type', async () => {
      const config = {
        type: 'unsupported' as any,
        url: 'invalid://localhost/test'
      };
      const db = new Database(config);
      
      await expect(db.query('SELECT * FROM test')).rejects.toThrow(
        'Unsupported database type'
      );
    });
  });
});

describe('DbConfig Type', () => {
  it('should accept valid MongoDB config', () => {
    const config: DbConfig = {
      type: 'mongodb',
      url: 'mongodb://localhost:27017/test'
    };
    expect(config.type).toBe('mongodb');
    expect(config.url).toBeDefined();
  });

  it('should accept valid MySQL config', () => {
    const config: DbConfig = {
      type: 'mysql',
      url: 'mysql://localhost:3306/test'
    };
    expect(config.type).toBe('mysql');
    expect(config.url).toBeDefined();
  });

  it('should accept valid PostgreSQL config', () => {
    const config: DbConfig = {
      type: 'postgres',
      url: 'postgresql://localhost:5432/test'
    };
    expect(config.type).toBe('postgres');
    expect(config.url).toBeDefined();
  });
});

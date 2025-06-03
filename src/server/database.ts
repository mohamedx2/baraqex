import { MongoClient, Db } from 'mongodb';
import mysql from 'mysql2/promise';
import pg from 'pg';

export interface DbConfig {
  url: string;
  type: 'mongodb' | 'mysql' | 'postgres';
}

export class Database {
  private config: DbConfig;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private mysqlPool: mysql.Pool | null = null;
  private pgPool: pg.Pool | null = null;

  constructor(config: DbConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    switch (this.config.type) {
      case 'mongodb':
        await this.connectMongo();
        break;
      case 'mysql':
        await this.connectMysql();
        break;
      case 'postgres':
        await this.connectPostgres();
        break;
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  private async connectMongo(): Promise<void> {
    try {
      this.mongoClient = new MongoClient(this.config.url);
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  private async connectMysql(): Promise<void> {
    try {
      this.mysqlPool = mysql.createPool(this.config.url);
      // Test connection
      await this.mysqlPool.getConnection();
      console.log('Connected to MySQL');
    } catch (error) {
      console.error('MySQL connection error:', error);
      throw error;
    }
  }

  private async connectPostgres(): Promise<void> {
    try {
      this.pgPool = new pg.Pool({ connectionString: this.config.url });
      // Test connection
      const client = await this.pgPool.connect();
      client.release();
      console.log('Connected to PostgreSQL');
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.mongoClient) {
      await this.mongoClient.close();
      this.mongoClient = null;
      this.mongoDb = null;
    }
    
    if (this.mysqlPool) {
      await this.mysqlPool.end();
      this.mysqlPool = null;
    }
    
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = null;
    }
  }

  // Database-specific methods
  getMongoDb(): Db | null {
    return this.mongoDb;
  }

  getMysqlPool(): mysql.Pool | null {
    return this.mysqlPool;
  }

  getPgPool(): pg.Pool | null {
    return this.pgPool;
  }

  // Generic query method
  async query(sql: string, values?: any[]): Promise<any> {
    switch (this.config.type) {
      case 'mongodb':
        throw new Error('For MongoDB, use getMongoDb() instead of query()');
      case 'mysql':
        if (!this.mysqlPool) throw new Error('MySQL not connected');
        const [rows] = await this.mysqlPool.execute(sql, values || []);
        return rows;
      case 'postgres':
        if (!this.pgPool) throw new Error('PostgreSQL not connected');
        const result = await this.pgPool.query(sql, values || []);
        return result.rows;
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }
}

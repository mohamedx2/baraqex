export interface DbConfig {
  url: string;
  type: 'mongodb' | 'mysql' | 'postgres';
}

export class Database {
  private config: DbConfig;
  private mongoClient: any = null;
  private mongoDb: any = null;
  private mysqlPool: any = null;
  private pgPool: any = null;

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
      const { MongoClient } = await import('mongodb');
      this.mongoClient = new MongoClient(this.config.url);
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
      console.log('Connected to MongoDB');
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('MongoDB driver not installed. Run: npm install mongodb');
      }
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  private async connectMysql(): Promise<void> {
    try {
      const mysql = await import('mysql2/promise');
      this.mysqlPool = mysql.createPool(this.config.url);
      // Test connection
      await this.mysqlPool.getConnection();
      console.log('Connected to MySQL');
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('MySQL driver not installed. Run: npm install mysql2');
      }
      console.error('MySQL connection error:', error);
      throw error;
    }
  }

  private async connectPostgres(): Promise<void> {
    try {
      const pg = await import('pg');
      this.pgPool = new pg.Pool({ connectionString: this.config.url });
      // Test connection
      const client = await this.pgPool.connect();
      client.release();
      console.log('Connected to PostgreSQL');
    } catch (error: any) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('PostgreSQL driver not installed. Run: npm install pg @types/pg');
      }
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
  getMongoDb(): any {
    return this.mongoDb;
  }

  getMysqlPool(): any {
    return this.mysqlPool;
  }

  getPgPool(): any {
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

export interface DatabaseConfig {
  url: string;
  poolSize?: number;
  maxConnections?: number;
  connectionTimeout?: number;
}

export interface QueryOptions {
  include?: Record<string, unknown>;
  select?: Record<string, boolean>;
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  skip?: number;
  take?: number;
}

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
}

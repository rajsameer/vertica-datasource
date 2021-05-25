import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface VerticaQuery extends DataQuery {
  queryType: 'Time Series' | 'Table';
  queryString: string;
  queryTemplated: string;
  streaming: boolean;
  streamingInterval: number;
  timeBucketGapFill: boolean;
  timeFillValue: 'zero' | 'null' | 'previous';
}

export const defaultQuery: Partial<VerticaQuery> = {
  queryString: `SELECT 
    time_slice(end_time, $__interval_ms, 'ms', 'end') as time , 
    node_name,
    avg(average_cpu_usage_percent)
  FROM 
   v_monitor.cpu_usage 
  WHERE 
   end_time > TO_TIMESTAMP($__from/1000) and end_time < TO_TIMESTAMP($__to/1000)
  GROUP BY 1, 2
  ORDER BY 1 asc`,
  streaming: false,
  streamingInterval: 1,
};

/**
 * These are options configured for each DataSource instance
 */
export interface VerticaDataSourceOptions extends DataSourceJsonData {
  host: string;
  database: string;
  user: string;
  sslMode: 'none' | 'server' | 'server-strict';
  usePreparedStatement: boolean;
  useConnectionLoadbalancing: boolean;
  maxOpenConnections: number;
  maxIdealConnections: number;
  maxConnectionIdealTime: number;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface VerticaSecureJsonData {
  password: string;
}

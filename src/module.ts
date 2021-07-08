import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { VerticaDataSourceOptions, VerticaQuery } from './types';

export const plugin = new DataSourcePlugin<DataSource, VerticaQuery, VerticaDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);

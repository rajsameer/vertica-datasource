import defaults from 'lodash/defaults';

import React, { PureComponent, FormEvent } from 'react';
import { TextArea, InlineLabel, InlineFieldRow, InlineSwitch, InlineField, Input } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, VerticaDataSourceOptions, VerticaQuery } from './types';

type Props = QueryEditorProps<DataSource, VerticaQuery, VerticaDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: FormEvent<HTMLTextAreaElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryString: event.currentTarget.value });
    onRunQuery();
  };
  onStreamingSwitchChange = (event: FormEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, streaming: event.currentTarget.checked });
    onRunQuery();
  };
  onStreamingIntervalChange = (event: FormEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, streamingInterval: event.currentTarget.valueAsNumber });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryString, streaming, streamingInterval } = query;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <InlineLabel width="auto"> Query </InlineLabel>
          <TextArea
            name="querytext"
            value={queryString}
            onChange={this.onQueryTextChange}
            css={{}}
            width="auto"
            rows={queryString.split(/\r\n|\r|\n/).length}
            spellCheck={false}
            required
          />
        </div>
        <div className="gf-form">
          <InlineFieldRow>
            <InlineField
              label="Streaming"
              tooltip="When using streaming please use the following kind of filter 'end_time >  TIMESTAMPADD(MINUTE, -1 , CURRENT_TIMESTAMP)' you can also use $__to ,this will make sure you donot fire the query for entire time range"
            >
              <InlineSwitch value={streaming} css={{}} onChange={this.onStreamingSwitchChange} />
            </InlineField>
            {streaming && (
              <InlineField
                label="Interval (seconds)"
                tooltip="Interval in seconds, determines the frequecy in which queires are fired to the backend"
              >
                <Input
                  css={{}}
                  type="number"
                  value={streamingInterval || 60}
                  onChange={this.onStreamingIntervalChange}
                />
              </InlineField>
            )}
          </InlineFieldRow>
        </div>
      </div>
    );
  }
}

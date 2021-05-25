import defaults from 'lodash/defaults';

import React, { PureComponent, FormEvent } from 'react';
import { config } from '@grafana/runtime';
import { InlineLabel, InlineFieldRow, InlineSwitch, InlineField, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, VerticaDataSourceOptions, VerticaQuery } from './types';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import { css, cx } from 'emotion';

require('codemirror/mode/sql/sql');
require('codemirror/theme/moxer.css');
require('codemirror/theme/neat.css');
require('codemirror/lib/codemirror.css');

type Props = QueryEditorProps<DataSource, VerticaQuery, VerticaDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (editor: any, data: any, value: string) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryString: value });
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
  onTimeBucketGapFillSwitchChange = (event: FormEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, timeBucketGapFill: event.currentTarget.checked });
    onRunQuery();
  };
  onTimeFillValueChange = (selectedValue: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    let val: 'zero' | 'null' | 'previous';
    switch (selectedValue.value) {
      case 'zero':
        val = 'zero';
        break;
      case 'null':
        val = 'null';
        break;
      case 'previous':
        val = 'previous';
        break;
      default:
        val = 'null';
    }
    onChange({ ...query, timeFillValue: val });
    onRunQuery();
  };
  onQueryTypeChange = (selectedValue: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    switch (selectedValue.value) {
      case 'Table':
        onChange({ ...query, queryType: 'Table', streaming: false, timeBucketGapFill: false });
        break;
      default:
        onChange({ ...query, queryType: 'Time Series' });
    }
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryString, streaming, streamingInterval, timeBucketGapFill, timeFillValue, queryType } = query;
    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <InlineLabel width="auto"> Query </InlineLabel>
          <CodeMirror
            className={cx(css`
              border: 1px solid #eee;
              height: auto;
              width: 100%;
              background-color: #fff;
            `)}
            value={queryString}
            options={
              config.theme.isDark
                ? {
                    mode: 'sql',
                    theme: 'moxer',
                    lineNumber: false,
                    visualViewport: Infinity,
                  }
                : {
                    mode: 'sql',
                    theme: 'neat',
                    lineNumber: true,
                    visualViewport: Infinity,
                  }
            }
            onChange={this.onQueryTextChange}
            autoCursor={false}
            autoScroll={false}
          />
        </div>
        <div className="gf-form">
          <InlineFieldRow>
            <InlineField label="QueryType" tooltip="Query type">
              <Select
                options={[
                  { label: 'Time Series', value: 'Time Series' },
                  { label: 'Table', value: 'Table' },
                ]}
                value={{ label: queryType || 'Time Series', value: queryType || 'Time Series' }}
                onChange={this.onQueryTypeChange}
              />
            </InlineField>
            {queryType === 'Time Series' && (
              <InlineField
                label="Streaming"
                tooltip="When using streaming please use the following kind of filter 'end_time >  TIMESTAMPADD(MINUTE, -1 , CURRENT_TIMESTAMP)' you can also use $__to ,this will make sure you donot fire the query for entire time range"
              >
                <InlineSwitch value={streaming} css={{}} onChange={this.onStreamingSwitchChange} />
              </InlineField>
            )}
            {queryType === 'Time Series' && streaming && (
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
            {queryType === 'Time Series' && (
              <InlineField
                label="Time gap fill"
                tooltip="Used to fill time gaps in the query result, run on the backend data source"
              >
                <InlineSwitch value={timeBucketGapFill} css={{}} onChange={this.onTimeBucketGapFillSwitchChange} />
              </InlineField>
            )}
            {queryType === 'Time Series' && timeBucketGapFill && (
              <InlineField label="Fill value" tooltip="Value to fill in non existent time">
                <Select
                  options={[
                    { label: 'zero', value: 'zero' },
                    { label: 'null', value: 'null' },
                    { label: 'previous', value: 'previous' },
                  ]}
                  value={{ label: timeFillValue || 'null', value: timeFillValue || 'null' }}
                  onChange={this.onTimeFillValueChange}
                />
              </InlineField>
            )}
          </InlineFieldRow>
        </div>
      </div>
    );
  }
}

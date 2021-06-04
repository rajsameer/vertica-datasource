import defaults from 'lodash/defaults';

import React, { PureComponent, FormEvent } from 'react';
import { config } from '@grafana/runtime';
import { InlineLabel, InlineFieldRow, InlineSwitch, InlineField, Input, Select, Button } from '@grafana/ui';
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
    const { onChange, query } = this.props;
    onChange({ ...query, queryString: value });
  };
  onStreamingSwitchChange = (event: FormEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, streaming: event.currentTarget.checked });
  };
  onStreamingIntervalChange = (event: FormEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, streamingInterval: event.currentTarget.valueAsNumber });
  };
  onTimeFillEnabledSwitchChange = (event: FormEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, timeFillEnabled: event.currentTarget.checked });
  };
  onRunButtonClick = () => {
    const { onRunQuery } = this.props;
    onRunQuery();
  };
  onTimeFillModeValueChange = (selectedValue: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    let val: 'static' | 'null';
    switch (selectedValue.value) {
      case 'static':
        val = 'static';
        break;
      case 'null':
        val = 'null';
        break;
      default:
        val = 'null';
    }
    onChange({ ...query, timeFillMode: val });
  };
  onQueryTypeChange = (selectedValue: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    switch (selectedValue.value) {
      case 'Table':
        onChange({ ...query, queryType: 'Table', streaming: false, timeFillEnabled: false });
        break;
      default:
        onChange({ ...query, queryType: 'Time Series' });
    }
  };
  onTimeFillStaticValue = (event: FormEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, timeFillStaticValue: event.currentTarget.valueAsNumber });
  };
  render() {
    const query = defaults(this.props.query, defaultQuery);
    const {
      queryString,
      streaming,
      streamingInterval,
      timeFillEnabled,
      timeFillMode,
      timeFillStaticValue,
      queryType,
    } = query;
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
                <InlineSwitch value={timeFillEnabled} css={{}} onChange={this.onTimeFillEnabledSwitchChange} />
              </InlineField>
            )}
            {queryType === 'Time Series' && timeFillEnabled && (
              <InlineField label="Fill value" tooltip="Value to fill in non existent time">
                <Select
                  options={[
                    { label: 'static', value: 'static' },
                    { label: 'null', value: 'null' },
                  ]}
                  value={{ label: timeFillMode || 'null', value: timeFillMode || 'null' }}
                  onChange={this.onTimeFillModeValueChange}
                />
              </InlineField>
            )}
            {queryType === 'Time Series' && timeFillEnabled && timeFillMode === 'static' && (
              <InlineField label="Fill value" tooltip="value that replcase the null time gaps">
                <Input css={{}} type="number" value={timeFillStaticValue || 0} onChange={this.onTimeFillStaticValue} />
              </InlineField>
            )}
          </InlineFieldRow>
        </div>
        <div className="gf-form">
          <InlineFieldRow>
            <Button variant="primary" size="md" onClick={this.onRunButtonClick}>
              Run
            </Button>
          </InlineFieldRow>
        </div>
      </div>
    );
  }
}

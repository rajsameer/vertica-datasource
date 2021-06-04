package main

import (
	"sort"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func TimeGapFill(frame *data.Frame, qm queryModel) (*data.Frame, error) {
	filledFrame := frame.EmptyCopy()
	timeFieldIdx := 0
	for i, f := range frame.Fields {
		if f.Type() == data.FieldTypeTime || f.Type() == data.FieldTypeNullableTime {
			timeFieldIdx = i
			break
		}
	}
	timeSeriesMap := make(map[int64][]interface{})
	from := qm.From.UTC().Round(time.Duration(qm.IntervalMs * int(time.Millisecond)))
	to := qm.To.UTC().Round(time.Duration(qm.IntervalMs * int(time.Millisecond)))
	for timeNow := from; timeNow.Before(to); timeNow = timeNow.Add(time.Duration(qm.IntervalMs * int(time.Millisecond))) {
		if qm.TimeFillMode == "static" {
			timeSeriesMap[timeNow.Unix()] = GenerateRow(timeNow, frame, qm.TimeFillValue)
		} else {
			timeSeriesMap[timeNow.Unix()] = GenerateRow(timeNow, frame, nil)
		}

	}

	for rowIdx := 0; rowIdx < frame.Rows(); rowIdx++ {
		if rt, ok := frame.ConcreteAt(timeFieldIdx, rowIdx); ok {
			if rtime, ok := rt.(time.Time); ok {
				timeSeriesMap[rtime.Unix()] = frame.RowCopy(rowIdx)
			}
		}
	}
	timeKeys := make([]int, 0)
	for key, _ := range timeSeriesMap {
		timeKeys = append(timeKeys, int(key))
	}

	sort.Ints(timeKeys)
	for _, ts := range timeKeys {
		row := timeSeriesMap[int64(ts)]
		filledFrame.AppendRow(row...)

	}

	return filledFrame, nil
}

func GenerateRow(timeField time.Time, frame *data.Frame, fillValue interface{}) []interface{} {
	row := make([]interface{}, 0)
	fields := frame.Fields
	for _, v := range fields {
		switch v.Type() {
		case data.FieldTypeNullableTime:
			row = append(row, timeField)
			break
		case data.FieldTypeTime:
			row = append(row, timeField)
			break
		case data.FieldTypeFloat32:
			if val, ok := fillValue.(float64); ok {
				row = append(row, float32(val))
			}
			break
		case data.FieldTypeNullableFloat32:
			if val, ok := fillValue.(float64); ok {
				converted := float32(val)
				row = append(row, &converted)
			}
			break
		case data.FieldTypeFloat64:
			if val, ok := fillValue.(float64); ok {
				row = append(row, val)
			}
			break
		case data.FieldTypeNullableFloat64:
			if val, ok := fillValue.(float64); ok {
				row = append(row, &val)
			}
			break
		case data.FieldTypeInt16:
			if val, ok := fillValue.(float64); ok {
				row = append(row, int16(val))
			}
			break
		case data.FieldTypeNullableInt16:
			if val, ok := fillValue.(float64); ok {
				converted := int16(val)
				row = append(row, &converted)
			}
			break
		case data.FieldTypeInt32:
			if val, ok := fillValue.(float64); ok {
				row = append(row, int32(val))
			}
			break
		case data.FieldTypeNullableInt32:
			if val, ok := fillValue.(float64); ok {
				converted := int32(val)
				row = append(row, &converted)
			}
			break
		case data.FieldTypeNullableInt64:
			if val, ok := fillValue.(float64); ok {
				converted := int64(val)
				row = append(row, &converted)
			}
			break
		case data.FieldTypeInt64:
			if val, ok := fillValue.(float64); ok {
				row = append(row, int64(val))
			}
			break
		case data.FieldTypeInt8:
			if val, ok := fillValue.(float64); ok {
				row = append(row, int8(val))
			}
			break
		case data.FieldTypeNullableInt8:
			if val, ok := fillValue.(float64); ok {
				converted := int8(val)
				row = append(row, &converted)
			}
			break
		default:
			row = append(row, nil)
		}
	}

	return row
}

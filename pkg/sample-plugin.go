package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	_ "github.com/vertica/vertica-sql-go"
)

// newDatasource returns datasource.ServeOpts.
func newDatasource() datasource.ServeOpts {
	// creates a instance manager for your plugin. The function passed
	// into `NewInstanceManger` is called when the instance is created
	// for the first time or when a datasource configuration changed.
	im := datasource.NewInstanceManager(newDataSourceInstance)
	ds := &VerticaDatasource{
		im: im,
	}

	return datasource.ServeOpts{
		QueryDataHandler:   ds,
		CheckHealthHandler: ds,
	}
}

// VerticaDatasource is an example datasource used to scaffold
// new datasource plugins with an backend.
type VerticaDatasource struct {
	// The instance manager can help with lifecycle management
	// of datasource instances in plugins. It's not a requirements
	// but a best practice that we recommend that you follow.
	im instancemgmt.InstanceManager
}

//GetVerticaDb will return the vertica db connection
//stored in the instance setting when the instance is created or update
func (td *VerticaDatasource) GetVerticaDb(pluginContext backend.PluginContext) (*sql.DB, error) {
	instance, err := td.im.Get(pluginContext)
	if err != nil {
		return nil, err
	}
	if instanceSetting, ok := instance.(*instanceSettings); ok {
		return instanceSetting.Db, nil
	} else {
		return nil, err
	}

}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifer).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (td *VerticaDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	log.DefaultLogger.Info("QueryData", "request", req)

	// create response struct
	response := backend.NewQueryDataResponse()

	db, err := td.GetVerticaDb(req.PluginContext)
	if err != nil {
		return nil, err
	}

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := td.query(ctx, q, db)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type queryModel struct {
	QueryString    string `json:"queryString"`
	QueryTemplated string `json:"queryTemplated,omitempty"`
}

func (td *VerticaDatasource) query(ctx context.Context, query backend.DataQuery, db *sql.DB) backend.DataResponse {
	// Unmarshal the json into our queryModel
	var qm queryModel

	response := backend.DataResponse{}
	// https://golang.org/pkg/database/sql/#DBStats
	log.DefaultLogger.Info(fmt.Sprintf("stats before query: %v", db.Stats()))
	response.Error = json.Unmarshal(query.JSON, &qm)
	if response.Error != nil {
		return response
	}

	connection, err := db.Conn(ctx)
	if err != nil {
		response.Error = err
		return response
	}

	defer connection.Close()
	//run query
	rows, err := connection.QueryContext(ctx, qm.QueryTemplated)
	if err != nil {
		response.Error = err
		return response
	}
	defer rows.Close()

	//get the column names, columns will be use to added a header names to the data frame
	columns, err := rows.Columns()
	if err != nil {
		response.Error = err
		return response
	}

	//get the column types, column type will be used to convert column from sql type to data frame type. (implemeted in tpyes.go generateFrameType)
	columnTypes, err := rows.ColumnTypes()
	if err != nil {
		response.Error = err
		return response
	}

	//most of the SQL data source will return mostly a Long frame.
	//so by default a long frame will be created.
	//We can generate the column types, using the info from coluymnTypes.
	longFrame := data.NewFrameOfFieldTypes("Long", 0, generateFrameType(columnTypes)...)
	//setting the header names to the frame , the names are same as return by the driver.
	longFrame.SetFieldNames(columns...)

	//scaning fro rows.
	for rows.Next() {
		//generateRowIn returns an []interface{}, but based on the columns type variable to the retrived type is added.
		rowIn := generateRowIn(columnTypes)
		err = rows.Scan(rowIn...)
		if err != nil {
			response.Error = err
			return response
		}

		//append the scanned rows to the frame.
		longFrame.AppendRow(rowIn...)

	}
	// https://golang.org/pkg/database/sql/#DBStats
	log.DefaultLogger.Info(fmt.Sprintf("stats after query: %v", db.Stats()))
	//here instead of asking the user to pass the query type,
	//based on the frame we can just judge the type of the frame.
	//this use full when the user writes a variable query
	if longFrame.TimeSeriesSchema().Type == data.TimeSeriesTypeNot {
		response.Frames = append(response.Frames, longFrame)
	} else if longFrame.TimeSeriesSchema().Type == data.TimeSeriesTypeWide {
		response.Frames = append(response.Frames, longFrame)
	} else if longFrame.Rows() == 0 {
		response.Frames = append(response.Frames, data.NewFrame("empty"))

	} else {
		wideFrame, err := data.LongToWide(longFrame, nil)
		if err != nil {
			response.Error = err
			return response
		}
		response.Frames = append(response.Frames, wideFrame)
	}

	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (td *VerticaDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	var status = backend.HealthStatusOk

	db, err := td.GetVerticaDb(req.PluginContext)
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}
	// https://golang.org/pkg/database/sql/#DBStats
	log.DefaultLogger.Info(fmt.Sprintf("stats before query: %v", db.Stats()))
	connection, err := db.Conn(ctx)
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}
	defer connection.Close()
	result, err := connection.QueryContext(ctx, "SELECT version()")
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}
	defer result.Close()
	var queryResult string

	if result.Next() {
		err = result.Scan(&queryResult)
		if err != nil {
			return &backend.CheckHealthResult{
				Status:  backend.HealthStatusError,
				Message: fmt.Sprintf("%s", err),
			}, nil
		}
	}
	// https://golang.org/pkg/database/sql/#DBStats
	log.DefaultLogger.Info(fmt.Sprintf("stats after query: %v", db.Stats()))
	return &backend.CheckHealthResult{
		Status:  status,
		Message: fmt.Sprintf("Successfully connected to %s", queryResult),
	}, nil
}

type instanceSettings struct {
	httpClient *http.Client
	Db         *sql.DB
	Name       string
}

// newDataSourceInstance is called always when a datasource is created or updated in the ui
// in either create or update, open a pool of sql connections and update them
func newDataSourceInstance(setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var config datasourceConfig
	secret := setting.DecryptedSecureJSONData["password"]
	err := json.Unmarshal(setting.JSONData, &config)
	if err != nil {
		log.DefaultLogger.Error(err.Error())
	}
	connStr := config.ConnectionURL(secret)
	db, err := sql.Open("vertica", connStr)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(config.MaxOpenConnections)
	db.SetMaxIdleConns(config.MaxIdealConnections)
	db.SetConnMaxIdleTime(time.Minute * time.Duration(config.MaxConnectionIdealTime))
	log.DefaultLogger.Info(fmt.Sprintf("new instance of datasource %s created", setting.Name))
	return &instanceSettings{
		httpClient: &http.Client{},
		Db:         db,
		Name:       setting.Name,
	}, nil
}

func (s *instanceSettings) Dispose() {
	s.Db.Close()
	log.DefaultLogger.Info(fmt.Sprintf("db connections of datasource %s closed", s.Name))
}

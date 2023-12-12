package main

import (
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func main() {
	log.DefaultLogger.Info("Starting RajSameer Vertica datasource plugin")

	err := datasource.Serve(newDatasource())

	// Log any error if we could not start the plugin.
	if err != nil {
		log.DefaultLogger.Error("Error serving Vertica plugin: " + err.Error())
	}
}

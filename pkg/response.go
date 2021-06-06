package main

import (
	"sync"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// implementation copied from https://github.com/grafana/sqlds/pull/14
// response might consider using sqlds library eventually
type Response struct {
	res *backend.QueryDataResponse
	mtx *sync.Mutex
}

func (r *Response) Set(refID string, res backend.DataResponse) {
	r.mtx.Lock()
	r.res.Responses[refID] = res
	r.mtx.Unlock()
}

func (r *Response) Response() *backend.QueryDataResponse {
	return r.res
}

func NewResponse(res *backend.QueryDataResponse) *Response {
	return &Response{
		res: res,
		mtx: &sync.Mutex{},
	}
}

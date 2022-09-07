import {RegionClientOptions, Http} from '../shared/index.js';

// https://cloud.baidu.com/doc/BLS/s/Ck8qtng1c

const stringifyDate = (date: Date) => date.toISOString().replace(/\.\d+Z$/, 'Z');

export interface LogRecordQuery {
    logStoreName: string;
    query: string;
    startDateTime: Date;
    endDateTime: Date;
}

export interface LogRecordResultSet {
    columns: string[];
    rows: any[][];
    isTruncated: boolean;
    truncatedReason: string;
}

export interface QueryLogRecordResponse {
    resultSet?: LogRecordResultSet;
}

export type BlsOptions = RegionClientOptions;

export class BlsClient {
    private readonly http: Http;

    constructor(options: BlsOptions) {
        this.http = Http.fromRegionSupportedServiceId('bls-log', options);
    }

    async queryLogRecord({logStoreName, query, startDateTime, endDateTime}: LogRecordQuery) {
        const response = await this.http.json<QueryLogRecordResponse>(
            'GET',
            `/v1/logstore/${logStoreName}/logrecord`,
            {
                params: {
                    query,
                    startDateTime: stringifyDate(startDateTime),
                    endDateTime: stringifyDate(endDateTime),
                },
            }
        );
        return response;
    }
}
import {BceCredential} from './authorization.js';
import {Http} from './http.js';

interface ListObjectOptions {
    delimiter?: string;
    marker?: string;
    maxKeys?: number;
    prefix?: string;
}

interface ObjectOwner {
    id: string;
    displayName: string;
}

interface ObjectContent {
    key: string;
    lastModified: string;
    eTag: string;
    size: number;
    storageClass: 'STANDARD' | 'COLD';
    owner: ObjectOwner;
}

interface CommonPrefix {
    prefix: string;
}

interface ListObjectResponse {
    name: string;
    prefix: string;
    delimiter: string;
    commonPrefixes?: CommonPrefix[];
    isTruncated: boolean;
    maxKeys: number;
    marker: string;
    nextMarker: string;
    contents: ObjectContent[];
}

interface BosOptions {
    region: string;
    credentials: BceCredential;
}

export default class BosClient {
    private readonly hostBase: string;
    private readonly http: Http;

    constructor({region, credentials}: BosOptions) {
        this.hostBase = `${region}.bcebos.com`;
        this.http = Http.fromEndpoint(this.hostBase, credentials);
    }

    async listObjects(bucketName: string, options: ListObjectOptions) {
        const params = new URLSearchParams();
        options.delimiter && params.set('delimiter', options.delimiter);
        options.marker && params.set('marker', options.marker);
        options.maxKeys && params.set('maxKeys', options.maxKeys.toString());
        options.prefix && params.set('prefix', options.prefix);

        const response = await this.http.json<ListObjectResponse>(
            'GET',
            '/',
            {
                params,
                headers: {
                    'content-type': 'application/json',
                    host: `${bucketName}.${this.hostBase}`,
                },
            }
        );
        return response.body;
    }
}
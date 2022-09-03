import fs, {ReadStream} from 'node:fs';
import {BceCredential} from './authorization';
import {Http} from './http';

export interface ListObjectOptions {
    delimiter?: string;
    marker?: string;
    maxKeys?: number;
    prefix?: string;
}

export interface ObjectOwner {
    id: string;
    displayName: string;
}

export interface ObjectContent {
    key: string;
    lastModified: string;
    eTag: string;
    size: number;
    storageClass: 'STANDARD' | 'COLD';
    owner: ObjectOwner;
}

export interface CommonPrefix {
    prefix: string;
}

export interface ListObjectResponse {
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

export interface PutObjectOptions {
    headers?: Record<string, string>;
}

export type ObjectBody = string | Blob | ArrayBuffer | ReadStream;

export interface BosOptions {
    region: string;
    credentials: BceCredential;
}

export class BosClient {
    private readonly hostBase: string;
    private readonly http: Http;

    constructor({region, credentials}: BosOptions) {
        this.hostBase = `${region}.bcebos.com`;
        this.http = Http.fromEndpoint(this.hostBase, credentials);
    }

    async listObjects(bucketName: string, options?: ListObjectOptions) {
        const params = new URLSearchParams();
        options?.delimiter && params.set('delimiter', options.delimiter);
        options?.marker && params.set('marker', options.marker);
        options?.maxKeys && params.set('maxKeys', options.maxKeys.toString());
        options?.prefix && params.set('prefix', options.prefix);

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
        return response;
    }

    async getObject(bucketName: string, key: string) {
        const response = await this.http.text(
            'GET',
            `/${key}`,
            {headers: {host: `${bucketName}.${this.hostBase}`}}
        );
        return response;
    }

    async getObjectAsBlob(bucketName: string, key: string) {
        const response = await this.http.blob(
            'GET',
            `/${key}`,
            {headers: {host: `${bucketName}.${this.hostBase}`}}
        );
        return response;
    }

    async getObjectAsStream(bucketName: string, key: string) {
        const response = await this.http.stream(
            'GET',
            `/${key}`,
            {headers: {host: `${bucketName}.${this.hostBase}`}}
        );
        return response;
    }

    async putObject(bucketName: string, key: string, body: ObjectBody, options?: PutObjectOptions) {
        const response = await this.http.noContent(
            'PUT',
            `/${key}`,
            {
                body,
                headers: {
                    ...options?.headers,
                    host: `${bucketName}.${this.hostBase}`,
                },
            }
        );
        return response;
    }

    async putObjectFromFile(bucketName: string, key: string, file: string, options?: PutObjectOptions) {
        const stream = fs.createReadStream(file);
        const response = await this.putObject(bucketName, key, stream, options);
        return response;
    }

    async deleteObject(bucketName: string, key: string) {
        const response = await this.http.noContent(
            'DELETE',
            `/${key}`,
            {headers: {host: `${bucketName}.${this.hostBase}`}}
        );
        return response;
    }
}

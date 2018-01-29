import * as fs from 'fs';
import { S3 } from 'aws-sdk';
import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';

const s3 = new S3();

export abstract class Export {
    abstract fileExt: string;
    features: Array<Feature>;
    year: number;
    years: Array<number>;
    lang: string;
    key: string;
    showUsAverage: boolean;
    usAverage: Object;
    dataProp: string;
    bubbleProp: string;
    templateKey: string | undefined;
    assetBucket: string = process.env['asset_bucket'];
    exportBucket: string = process.env['export_bucket'];

    constructor(requestData: RequestData) {
        this.features = requestData.features;
        this.year = requestData.year;
        this.years = requestData.years;
        this.lang = requestData.lang;
        this.showUsAverage = requestData.showUsAverage;
        this.usAverage = requestData.usAverage;
        this.dataProp = requestData.dataProp.split('-')[0];
        // If 'none' is supplied as eviction prop, default to eviction rate
        this.bubbleProp = requestData.bubbleProp.startsWith('none') ? 'er' :
            requestData.bubbleProp.split('-')[0];
        this.key = this.createKey(requestData);
    };

    /**
     * Generates an S3 key based off of RequestData object
     * @param requestData Array of at least 1 Feature
     */
    createKey(requestData: RequestData): string {
        const idPath = requestData.features.map(f => f.properties.GEOID).join('/');
        return `${this.lang}/${this.year}/${this.years[0]}-${this.years[1]}/` +
            `${this.dataProp}/${this.bubbleProp}/${this.showUsAverage ? 'us/' : ''}${idPath}/eviction_lab_export.${this.fileExt}`;
    }

    /**
     * Returns true if key exists, otherwise false
     */
    async keyExists(): Promise<boolean> {
        try {
            const awsObj = await s3.headObject({
                Bucket: this.exportBucket,
                Key: this.key
            }).promise();
            return true;
        } catch(err) {
            return false;
        }
    }

    /**
     * Abstract method for creating a file that each subclass must
     * implement. Returns a buffer
     */
    abstract async createFile(): Promise<Buffer>;

    /**
     * Uploads file from buffer
     * @param fileBuffer
     */
    async uploadFile(fileBuffer: Buffer): Promise<void> {
        await s3.putObject({
            Bucket: this.exportBucket,
            Key: this.key,
            Body: fileBuffer,
            ACL: 'public-read',
            ContentDisposition: 'attachment'
        }).promise();
    }
}
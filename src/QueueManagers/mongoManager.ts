import { MongoHelper } from "../mongo.helper";
import * as mongodb from 'mongodb';
import { collections } from "../database.service";
import { NickelJob, State } from "../nickelJob";
import { QueueManager } from "./queueManager";
import { NickelResult } from "../nickelResult";
import { ObjectId } from "mongodb";
import config from "../config";
import { NickJobMetadata } from "../models/nickJobMetada";
import { NickelJobModel } from "../models/nickelJobModel";

export class MongoManager implements QueueManager {

    queueIdentifier: string = 'Mongo DB';
    dbName: string;
    collectionName: string;
    url: string;
    connectionSucceeded: boolean;
    cachedAssignedWorker: number;
    jobCollectionChangeStream?: mongodb.ChangeStream;


    public static client: mongodb.MongoClient | undefined;

    constructor(url: string, dbName: string, collectionName: string) {
        this.url = url;
        this.dbName = dbName;
        this.collectionName = collectionName;
        this.connectionSucceeded = false;
        this.cachedAssignedWorker = 0;        
    }

    connect(user?: string, pass?: string): Promise<boolean> {

        return new Promise(async (resolve, reject) => {

            try {
                MongoManager.client = await MongoHelper.connect(this.url);
                this.connectionSucceeded = true;
                resolve(true);
            } catch (error) {
                console.log('Error: ', error);
                reject(false);
            }
        });
    }

    setupProcessJobsListener(jobType: string, fromClient: boolean, callback: (nickelJob: NickelJob, data: string) => any): Promise<void> {

        return new Promise(async (resolve, reject) => {

            if (MongoManager.client) {
                const db: mongodb.Db = MongoManager.client.db(this.dbName);
                const jobsCollection: mongodb.Collection = db.collection(this.collectionName);

                let metadata = await this.upsertMetadata(jobType, fromClient);
                console.log('setupProcessJobsListener - metadata', metadata);
                this.cachedAssignedWorker = metadata.queueDataResult.registeredWorkers;

                const generalPipeline = [{
                    '$match': {
                        'operationType': 'insert',
                        'fullDocument.jobType': jobType,
                        'fullDocument.state': State.Queued,
                        'fullDocument.assignedWorker': this.cachedAssignedWorker
                    }
                }];

                this.jobCollectionChangeStream = jobsCollection.watch(generalPipeline);
                console.log(`Start to listening for jobs of type : ${jobType}`);
                this.jobCollectionChangeStream.on("change", async next => {

                    console.log(`Received Job of type ${jobType} with the following information: /t`, next);

                    let currentNickelJobModel = NickelJobModel.clone(next.fullDocument);
                    currentNickelJobModel.state = State.Active;
                    currentNickelJobModel.updatedAt = Date.now();
                    console.log('Updating Received Job : ', currentNickelJobModel);

                    const result = await this.update(currentNickelJobModel);

                    let currentNickelJob = new NickelJob();
                    currentNickelJob.nickelJobModel = currentNickelJobModel;
                    currentNickelJob.connectionSucceeded = this.connectionSucceeded;
                    currentNickelJob.queueManager = this;    
                    console.log('After change to active state : ', result);
                    callback(currentNickelJob, currentNickelJobModel.data);
                });

                resolve();
            }
        });
    }

    setupOnWorkerChangeListener(jobType: string, callback: () => any) {

        if (MongoManager.client) {

            const metadataPipeline = [{
                '$match': {
                    'operationType': 'update',
                    'fullDocument.jobType': jobType
                }
            }];

            const changeStream = collections.metadata?.watch(metadataPipeline, { fullDocument: 'updateLookup' });
            console.log(`Start to listening JobMetadata Collection of type : ${jobType}`);

            changeStream?.on("change", async (next: any) => {

                console.log(`Received JobMetadata of type ${jobType} with the following information: /t`, next);
                console.log('Cached Assigned Worker', this.cachedAssignedWorker);

                if (next.fullDocument.registeredWorkers < this.cachedAssignedWorker) {
                    // change workerIdentifier
                    console.log('setupOnWorkerChangeListener - Executing callback');
                    callback();
                }
            });
        }

    }

    setupOnDoneListener(jobType: string, callback: (nickelJob: NickelJobModel) => any): void {

        if (MongoManager.client) {
            const db: mongodb.Db = MongoManager.client.db(this.dbName);
            const jobsCollection: mongodb.Collection = db.collection(this.collectionName);

            const pipeline = [{
                '$match': {
                    'operationType': 'update',
                    'fullDocument.jobType': jobType,
                    'fullDocument.state': State.Done
                }
            }];

            const changeStream = jobsCollection.watch(pipeline, { fullDocument: 'updateLookup' });

            console.log('Start to listening if there are some changes into the collection: ', this.collectionName);
            changeStream.on("change", next => {
                console.log("Received change from collection: /t", next);

                let currentNickelJob = NickelJobModel.clone(next.fullDocument);
                // currentNickelJob.collectionName = this.collectionName;
                // currentNickelJob.dbName = this.dbName;
                callback(currentNickelJob);
            });
        }
    }

    insert(nickelJob: NickelJobModel): Promise<NickelResult> {
        return new Promise(async (resolve, reject) => {

            try {
                const result = await collections.jobs?.insertOne(nickelJob);
                resolve({ queueDataResult: result });
            } catch (error) {
                console.log('Error: ', error);
                reject(null);
            }
        });
    }

    upsertMetadata(jobType: string, fromClient: boolean = true): Promise<NickelResult> {

        return new Promise(async (resolve, reject) => {

            try {
                //console.log('Searching metadata with:', jobType);
                const metadataResult = await collections.metadata?.findOne({ 'jobType': jobType });
                //console.log('From MongoDB metadataResult', metadataResult);
                if (metadataResult) {
                    if (!fromClient) {
                        let updateResult = await collections.metadata?.updateOne(
                            { _id: metadataResult._id },
                            { $set: { 'registeredWorkers': metadataResult.registeredWorkers + 1 } }
                        );
                        //console.log('From MongoDB updateResult', updateResult);
                        resolve({ queueDataResult: { _id: metadataResult._id, 'jobType': jobType, 'registeredWorkers': metadataResult.registeredWorkers + 1 } });
                    }

                    resolve({ queueDataResult: metadataResult });
                } else {
                    let workersToInsert = 0;
                    if (!fromClient) {
                        workersToInsert = 1;
                    }
                    let insertResult = await collections.metadata?.insertOne({ 'jobType': jobType, 'registeredWorkers': workersToInsert });
                    //console.log('From MongoDB insertResult', insertResult);
                    resolve({ queueDataResult: { _id: insertResult?.insertedId, 'jobType': jobType, 'registeredWorkers': workersToInsert } });
                }
            } catch (error) {
                console.log('Error: ', error);
                reject(null);
            }
        });
    }

    update(nickelJob: NickelJobModel): Promise<NickelResult> {

        return new Promise(async (resolve, reject) => {

            try {
                const query = { _id: new ObjectId(nickelJob.id) };
                const result = await collections.jobs?.updateOne(query, { $set: nickelJob });
                resolve({ queueDataResult: result });
            } catch (error) {
                console.log('Error: ', error);
                reject(null);
            }
        });
    }

    setup(): void {
        try {
            if (MongoManager.client) {
                const db: mongodb.Db = MongoManager.client.db(this.dbName);
                const jobsCollection: mongodb.Collection = db.collection(this.collectionName);
                const jobsMetadaCollection: mongodb.Collection = db.collection(config.metadataCollectionName);
                collections.jobs = jobsCollection;
                collections.metadata = jobsMetadaCollection;
            }
        } catch (error) {
            console.log('Error: ', error);

        }
    }

    cleanRegisteredWorkers(jobType: string): Promise<void> {

        return new Promise(async (resolve, reject) => {

            console.log('Cleaning Registered Worker');

            if (MongoManager.client) {
                const db: mongodb.Db = MongoManager.client.db(this.dbName);
                const metadataCollection: mongodb.Collection = db.collection(config.metadataCollectionName);
                let result: any = await metadataCollection.findOneAndUpdate(
                    { 'jobType': jobType },
                    { $inc: { 'registeredWorkers': -1 } },
                    { returnDocument: mongodb.ReturnDocument.AFTER });

                if (!result) {
                    reject();
                }

                console.log('After update Job Metada on cleanRegisteredWorkers', result);

                resolve();
            }
        });
    }

    cleanStream () : Promise<void> {

        return new Promise(async (resolve, reject) => {

            try {
                if (MongoManager.client) {
                    await this.jobCollectionChangeStream?.close();
                }    
                resolve();
            } catch (error) {
                console.log('Error: ', error);
                reject(null);
            }
            
        });
    }

}
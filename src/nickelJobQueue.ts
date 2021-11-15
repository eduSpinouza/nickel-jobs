import * as mongodb from "mongodb";
import { MongoHelper } from "./mongo.helper";
import { NickelJob, State } from "./nickelJob";
import { MongoManager } from "./QueueManagers/mongoManager";
import { QueueManager } from "./QueueManagers/queueManager";


export class NickelJobQueue {

    collectionName: string;
    url: string;
    dbName: string;
    queueManager: QueueManager;
    connectionSucceeded: boolean;
    
    constructor(url: string, dbName: string = 'meteor', collectionName: string = 'nickelJobQueue') {
        this.collectionName = collectionName;
        this.url = url;
        this.dbName = dbName;
        this.queueManager = new MongoManager(url, dbName, collectionName);
        this.connectionSucceeded = false;
        this.lastAssignedWorker = 0;
    }

    public async startServer() {

        this.connectionSucceeded = await this.queueManager.connect(this.url);
        if (this.connectionSucceeded) {
            this.queueManager.setup();
        }
    }

    public async saveJob(nickelJob: NickelJob) {
        
        nickelJob.createAt = Date.now();
        nickelJob.state = State.Queued;
        nickelJob.dbName = this.dbName;
        nickelJob.collectionName = this.collectionName;
        nickelJob.options = nickelJob.options ? nickelJob.options : { MaxWorkerCount: 1 };        
        
        const result = await this.queueManager.insert(nickelJob);
        console.log(`Result after insert NickelJob into Queue: ${this.queueManager.queueIdentifier}`, result);
        if (!result) {
            console.log('Error ocurred queueing NickelJob');
            throw new Error('Error ocurred queueing NickelJob');
        }
    }    

    public onDone(jobType: string, callback: (nickelJob: NickelJob) => any) {
        console.log('Subscribe when Jobs are DONE');

        if (this.connectionSucceeded) {
            this.queueManager.setupOnDoneListener(jobType, callback);
        }
    }    
}
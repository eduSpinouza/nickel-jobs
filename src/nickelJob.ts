import { QueueManager } from "./QueueManagers/queueManager";
import { MongoManager } from "./QueueManagers/mongoManager";
import { NickelJobOptions } from "./models/nickelJobOptions";

export enum State {
    Queued,
    Active,
    Done,
    Failed
}

export class NickelJob {

    id?: string;
    jobType: string;
    createAt?: number;
    updatedAt?: number;
    data?: string | any;
    state?: State;
    options?: NickelJobOptions;
    assignedWorker: number;


    dbName: string;
    collectionName: string;
    queueManager: QueueManager | undefined;
    connectionSucceeded: boolean;


    constructor(jobType: string = 'nickelJob', data: string | any = '') {
        this.jobType = jobType;
        this.data = data;
        this.dbName = '';
        this.collectionName = '';
        this.connectionSucceeded = false;
        this.assignedWorker = 0;
    }

    public async setConnection(url: string, dbName: string = 'meteor', collectionName: string = 'nickelJobQueue') {
        this.queueManager = new MongoManager(url, dbName, collectionName);
        this.dbName = dbName;
        this.collectionName = collectionName;
        console.log(`Trying to connecto to ${this.queueManager.queueIdentifier} with: `, url);
        this.connectionSucceeded = await this.queueManager.connect(url);
        //await MongoHelper.connect(url);
        if (this.connectionSucceeded) {
            this.queueManager.setup();
            console.log('Connection succeded');
        }
    }

    public processJobs(jobType: string, callback: (nickelJob: NickelJob, data: string) => any) {
        console.log('Starting processJobs method');
        this.queueManager?.setupProcessJobsListener(jobType, callback);
    }

    public async done() {

        console.log('NickelJob - done()', this.connectionSucceeded);
        console.log('NickelJob - done()', this.queueManager);

        if (this.connectionSucceeded) {
            const updatedNickelJob = this;
            console.log('NickelJob - done() - updatedNickelJob', updatedNickelJob);
            await this.updateJobStatus(updatedNickelJob, State.Done);
        }
    }

    private async updateJobStatus(nickelJob: NickelJob, changeToState: State) {

        if (this.queueManager?.connectionSucceeded) {

            nickelJob.state = changeToState;
            nickelJob.updatedAt = Date.now();
            console.log(`Updating NickelJob to State: [${changeToState}]`);

            const result = await this.queueManager?.update(nickelJob);

            console.log("updateJobStatus - Result : ", result);

            if (!result) {
                console.log(`Error ocurred updating NickelJob to State: [${changeToState}]`);
                throw new Error(`Error ocurred updating NickelJob to State: [${changeToState}]`);
            }
        }
    }

    private assignWorker(nickelJob: NickelJob) : number {

        if (!nickelJob.options) {
            return 1;
        }

        var maxWorkerCount = nickelJob.options.MaxWorkerCount;
        
        if (maxWorkerCount === 1) {
            return 1;
        }else {
            if (this.lastAssignedWorker <= maxWorkerCount)  {
                this.lastAssignedWorker++;
                return this.lastAssignedWorker;
            } else {
                this.lastAssignedWorker = 1;
                return this.
            }
        }
    }

    public static clone(fullDocument: any): NickelJob {
        let clone = new NickelJob();
        clone.createAt = fullDocument?.createAt;
        clone.updatedAt = fullDocument?.updatedAt;
        clone.jobType = fullDocument?.jobType;
        clone.data = fullDocument?.data;
        clone.state = fullDocument?.state;
        clone.dbName = fullDocument?.dbName;
        clone.collectionName = fullDocument?.collectionName;
        clone.id = fullDocument?.id;
        return clone;
    }

    // public onDone(jobType: string, callback: (nickelJob: NickelJob) => any) {
    //     console.log('Subscribe when Jobs are done', MongoHelper.client);
    //     if (MongoHelper.client) {            
    //         const db: mongodb.Db = MongoHelper.client.db(this.dbName);
    //         const jobsCollection: mongodb.Collection = db.collection(this.collectionName);
    //         const pipeline = [ {
    //             '$match': {
    //                 'operationType': 'update',
    //                 'fullDocument.jobType' : jobType,
    //                 'fullDocument.state' : 2               
    //             }
    //         }];
    //         const changeStream = jobsCollection.watch(pipeline);
    //         console.log('Start to listening if there are some changes into the collection: ', this.collectionName);
    //         changeStream.on("change", async next => {                
    //             console.log("Received change from collection: /t", next);
    //             let currentNickelJob = NickelJob.clone(next.fullDocument);
    //             currentNickelJob.collectionName = this.collectionName;
    //             currentNickelJob.dbName = this.dbName;
    //             //const currentNickelJob: NickelJob = next.fullDocument as NickelJob;
    //             callback(currentNickelJob);
    //         });
    //     }
    // }
}
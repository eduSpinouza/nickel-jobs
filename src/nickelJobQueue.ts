import { NickelJobModel } from "./models/nickelJobModel";
import { State } from "./nickelJob";
import { MongoManager } from "./QueueManagers/mongoManager";
import { QueueManager } from "./QueueManagers/queueManager";


export class NickelJobQueue {

    collectionName: string;
    url: string;
    dbName: string;
    queueManager: QueueManager;
    connectionSucceeded: boolean;
    lastAssignedWorker: number;

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

    public async saveJob(nickelJob: NickelJobModel) {

        const metadataResult = await this.queueManager.upsertMetadata(nickelJob.jobType, true);
        if (!metadataResult) {
            console.log('Error ocurred queueing NickelJob');
            throw new Error('Error ocurred queueing NickelJob');
        }

        nickelJob.createAt = Date.now();
        nickelJob.state = State.Queued;
        nickelJob.options = nickelJob.options ? nickelJob.options : { MaxWorkerCount: 1 };

        console.log('After update Job Metada', metadataResult);
        let registeredWorkers = metadataResult.queueDataResult.registeredWorkers;

        if (registeredWorkers == 0 || registeredWorkers == 1) {
            nickelJob.assignedWorker = 1;
        } else {
            nickelJob.assignedWorker = this.assignWorker(nickelJob);
        }

        console.log('nickelJobQueue - saveJob - nickelJob', nickelJob);
        const result = await this.queueManager.insert(nickelJob);
        console.log(`Result after insert NickelJob into Queue: ${this.queueManager.queueIdentifier}`, result);
        if (!result) {
            console.log('Error ocurred queueing NickelJob');
            throw new Error('Error ocurred queueing NickelJob');
        }
    }

    public onDone(jobType: string, callback: (nickelJob: NickelJobModel) => any) {
        console.log('Subscribe when Jobs are DONE');

        if (this.connectionSucceeded) {
            this.queueManager.setupOnDoneListener(jobType, callback);
        }
    }

    private assignWorker(nickelJob: NickelJobModel): number {

        // Using kind of "Round Robin assignation"
        console.log('assignWorker - nickelJob', nickelJob);
        if (!nickelJob.options) {
            return 1;
        }

        var maxWorkerCount = nickelJob.options.MaxWorkerCount;
        console.log('assignWorker - maxWorkerCount', maxWorkerCount);

        if (maxWorkerCount === 1) {
            return 1;
        } else {
            if (this.lastAssignedWorker < maxWorkerCount) {                
                this.lastAssignedWorker++;
                return this.lastAssignedWorker;
            } else {
                this.lastAssignedWorker = 1;
                return this.lastAssignedWorker;
            }
        }
    }
}
import { QueueManager } from "./QueueManagers/queueManager";
import { MongoManager } from "./QueueManagers/mongoManager";
import { NickelJobModel } from "./models/nickelJobModel";

export enum State {
    Queued,
    Active,
    Done,
    Failed
}

export class NickelJob {
    
    nickelJobModel: NickelJobModel;

    dbName: string;
    collectionName: string;
    queueManager: QueueManager | undefined;
    connectionSucceeded: boolean;

    constructor(jobType: string = 'nickelJob', data: string | any = '') {
        this.nickelJobModel = new NickelJobModel(jobType, data);
        this.dbName = '';
        this.collectionName = '';
        this.connectionSucceeded = false;        
    }

    public async setConnection(url: string, dbName: string = 'meteor', collectionName: string = 'nickelJobQueue') {
        this.queueManager = new MongoManager(url, dbName, collectionName);
        this.dbName = dbName;
        this.collectionName = collectionName;
        console.log(`Trying to connecto to ${this.queueManager.queueIdentifier} with: `, url);
        this.connectionSucceeded = await this.queueManager.connect(url);        
        if (this.connectionSucceeded) {
            this.queueManager.setup();
            console.log('Connection succeded');
        }
    }

    public async processJobs(jobType: string, callback: (nickelJob: NickelJob, data: string) => any) {

        console.log('Starting to process Jobs');

        await this.queueManager?.setupProcessJobsListener(jobType, false, callback);
        
        this.queueManager?.setupOnWorkerChangeListener(jobType, async () => {
            console.log('Just before to call setupProcessJobsListener on WORKERCHANGE');
            await this.queueManager?.cleanStream();           
            await this.queueManager?.setupProcessJobsListener(jobType, true, callback);  
        })

        process.on('SIGINT', async () => {
            console.log('Cleaning Workers just before exit');
            await this.queueManager?.cleanRegisteredWorkers(jobType);
            process.exit();
        });
    }

    public async done() {

        if (this.connectionSucceeded) {
            const updatedNickelJob = this.nickelJobModel;                        
            await this.updateJobStatus(updatedNickelJob, State.Done);
        }
    }

    private async updateJobStatus(nickelJob: NickelJobModel, changeToState: State) {

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
}
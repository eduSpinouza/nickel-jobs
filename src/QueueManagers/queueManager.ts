import { NickelJobModel } from "../models/nickelJobModel";
import { NickJobMetadata } from "../models/nickJobMetada";
import { NickelJob, State } from "../nickelJob";
import { NickelResult } from "../nickelResult";

export interface QueueManager {

    queueIdentifier: string;
    connectionSucceeded: boolean;

    connect: (url: string, user?: string, pass?: string) => Promise<boolean>;
    setup: () => void;
    insert: (nickelJob: NickelJobModel) => Promise<NickelResult>;
    upsertMetadata: (jobType: string, fromClient: boolean) => Promise<NickelResult>;
    update: (nickelJob: NickelJobModel) => Promise<NickelResult>;

    setupProcessJobsListener: (jobType: string, fromClient:boolean, callback: (nickelJob: NickelJob, data: string) => any) => void;

    setupOnDoneListener: (jobType: string, callback: (nickelJob: NickelJobModel) => any) => void;

    setupOnWorkerChangeListener: (jobType: string, callback: () => any) => void;

    cleanRegisteredWorkers: (jobType: string) => Promise<void>;

    cleanStream:() => Promise<void>;

}
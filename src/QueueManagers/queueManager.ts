import { NickJobMetadata } from "../models/nickJobMetada";
import { NickelJob, State } from "../nickelJob";
import { NickelResult } from "../nickelResult";

export interface QueueManager {

    queueIdentifier: string;
    connectionSucceeded: boolean;

    connect: (url: string, user?: string, pass?: string) => Promise<boolean>;
    setup: () => void;
    insert: (nickelJob: NickelJob) => Promise<NickelResult>;
    upsertMetadata: (jobType: string, fromClient: boolean) => Promise<NickelResult>;
    update: (nickelJob: NickelJob) => Promise<NickelResult>;

    setupProcessJobsListener: (jobType: string, callback: (nickelJob: NickelJob, data: string) => any) => void;

    setupOnDoneListener: (jobType: string, callback: (nickelJob: NickelJob) => any) => void;

    cleanRegisteredWorkers: (jobType: string) => Promise<void>;


}
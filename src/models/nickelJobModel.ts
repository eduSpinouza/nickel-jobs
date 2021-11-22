import { ObjectId } from "mongodb";
import { NickelJobOptions } from "./nickelJobOptions";

enum State {
    Queued,
    Active,
    Done,
    Failed
}

export class NickelJobModel {
    
    id?: string;
    jobType: string;
    createAt?: number;
    updatedAt?: number;
    data?: string | any;
    state?: State;
    options?: NickelJobOptions;
    assignedWorker: number;
    
    constructor(jobType: string = 'nickelJob', data: string | any = '') {
        this.jobType = jobType;
        this.data = data;        
        this.assignedWorker = 0;
    }

    public static clone(fullDocument: any): NickelJobModel {
        let clone = new NickelJobModel();
        clone.createAt = fullDocument?.createAt;
        clone.updatedAt = fullDocument?.updatedAt;
        clone.jobType = fullDocument?.jobType;
        clone.data = fullDocument?.data;
        clone.state = fullDocument?.state;
        clone.id = fullDocument?._id;
        clone.options = fullDocument?.options;
        return clone;
    }
}
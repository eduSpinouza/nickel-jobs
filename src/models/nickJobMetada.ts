export class NickJobMetadata {
    
    jobType: string;
    registeredWorkers: number

    constructor(jobType: string, registeredWorkers: number = 0) {
        this.jobType = jobType;
        this.registeredWorkers = registeredWorkers;
    }
}
import { ObjectId } from "mongodb";

enum State {
    Queued,
    Active,
    Done,
    Failed
}

export interface Job {
    id?: ObjectId;
    name: string;
    createdAt: Date;
    state: State;
    data: string;
}
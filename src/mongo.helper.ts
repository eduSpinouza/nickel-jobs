import * as mongodb from 'mongodb';


export class MongoHelper {

    public static connect(url: string) {

        return new Promise<any>((resolve, reject) => {

            mongodb.MongoClient.connect(url, (err, client) => {
                if (err) {
                    reject(err);
                } else {                    
                    resolve(client);
                }
            });
        });
    }
}
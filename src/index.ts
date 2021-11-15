// import { MongoHelper } from './mongo.helper';

// const url = "mongodb://127.0.0.1:3001/meteor";

// // console.log('Antes');
// let changeStream;

// (async () => {
//     try {
//         await MongoHelper.connect(url);
//         console.log("Connected correctly to server");
//         if (MongoHelper.client) {
//             const db = MongoHelper.client.db('meteor');
//             const col = db.collection("tasks");
//             changeStream = col.watch();
//             changeStream.on("change", next => {
//                 console.log("Receiced change from collection: /t", next);
//             });


//             // const docs = col.find({}).toArray((err, items) => {
//             //     console.log('Records: ', JSON.stringify(items));
                
//             //     if (MongoHelper.client) {
//             //         MongoHelper.client.close();
//             //     }

//             // });
//         }

//     } catch (error: any) {
//         console.log(error.stack);
//     }    
    
// })();
// //.then(() => { console.log('Se ejecuto'); return; });
// // console.log('Despues');

// console.log('Hello Wrold!!!');
import { MongoHelper } from '../mongo.helper';

test('Should connect to MongoDB', async () => {
  const url = "mongodb://127.0.0.1:3001/meteor";
  await MongoHelper.connect(url);
  expect(MongoHelper.client).toBeTruthy();
  if (MongoHelper.client) {
    MongoHelper.client.close();
  }  
});
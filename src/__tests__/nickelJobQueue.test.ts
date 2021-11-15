import { NickelJobQueue } from '../nickelJobQueue';


test('Should create a NickelJobQueue class', () => {
    const url = "mongodb://127.0.0.1:3001";
    const nickelJobQueue: NickelJobQueue = new NickelJobQueue(url, 'meteor');
    
    expect(nickelJobQueue.dbName).toBe('meteor');
    expect(nickelJobQueue.url).toBe(url);    
    expect(nickelJobQueue.collectionName).toBe('nickelJobQueue');    
});

test('Should create a NickelJobQueue class', () => {
    const url = "mongodb://127.0.0.1:3001";
    const nickelJobQueue: NickelJobQueue = new NickelJobQueue(url, 'meteor');
    
    expect(nickelJobQueue.dbName).toBe('meteor');
    expect(nickelJobQueue.url).toBe(url);    
    expect(nickelJobQueue.collectionName).toBe('nickelJobQueue');    
});
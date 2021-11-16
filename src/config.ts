const MONGO_OPTIONS = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    socketTimeoutMS: 30000,
    keepAlive: true,
    poolSize: 50,
    autoIndex: false,
    retryWrites: false
};



// const MONGO = {
//     host: MONGO_HOST,
//     password: MONGO_PASSWORD,
//     username: MONGO_USERNAME,
//     options: MONGO_OPTIONS,
//     url: `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}`
// };

const config = {
    mongoOptions: MONGO_OPTIONS,
    metadataCollectionName: 'jobMetadata'
}

export default config;
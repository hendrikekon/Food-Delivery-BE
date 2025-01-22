const mongoose = require('mongoose');
const {dbHost, dbName, dbPort, dbUser, dbPass} = require('../app/config')

// const options = {
//     serverSelectionTimeoutMS: 60000, // Increase server selection timeout
//     socketTimeoutMS: 60000, // Increase socket timeout
//     authSource: 'admin', // Use the 'admin' database for authentication
// };

// mongoose.connect(`mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?authSource=admin`, options);
// const db = mongoose.connection;

// module.exports = db;

mongoose.connect(`mongodb+srv://${dbUser}:${dbPass}@cluster0.lh18l.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`);
const db = mongoose.connection;

module.exports = db;
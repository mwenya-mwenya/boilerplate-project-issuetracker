const { MongoClient } = require("mongodb");  // mongodb connnection logic
let env = require('dotenv').config();

let key = env.parsed.DB           //.env variable - mongodb connection key needs to be declared in .env file

let dbConnection

module.exports = {
    connectToDb:(cb) => {
     return MongoClient.connect(key)
     .then((client) => {
        dbConnection = client.db()
        return cb();        
     }).catch((error) => {
        console.log(error);
        return cb(error)
     })
    },
    getDb:() => {return dbConnection}
}
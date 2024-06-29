const { MongoClient } = require("mongodb");
let env = require('dotenv').config();

let key = env.parsed.DB

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
const { connectToDb, getDb } = require('./db');
module.exports = {
    db: connectToDb((error) => {
        if (!error) {
            console.log('***DB successfully Connected[VALIDATION ADDED]');
            return getDb().createCollection("issues", {
                validator: {
                    $jsonSchema: {
                        bsonType: "object",
                        title: "issues",
                        required: ["issue_title", "issue_text", "created_by"],
                        properties: {
                            issue_title: {
                                bsonType: "string",
                                description: "'issue_title' must be a string and is required"
                            },
                            issue_text: {
                                bsonType: "string",
                                description: "'issue_text' must be a string and is required"
                            },
                            created_by: {
                                bsonType: "string",
                                description: "'created_by' must be a string and is required"
                            }
                        }
                    }
                }
            })
        }

    }
    )

}
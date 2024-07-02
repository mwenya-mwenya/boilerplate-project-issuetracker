'use strict';
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('../db');    // imports mongodb connection

module.exports = function (app) {
  let db                            // declares DB

  connectToDb(async (error) => {     // async connecton ensures DB connection is established first
    if (!error) {

      db = getDb();
      console.log('***DB successfully Connected');
    }

    let listCollections = await db.listCollections().toArray()   // retrieves collection on DB
    let collection = listCollections.find((col) => {
      return col.name === 'issues'                           // checks if issues collection exists on DB
    }); 

    if (!collection) {
      const dbCreate = require('../schema').db;        // if issues collection does no exists - this creates it and applies validation
    }

  });

  const date = () => {                          // sets which date to be used - 'TEST_DATE' uses static date to ensure tests pass otherwise live date is used
    if (process.env.DATE === 'TEST_DATE') {
      return new Date('01/01/1999').toISOString();
    } else {
      return new Date().toISOString()
    }
  };

  app.route('/api/issues/:project')

    .get(function (req, res) {

      let project = req.query 

      if (project.open === "true") {   // open status is saved as boolean in the DB - hence this conversion is necessary to match with DB entries
        project.open = true
      }

      if (project.open === "false") {
        project.open = false
      }

      if (Array.isArray(project.open)) { // if the get request is for for both true and false - req.query is ['true','false'] - hence this is changed to boolean array [true,false]
        project.open = [true, false]
      }

      db.collection('issues')      // finds all documents in issues collections
        .find({})
        .toArray()
        .then((result) => {

          let params = Object.keys(project);                  // creates an array from the req.query object declared as project
          let filterNo1 = result.filter((data) => {
            return data.project_name === req.params.project.toLowerCase();  // filters result by the project_name - returns issues with the req.params project_name
          });


          if (params.length > 0) {  //checks if the request has quesries 

            let filterNo2 = filterNo1.filter((data) => {    // filters filterNo1 if req.queries are present
              return params.every((filterKey) => {
                if (Array.isArray(project[filterKey])) {     // if filters with the same property are preset e.g. re.query.open [true,false] - this filters for both
                  return project[filterKey].find((d) => d === data[filterKey])
                }

                return data[filterKey].toString().toLowerCase() === project[filterKey].toLowerCase();
              })
            });

            return res.status(200).json(filterNo2);

          } else {

            return res.status(200).json(filterNo1);
          }
        })
    })

    .post(function (req, res) {

      let project = req.body;                             // these assignments add required fields to the documents
      project.open = true;
      project.created_on = date();
      project.updated_on = date();
      project.project_name = req.params.project.toLowerCase();
      project.assigned_to = project.assigned_to !== undefined ? project.assigned_to : "";
      project.status_text = project.status_text !== undefined ? project.status_text : "";

      if (!project.issue_title || !project.issue_text || !project.created_by) {    //checks required fields are present

        return res.status(200).json({ error: 'required field(s) missing' });
      } else {

        db.collection('issues')
          .insertOne(project)
          .then((result) => {

            db.collection('issues')
              .findOne({ _id: result.insertedId })
              .then((result2) => {

                return res.status(201).json(Object.assign(result,result2)) // creates a new object with the created document and the acknowledgement object from insertone

              })

          })
          .catch((error) => {
            return res.status(500).json({ error: 'Could post data' });
          })
      }

    })

    .put(function (req, res) {

      const update = req.body;
      let iD = req.body._id;

      delete update._id;                  // removes ID from the request to allow the the udpated

      if (req.body.open === "true") {    // concerts string to boolean entries to be saved in DB
        update.open = true
      }

      if (req.body.open === "false") {
        update.open = false
      }

      let filterUpdate = Object.keys(update).reduce((acc, key) => { // removes empty strings so that the do not overwrite DB entries
        if (update[key] !== "") {
          acc[key] = update[key];
        }
        return acc
      }, {});

      if (ObjectId.isValid(iD)) {
        if (Object.keys(filterUpdate).length === 0) {   //checks if they are any updated being made

          return res.status(200).json({ error: 'no update field(s) sent', '_id': iD })
        }

        filterUpdate.updated_on = date();   // adds updated on date
        db.collection('issues')                                                           // the rest of the logic updates the document and return appropriated objects when update is not complete
          .findOneAndUpdate({ _id: ObjectId.createFromHexString(iD) }, { $set: filterUpdate }, { returnDocument: "after" })
          .then((doc) => {

            if (doc) {

              return res.status(200).json({ result: 'successfully updated', '_id': doc._id });

            } else {
              return res.status(200).json({ error: 'could not update', '_id': iD })
            }
          }).catch((error) => {
            return res.status(200).json({ error: 'could not update', '_id': iD })
          })
      } else if (iD === undefined) {
        return res.status(200).json({ error: 'missing _id' })
      } else {
        return res.status(500).json({ error: 'could not update', '_id': iD })
      }

    })

    .delete(function (req, res) {
      
      let iD = req.body._id;

      if (iD === undefined) {                               // checks ID if defined

        return res.status(200).json({ error: 'missing _id' })
      }

      else if (ObjectId.isValid(iD)) {

        db.collection('issues')
          .findOne({ _id: ObjectId.createFromHexString(iD) })     // finds inital doc to be deleted - *note unable to use findOneAndDelete - as tests do not pass
          .then((doc2) => {
            
            db.collection('issues')
              .deleteOne({ _id: ObjectId.createFromHexString(iD) })   // as above comment findOne and deleteOne are required to pass tests
              .then((doc) => {

                if (doc) {

                  return res.status(200).json({ result: 'successfully deleted', '_id': doc2._id })
                }
              }).catch((error) => {

                return res.status(200).json({ error: 'could not delete', '_id': iD })
              })
          })
      } else {

        return res.status(200).json({ error: 'could not delete', '_id': iD })
      }

    });

};

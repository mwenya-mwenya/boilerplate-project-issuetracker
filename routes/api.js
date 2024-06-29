'use strict';
const { ObjectId } = require('mongodb');
const { connectToDb, getDb } = require('../db');

module.exports = function (app) {
  let db

  connectToDb(async (error) => {
    if (!error) {

      db = getDb();
      console.log('***DB successfully Connected');
    }

    let listCollections = await db.listCollections().toArray()
    let collection = listCollections.find((col) => {
      return col.name === 'issues'
    });

    if (!collection) {
      const dbCreate = require('../schema').db;
    }

  });


  const date = () => {
    if (process.env.NODE_ENV === 'test') {
      return new Date('01/01/1999').toISOString();
    } else {
      return new Date().toISOString()
    }
  };


  app.route('/api/issues/:project')

    .get(function (req, res) {
      let project = req.query


      db.collection('issues')
        .find({})
        .toArray()
        .then((result) => {

          let params = Object.keys(project);


          if (params.length >= 1) {

            let filtered = result.filter((data) => params.find((filterKey) => {
              if (Array.isArray(project[filterKey])) {
                return project[filterKey].find((d) => d === data[filterKey])
              }
              return data[filterKey] === project[filterKey]
            }))

            return res.status(200).json(filtered);

          } else {

            return res.status(200).json(result);
          }
        })
    })

    .post(function (req, res) {



      let project = req.body;
      project.open = "true";
      project.created_on = date();
      project.updated_on = date();



      db.collection('issues')
        .insertOne(project)
        .then((result) => {

          return res.status(201).json({
            assigned_to: req.body.assigned_to,
            status_text: req.body.status_text,
            open: "true",
            _id: result.insertedId,
            issue_title: req.body.issue_title,
            issue_text: req.body.issue_text,
            created_by: req.body.created_by,
            created_on: date(),
            updated_on: date()
          });
        })
        .catch((error) => {
          return res.status(500).json({ error: 'Could post data' });
        })

    })

    .put(function (req, res) {
      let project = req.params.project;

      const update = req.body;

      let iD = req.body._id;
      delete update._id;

      let filterUpdate = Object.keys(update).reduce((acc, key) => {
        if (update[key] !== "") {
          acc[key] = update[key];
        }
        return acc
      }, {});

      if (ObjectId.isValid(iD)) {
        if (Object.keys(filterUpdate).length === 0) {
          return res.status(200).json({ "error": "could not update", "_id": iD })
        }

        filterUpdate.updated_on = date();
        db.collection('issues')
          .findOneAndUpdate({ _id: ObjectId.createFromHexString(iD) }, { $set: filterUpdate }, { returnDocument: "after" })
          .then((doc) => {

            if (doc) {
              return res.status(200).json(doc)
            } else {
              return res.status(200).json({ msg: 'No such document to update' })
            }
          }).catch((error) => {
            return res.status(500).json({ msg: 'Could not update the documents' })
          })
      } else if (iD === undefined) {
        return res.status(500).json({ msg: 'Missing ID' })
      } else {
        return res.status(500).json({ msg: 'Invalid ID' })
      }

    })

    .delete(function (req, res) {
      let project = req.params.project;
      let iD = req.body._id;

      if (ObjectId.isValid(iD)) {
        db.collection('issues')
          .deleteOne({ _id: ObjectId.createFromHexString(iD) })
          .then((doc) => {
            if (doc) {
              return res.status(200).json(doc)
            } else {
              return res.status(200).json({ msg: 'No such document to delete' })
            }
          }).catch((error) => {
            return res.status(500).json({ msg: 'Could not delete the documents' })
          })
      } else {
        return res.status(500).json({ msg: 'Not a valid format iD' })
      }

    });

};

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { connectToDb, getDb } = require('../db')

chai.use(chaiHttp);

let db

suite('Functional Tests', function () {
  
  before((done) => {
    process.env.DATE = 'TEST_DATE';
    db = getDb()

    db.collection('issues')
      .deleteMany({}, function (err) { });
    done();

  });

   test('Check if DB is empty', function (done) {
    chai
      .request(server)
      .keepOpen()
      .get('/api/issues/TEST')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body, true);
        assert.equal(res.body.length, 0);
        done();
      })
  });
 
  const testDate = new Date('01/01/1999').toISOString()

  test('Create an issue with every field: POST request to /api/issues/{project}', function (done) {

    let testIssue = {
      assigned_to: "tester",
      status_text: "this is a test",
      open: "true",
      issue_title: "Test issue title",
      issue_text: "Test issue text",
      created_by: "tester creator",
      created_on: testDate,
      updated_on: testDate
    }

    chai
      .request(server)
      .keepOpen()
      .post('/api/issues/TEST')
      .send(testIssue)
      .end(function (err, res) {
        assert.equal(res.status, 201);
        const resObj = res.body;
        assert.isObject(res.body, true)
        assert.equal(resObj.assigned_to, "tester");
        assert.equal(resObj.status_text, "this is a test");
        assert.isTrue(resObj.open, true)
        assert.equal(resObj.issue_title, "Test issue title")
        assert.equal(resObj.created_on, testDate)
        assert.equal(resObj.updated_on, testDate)
        done();
      })

  });

  test('Create an issue with only required fields: POST request to /api/issues/{project}', function (done) {

    let testIssue = {
      issue_title: "Test issue title2",
      issue_text: "Test issue text2",
      created_by: "tester creator2"
    }

    chai
      .request(server)
      .keepOpen()
      .post('/api/issues/TEST')
      .send(testIssue)
      .end(function (err, res) {
        assert.equal(res.status, 201);
        const resObj = res.body;
        assert.isObject(res.body, true);
        assert.equal(resObj.issue_text, "Test issue text2");
        assert.equal(resObj.created_by, "tester creator2");
        assert.equal(resObj.issue_title, "Test issue title2");
        done();
      })

  });

  test('Create an issue with missing required fields: POST request to /api/issues/{project}', function (done) {

    let testIssue = {
      issue_title: undefined,
      issue_text: undefined,
      created_by: undefined
    }

    chai
      .request(server)
      .keepOpen()
      .post('/api/issues/TEST')
      .send(testIssue)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        const resObj = res.body;
        assert.isObject(res.body, true);
        assert.isUndefined(resObj.issue_text, true);
        assert.isUndefined(resObj.created_by, true);
        assert.isUndefined(resObj.issue_title, true);
        done();
      });

  });

  test('View issues on a project: GET request to /api/issues/{project}', function (done) {

    chai
      .request(server)
      .keepOpen()
      .get('/api/issues/TEST')
      .end(function (err, res) {
        const resObj = res.body[0];
        assert.equal(res.status, 200);
        assert.isArray(res.body, true)
        assert.equal(resObj.assigned_to, "tester");
        assert.equal(resObj.status_text, "this is a test");
        assert.isTrue(resObj.open, true)
        assert.equal(resObj.issue_title, "Test issue title");
        assert.equal(resObj.issue_text, "Test issue text");
        assert.equal(resObj.created_by, "tester creator");
        assert.equal(resObj.created_on, testDate);
        assert.equal(resObj.updated_on, testDate);
        done();
      })
  });




  test('Update one field on an issue: PUT request to /api/issues/{project}', function (done) {

    db.collection('issues')
      .findOne({})
      .then((d) => {

        let testIssue = {
          _id: d._id,
          issue_title: "UPDATED - Test issue title",
        }

        chai
          .request(server)
          .keepOpen()
          .put(`/api/issues/apitest`)
          .send(testIssue)
          .end(function (err, res) {
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body._id, d._id.toString());
            assert.strictEqual(res.body.result, 'successfully updated');
            done();
          });

      });

  });

  test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function (done) {

    db.collection('issues')
      .findOne({})
      .then((d) => {

        let testIssue = {
          _id: d._id,
          issue_title: "UPDATED - Test issue title2",
          assigned_to: "UPDATED - tester2"
        }

        chai
          .request(server)
          .keepOpen()
          .put(`/api/issues/apitest`)
          .send(testIssue)
          .end(function (err, res) {
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body._id, d._id.toString());
            assert.strictEqual(res.body.result, 'successfully updated');
            done();
          });

      });

  });


  test('Update an issue with missing _id: PUT request to /api/issues/{project}', function (done) {

    let testIssue = {
      issue_title: "UPDATED - Test issue title [MISSING ID]",
    }

    chai
      .request(server)
      .keepOpen()
      .put(`/api/issues/apitest`)
      .send(testIssue)
      .end(function (err, res) {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.error, 'missing _id');
        assert.isUndefined(res.body.issue_title, true);
        done();
      });

  });

  test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function (done) {

    db.collection('issues')
      .findOne({})
      .then((d) => {
        let ID = d._id
        let testIssue = {
          _id: ID
        }

        chai
          .request(server)
          .keepOpen()
          .put(`/api/issues/apitest`)
          .send(testIssue)
          .end(function (err, res) {

            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body["error"], "no update field(s) sent");
            assert.strictEqual(res.body["_id"], ID.toString());
            
            done();
          });
      });

  });

  test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function (done) {

    let testIssue = {
      _id: "INVALID ID",
      issue_title: "INVALID UPDATE",
      assigned_to: "INVALID UPDATE"
    }

    chai
      .request(server)
      .keepOpen()
      .put(`/api/issues/apitest`)
      .send(testIssue)
      .end(function (err, res) {
        assert.strictEqual(res.status, 500);
        assert.strictEqual(res.body.error, "could not update");
        assert.strictEqual(res.body._id, testIssue._id);
        assert.isUndefined(res.body.issue_title, true);
        done();
      });

  });


  test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function (done) {

    let testIssue = {
      _id: "INVALID ID",
      issue_title: "INVALID UPDATE",
      assigned_to: "INVALID UPDATE"
    }

    chai
      .request(server)
      .keepOpen()
      .delete(`/api/issues/apitest`)
      .send(testIssue)
      .end(function (err, res) {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.error, "could not delete");
        assert.strictEqual(res.body._id, testIssue._id);
        
        done();
      });

  });


  test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function (done) {

    let testIssue = {
      issue_title: "INVALID UPDATE",
      assigned_to: "INVALID UPDATE"
    }

    chai
      .request(server)
      .keepOpen()
      .delete(`/api/issues/apitest`)
      .send(testIssue)
      .end(function (err, res) {
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.error, "missing _id");
        assert.isUndefined(res.body.assigned_to, true);
        assert.isUndefined(res.body.issue_title, true);
        done();
      });

  });

  test('View issues on a project with one filter: GET request to /api/issues/{project}', function (done) {

    let testIssue = {
      assigned_to: "tester3",
      status_text: "this is a test3",
      open: "true",
      issue_title: "Test issue title3",
      issue_text: "Test issue text3",
      created_by: "tester creator3",
      created_on: testDate,
      updated_on: testDate
    }

    chai
      .request(server)
      .keepOpen()
      .post('/api/issues/TEST')
      .send(testIssue)
      .end();

    chai
      .request(server)
      .keepOpen()
      .get('/api/issues/TEST?created_by=tester creator3')
      .end(function (err, res) {

        assert.equal(res.status, 200);
        assert.isArray(res.body, true);
        assert.equal(res.body.length, 1)
        done();
      })
  });


  test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function (done) {

    let testIssue = {
      assigned_to: "tester4",
      status_text: "this is a test4",
      open: "true",
      issue_title: "Test issue title4",
      issue_text: "Test issue text4",
      created_by: "tester creator4",
      created_on: testDate,
      updated_on: testDate
    }

    chai
      .request(server)
      .keepOpen()
      .post('/api/issues/TEST')
      .send(testIssue)
      .end();

    chai
      .request(server)
      .keepOpen()
      .get('/api/issues/TEST?created_by=tester creator3&created_by=tester creator4&created_by=tester creator')
      .end(function (err, res) {

        assert.equal(res.status, 200);
        assert.isArray(res.body, true);
        assert.equal(res.body.length, 3)
        done();
      })
  });

  test('Delete an issue: DELETE request to /api/issues/{project}', function (done) {

    db.collection('issues')
      .findOne({})
      .then((d) => {
        let ID = d._id
        let testIssue = {
          _id: ID
        }

        chai
          .request(server)
          .keepOpen()
          .delete(`/api/issues/apitest`)
          .send(testIssue)
          .end(function (err, res) {
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.result, "successfully deleted");
            assert.strictEqual(res.body._id, ID.toString());
            done();
          });
      });

  });



   after((done) => {
    db.collection('issues')
      .deleteMany({}, function (err) { });
      process.env.DATE = 'PROD_DATE';       
    done();
  }); 

});





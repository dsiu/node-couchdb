var common = require('./common')
  , assert = require('assert')
  , couchdb = require('../../lib/couchdb')
  ;

describe('test-changes', function () {
  var DB_NAME = 'node-couchdb-test';
  var db;
  var results = {
    B1:false,
    B2:false
  };


  before(function (done) {
    db = common.client.db(DB_NAME);
    // Init fresh db
    db.remove(function () {
      db.create(function (er) {
        if (er) throw new Error(JSON.stringify(er));
        done();
      })
    })
  });

  it('#changeStream should receive changes', function (done) {
    var stream = db.changesStream();

    stream.addListener('data', function (change) {
      results['B' + change.seq] = true;
      if (change.seq == results.length) {
        stream.close();
      }
    });

    done();
  });

  it('should trigger change changesStream', function (done) {

    db.saveDoc({test:1}, function () {
      db.saveDoc({test:2}, function () {
        done();
      });
    });
  });

  it('#changes should be observed', function (done) {

    db.changes({since:1}, function (er, r) {
      if (er) throw new Error(JSON.stringify(er));

      // check the results from changes callbacks
      assert.equal(2, r.results[0].seq);
      assert.equal(1, r.results.length);

      // check the results from changesStream
      assert.ok(results.B1);
      assert.ok(results.B2);
      done();
    });
  });

});

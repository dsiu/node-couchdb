var common = require('./common')
  , assert = require('assert')
  , couchdb = require('../../lib/couchdb')
  ;


describe('test-client', function () {
  var
    DB_NAME = 'node-couchdb-test',
    DB_NAME2 = 'node-couchdb-test-mirror',
    TEST_ID = 'my-doc',
    TEST_DOC = {hello:'world'},
    client = common.client;

  it("should get a list of all databases", function (done) {
    client.allDbs(function (er, r) {
      if (er) throw new Error(JSON.stringify(er));
      assert.ok('length' in r);
      done();
    });
  });

  it("should get the couch config", function (done) {
    // Get the couch config
    client.config(function (er, r) {
      if (er) throw new Error(JSON.stringify(er));
      assert.ok('httpd' in r);
      done();
    });
  });

  it("should get some uuids", function (done) {
    // Get some uuids
    client.uuids(3, function (er, r) {
      if (er) throw new Error(JSON.stringify(er));
      assert.equal(3, r.uuids.length);
      done();
    });
  });

  it("should get the couch stats", function (done) {
    // Get the couch stats
    client.stats('httpd_status_codes', '200', function (er, r) {
      if (er) throw new Error(JSON.stringify(er));
      assert.deepEqual(['httpd_status_codes'], Object.keys(r));
      assert.deepEqual(['200'], Object.keys(r.httpd_status_codes));
      done();
    });
  });

  it("should find all active tasks", function (done) {
    // Find all active tasks
    client
      .activeTasks(function (er, r) {
      if (er) throw new Error(JSON.stringify(er));
      assert.ok('length' in r);
      done();
    });
  });

  describe("#replicate", function () {
    // Lets create two dbs to test replication
    var db = client.db(DB_NAME);
    var db2 = client.db(DB_NAME2);

    // Here's how we'll actually replicate later.
    var replicate = function (done) {
      client
        .replicate(DB_NAME, DB_NAME2, function (er, r) {
        if (er) {
          if (er.reason && er.reason.indexOf('erlang') > 0) {
            console.error("---------------------------------------------------------------------------------");
            console.error(" Test failed. Possibly due to https://issues.apache.org/jira/browse/COUCHDB-1221");
            console.error(" Try restarting CouchDB for a quick fix.");
            console.error("---------------------------------------------------------------------------------");
          }
          throw new Error(JSON.stringify(er));
        }
        assert.ok('session_id' in r);
        done();
      });
    };

    it("should replicate", function (done) {
      // Create first db, save document, create second db, then
      // replicate. And all that in a well-defined order.
      db.remove(function () {
        db.create(function () {
          db.saveDoc(TEST_ID, TEST_DOC, function () {
            db2.remove(function () {
              db2.create(function () {
                replicate(done);
              });
            });
          });
        });
      });
    });

    after(function (done) {
      // Cleanup
      db.remove();
      db2.remove();
      done();
    });
  });

  describe("#connection to a port where this is no couch", function () {
    var client2;

    before(function(done) {
      client2 = couchdb.createClient(3921);
      done();
    });

    it('should error in getting uuids', function (done) {

       // Test connecting to a port where there is no couch
      client2._addClientListener('error', function (er) {
        assert.ok(er.errno == 'ECONNREFUSED', 'connect error did not happen');
      });

      client2.uuids(function (er, r) {
        assert(er, 'connection error did not happen');
        done();
      });
    });
  });

});




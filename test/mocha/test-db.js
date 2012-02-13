
var common = require('./common')
  , assert = require('assert');

describe('test-db', function () {
  var
    DB_NAME = 'node-couchdb-test',
    TEST_ID = 'my-doc',
    TEST_ID2 = 'my-doc2',
    TEST_DOC = {hello:'world'},
    createUpdate = function (rev) {
      return {_id:TEST_ID, _rev:rev, hello:'universe'};
    },
    db;

  before(function (done) {
    db = common.client.db(DB_NAME);

    // Cleanup if test crashed in the middle
    db.remove(function () {
      done();
    })
  });

  describe('#setup db', function () {

    it('should not exist before creating one', function (done) {
      // Make sure our test db does not exist yet
      db.exists(function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(false, r);
        done();
      });
    });

    it('should be created', function (done) {
      // Now create it
      db.create(function (er, r) {
        if (er) throw new Error(JSON.stringify(~er));
        done();
      });
    });

    it('should exist', function (done) {
      // Make sure that worked
      db.exists(function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(true, r);
        done();
      });
    });
  });

  describe('#doc', function () {
    // Remember revisions for save and update tests.

    var revisions = {};

    it('should be created with a given id', function (done) {
      // Create a document with a given id
      db.saveDoc(TEST_ID, TEST_DOC, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(TEST_ID, r.id);
        assert.ok('rev' in r);
        revisions.first = r.rev; // keep for next test
        done();
      });
    });

    it('should have the saved contents', function (done) {
      // Get the document, check contents
      db.getDoc(TEST_ID, function (er, doc) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(doc.hello, TEST_DOC.hello);
        done();
      });
    });

    it('should have new revision after update', function (done) {
      // Update the document, check if the revision parameter works
      db.saveDoc(createUpdate(revisions.first), function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(TEST_ID, r.id);
        assert.ok('rev' in r);
        revisions.second = r.rev;
        done();
      });
    });

    it('should be the latest revision if revision is omitted', function (done) {
      // Get document without revision, must contain the latest text.
      db.getDoc(TEST_ID, function (er, doc) {
        if (er) throw new Error(JSON.stringify(er));
        assert.notEqual(doc.hello, TEST_DOC.hello);
        assert.equal(doc._rev, revisions.second);
        done();
      });
    });

    it('should have first revision content if asked for it', function (done) {
      // Get document with first revision, must contain the earlier text.
      db.getDoc(TEST_ID, revisions.first, function (er, doc) {
        if (er) throw new Error(JSON.stringify(er));

        assert.equal(doc.hello, TEST_DOC.hello);
        assert.equal(doc._rev, revisions.first);
        done()
      });
    });

    it('should have the latest revision when revision is specified expicitly', function (done) {
      // Get document with latest revision explicitly, must contain the latest text.
      db.getDoc(TEST_ID, revisions.second, function (er, doc) {
        if (er) throw new Error(JSON.stringify(er));
        assert.notEqual(doc.hello, TEST_DOC.hello);
        assert.equal(doc._rev, revisions.second);
        done();
      });
    });
  });

  describe('#doc with couch created document id', function () {

    var doc;

    it('should be created', function (done) {
      // Let couch create a document id for us
      db.
        saveDoc(TEST_DOC, function (er, savedDoc) {
        if (er) throw new Error(JSON.stringify(er));
        doc = savedDoc;
        done();
      });
    });

    it('should be removed', function (done) {
      // And lets try to delete this one right away
      db.removeDoc(doc.id, doc.rev, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        done();
      });
    });
  });

  describe('#info', function () {

    it('should have doc_count = 1', function (done) {
      // Lets check how we are doing here
      db.info(function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(1, r.doc_count);
        done();
      });
    });
  });

  describe('#copy', function () {
    var copy;

    it('should make a copy', function (done) {
      // Lets test copying
      db.copyDoc(TEST_ID, TEST_ID2, function (er, c) {
        if (er) throw new Error(JSON.stringify(er));
        copy = c;
        done()
      });
    });

    it('should make a copy with rev', function (done) {
      // Now lets try to do this again, but this time we need the destRev
      db.copyDoc(TEST_ID, TEST_ID2, copy.rev, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        done()
      });
    });
  });

  describe('#allDocs', function () {

    it('should be able to get a list of all docs', function (done) {
      // Get a list of all docs
      db.allDocs(function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(2, r.total_rows);
        assert.equal(2, r.rows.length);
        done()
      });
    });

    it('should work with query options', function (done) {
      // Make sure query options work
      db.allDocs({limit:1}, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(1, r.rows.length);
        done();
      });
    });
  });

  describe('#allDocsBySeq', function () {

    it('should not be supported', function (done) {
      // Test allDocsBySeq
      db.allDocsBySeq(function (er, r) {
        /*
         * An error here is perfectly valid as of CouchDB 0.11. The _all_docs_by_seq API
         * has been replaced by _changes.
         */
        if (er && er.error == 'not_found' && er.reason == 'missing') {
          done();
        }
        else {
          /*
           * If there is as an error different from 404, it may still be a problem.
           */
          if (er) throw new Error(JSON.stringify(er));
          assert.ok('rows' in r);
          done();
        }
      });
    });
  });

  describe('#compact', function () {

    it('should compact', function (done) {
      // Test compact
      db.compact(function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok('ok' in r);
        done();
      });
    })
  });

  describe('#bulkDocs', function () {

    it('should save multiple docs', function (done) {
      // Test bulk docs
      db.bulkDocs({
        docs:[
          {_id:'1'},
          {_id:'2'}
        ]
      }, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal('1', r[0].id);
        assert.equal('2', r[1].id);
        done();
      });
    })
  });

  describe('#view', function () {

    it('should be able to create temp view', function (done) {
      // Test temp views
      db.tempView({
        map:function () {
          emit(null, null);
        }
      }, {include_docs:true}, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok('total_rows' in r);
        done();
      });
    });

    it('should be able to clean up views', function (done) {
      // Test view cleanup
      db.viewCleanup(function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok(r.ok);
        done();
      });

    });
  });

  describe('#design', function () {

    it('should save design doc', function (done) {
      // Test save design doc
      db.saveDesign('nice', {
        views:{
          one:{
            map:function () {
              emit(null, null)
            }
          }
        }
      }, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok('ok' in r);
        assert.ok('_design/nice', r.id);
        done();
      });
    });


    it('shoud save design doc with alternative syntax', function (done) {
      // Try alternative syntax
      db.saveDesign({
        _id:'other',
        views:{
          example:{
            map:function () {
              emit(null, null)
            }
          }
        }
      }, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok('ok' in r);
        assert.ok('_design/other', r.id);
        done();
      });
    });

    it('should compact on design', function (done) {
      // Test compact on design
      db.compact('nice', function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok('ok' in r);
        done();
      });
    });

    it('should be able to query on view', function (done) {
      // Test view querying
      db.view('nice', 'one', {limit:1}, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.equal(1, r.rows.length);
        done();
      });
    });

  });

});
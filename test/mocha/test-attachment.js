var common = require('./common')
  , assert = require('assert')
  , couchdb = require('../../lib/couchdb')
  ;

describe('test-attachment', function () {
  var DB_NAME = 'node-couchdb-test'
    , LOGO_PNG_FILE = '/../fixture/logo.png'
    , db
    ;

  before(function (done) {

    db = common.client.db(DB_NAME);
    // Init fresh db
    db.remove(function () {
      db.create(function () {
        done();
      });
    });
  });

  it('should save an attachment', function (done) {

    couchdb.toAttachment(__dirname + LOGO_PNG_FILE, function (er, attachment) {
      if (er) throw new Error(JSON.stringify(er));

      assert.equal('image/png', attachment.content_type);
      assert.equal(4016, attachment.data.length);

      db.saveDoc('logo-doc', {
        name:'The Logo',
        _attachments:{
          'logo.png':attachment
        }
      }, function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok(r.ok);
        assert.equal('logo-doc', r.id);

        db.getAttachment('logo-doc', 'logo.png', function (er, r) {
          assert.equal(3010, r.length);
          done();
        })
      });
    });

  });

  it('should remove an attachment', function (done) {

    db.saveAttachment(
      __dirname + LOGO_PNG_FILE,
      'logo-2',
      function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok(r.ok);
        assert.equal('logo-2', r.id);

        db.removeAttachment('logo-2', 'logo.png', r.rev, function (er, r) {
          if (er) throw new Error(JSON.stringify(er));
          assert.ok(r.ok);
          done();
        })
      });
  });
});

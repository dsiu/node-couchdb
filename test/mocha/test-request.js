var common = require('./common')
  , assert = require('assert')
  ;

describe('test-request', function () {
  var client, i;

  before(function (done) {
    client = common.client;
    done();
  });

  for (i = 1; i <= 5; i++) {
    it('GET /_uuids # for ' + i + ' uuid', function (done) {
      client
        .request('/_uuids', function (er, r) {
        if (er) throw new Error(JSON.stringify(er));
        assert.ok(i, r.uuids.length);
        done()
      });
    });
  }

  it('POST /_uuids not allowed', function (done) {

    client
      .request('post', '/_uuids', function (r) {
      assert.equal('method_not_allowed', r.error);
      done();
    });
  });
});

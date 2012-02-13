var assert = require('assert')
  , couchdb = require('../../lib/couchdb')
  ;

describe('test-to-query', function () {

  it('should convert to query string', function () {
    var query = couchdb.toQuery({
      key:'bar',
      very:true,
      stale:'ok'
    });

    assert.equal('key=%22bar%22&very=true&stale=ok', query);
  });

});


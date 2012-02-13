
var couchdb = require('../../lib/couchdb');

// Provide a port/host here if your local db has a non-default setup
exports.client = couchdb.createClient(undefined, undefined, undefined, undefined, 0);

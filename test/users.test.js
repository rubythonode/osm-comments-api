var testConfig = {
    'PostgresURL': 'postgres://localhost/osm-comments-api-test'
};

require('../lib/config')(testConfig);

var tape = require('tape');
var users = require('../users/index');

tape('test users module', function(assert) {
    users.get('FredB', function(err, result) {
        assert.ifError(err, 'no error fetching user');
        var expected = {
            'id': 1626,
            'name': 'FredB',
            'first_edit': new Date('2013-04-23T18:30:00.000Z'),
            'changeset_count': 5,
            'num_changes': 50
        };
        assert.deepEqual(result, expected, 'user module returns as expected');
        assert.end();
    });
});
process.env.OSM_COMMENTS_POSTGRES_URL = 'postgres://' + process.env.TEST_PG_USER + '@localhost/osm-comments-api-test';

var api = require('../api');
var tape = require('tape');
var queue = require('d3-queue').queue;
var http = require('http');
var testsList = require('./fixtures/changesets/test_list.json');
var server;

// Simple GET function
function get(path, callback) {
    http.get('http://localhost:20009' + path, function(res) {
        var body = '';
        res.on('error', callback);
        res.on('data', function(d) { body += d; });
        res.on('end', function() {
            callback(null, body, res);
        });
    }).on('error', callback);
}

tape('start server', function(assert) {
    server = api.listen(20009, function(err) {
        if (err) throw err;
        assert.pass('server listening on 20009');
        assert.end();
    });
});

tape('run API tests for changesets', function(assert) {
    var q = queue(5);
    testsList.forEach(function(t) {
        q.defer(runAPITest, assert, t);    
    });
    q.awaitAll(function() {
        assert.end();
    });
});

function runAPITest(assert, testObj, callback) {
    var basePath = './fixtures/changesets/';
    var expected = require(basePath + testObj.fixture);
    get(testObj.url, function(err, body, res) {
        assert.ifError(err, testObj.description + ': success');
        assert.equal(res.statusCode, 200, testObj.description + ': status 200');
        assert.deepEqual(JSON.parse(body), expected.geojson, testObj.description);
        callback();
    });
}


//Tests for invalid queries
// test('get changeset that does not exist', function(assert) {
//     get('/api/v1/changesets/123456789', function(err, body, res) {
//         assert.ifError(err, 'success');
//         assert.deepEqual(JSON.parse(body), { message: 'Not found: Changeset not found' }, 'expected error message');
//         assert.equal(res.statusCode, 404, 'expected status');
//         assert.end();
//     });
// });

// test('get invalid changeset id', function(assert) {
//     get('/api/v1/changesets/ventriloquism', function(err, body, res) {
//         assert.ifError(err, 'success');
//         assert.deepEqual(JSON.parse(body), { message: 'Invalid request: Changeset id must be a number' }, 'expected error message');
//         assert.equal(res.statusCode, 422, 'expected status');
//         assert.end();
//     });
// });

tape('get results for invalid from date', function(assert) {
    get('/api/v1/changesets?from=strings&to=2015-09-08', function(err, body, res) {
        assert.ifError(err, 'success');
        assert.deepEqual(JSON.parse(body), { message: 'Invalid request: From must be a valid date' }, 'expected error message');
        assert.equal(res.statusCode, 422, 'expected status');
        assert.end();
    });
});

tape('get results for invalid to date', function(assert) {
    get('/api/v1/changesets?from=2015-09-08&to=strings', function(err, body, res) {
        assert.ifError(err, 'success');
        assert.deepEqual(JSON.parse(body), { message: 'Invalid request: To must be a valid date' }, 'expected error message');
        assert.equal(res.statusCode, 422, 'expected status');
        assert.end();
    });
});

tape('get results for invalid bounding box', function(assert) {
    get('/api/v1/changesets?bbox=a,1,2,3', function(err, body, res) {
        assert.ifError(err, 'success');
        assert.deepEqual(JSON.parse(body), { message: 'Invalid request: Bbox not a valid bbox string' }, 'expected error message');
        assert.equal(res.statusCode, 422, 'expected status');
        assert.end();
    });
});

tape('close server', function(assert) {
    server.close(function(err) {
        if (err) throw err;
        assert.pass('server closed');
        assert.end();
    });
});

tape.onFinish(() => process.exit(0));

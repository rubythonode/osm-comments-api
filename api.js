var config = {
    'PostgresURL': process.env.OSM_COMMENTS_POSTGRES_URL || 'postgres://postgres@localhost/osm-comments'
};
require('./lib/config')(config);

var express = require('express');
var notes = require('./notes/index');
var changesets = require('./changesets/index');
var users = require('./users/index');
var cors = require('cors');
var errors = require('mapbox-error');
var ErrorHTTP = require('mapbox-error').ErrorHTTP;
var customErrors = require('./errors');

var server = module.exports = express();

server.use(cors());

server.get('/', function(req, res) {
    res.json({'status': 'ok'});
});

server.get('/api/v1/notes', function(req, res, next) {
    notes.search(req.query, function(err, geojson) {
        if (err) {
            return next(err);
        }
        res.json(geojson);
    });
});

server.get('/api/v1/changesets', function(req, res, next) {
    changesets.search(req.query, function(err, geojson) {
        if (err) {
            return next(err);
        }
        res.json(geojson);
    });
});

server.get('/api/v1/notes/:id', function(req, res, next) {
    notes.get(req.params.id, function(err, geojson) {
        if (err) {
            return next(err);
        }
        res.json(geojson);
    });
});

server.get('/api/v1/changesets/:id', function(req, res, next) {
    changesets.get(req.params.id, function(err, geojson) {
        if (err) {
            return next(err);
        }
        res.json(geojson);
    });
});

server.get('/api/v1/users/:name', function(req, res, next) {
    users.get(req.params.name, function(err, json) {
        if (err) {
            return next(err);
        }
        res.json(json);
    });
});

server.use(function(err, req, res, next) {
    if (err instanceof customErrors.ParseError) {
        next(new ErrorHTTP('Invalid request: ' + err.message, 422));
    } else if (err instanceof customErrors.NotFoundError) {
        next(new ErrorHTTP('Not found: ' + err.message, 404));
    } else {
        next(err);
    }
});

server.use(errors.showError);
server.use(errors.notFound);

// server.use(function(err, req, res, next) {
//     console.log(err);
//     res.status(500).send(JSON.stringify(err));
// });

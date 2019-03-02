'use strict';

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const router = express.Router();
const dns = require('dns');
const bodyParser = require('body-parser');
const ShortUrl = require('./models');
const idGenerator = new require('./id-generator')(function (err, done) {
  const q = ShortUrl.findOne({});
  q.sort({ shortUrl: 'desc' })
    .limit(1)
    .exec(function (err, res) {
      if (err) return done(err);
      return done(null, res);
    });
});

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
const cors = require('cors');

app.use(bodyParser.urlencoded({ extended: 'false' }));
app.use(bodyParser.json());

// http://expressjs.com/en/starter/static-files.html
app.use('/public', express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, dbName: 'url_shortener' })
  .then(function () {
    console.debug('Connected to database');
  }, function (err) {
    console.error('Failed to connet to the database: ', err);
  });

router.post('/shorturl/new', function (req, res) {
  function respond(body, status = 200) {
    return res.status(status).send(body);
  }

  if (!req.body.url) {
    console.debug('Empty url');
    return respond({
      error: 'EMPTY_URL'
    }, 400);
  }

  console.info(`Shortening url '${req.body.url}'`);
  const url = req.body.url.trim().replace(/^https?:\/\//, '');
  console.log('Modified url: ' + url);

  dns.lookup(url, function (lookupErr, address) {
    console.log('Could resolve url:', address);

    if (lookupErr) {
      console.error(lookupErr);
      return respond({
        error: 'Could not resolve host'
      }, 400);
    }

    function createIfNotFound(url) {
      const shortUrl = new ShortUrl({
        originalUrl: req.body.url,
        shortUrl: idGenerator.nextId()
      });

      shortUrl.save(function (err, data) {
        if (err) {
          return respond({
            error: 'Failed to save the url'
          }, 500);
        }
        return respond({
          original_url: data.originalUrl,
          short_url: data.shortUrl
        });
      });
    }

    ShortUrl.findOne({ originalUrl: req.body.url }, function (err, result) {
      if (err) {
        return respond({
          error: 'Failed to read short url enty'
        }, 500);
      }
      if (!result) {
        console.debug('No url found in db.');
        return createIfNotFound(req.body.url);
      }
      console.debug('Url already in database: ', result);
      return respond({
        original_url: result.originalUrl,
        short_url: result.shortUrl
      });
    });
  });
});

router.get('/shorturl/:id', function (req, res) {

});

app.use('/api', cors({
  optionSuccessStatus: 200
}), router);  // some legacy browsers choke on 204

// Respond to not found routes.
app.use(function (req, res, next) {
  if (req.method.toLowerCase() === 'options') {
    res.end();
  } else {
    res.status(404).type('txt').send('Not Found');
  }
});

// Error handling
app.use(function (err, req, res, next) {
  if (err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }
});

// listen for requests :)
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
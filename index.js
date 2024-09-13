require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const urlhttp = require('url-http')

const URL = require('./url');

mongoose.connect(process.env.MONGO_URI)


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res, next) =>
{
  let fullurl = urlhttp(req.body.url.replace(/^(https?:\/\/)?/i, 'https://'));
  if (!fullurl)
  {
    console.error(`${req.body.url} is an invalid url (resolved to ${fullurl})`);
      res.json({ error: 'invalid url' });
  } else
  {
    let date = new Date();
    let n = Number(date.getTime().toString().substring(4));
    let doc = new URL({
      original_url: fullurl,
      short_url: n
    });
    doc.save().then((data) =>
    {
      console.log(`saved: ${data}`);
      res.json({ "original_url": data.original_url, "short_url": data.short_url });
    }).catch((e) =>
    {
      console.error(`error saving new document ${e}`);
      res.json({ error: e.message });
    });
  }
});

app.get('/api/shorturl/:short', (req, res, next) =>
{
  if (Number(req.params.short).toString() == "NaN")
  {
    res.json({ "error": "must provide a number to /api/shorturl/" });
  } else
  {
    URL.findOne({ short_url: Number(req.params.short) }).then((doc) =>
    {
      if (doc == null)
      {
        res.json({ "error": "No short URL found for the given input" });
      } else
      {
        console.log(`redirecting from ${doc.short_url} to ${doc.original_url}`);
        res.redirect(doc.original_url);
      }
    }).catch((e) =>
    {
      console.error(e);
      res.json({ "error": `failed to return original URL... error message: ${e.message}` });
    });
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

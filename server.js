'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const bodyParser = require('body-parser');
const validUrl = require('valid-url');
const shortid = require("shortid");

mongoose.connect(process.env.MONGO_URI);
let Schema = mongoose.Schema;

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 

app.use(cors());

app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const schema = new Schema({
  origUrl: String,
  shortUrl: String
});

const shortUrl = mongoose.model("shortUrl", schema);
  
app.post("/api/shorturl/:url", function(req, res) {
  // takes the url from the body parser
  let originalUrl = req.body.url;
  
  let host = req.get("host") + "/";
  // generate random Id for short URL
  let randId = shortid.generate();
  
  let shorterUrl = new shortUrl({
        origUrl: originalUrl,
        shortUrl: randId
      });
  // checks to see if it LOOKS like a valid site, doesnt test dns or anything
  if (validUrl.isUri(originalUrl)) {
    // does originalUrl already exist?
    shortUrl.findOne({origUrl: originalUrl}, function (err, data) {
      if (err) return err;
      if (data != null) {
        res.json({ 
          original_url: originalUrl, 
          short_url: data.shortUrl 
        });      
      } else {
       
        shorterUrl.save(function (err) {
          if (err) return err;
        });
        res.json({ 
          original_url: originalUrl, 
          short_url: host + randId 
        });
      }
    });
  } else {
    res.json({ error: "invalid URL" });
  }
});

app.get("/:short", function(req, res) {
  let short = req.params.short;
  let host = req.get("host") + "/";
  let fullUrl = host + short;
  
  shortUrl.findOne({shortUrl: short}, function (err, data) {
      if (err) return err;
      if (data != null) {
        res.redirect(data.origUrl);
      } else {
        res.json({ error: "Shortlink not found in the database." });
      }
    });
});


app.listen(port, function () {
  console.log('Node.js is listening ...');
});
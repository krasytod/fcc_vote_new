
/**
 * Module dependencies.
 */

//https://api.twitter.com/oauth/authenticate?oauth_token=12nzGgAAAAAAiNuVAAABVUpVU2E
var CHARSET = '<meta charset="UTF-8">'

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , bodyParser = require('body-parser')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , methodOverride = require('method-override'),
    passport = require('passport'),
    Strategy = require('passport-twitter').Strategy;  

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/images/favicon.png'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'))

/*if (app.get('env') == 'development') {
	app.locals.pretty = true;
} */

require('dotenv').load();

// Configure the Twitter strategy for use by Passport.
//
// OAuth 1.0-based strategies require a `verify` function which receives the
// credentials (`token` and `tokenSecret`) for accessing the Twitter API on the
// user's behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
    consumerKey : process.env.TWITTER_CONSUMER_KEY,
    consumerSecret : process.env.TWITTER_CONSUMER_SECRET,
    callbackURL : process.env.TWITTER_CALLBACK
  },
  function(token, tokenSecret, profile, cb) {
    // In this example, the user's Twitter profile is supplied as the user
    // record.  In a production-quality application, the Twitter profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
  }));
  
  
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.get('/login/twitter',
  passport.authenticate('twitter'));
  
app.get('/login/twitter/return', 
   passport.authenticate('twitter', { failureRedirect: '/logint' }),
  function(req, res) {
   //console.log("new callback")
    res.redirect('/');
  });  


app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
      
    //console.log("profile: ",req.user)  
    res.render('profile.jade', { user: req.user });  //JSON.stringify
  });


var secret = require('./sec.json');
var Twitter = require("node-twitter-api");

/*
var twitter = new Twitter({
        consumerKey: secret.twitter.consumerKey,
        consumerSecret: secret.twitter.consumerSecret,
        callback: secret.twitter.callbackUrl})
*/
//app.get('/', routes.index);
//var _requestSecret;
//console.log(process.env.MONGO_URI)


app.get("/", function(req, res) {
  res.render("index.jade",{polls: ['first','second','3'],loged:true,user: req.user });
});

app.get("/logout", function(req, res)
{
  req.logout();
  res.redirect('/');  
});

app.get("/login", function(req, res)
{
  res.render("redirect.jade",{message:"You must be loged",timer:5000,url:"'/'"});
  //res.redirect('/');  
});


app.get("/new-poll", require('connect-ensure-login').ensureLoggedIn(), function(req, res)
{
  //req.logout();
  //console.log("new_poll");
  res.render("new_poll.jade",{user: req.user});
    
});

app.post("/new_poll_post_request",function(req,res){
var title=req.body.title;
var options=req.body.options;


});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


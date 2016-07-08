
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
    mongoose = require('mongoose'),
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
app.use('/static', express.static(__dirname + '/static'));
console.log(path.join(__dirname, 'public'))
console.log(path.join(__dirname, 'static'))

/*if (app.get('env') == 'development') {
	app.locals.pretty = true;
} */

require('dotenv').load();

mongoose.connect(process.env.MONGO_URI||process.env.MONGODB_URI);

//scheema
var voteSchema = mongoose.Schema({user:String,
    title: String,options : { }                  //type : Array , "default" : [] 
});

var voteModel= mongoose.model('votes', voteSchema);


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


//var secret = require('./sec.json');
//var Twitter = require("node-twitter-api");

app.get("/", function(req, res) {
   var polls_arr =[]
  voteModel.find({}, function (err, result) {  //
    
      if (err){ 
         console.log("error!!! %s", err)  
         res.writeHeader(200, {"Content-Type": "text/html"});  
         res.end("Error with DB. Please contact the support");
         return ;
       }
      else
        {
        if (result !== null) {
        for (var key in result)
         {var id =    result[key]._id;
         var title = result[key].title;
          polls_arr.push(  [title,id]  ) }
         console.log(polls_arr)   
        } } 
    res.render("index.jade",{polls: polls_arr,loged:true,user: req.user });  
  });
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

app.get("/mypolls", require('connect-ensure-login').ensureLoggedIn(),function(req, res)
{
   var id  = req.user.id;    
   var polls_arr =[]
  voteModel.find({user:id}, function (err, result) {  //
    
      if (err){ 
         console.log("error!!! %s", err)  
         res.writeHeader(200, {"Content-Type": "text/html"});  
         res.end("Error with DB. Please contact the support");
         return ;
       }
      else
        {
        if (result !== null) {
        for (var key in result)
         {var id =    result[key]._id;
         var title = result[key].title;
          polls_arr.push(  [title,id]  ) }
         console.log(polls_arr)   
        } } 
    res.render("index.jade",{polls: polls_arr,loged:true,user: req.user,mypolls:true });  
  });
});





app.get("/polls/:poll", function(req, res)
{
 //req.logout();
 // console.log(req.params.poll);
 var poll = req.params.poll;
 voteModel.findOne({_id: poll}, function (err, result) {  //
      if (err){ 
         console.log("error!!! %s", err)  
         res.writeHeader(200, {"Content-Type": "text/html"});  
         res.end("Error with DB. Please contact the support");
         return ;
       }
      else
        {
        if (result !== null) 
        {
            //[{'age':'<5','population':'4659'},{'age':'135','population':'14659'}]
            var votes_arr = [];
            var draw_chart = false
            for (var key in result.options) {
              if (result.options.hasOwnProperty(key)) {
                
                if (result.options[key]>0)
                {
                votes_arr.push({'name':key,'population':result.options[key]})
                draw_chart = true;
                //console.log(key + " -> " + result.options[key]);
              }}
            }
            res.render("vote.jade",{vote:result,user: req.user, chart_data:JSON.stringify(votes_arr),draw_chart:draw_chart});
         console.log(result,votes_arr)  }
        else
        {res.end("Not FOUND")}
     }   });    });


app.get("/vote", function(req, res)
{
 var poll = req.query.poll;
 var options_obj = {}
 //options_obj[req.query.option]=0;
 
 voteModel.findById(poll, function (err, result) {  //
      if (err){ 
         console.log("error!!! %s", err)  
         res.writeHeader(200, {"Content-Type": "text/html"});  
         res.end("Error with DB. Please contact the support");
         return ;
       }
      else
        {
        if (result !== null) 
        {
        console.log("kvo e tui: ",result)    
            //if option already exists
        if ( req.query.option in result.options)
         {
           var options = JSON.parse(JSON.stringify(result.options));     //to copy object
           options[req.query.option] +=1
           result.options = options;
           res.end("Done")  }
        //if is a new option
        else
        {
        var options = JSON.parse(JSON.stringify(result.options));     //to copy object
        options[req.query.option] =1
        result.options = options;
        //console.log("new option: ", options) 
        res.end("Done")    
        }
        //console.log("tosave: ", result) 
        result.save(function(err) {
         if (err)
             throw err
        //console.log("err ", err)     
        });
           } //end of inside else
        
        
        else
        {res.end("Not FOUND")}   }   });   
    
    /* voteModel.update({ _id: poll}, { $set: { title:"newName"}},function(err,result)
     {
         if (err) return (err);
         console.log("update: ",result);
         
     }
     
     );  
    */
    
});


app.get("/pie", function(req, res)
{
 res.sendfile('static/pie.html');

});



app.get("/delete_poll", function(req, res)
{
 var id_for_delete = req.query.id;
 voteModel.find({ _id:id_for_delete}).remove( function (err, result)
 {
     //this is the callback of remove record
        if (err){ 
         console.log("error!!! %s", err)  
         res.end("Error deleting record from DB. Please contact support");
         return ;
       }
       else
        {
         res.end("Job Done!");   
        }
       }
 );

});



app.post("/new_poll_post_request",function(req,res){
 var title=req.body.title;
 var options=req.body.options;
 var id  = req.user.id;
 var options_obj = {}
 options.split("\r\n").forEach(function(element, index, array){
   if (element!="")
    {options_obj[element] = 0;}
 })
 //console.log (options_obj); 
 voteModel.create({ user: id ,title:title,options: options_obj}, function (err, result) {
                if (err) {console.log("Error in save"); res.end("Error with DB");  return ; } //return {error:true};
                else {
                    console.log(result) 
                    res.render("redirect.jade",{message:"New Poll ia added",timer:3000,url:"'polls/"+result._id+"'"});
                    return } 
  })
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


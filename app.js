// Module dependencies.
var express = require('express')
  , GitHubApi = require('github')
  , github = new GitHubApi({version: "3.0.0"})  
  , Cache2File = require('cache2file')
  , cache = new Cache2File('./cache', 86400000) // one day
  , dateutil = require('dateutil');

var app = module.exports = express.createServer()
  , io = require('socket.io').listen(app);

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  // app.use(express.errorHandler());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

io.sockets.on('connection', function (socket) {
 
});

function getData(key, apiClass, apiFunc, apiFuncParams, callback) {
  cache.get(key, function (err, data) {
    if (!err) {
      callback(false, JSON.parse(data));
    }
    else { 
      github[apiClass][apiFunc](apiFuncParams, function(err, data) {
          if (!err) {
            cache.set(key, JSON.stringify(data));
            callback(false, data);
          }
          else {
            callback(err, null);
          }
      });
    }
  });
};

function githubUser(req, res, next) {
  getData(req.params.name + '_profile', 'user', 'getFrom', {user: req.params.name}, function(err, data) {

    if (err) res.send('Error: getData failed! (user)');

    req.userDetail = data;
    next();
  });
};

// Routes
app.get('/', function(req, res) {
  res.render('index', { title: "looky" });
});

app.get('/user/:name', githubUser, function(req, res) {
  res.redirect('/user/' + req.params.name + '/repositories');
});

app.get('/user/:name/repositories', githubUser, function(req, res) {

  getData(req.params.name + '_repos', 'repos', 'getFromUser', {user: req.params.name}, function(err, data) {

    if (err) res.send('Error: getData failed! (repos)');

    res.render('profile', {
      title: "User: " + req.params.name,
      userDetail: req.userDetail,
      repos: data
    });
  });

});

app.get('/user/:name/gists', githubUser, function(req, res) {

  getData(req.params.name + '_gists', 'gists', 'getFromUser', {user: req.params.name}, function(err, data) {

    if (err) res.send('Error: getData failed! (gists)');

    data.forEach(function(gist) {
        gist.created_at = dateutil.format(new Date(gist.created_at), 'j.m.Y');
        gist.updated_at = dateutil.format(new Date(gist.updated_at), 'j.m.Y');
    });

    res.render('gists', {
      title: "User: " + req.params.name,
      userDetail: req.userDetail,
      gists: data
    });
  });

});

app.get('/user/:name/followers', githubUser, function(req, res) {

  getData(req.params.name + '_followers', 'user', 'getFollowers', {user: req.params.name}, function(err, data) {

    if (err) res.send('Error: getData failed! (followers)');

    res.render('followers', {
      title: "User: " + req.params.name,
      userDetail: req.userDetail,
      followers: data
    });
  });

});

app.get('/user/:name/events', githubUser, function(req, res) {

  getData(req.params.name + '_events', 'events', 'getFromUser', {user: req.params.name}, function(err, data) {

    if (err) res.send('Error: getData failed! (user_events)');

    res.render('events', {
      title: "User: " + req.params.name,
      userDetail: req.userDetail,
      events: data
    });
  });

});

app.get('/user/:name/repository/:repo', githubUser, function(req, res) {

  getData(req.params.name + '_repo_' + req.params.repo, 'events', 'getFromRepo', {user: req.params.name, repo: req.params.repo}, function(err, data) {

    if (err) res.send('Error: getData failed! (followers)');

    console.log(data);

    res.render('repo_single', {
      title: "User: " + req.params.name,
      userDetail: req.userDetail,
      repoName: req.params.repo,
      repoEvents: data
    });
  });

});

app.listen(process.env['app_port'] || 3000, function(){
  console.log("Express server listening on port %d in %s mode", process.env['app_port'] || 3000, app.settings.env);
});
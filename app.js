// Module dependencies.
var express = require('express')
  , GitHubApi = require('github')
  , github = new GitHubApi({version: "3.0.0"})  
  , Cache2File = require('cache2file')
  , cache = new Cache2File('./cache', 60000 * 60);

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
  app.use(express.errorHandler());
});

io.sockets.on('connection', function (socket) {
 
  socket.on('getRepos', function (data) {  
    cache.get(data.user + '_repos', function (err, repos) {
      if (!err) {
        socket.emit('repos', { repos: JSON.parse(repos) });
      }
      else {      
        github.repos.getFromUser({
          user: data.user
        }, function(err, repos) {
            if (!err) {
              cache.set(data.user + '_repos', JSON.stringify(repos));
              socket.emit('repos', { repos: repos });
              socket.emit('ratelimit', { meta: repos.meta });
            }
        });
      }
    });
  });
  
  socket.on('getGists', function (data) {
    cache.get(data.user + '_gists', function (err, gists) {
      if (!err) {
        socket.emit('gists', { gists: JSON.parse(gists) });
      }
      else {      
        github.gists.getFromUser({
          user: data.user
        }, function(err, gists) {
            if (!err) {
              cache.set(data.user + '_gists', JSON.stringify(gists));
              socket.emit('gists', { gists: gists });
              socket.emit('ratelimit', { meta: gists.meta });
            }
        });
      }
    });  
  });
  
  socket.on('getUser', function (data) {
    cache.get(data.user + '_profile', function (err, detail) {
      if (!err) {
        socket.emit('userDetail', { detail: JSON.parse(detail) });
      }
      else {      
        github.user.getFrom({
          user: data.user
        }, function(err, detail) {
            if (!err) {
              cache.set(data.user + '_profile', JSON.stringify(detail));
              socket.emit('userDetail', { detail: detail });
              socket.emit('ratelimit', { meta: detail.meta });
            }
        });
      }
    });
  });
  
  socket.on('getFollowers', function (data) {
    cache.get(data.user + '_followers', function (err, followers) {
      if (!err) {
        socket.emit('followers', { followers: JSON.parse(followers) });
      }
      else {      
        github.user.getFollowers({
          user: data.user
        }, function(err, followers) {
            if (!err) {
              cache.set(data.user + '_followers', JSON.stringify(followers));
              socket.emit('followers', { followers: followers });
              socket.emit('ratelimit', { meta: followers.meta });
            }
        });
      }
    });
  });
  
});

// Routes
app.get('/', function(req, res) {
  res.render('index', { title: "Nody" });
});

app.get('/user/:name', function(req, res) {
  res.render('profile', { title: "User: " + req.params.name, user: req.params.name });
});

app.get('/user/:name/repositories', function(req, res) {
  res.render('profile', { title: "User: " + req.params.name, user: req.params.name });
});

app.get('/user/:name/gists', function(req, res) {
  res.render('gists', { title: "User: " + req.params.name, user: req.params.name });
});

app.get('/user/:name/followers', function(req, res) {
  res.render('followers', { title: "User: " + req.params.name, user: req.params.name });
});

app.get('/user/:name/repository/:repo', function(req, res) {
    res.render('repository', { title: "repository" + req.params.repo, user: req.params.user, repo: req.params.repo });
});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
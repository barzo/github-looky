var url = $.url();

var socket = io.connect('http://localhost');

if (url.segment(1) == 'user') {
  console.log('getting user info');
  socket.emit('getUser', { user: url.segment(2) });
}

if (!url.segment(3) || url.segment(3) == 'repositories') {
  console.log('getting user repositories');
  socket.emit('getRepos', { user: url.segment(2) });
}

if (url.segment(3) == 'gists') {
  console.log('getting user gists');
  socket.emit('getGists', { user: url.segment(2) });
}

if (url.segment(3) == 'followers') {
  console.log('getting user followers');
  socket.emit('getFollowers', { user: url.segment(2) });
}

if (url.segment(3) == 'repository') {
  console.log('getting user repository detail');
  socket.emit('getRepoDetail', { user: url.segment(2), repo: url.segment(4) });
}

socket.on('repos', function (data) {
  $("#repoList").empty();
  $.template("repoTemplate", 
      "<li class='repo'>"
        + "<a href='/repository/${name}'><i class='icon-github'></i> ${name}</a>"
        + "<span class='repo-desc-text'> {{if description}}- ${description}{{else}}{{/if}}</span>"
        + "<div class='repo-mini-desc'>"
        + "<span><i class='icon-bolt'></i> {{if language}}${language}{{else}}Unknown{{/if}}</span>"
        + "<span><i class='icon-eye-open'></i> ${watchers}</span>"
        + "<span><i class='icon-download-alt'></i> ${forks}</span>"
        + "</div>"
        + "</li>" 
  );
  $.tmpl( "repoTemplate", data.repos ).appendTo( "#repoList" );
});

socket.on('ratelimit', function (data) {
  $('span.rateLimit').html("Current Limit: " + data.meta['x-ratelimit-remaining']);
});

socket.on('userDetail', function (data) {
  $('span.username').html(data.detail.name + ' <span class="nickname">' + data.detail.login + '</span>');
  $('div.avatar img').attr('src', data.detail.avatar_url);
  $('span.location').html(data.detail.location);
  $('span.followers').html('<strong>Followers:</strong> ' + data.detail.followers);  
  $('span.publicRepos').html('<strong>Public Repos:</strong> ' + data.detail.public_repos);
  $('span.publicGists').html('<strong>Public Gists:</strong> ' + data.detail.public_gists);
});

socket.on('gists', function (data) {
  $("#gistList").empty();
  $.template("gitTemplate", 
      "<li class='repo'>"
        + "<a href='/gist/${id}'><i class='icon-github'></i> {{if description}}${description}{{else}}Undefined{{/if}}</a>"
        + "<span class='repo-desc-text'> - {{each files}}<span><i class='icon-file'></i>${$value.filename}</span> {{/each}}</span>"
        + "<div class='repo-mini-desc'>"
        + "<span><i class='icon-calendar'></i> ${created_at}</span>"
        + "<span><i class='icon-calendar'></i> ${updated_at}</span>"
        + "<span><i class='icon-comments'></i> ${comments}</span>"
        + "</div>"
        + "</li>" 
  );
  $.tmpl( "gitTemplate", data.gists ).appendTo( "#gistList" );
});

socket.on('followers', function (data) {
  $("#followerList").empty();
  $.template("followerTemplate", 
      "<li class='repo follower' id='follower_${login}'>"
        + "<a href='/user/${login}'><img src='${avatar_url}' /> ${login}</a>"
        + "</li>"
  );
  $.tmpl( "followerTemplate", data.followers ).appendTo( "#followerList" );
});
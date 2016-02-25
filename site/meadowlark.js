var express = require('express');

var app = express();

var fortune = require('./lib/fortune.js');
var formidable = require('formidable');

var credentials = require('credentials.js');

//set up handlebars engine
var handlebars = require('express3-handlebars')
    .create({defaultLayout:'main',
    helpers: {
        section: function(name, options){
            if(!this._sections)
                this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());

app.use(express.static(__dirname + '/public'));
app.use(require('body-parser')());
// test function to create weather data
function getWeatherData(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partialcloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Mazanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Mazanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)'
            },
        ],
    };
}

// test middleware
app.use(function(req, res, next) {
    /*res.locals.showTests = app.get('env') !== 'production' && 
        req.query.test === '1';*/
    
    if (!res.locals.partials)
        res.locals.partials = {};
    res.locals.partials = getWeatherData();
    next();
});

app.use(function(req, res, next){
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

app.use(function(req, res, next){
    console.log('processing request for "' + req.url + '"....');
    res.next();
});

app.use(function(req, res, next){
    console.log('terminating request');
    res.send('thanks for playing');
});

app.use(function(req, res, next){
    console.log('whoops i\'ll never get called');
});
// routes go here
app.get('/contest/vacation-photo', function(req, res){
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(), month: now.getMonth()
    });
});

app.post('/contest/vacation-photo/:year/:month', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if(err){
            return res.redirect(303, '/error');
        }
        console.log('recieved fields:');
        console.log(fields);
        console.log('recieved fields:');
        console.log(files);
        res.redirect(303, '/thank-you');
    });
});
app.get('/newsletter', function(req, res){
    res.render('newsletter', { csrf: 'CSRF token goes here'});
});

app.post('/newsletter', function(req, res){
    var name = req.body.name || '', email = req.body.email || '';
    // input validation
    if (!email.match(VALID_EMAIL_REGEX)) {
        if (req.xhr) return res.json({ error : 'Invalid name email address'});
        req.session.flash = {
            type: 'danger',
            intro: 'Validation Error',
            message: 'The email address you entered was valid',
        };
        return res.redirect(303, '/newsletter/archive');
    }
    new NewsLetterSignup({name : name, email : email}).save(function(err){
        if (err) {
            if (req.xhr) return res.json({ error : 'Database error.'});
            req.session.flash = {
                type: 'danger',
                intro: 'Database Error',
                message: 'There was a database error; please try again later.',
            };
            return res.redirect(303, '/newsletter/archive');
        }
        if (req.xhr) return res.json({ success: true });
        req.session.flash = {
            type: 'success',
            intro: 'Thank You',
            message: 'You have been signed up for the newsletter',
        };
        return res.redirect(303, '/newsletter/archive');
    });
});

app.post('/process', function(req, res){
    /*console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token from hidden field: ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    res.redirect(303, '/thank-you');*/
    if(req.xhr || req.accepts('json.html') ==='json'){
        res.send({success: true});
    } else {
        res.redirect(303, '/thank-you');
    }
});
app.get('/nusery-rhyme', function(req, res){
    res.render('nusery-rhyme');
});

app.get('/data/nusery-rhyme', function(req, res){
    res.json({
        animal: 'squirel',
        bodyPart: 'tail',
        adjective: 'bushy',
        noun: 'heck'
    });
});

app.get('/', function(req, res){
    res.render('home');
});

app.get('/about', function(req, res){
    res.render('about', { fortune: fortune.getFortune(),
                pageTestScript: '/qa/tests-about.js'
            });
});

app.get('/tours/hood-river', function(req, res){
    res.render('tours/hood-river');
});

app.get('tours/request-group-rate', function(req, res){
    res.render('tours/request-group-rate');
});


// get the headers element 
app.get('/headers', function(req, res) {
    res.set('Content-Type', 'text/plain');
    var s = '';
    for (var name in req.headers) 
        s += name + ':' + req.headers[name] + '\n';
    res.send(s);
});
// custom 404 page
app.use(function(req, res){
    res.status(404);
    res.render('404');
});

// custom 500 page
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});


app.listen(app.get('port'), function(){
    console.log('Express started on http://localhost' +
        app.get('port') + '; press ctrl-C to terminate');
});


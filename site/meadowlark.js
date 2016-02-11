var express = require('express');

var app = express();

var fortune = require('./lib/fortune.js');

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

app.use(express.static(__dirname + '/public'));

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

// routes go here
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


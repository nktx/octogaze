// server.js

var express = require('express'),
		path = require('path');

var fs = require('fs');
var jsonfile = require('jsonfile')
var bodyParser = require('body-parser');
var app = express();

const server = app.listen(8000, function(){
  console.log('listening on *:8000');
});

const io = require('socket.io')(server);

io.on('connection', function(socket){
	console.log('user connected');

	socket.on('record', function(data){
		var file = 'data/'+ Date.now() +'.json';
		jsonfile.writeFile(file, data, function (err) {
			if (err) {
		  	return console.log(err);
			}
		});
	});

	socket.on('readfile', function(){
		var data = [];

		fs.readdir('data/', function(err, filenames) {
			if (err) {
				onError(err);
			}

			filenames.forEach(function(filename) {
				if (filename[0] !== '.') {
					var file = 'data/' + filename;
					data.push(jsonfile.readFileSync(file))
				}
			});

			socket.emit('filedata', data);
		});			
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.render('pages/index');
});

app.get('/gazebeacon', function(req, res) {
	res.render('pages/gazebeacon');
});

app.get('/line', function(req, res) {
	res.render('pages/line');
});

app.get('/corner', function(req, res) {
	res.render('pages/corner');
});

app.get('/arc', function(req, res) {
	res.render('pages/arc');
});

app.get('/result', function(req, res) {
	res.render('pages/result');
});

app.get('/proportion-test', function(req, res) {
	res.render('pages/proportion-test');
});

app.get('/resample-test', function(req, res) {
	res.render('pages/resample-test');
});

app.get('/resample-result', function(req, res) {
	res.render('pages/resample-result');
});
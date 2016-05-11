// server.js

var express = require('express'),
		path = require('path');

var fs = require('fs');
var jsonfile = require('jsonfile')
var bodyParser = require('body-parser');
var app = express();

const server = app.listen(8080, function(){
  console.log('listening on *:8080');
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
				var file = 'data/' + filename;
				data.push(jsonfile.readFileSync(file))
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

app.get('/gazebeaconr', function(req, res) {
	res.render('pages/gazebeaconr');
});

app.get('/makecircle', function(req, res) {
	res.render('pages/makecircle');
});

// app.listen(8080);
// console.log('server listening on port 8080');
var socket = io.connect();
var recognizer = new DollarRecognizer;

var canvas = d3.select('body')
								.append('svg')
								.attr('height', $(window).height())
								.attr('width', $(window).width())
								.attr('class', 'menu-svg');

var line = d3.svg.line()
					.x(function(d) {
						return d.X;
					})
					.y(function(d) {
						return d.Y;
					})
					.interpolate('basis');

var recordMode = false;
var audio = new Audio('assets/pi.ogg');
var cursorRadius = 25;

Record = function(x, y) {
	this.interface = $('#task-interface').text();
	this.subject = $('#task-subject').val();
	this.result = "";
	this.score = 0;
	this.duration = 0;
	this.path = [];
	this.startTime = Date.now();
	this.startPosition = {
		X: x,
		Y: y
	};

	this.record = function(x, y) {
		this.path.push({
			X: x,
			Y: y
		})
	};
	
	this.end = function(r, s) {
		this.duration = Date.now() - this.startTime;
		this.score = Math.round(s*1000)/1000;

		$('#task-duration').text(this.duration);
		if (s !== 0) {
			this.result = r;
			$('#task-result').text(this.result + '(' + this.score + ')');
		} else {
			$('#task-result').text('-');
		}

		console.log(this);
		if (recordMode) {
			socket.emit('record', this);
		}
	};
};

Menu = function() {
	this.mode = false;
	
	this.open = function(x, y) {
		this.mode = true;
		this.gesturePath = [];
		this.gesturePath.push(new Point(0, 0));

		this.startPos = this.prevPos = this.curPos = new Point(x, y);

		this.realtime	= recognizer.Realtime(this.gesturePath);
		drawGuidance(this.realtime.Status, this.startPos, this.curPos);

		this.record = new Record(x, y);
		this.record.record(0, 0);
	};

	this.move = function(x, y) {
		this.curPos = new Point(x, y);
		this.record.record(x - this.startPos.X, y - this.startPos.Y);

    this.gesturePath.push(new Point(x - this.startPos.X, y - this.startPos.Y));
		this.realtime	= recognizer.Realtime(this.gesturePath);

		var pathStatus = this.realtime.Current.Name + '(' + Math.round(this.realtime.Current.Score*1000)/1000 + ') + ';
		$.each(this.realtime.Status, function(index, value){
			pathStatus += value.Name;
			pathStatus += '(';
			pathStatus += Math.round(value.Score*1000)/1000;
			pathStatus += ') ';
		});
		$('#path-status').text(pathStatus);

    canvas
  		.append('path')
			.attr({
				'd': line([this.prevPos, this.curPos]),
				'stroke': '#E6E6E6',
				'stroke-width': cursorRadius*2,
				'class': 'gesture'
			});

		drawGuidance(this.realtime.Status, this.startPos, this.curPos);

		this.prevPos = this.curPos;
	}
	
	this.close = function() {
		this.mode = false;

		this.result = recognizer.RecognizeR(this.gesturePath);
		this.record.end(this.result.Name, this.result.Score);

		if (this.result.Score >= 0.75) {
			d3.selectAll('.menu-svg .guidance').remove();
			d3.selectAll('.menu-svg .gesture')
				.attr({
					'stroke': this.result.Color
				});

			audio.play();

			window.setTimeout(function (){
				d3.selectAll('.menu-svg .gesture').remove();
			}, 1000);

		} else {
			d3.selectAll('.menu-svg .guidance').remove();
			d3.selectAll('.menu-svg .gesture').remove();
		}
	};

};

$(function() {

	var allowed = true;
	$('#task-interface').text('GAZEBEACON');

	var menu = new Menu();

	canvas
		.append('circle')
  	.attr({
  		'cx': (-1)*cursorRadius,
  		'cy': (-1)*cursorRadius,
  		'r': cursorRadius,
  		'fill': '#000',
  		'fill-opacity': 0.1,
  		'class': 'cursor'
  	});

	$(document).keydown(function(event){

		// avoid keydown event repeated
		if (event.repeat != undefined) { allowed = !event.repeat; }
	  if (!allowed) return;
	  allowed = false;

		if (event.keyCode == 90) { 
			menu.open(window.x, window.y);
		}

    if (event.keyCode == 82) {
			recordMode = !recordMode;
    	$('#record-mode').text( recordMode ? 'ON' : 'OFF');
    }
	});

	$(document).keyup(function(event){ 
		allowed = true;

		if (event.keyCode == 90) {
			menu.close();
		}
	});

	$(document).mousemove(function(e) {
		window.x = e.pageX;
    window.y = e.pageY;

		if (menu.mode) {
			menu.move(window.x, window.y);
		}

		d3.select('.cursor')
			.attr('cx', window.x)
			.attr('cy', window.y);
	});
});
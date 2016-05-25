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
var cursorRadius = 20;

Record = function(x, y) {
	this.interface = location.pathname.slice(1).toUpperCase();
	this.subject = $('#task-subject').val();
	this.duration = 0;
	this.curLength = [];
	this.startTime = Date.now();

	this.record = function(l64, l32, l16, l8, l4) {
		this.curLength.push({
			'Length64': l64,
			'Length32': l32,
			'Length16': l16,
			'Length8': l8,
			'Length4': l4,
			'Time': Date.now() - this.startTime
		});
	};
	
	this.end = function() {
		this.duration = Date.now() - this.startTime;
		$('#task-duration').text(this.duration);

		console.log(this);
		if (recordMode) {
			socket.emit('record', this);
		}
	};
};

Menu = function() {
	this.lock = true;
	this.mode = false;
	
	this.open = function(x, y) {
		this.lock = false;
		this.mode = true;
		this.gesturePath = [];
		this.gesturePath.push(new Point(0, 0));

		this.startPos = this.prevPos = this.curPos = new Point(x, y);

		this.record = new Record(x, y);
		this.record.record(0, 0);
	};

	this.move = function(x, y) {
		this.curPos = new Point(x, y);

		var gesturePathCopy64 = JSON.parse(JSON.stringify(this.gesturePath));
		var gesturePathCopy32 = JSON.parse(JSON.stringify(this.gesturePath));
		var gesturePathCopy16 = JSON.parse(JSON.stringify(this.gesturePath));
		var gesturePathCopy8 = JSON.parse(JSON.stringify(this.gesturePath));
		var gesturePathCopy4 = JSON.parse(JSON.stringify(this.gesturePath));

		gesturePathCopy64 = Resample(gesturePathCopy64, 64);
		gesturePathCopy32 = Resample(gesturePathCopy32, 32);
		gesturePathCopy16 = Resample(gesturePathCopy16, 16);
		gesturePathCopy8 = Resample(gesturePathCopy8, 8);
		gesturePathCopy4 = Resample(gesturePathCopy4, 4);

		this.record.record(
			PathLength(gesturePathCopy64),
			PathLength(gesturePathCopy32),
			PathLength(gesturePathCopy16),
			PathLength(gesturePathCopy8),
			PathLength(gesturePathCopy4)
		);

    this.gesturePath.push(new Point(x - this.startPos.X, y - this.startPos.Y));

    canvas
  		.append('path')
			.attr({
				'd': line([this.prevPos, this.curPos]),
				'stroke': '#EDEDED',
				'stroke-width': cursorRadius*2,
				'class': 'gesture'
			});

		this.prevPos = this.curPos;
	}
	
	this.close = function() {
		this.lock = true;
		$('.trigger').removeClass('hover');

		this.mode = false;
		this.record.end();

		d3.selectAll('.menu-svg .guidance').remove();
		d3.selectAll('.menu-svg .gesture').remove();
	};

};

$(function() {

	var allowed = true;
	$('#task-interface').text('RESAMPLE');

	var menu = new Menu();

	canvas
		.append('circle')
  	.attr({
  		'cx': (-1)*cursorRadius,
  		'cy': (-1)*cursorRadius,
  		'r': cursorRadius,
  		'fill': '#EDEDED',
  		'class': 'cursor'
  	});

	canvas
  	.append('rect')
		.attr({
  		'x': $(window).width()/2 - 100,
  		'y': $(window).height()/2 - 100,
  		'width': 200,
  		'height': 200, 
  		'stroke': '#EDEDED',
  		'stroke-dasharray': ('100, 100'),
  		'stroke-dashoffset': 50,
  		'fill': 'none',
    	'pointer-events': 'all',
  		'class': 'trigger'
  	});

	$(document).keydown(function(event){

		// avoid keydown event repeated
		if (event.repeat != undefined) { allowed = !event.repeat; }
	  if (!allowed) return;
	  allowed = false;

		if ((event.keyCode == 90) && (menu.lock == false)) { 
			menu.open(window.x, window.y);
		}

    if (event.keyCode == 82) {
			recordMode = !recordMode;
    	$('#record-mode').text( recordMode ? 'ON' : 'OFF');
    }
	});

	$(document).keyup(function(event){ 
		allowed = true;

		if ((event.keyCode == 90) && (menu.lock == false)) { 
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

	$('.trigger')
		.hover(
			function(){
				if (menu.mode == false) {
					$(this).addClass('hover');
					menu.lock = false;
				}
			},
			function(){
				if (menu.mode == false) {
					$(this).removeClass('hover');
					menu.lock = true;
				}
			}
		);
});
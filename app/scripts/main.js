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
var modes = ['NOGUIDE', '1FFW', '2FFW'];
var guidanceMode = 0;
var audio = new Audio('assets/pi.ogg');
var cursorRadius = 20;

var taskCompleted = 0;

Record = function(x, y) {
	this.interface = location.pathname.slice(1).toUpperCase();
	this.guide = $('#task-interface').text();
	this.gesture = $('#task-gesture').text();
	this.subject = $('#task-subject').val();
	this.result = "";
	this.score = 0;
	this.resultnorotate = "";
	this.scorenorotate = 0;
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
	
	this.end = function(r, s, ru, su) {
		this.duration = Date.now() - this.startTime;
		this.score = Math.round(s*1000)/1000;
		this.scorenorotate = Math.round(su*1000)/1000;

		$('#task-duration').text(this.duration);

		if (location.pathname.slice(1) == 'line'){
			if (su > 0) {
				this.resultnorotate = ru;
				$('#task-result').text(this.resultnorotate + '(' + this.scorenorotate + ')');
			} else {
				$('#task-result').text('-');
			}
		} else {
			if (s > 0) {
				this.result = r;
				$('#task-result').text(this.result + '(' + this.score + ')');
			} else {
				$('#task-result').text('-');
			}
			this.resultnorotate = ru;
		}

		console.log(this);
		if (recordMode) {
			socket.emit('record', this);
			setTaskCounter(1);
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
				'stroke': '#EDEDED',
				'stroke-width': cursorRadius*2,
				'class': 'gesture'
			});

		drawGuidance(this.realtime.Status, this.startPos, this.curPos);

		this.prevPos = this.curPos;
	}
	
	this.close = function() {
		this.lock = true;
		$('.trigger').removeClass('hover');

		this.mode = false;

		var gesturePathCopy = JSON.parse(JSON.stringify(this.gesturePath));

		this.result = recognizer.RecognizeR(this.gesturePath);
		this.resultNoRotate = recognizer.RecognizeNoRotate(gesturePathCopy);
		this.record.end(this.result.Name, this.result.Score, this.resultNoRotate.Name, this.resultNoRotate.Score);

		if (this.result.Score >= 0.75) {
			d3.selectAll('.menu-svg .guidance').remove();
			d3.selectAll('.menu-svg .gesture')
				.attr({
					'stroke': this.result.Color,
					'stroke-width': 5,
				});

			audio.play();

			window.setTimeout(function (){
				d3.selectAll('.menu-svg .gesture').remove();
			}, 500);

		} else {
			d3.selectAll('.menu-svg .guidance').remove();
			d3.selectAll('.menu-svg .gesture').remove();
		}
	};

};

$(function() {

	var allowed = true;
	$('#task-interface').text('NOGUIDE');

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

	// Initial first gesture
  $('#task-gesture').text(gestures[gestureIndex].Name);
	recognizer.DeleteUserGestures();
	recognizer.AddGesture(gestures[gestureIndex].Color, gestures[gestureIndex].Name, gestures[gestureIndex].Points);

	$(document).keydown(function(event){

		// avoid keydown event repeated
		if (event.repeat != undefined) { allowed = !event.repeat; }
	  if (!allowed) return;
	  allowed = false;

		if ((event.keyCode == 90) && (menu.lock == false)) { 
			menu.open(window.x, window.y);
		}

    if (event.keyCode == 82) {
    	setTaskCounter(0);
			recordMode = !recordMode;
    	$('#record-mode').text( recordMode ? 'ON' : 'OFF');
    }

    if (event.keyCode == 80) {
    	setTaskCounter(0)
    	guidanceMode = (guidanceMode+1)%3;
    	$('#task-interface').text(modes[guidanceMode]);
    }

    if (event.keyCode == 71) {
    	setTaskCounter(0);

			guidanceMode = 0;
    	$('#task-interface').text(modes[guidanceMode]);

    	gestureIndex = (gestureIndex+1)%(gestures.length);
    	$('#task-gesture').text(gestures[gestureIndex].Name);

			recognizer.DeleteUserGestures();
    	recognizer.AddGesture(gestures[gestureIndex].Color, gestures[gestureIndex].Name, gestures[gestureIndex].Points);
    }
	});

	$(document).keyup(function(event){ 
		allowed = true;

		if ((event.keyCode == 90) && (menu.lock == false)) { 
			menu.close();
		}
	});

	var euroX = OneEuroFilter(25, 1, 1, 1);
	var euroY = OneEuroFilter(25, 1, 1, 1);

	var lastMove = 0;

	$(document).mousemove(function(e) {
		if (Date.now() - lastMove > 40) {
			// window.x = e.pageX;
			// window.y = e.pageY;
			// console.log(euroX.filter(e.pageX, Date.now()), euroY.filter(e.pageY, Date.now()));
	 
	    window.x = euroX.filter(e.pageX, new Date().getTime()*0.001);
	    window.y = euroY.filter(e.pageY, new Date().getTime()*0.001);

			if (menu.mode) {
				menu.move(window.x, window.y);
			}

			d3.select('.cursor')
				.attr('cx', window.x)
				.attr('cy', window.y);

			lastMove = Date.now();
		}
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

function drawGuidance(status, start, cur) {

	var FillSize = 20;
	var FillSizeThreshold = 5;
	var FillCapacity = 0.5;
	var FillCapacityThreshold = 0.3;

	var StrokeWidth = 40;
	var StrokeWidthThresold = 5;
	var StrokeCapacity = 0.5;
	var StrokeCapacityThresold = 0.3

	canvas.selectAll('.menu-svg .guidance').remove();

	$.each(status, function(index, value) {
		var offsetX = 0;
		var offsetY = 0;

		if (value.Subtract[0]) {
			offsetX = value.Subtract[0].X;
			offsetY = value.Subtract[0].Y;
		}

		var guide = value.Subtract.map(function(element, index){
			return {
				X: element.X + cur.X - offsetX - (cur.X - offsetX - start.X)*index/9 ,
				Y: element.Y + cur.Y - offsetY - (cur.Y - offsetY - start.Y)*index/9
			};
    })
		
		if (guide.length >= 5) {

			if (guidanceMode == 1) {
				var guide1ffw = guide.slice(0,11);

				canvas.append('path')
				.attr({
					'd': line(guide1ffw),
					'stroke': value.Color,
					'stroke-width': value.Score*(StrokeWidth+StrokeWidthThresold)-StrokeWidthThresold +'px',
					'stroke-opacity': value.Score*(StrokeCapacity+StrokeCapacityThresold)-StrokeCapacityThresold,
					'class': 'guidance'
				});
				canvas.append('circle')
	      	.attr({
	      		'cx': guide1ffw.slice(-1)[0].X,
	      		'cy': guide1ffw.slice(-1)[0].Y,
	      		'r': Math.max(value.Score*(FillSize+FillSizeThreshold)-FillSizeThreshold, 0),
	      		'fill': value.Color,
	      		'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)-FillCapacityThreshold, 0),
	      		'class': 'guidance'
	      	});
	      canvas.append('text')
	      	.attr({
	      		'dx': guide1ffw.slice(-1)[0].X - 8,
	      		'dy': guide1ffw.slice(-1)[0].Y + 5,
	      		'opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)-FillCapacityThreshold, 0),
	      		'class': 'guidance'
	      	})
					.text(value.Name);
			} else if (guidanceMode == 2) {
				canvas.append('path')
				.attr({
					'd': line(guide),
					'stroke': value.Color,
					'stroke-width': value.Score*(StrokeWidth+StrokeWidthThresold)-StrokeWidthThresold +'px',
					'stroke-opacity': value.Score*(StrokeCapacity+StrokeCapacityThresold)-StrokeCapacityThresold,
					'class': 'guidance'
				});
				canvas.append('circle')
	      	.attr({
	      		'cx': guide.slice(-5)[0].X,
	      		'cy': guide.slice(-5)[0].Y,
	      		'r': Math.max(value.Score*(FillSize+FillSizeThreshold)-FillSizeThreshold, 0),
	      		'fill': value.Color,
	      		'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)-FillCapacityThreshold, 0),
	      		'class': 'guidance'
	      	});
	      canvas.append('text')
	      	.attr({
	      		'dx': guide.slice(-5)[0].X - 8,
	      		'dy': guide.slice(-5)[0].Y + 5,
	      		'opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)-FillCapacityThreshold, 0),
	      		'class': 'guidance'
	      	})
					.text(value.Name);
			}
		}
	});	
}

function setTaskCounter(p) {
	if (p == 0) {
		taskCompleted = 0;
	} else {
		taskCompleted += p;
	}
	$('.progress').css('width', Math.min(100, taskCompleted*20) + '%');
}
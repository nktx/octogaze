var socket = io.connect();

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
var modes = ['NOGUIDE', 'GAZEBEACON'];
var guidanceMode = 0;
var audio = new Audio('assets/pi.ogg');
var cursorRadius = 20;

var taskCompleted = 0;

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

		if (s > 0) {
			this.result = r;
			$('#task-result').text(this.result + '(' + this.score + ')');
		} else {
			$('#task-result').text('-');
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
		this.cursorPath = [];
		this.cursorPath.push(new Point(x, y));

		this.startPos = this.prevPos = this.curPos = new Point(x, y);

		canvas
  		.append('path')
			.attr({
				'd': line([this.prevPos, this.curPos]),
				'stroke': '#EDEDED',
				'stroke-width': cursorRadius*2,
				'class': 'gesture'
			});

		this.realtime	= recognizer.Realtime(this.gesturePath);
		drawGuidance(this.realtime.Status, this.startPos, this.curPos, true);

		this.record = new Record(x, y);
		this.record.record(0, 0);
	};

	this.move = function(x, y) {
		this.curPos = new Point(x, y);
		this.record.record(x - this.startPos.X, y - this.startPos.Y);

		this.cursorPath.push(new Point(x, y));
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

    d3.select('.gesture')
 			.attr({
				'd': line(this.cursorPath),
			});

		drawGuidance(this.realtime.Status, this.startPos, this.curPos, false);

		this.prevPos = this.curPos;
	}
	
	this.close = function() {
		this.lock = true;
		$('.trigger').removeClass('hover');

		this.mode = false;

		this.result = recognizer.RecognizeR(this.gesturePath);
		this.record.end(this.result.Name, this.result.Score);

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
    	guidanceMode = (guidanceMode+1)%2;
    	$('#task-interface').text(modes[guidanceMode]);
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

function drawGuidance(status, start, cur, init) {

	var FillSize = 20;
	var FillSizeThreshold = 5;
	var FillCapacity = 0.5;
	var FillCapacityThreshold = 0.3;

	var StrokeWidth = 40;
	var StrokeWidthThreshold = 5;
	var StrokeCapacity = 0.5;
	var StrokeCapacityThreshold = 0.3

	var transitionDuration = 50;

	var m = Math.max.apply(Math,status.map(function(o){return o.Score;}));

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

		if ((guidanceMode == 1) && (guide.length >= 5)) {
			if (!init) {
				d3.select('.path.' + value.Name)
					.transition()
					.duration(transitionDuration)
					.attr({
						'd': line(guide),
						'stroke-width': value.Score*(StrokeWidth+StrokeWidthThreshold)/m-StrokeWidthThreshold +'px',
						'stroke-opacity': value.Score*(StrokeCapacity+StrokeCapacityThreshold)/m-StrokeCapacityThreshold,
					});
			} else {
				canvas.append('path')
					.attr({
						'd': line(guide),
						'stroke': value.Color,
						'stroke-width': value.Score*(StrokeWidth+StrokeWidthThreshold)/m-StrokeWidthThreshold +'px',
						'stroke-opacity': value.Score*(StrokeCapacity+StrokeCapacityThreshold)/m-StrokeCapacityThreshold,
						'class': 'guidance path ' + value.Name
					});
			}
			
			if (guide.length >= 10) {
				if (!init) {
					d3.select('.circle.' + value.Name)
						.transition()
						.duration(transitionDuration)
						.attr({
							'cx': guide[value.Conjunction-1].X,
							'cy': guide[value.Conjunction-1].Y,
							'r': Math.max(value.Score*(FillSize+FillSizeThreshold)/m-FillSizeThreshold, 0),
							'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
						});
					d3.select('.text.' + value.Name)
						.transition()
						.duration(transitionDuration)
						.attr({
							'dx': guide[value.Conjunction-1].X,
							'dy': guide[value.Conjunction-1].Y,
							'opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
						})
						.text(value.Name);
				} else {
					canvas.append('circle')
						.attr({
							'cx': guide[0].X,
							'cy': guide[0].Y,
							'r': Math.max(value.Score*(FillSize+FillSizeThreshold)/m-FillSizeThreshold, 0),
							'fill': value.Color,
							'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
							'class': 'guidance circle ' + value.Name
						})
						.transition()
						.duration(transitionDuration*10)
						.attr({
							'cx': guide[value.Conjunction-1].X,
							'cy': guide[value.Conjunction-1].Y,
						});
					canvas.append('text')
						.attr({
							'dx': guide[0].X,
							'dy': guide[0].Y,
							'opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
							'class': 'guidance text ' + value.Name
						})
						.text(value.Name)
						.transition()
						.duration(transitionDuration*10)
						.attr({
							'dx': guide[value.Conjunction-1].X,
							'dy': guide[value.Conjunction-1].Y,
						});
				}
			} else {
				if (!init) {
					d3.select('.circle.' + value.Name)
						.transition()
						.duration(transitionDuration)
						.attr({
							'cx': guide.slice(-1)[0].X,
							'cy': guide.slice(-1)[0].Y,
							'r': Math.max(value.Score*(FillSize+FillSizeThreshold)/m-FillSizeThreshold, 0),
							'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
						});
					d3.select('.text.' + value.Name)
						.transition()
						.duration(transitionDuration)
						.attr({
							'dx': guide.slice(-1)[0].X,
							'dy': guide.slice(-1)[0].Y,
							'opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
						})
						.text(value.Name);
				} else {
					canvas.append('circle')
						.attr({
							'cx': guide[0].X,
							'cy': guide[0].Y,
							'r': Math.max(value.Score*(FillSize+FillSizeThreshold)/m-FillSizeThreshold, 0),
							'fill': value.Color,
							'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
							'class': 'guidance circle ' + value.Name
						})
						.transition()
						.duration(transitionDuration*10)
						.attr({
							'cx': guide.slice(-1)[0].X,
							'cy': guide.slice(-1)[0].Y,
						});
					canvas.append('text')
						.attr({
							'dx': guide[0].X,
							'dy': guide[0].Y,
							'opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
							'class': 'guidance text ' + value.Name
						})
						.text(value.Name)
						.transition()
						.duration(transitionDuration*10)
						.attr({
							'dx': guide.slice(-1)[0].X,
							'dy': guide.slice(-1)[0].Y,
						});
				}
			}
		} else {
			d3.selectAll('.menu-svg .' + value.Name).remove();
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
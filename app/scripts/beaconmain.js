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
var audio = new Audio('/assets/pi.ogg');
var cursorRadius = 20;

var task;

Record = function(x, y) {
	this.interface = 'EVALUATION'; 
	this.guide = $('#task-guide').text();
	this.subject = $('#task-subject').val();
	this.task = '';
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
		this.task = task.name;
		
		$('#task-duration').text(this.duration);

		if (s > 0) {
			this.score = Math.round(s*1000)/1000;
			this.result = r;
			$('#task-result').text(this.result + '(' + this.score + ')');
		} else {
			$('#task-result').text('-');
		}

		console.log(this);
		if (recordMode) {
			socket.emit('record', this);
			task.commit();
			task.assign();
		}
	};
};

Menu = function() {
	this.lock = true;
	this.mode = false;
	
	this.open = function(x, y) {
		$('#task-assignment').hide();
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
		$('#task-assignment').show();
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

Task = function() {

	var taskspool = [];
	var round = 10;

	for (var i = 0; i < round; i++) {
		for (var j = 0; j < recognizer.Unistrokes.length; j++) {
		taskspool.push(recognizer.Unistrokes[j].Name);
		}
	}

	this.tasks = JSON.parse(JSON.stringify(taskspool.sort(function(){return Math.round(Math.random());})));

	this.name = '';
	this.count = 0;
	this.lock = false;

	this.assign = function() {
		this.name = this.tasks.pop();
		if (this.name) {
			$('#task-gesture').text(this.name);
			$('#task-assignment').text(this.name);
		} else {
			$('#task-gesture').text('');
			$('#task-assignment').text('');
			this.lock = true;
		}
	};

	this.commit = function() {
		this.count++;
		$('.progress').css('width', Math.min(100, this.count*100/taskspool.length) + '%');
	}

	this.reset = function() {
		this.name = '';
		this.count = 0;
		this.lock = false;
		this.tasks = JSON.parse(JSON.stringify(taskspool.sort(function(){return Math.round(Math.random());})));
		$('#task-gesture').text('');
		$('#task-assignment').text('');
		$('.progress').css('width', '0%');
	}

};

$(function() {

	var allowed = true;

	var menu = new Menu();
	task = new Task();

	guidanceMode = 1;
	guideSwitch();

	canvas
  	.append('text')
		.attr({
  		'dx': $(window).width()/2,
  		'dy': $(window).height()/2,
  		'width': 200,
  		'height': 200, 
  		'fill': '#EDEDED',
    	'pointer-events': 'all',
  		'id': 'task-assignment'
  	})
  	.text('');

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

		if (!$('#task-subject').is(':focus')) {
			// avoid keydown event repeated
			if (event.repeat != undefined) { allowed = !event.repeat; }
		  if (!allowed) return;
		  allowed = false;

			// space to open menu 
			if ((event.keyCode == 32) && (!menu.lock) && (!task.lock)) { 
				menu.open(window.x, window.y);
			}

			// r to switch between record mode
	    if (event.keyCode == 82) {
	    	task.reset();
				recordMode = !recordMode;
	    	$('#record-mode').text( recordMode ? 'ON' : 'OFF');
	    	if (recordMode) {
					task.assign();
				} else {
					task.reset();
				}
	    }

			// p to switch between guidance techniques
	    if (event.keyCode == 80) {
	    	guideSwitch();
	    }
	  
	  	// push trigger area up up and down
	    if (event.keyCode == 38) {
				var y = parseInt(d3.selectAll('.trigger').attr('y'));
	    	d3.select('.trigger')
	    		.transition()
	    		.attr({
						'y': y - 50
	    		});
	    }
	    if (event.keyCode == 40) {
				var y = parseInt(d3.selectAll('.trigger').attr('y'));
	    	d3.select('.trigger')
	    		.transition()
	    		.attr({
						'y': y + 50
	    		});
	    }
  	}
	});

	$(document).keyup(function(event){ 
		allowed = true;

		if ((event.keyCode == 32) && (!menu.lock) && (!task.lock)) { 
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

function guideSwitch() {
	task.reset();
	if (recordMode) {
		task.assign();
	}
	guidanceMode = (guidanceMode+1)%2;
	$('#task-guide').text(modes[guidanceMode]);
}

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
				X: element.X + cur.X - offsetX - (value.Score)*(cur.X - offsetX - start.X)*index/9 ,
				Y: element.Y + cur.Y - offsetY - (value.Score)*(cur.Y - offsetY - start.Y)*index/9
			};
    })

		if ((modes[guidanceMode] !== 'NOGUIDE') && (guide.length >= 4)) {
			if (init) {
				canvas.append('path')
					.attr({
						'd': line(guide),
						'stroke': value.Color,
						'stroke-width': value.Score*(StrokeWidth+StrokeWidthThreshold)/m-StrokeWidthThreshold +'px',
						'stroke-opacity': value.Score*(StrokeCapacity+StrokeCapacityThreshold)/m-StrokeCapacityThreshold,
						'class': 'guidance path ' + value.Name
					});
			} else {
				d3.select('.path.' + value.Name)
					.transition()
					.duration(transitionDuration)
					.attr({
						'd': line(guide),
						'stroke-width': value.Score*(StrokeWidth+StrokeWidthThreshold)/m-StrokeWidthThreshold +'px',
						'stroke-opacity': value.Score*(StrokeCapacity+StrokeCapacityThreshold)/m-StrokeCapacityThreshold,
					});
			}

			if (value.Conjunction < guide.length) {
				if (init) {
					canvas.append('circle')
						.attr({
							'cx': guide[0].X,
							'cy': guide[0].Y,
							'r': Math.max(value.Score*(FillSize+FillSizeThreshold)/m-FillSizeThreshold, 0),
							'fill': value.Color,
							'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
							'class': 'guidance cirlce ' + value.Name
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
				} else {
					d3.select('.cirlce.' + value.Name)
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
						});
				}
			} else {
				if (init) {
					canvas.append('circle')
						.attr({
							'cx': guide[0].X,
							'cy': guide[0].Y,
							'r': Math.max(value.Score*(FillSize+FillSizeThreshold)/m-FillSizeThreshold, 0),
							'fill': value.Color,
							'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0),
							'class': 'guidance cirlce ' + value.Name
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
				} else {
					d3.select('.cirlce.' + value.Name)
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
							'opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)/m-FillCapacityThreshold, 0)
						});
				} 
			}
		} else {
			d3.selectAll('.menu-svg .' + value.Name).remove();
		}
	});	
}
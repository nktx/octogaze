function Point(x, y)
{
	this.X = x;
	this.Y = y;
}

$(function() {

	socket = io.connect();

	var menuMode = false;
	var initStart = false;
	var hasResult = false;
	var gesturePath = [];

	var gestureStartTime = 0;
	var curPos, prevPos, startPos;

	var menu = d3.select('body')
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

	var recognizer = new DollarRecognizer;

	var guidanceMode = false;
	var tangentMode = false;
	var recordMode = false;

	// recognizer constants
	// ------------------------------

	var StrokeWidth = 20;
	var StrokeWidthThresold = 5;
	var StrokeCapacity = 0.5;
	var StrokeCapacityThresold = 0.3
	var RecognizerThresold = 0.75;

	// guidance parameters
	// ------------------------------

	var guidanceRemaining = 5;

	// DOM selection
	// ------------------------------

	var $menuStatus = $('#menu-status');
	var $resultName = $('#result-name');
	var $resultScore = $('#result-score');
	var $resultTime = $('#result-time');
	var $pathLength = $('#path-length');
	var $pathAngle = $('#path-angle');
	var $pathVelo = $('#path-velo');
	var $pathAccel = $('#path-accel');
	var $pathCurrent = $('#path-current');
	var $pathStatus = $('#path-status');

	// menu switch
	// ------------------------------

	$(document).keydown(function(event){ 
		if (event.keyCode == 90 && !hasResult) { 
			menuMode = true;
			$menuStatus.text('ON');
		}

		if (event.keyCode == 71) {
			guidanceMode = !guidanceMode;
    	$('#guidance-mode').text( guidanceMode ? 'ON' : 'OFF');
		}
		
		if (event.keyCode == 84) {
			tangentMode = !tangentMode;
    	$('#tangent-mode').text( tangentMode ? 'ON' : 'OFF');
    }

    if (event.keyCode == 82) {
			recordMode = !recordMode;
    	$('#record-mode').text( recordMode ? 'ON' : 'OFF');
    }
	});

	$(document).keyup(function(event){ 
		if (event.keyCode == 90) {

			$menuStatus.text('OFF');
			d3.selectAll('.menu-svg path').remove();

			var result = recognizer.Recognize(gesturePath);
			$resultName.text(result.Name);
			$resultScore.text(result.Score);
			$resultTime.text(Date.now() - gestureStartTime);

			if (recordMode && hasResult) {
				
				var recordData = new Object;

				recordData.Name = result.Name;
				recordData.Score = result.Score;
				recordData.Time = Date.now() - gestureStartTime;
				recordData.Prefix = guidanceMode;
				recordData.Tangent = tangentMode;
				recordData.Path = Resample(gesturePath, 128);

				socket.emit('record', recordData);
			}

			menuMode = false;
			initStart = false;
			gesturePath = [];

			hasResult = false;
		}
	});

	var prevTime = 0;
	var prevVelo = 0;

	// gesture path drawing and recognizing
	// ------------------------------

	$(document).mousemove(function(e) {
		if (menuMode && !hasResult) {
			if (!initStart) {
				startPos = new Point(e.pageX, e.pageY);
				prevPos = new Point(e.pageX, e.pageY);
				gestureStartTime = Date.now();
				initStart = true;

				prevTime = Date.now();
			}
		
			curPos = new Point(e.pageX, e.pageY);
      gesturePath.push(new Point(curPos.X - startPos.X, curPos.Y - startPos.Y));

			var timeDuration = Date.now()-prevTime;
      var curVelo = Distance(curPos, prevPos)*1000/timeDuration;
			var curAccel = curVelo - prevVelo*1000/timeDuration;

			$pathVelo.text(curVelo);
			$pathAccel.text(curAccel);

			prevVelo = curVelo;
			
      var realtimeData = recognizer.Realtime(gesturePath);
      $pathLength.text(realtimeData.Length);
      $pathAngle.text(realtimeData.Angle);
      $pathCurrent.text(realtimeData.Current.Name + ": " + realtimeData.Current.Score);
      
			var pathStatus = '';
			$.each(realtimeData.Status, function(index, value){
				pathStatus += value.Name;
				pathStatus += ': ';
				pathStatus += value.Score;
				pathStatus += '; ';
			});
			$pathStatus.text(pathStatus);

      drawGuidance(realtimeData.Status, e.pageX, e.pageY, curVelo, curAccel);

      menu.append('path')
					.attr({
						'd': line([prevPos, curPos]),
						'stroke': '#EFEFEF',
						'stroke-width': '3px',
						'class': 'gesture'
					});

			prevPos = new Point(curPos.X, curPos.Y);

			if ((realtimeData.Current.Score >= RecognizerThresold) && (realtimeData.Current.Score < 1)) {

				d3.selectAll('.menu-svg .guidance').remove();
				d3.selectAll('.menu-svg .gesture')
					.attr({
						'stroke': realtimeData.Current.Color
					});

				var result = recognizer.Recognize(gesturePath);
				$resultName.text(result.Name);
				$resultScore.text(result.Score);

				hasResult = true;
			}
		}
	});

	function drawGuidance(st, x, y, v, a) {

		menu.selectAll('.menu-svg .guidance').remove();

		var weight = calculateWeight(st);

		$.each(st, function(index, value) {
			var offsetX = 0;
			var offsetY = 0;

			if (value.Subtract[0]) {
				offsetX = value.Subtract[0].X;
				offsetY = value.Subtract[0].Y;
			}

			var guide = value.Subtract.slice(0,guidanceRemaining).map(function(element){
				return {
					X: element.X + x - offsetX,
					Y: element.Y + y - offsetY
				};
      })

      var tangent = new Array;

      if (guide[1]) {
      	var deltaX = guide[1].X - guide[0].X;
				var deltaY = guide[1].Y - guide[0].Y;

				tangent.push({
					X: guide[0].X,
					Y: guide[0].Y
				});

				tangent.push({
					X: guide[0].X + deltaX * guidanceRemaining,
					Y: guide[0].Y + deltaY * guidanceRemaining
				});
      }

      if (guidanceMode) {
      	if (tangentMode) {
	      	menu.append('path')
						.attr({
							'd': line(tangent),
							'stroke': value.Color,
							'stroke-width': weight[index]*(StrokeWidth+StrokeWidthThresold)-StrokeWidthThresold +'px',
							'stroke-opacity': weight[index]*(StrokeCapacity+StrokeCapacityThresold)-StrokeCapacityThresold,
							'class': 'guidance'
						});
	      } else {
	      	menu.append('path')
					.attr({
						'd': line(guide),
						'stroke': value.Color,
						'stroke-width': weight[index]*(StrokeWidth+StrokeWidthThresold)-StrokeWidthThresold +'px',
						'stroke-opacity': weight[index]*(StrokeCapacity+StrokeCapacityThresold)-StrokeCapacityThresold,
						'class': 'guidance'
					});
	      }      	
      }		
		});	
	}

	function calculateWeight(st) {
		var w = new Array;

		$.each(st, function(index, value) {
			w.push(value.Score);
		});

		return w;
	}

});
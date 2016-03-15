function Point(x, y)
{
	this.X = x;
	this.Y = y;
}

$(function() {

	var menuMode = false;
	var initStart = false;
	var gesturePath = [];

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

	// Guidance constants
	// ------------------------------

	var StrokeWidth = 20;
	var StrokeWidthThresold = 5;
	var StrokeCapacity = 0.5;
	var StrokeCapacityThresold = 0.3

	// DOM selection
	// ------------------------------

	var $menuStatus = $('#menu-status');
	var $resultName = $('#result-name');
	var $resultScore = $('#result-score');
	var $pathLength = $('#path-length');
	var $pathAngle = $('#path-angle');
	var $pathCurrent = $('#path-current');
	var $pathStatus = $('#realtime-status');

	var guidanceMode = false;
	var tangentMode = false;


	// menu swith
	// ------------------------------

	$(document).keydown(function(event){ 
		if (event.keyCode == 90) { 
			menuMode = true;
			$menuStatus.text('on');
		}

		if (event.keyCode == 80) {
			guidanceMode = !guidanceMode;
    	$('#guidance-mode').text( guidanceMode ? 'on' : 'off');
		}
		
		if (event.keyCode == 84) {
			tangentMode = !tangentMode;
    	$('#tangent-mode').text( tangentMode ? 'on' : 'off');		}
	});

	$(document).keyup(function(event){ 
		if (event.keyCode == 90) {

			$menuStatus.text('off');
			d3.selectAll('.menu-svg path').remove();

			var result = recognizer.Recognize(gesturePath);
			$resultName.text(result.Name);
			$resultScore.text(result.Score);

			menuMode = false;
			initStart = false;
			gesturePath = [];
		}
	});

	// gesture path drawing and recording
	// ------------------------------

	$(document).mousemove(function(e) {
		if (menuMode) {
			if (!initStart) {
				startPos = new Point(e.pageX, e.pageY);
				prevPos = new Point(e.pageX, e.pageY);
				initStart = true;
			}
		
			curPos = new Point(e.pageX, e.pageY);
      gesturePath.push(new Point(curPos.X - startPos.X, curPos.Y - startPos.Y));

      var realtimeData = recognizer.Realtime(gesturePath);
      $pathLength.text(realtimeData.Length);
      $pathAngle.text(realtimeData.Angle);
      $pathCurrent.text(JSON.stringify(realtimeData.Current));
      
			var pathStatus = '';
			$.each(realtimeData.Status, function(index, value){
				pathStatus += value.Name;
				pathStatus += ': ';
				pathStatus += value.Score;
				pathStatus += '; ';
			});
			$pathStatus.text(pathStatus);

      drawGuidance(realtimeData.Status, e.pageX, e.pageY);

      menu.append('path')
					.attr({
						'd': line([prevPos, curPos]),
						'stroke': '#EFEFEF',
						'stroke-width': '5px'
					});

			prevPos = new Point(curPos.X, curPos.Y);
		}
	});

	function drawGuidance(st, x, y) {

		menu.selectAll('.menu-svg .guidance').remove();
		menu.selectAll('.menu-svg .tangent').remove();

		var weight = calculateWeight(st);

		$.each(st, function(index, value) {
			var offsetX = 0;
			var offsetY = 0;

			if (value.Subtract[0]) {
				offsetX = value.Subtract[0].X;
				offsetY = value.Subtract[0].Y;
			}

			var guide = value.Subtract.slice(0,10).map(function(element){
				return {
					X: element.X + x - offsetX,
					Y: element.Y + y - offsetY
				};
      })

      var tangent = new Array;

      if (guide[1]) {
      	var deltaX = guide[1].X - guide[0].X;
				var deltaY = guide[1].Y - guide[0].Y;
				
				for (var i = 0; i < 10; i++){
					tangent.push({
						X: guide[0].X + deltaX * i,
						Y: guide[0].Y + deltaY * i
					});
				}
      }

      if (guidanceMode) {
      	menu.append('path')
					.attr({
						'd': line(guide),
						'stroke': value.Color,
						'stroke-width': weight[index]*(StrokeWidth+StrokeWidthThresold)-StrokeWidthThresold +'px',
						'stroke-opacity': weight[index]*(StrokeCapacity+StrokeCapacityThresold)-StrokeCapacityThresold,
						'class': 'guidance'
					});
      }

      if (tangentMode) {
      	menu.append('path')
					.attr({
						'd': line(tangent),
						'stroke': value.Color,
						'stroke-width': weight[index]*(StrokeWidth+StrokeWidthThresold)-StrokeWidthThresold +'px',
						'stroke-opacity': weight[index]*(StrokeCapacity+StrokeCapacityThresold)-StrokeCapacityThresold,
						'class': 'tangent'
					});
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
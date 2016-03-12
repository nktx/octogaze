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

	// DOM selection
	// ------------------------------

	var $menuStaus = $('#menu-status');
	var $resultName = $('#result-name');
	var $resultScore = $('#result-score');
	var $pathLength = $('#path-length');
	var $pathAngle = $('#path-angle');
	var $realtimeStatus = $('#realtime-status');

	// menu swith
	// ------------------------------

	$(document).keydown(function(event){ 
		if (event.keyCode == 90) { 
			menuMode = true;
			$menuStaus.text('on');
		}
	});

	$(document).keyup(function(event){ 
		if (event.keyCode == 90) {

			$menuStaus.text('off');
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
      $realtimeStatus.text(JSON.stringify(realtimeData.Score));

      menu.append('path')
					.attr({
						'd': line([prevPos, curPos]),
						'stroke': '#EFEFEF',
						'stroke-width': '5px'
					});

			prevPos = new Point(curPos.X, curPos.Y);
		}
	});

});
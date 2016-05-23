function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function setGestures (r) {
	var gestures = [];

	// Line
	gestures.push({'Color': "#E74C3C", 'Name': "NE", 'Points': new Array(new Point(0,0), new Point(SquareSize,SquareSize*(-1))) });
	gestures.push({'Color': "#2ECC71", 'Name': "SE", 'Points': new Array(new Point(0,0), new Point(SquareSize,SquareSize)) });
	gestures.push({'Color': "#3498DB", 'Name': "SW", 'Points': new Array(new Point(0,0), new Point(SquareSize*(-1),SquareSize)) });
	gestures.push({'Color': "#F1C40F", 'Name': "NW", 'Points': new Array(new Point(0,0), new Point(SquareSize*(-1),SquareSize*(-1))) });
	
	// Corner
	gestures.push({'Color': "#3498DB", 'Name': "RR", 'Points': new Array(new Point(0,0), new Point(SquareSize,0), new Point(SquareSize,SquareSize), new Point(0,SquareSize), new Point(0,0)) });
	gestures.push({'Color': "#E74C3C", 'Name': "LR", 'Points': new Array(new Point(0,0), new Point(SquareSize*(-1),0), new Point(SquareSize*(-1),SquareSize), new Point(0,SquareSize), new Point(0,0)) });
	gestures.push({'Color': "#2ECC71", 'Name': "RT", 'Points': new Array(new Point(0,0), new Point(SquareSize/2,SquareSize*(-1)), new Point(SquareSize,0), new Point(0,0)) });
	gestures.push({'Color': "#F1C40F", 'Name': "LT", 'Points': new Array(new Point(0,0), new Point(SquareSize*(-1)/2,SquareSize*(-1)), new Point(SquareSize*(-1),0), new Point(0,0)) });
	
	// Arc
	var clockwise = new Array;
	var counterclockwise = new Array;
	for (var i = 0; i <= 360; i += 10) {clockwise.push(new Point((SquareSize/2)*Math.cos(toRadians(i)) - SquareSize/2, (SquareSize/2)*Math.sin(toRadians(i)))); }
	for (var i = 180; i >= -180; i -= 10) {counterclockwise.push(new Point((SquareSize/2)*Math.cos(toRadians(i)) + SquareSize/2, (SquareSize/2)*Math.sin(toRadians(i)))); }
	gestures.push({'Color': "#3498DB", 'Name': "RC", 'Points': clockwise });
	gestures.push({'Color': "#E74C3C", 'Name': "LC", 'Points': counterclockwise });

	for (var i = 0; i < gestures.length; i++ ){
		r.AddGesture(gestures[i].Color, gestures[i].Name, gestures[i].Points);
	}
}

$(function() {

	var line = d3.svg.line()
			.x(function(d) {
				return d.X;
			})
			.y(function(d) {
				return d.Y;
			})
			.interpolate('basis');

	var svg = d3.select('#result-svg');

	var svg = d3.select('body')
								.append('svg')
								.attr('height', $(window).height())
								.attr('width', $(window).width())
								.attr('class', 'result-svg');

	function drawResult(result, strokes){

		var presence = {};

		var offsetX = $(window).width()/2;
		var offsetY = $(window).height()/2;

		svg
			.append('circle')
	  	.attr({
	  		'cx': offsetX,
	  		'cy': offsetY,
	  		'r': 20,
	  		'fill': '#F0F1F3',
	  		'class': 'cursor'
	  	});

	  result.forEach(function (data){
			if (!presence[data.gesture]){
				presence[data.gesture] = true;
			}
	  });

		for (var key in presence) {
			for (var i = 0; i < strokes.length; i++) {
				if (strokes[i].Name == key) {
					var translatedTemplate = strokes[i].Points.map(function(p){
						return {
							X: p.X + offsetX,
							Y: p.Y + offsetY
						}
					});

					svg.append('path')
						.attr({
							'd': line(translatedTemplate),
							'stroke': '#F0F1F3',
							'stroke-width': '15px',
							'fill': 'none',
							'class': 'template'
						});
				}
			}
		}

		result.forEach(function (data){
			var translatedPath = data.path.map(function(p){
				return {
					X: p.X + offsetX,
					Y: p.Y + offsetY
				}
			});

			var pathColor = '';

			if (data.guide == '2FFW') {
				pathColor = '#3498DB';
			} else if (data.guide == '1FFW'){
				pathColor = '#E74C3C';
			}	else {
				pathColor = '#F1C40F';
			}

			for (var i = 0; i < strokes.length; i++) {
				if ((data.result == strokes[i].Name) || (data.resultnorotate == strokes[i].Name)) {
					svg.append('path')
						.attr({
							'd': line(translatedPath),
							'stroke': pathColor,
							'stroke-width': '1px',
							'fill': 'none',
							'class': 'result'
						});
				}
			}
		});
	}

	socket = io.connect();
	socket.emit('readfile');

	socket.on('filedata', function(data){
		console.log(data)

		var recognizer = new DollarRecognizer;
		setGestures(recognizer);
		drawResult(data, recognizer.Unistrokes);
	});

});
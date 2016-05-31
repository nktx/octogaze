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

		var gestureCollection = {};

		var offsetX = $(window).width()/2;
		var offsetY = $(window).height()/2;

		var guideColor = {
			'NOGUIDE': '#F1C40F',
			'1FFW': '#E74C3C',
			'2FFW': '#3498DB'
		};

	  result.forEach(function (data){
			if ((!gestureCollection[data.gesture]) && (data.interface == displayInterface)){
				gestureCollection[data.gesture] = {};
			}
	  });

		result.forEach(function (data){
			if (data.interface == displayInterface) {

				var resizedPath = ScaleTo(data.path, 250);
				// var translatedPath = resizedPath.map(function(p){		
				var translatedPath = data.path.map(function(p){
					return {
						X: p.X + offsetX,
						Y: p.Y + offsetY
					}
				});

				if (!gestureCollection[data.gesture][data.guide]){
					gestureCollection[data.gesture][data.guide] = [];
				}

				gestureCollection[data.gesture][data.guide].push(translatedPath);
			}
		});

		// render gesture template
		for (var gesture in gestureCollection) {
			for (var i = 0; i < strokes.length; i++) {
				if (strokes[i].Name == gesture) {
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

		// render gesture paths
		for (var gesture in gestureCollection) {
			for (var guide in gestureCollection[gesture]) {
				var sum = Array.apply(null, Array(64)).map(function() { return {'X': 0, 'Y': 0} });
				var c = 0;
				for (var i = 0; i < gestureCollection[gesture][guide].length; i++) {
					gestureCollection[gesture][guide][i] = Resample(gestureCollection[gesture][guide][i], 64);
					for (var j = 0; j < gestureCollection[gesture][guide][i].length; j++) {
						sum[j].X += gestureCollection[gesture][guide][i][j].X;
						sum[j].Y += gestureCollection[gesture][guide][i][j].Y;		
					}
					c++;
				}
				gestureCollection[gesture][guide] = sum.map(function(v){ return {'X': v.X/c, 'Y': v.Y/c };});

				svg.append('path')
						.attr({
							'd': line(gestureCollection[gesture][guide]),
							'stroke': guideColor[guide],
							'stroke-width': '1px',
							'fill': 'none',
							'class': 'result'
						});
			}
		}

		console.log(gestureCollection);
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
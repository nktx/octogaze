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

		var offsetX = $(window).width()/2;
		var offsetY = $(window).height()/2;

		for (var i = 0; i < strokes.length; i++) {

			var translatedTemplate = strokes[i].Points.map(function(p){
				return {
					X: p.X + offsetX,
					Y: p.Y + offsetY
				}
			});

			svg.append('path')
				.attr({
					'd': line(translatedTemplate),
					'stroke': strokes[i].Color,
					'stroke-width': '15px',
					'stroke-opacity': '0.1',
					'fill': 'none',
					'class': 'template'
				});
		}

		result.forEach(function (data){			
			var translatedPath = data.path.map(function(p){
				return {
					X: p.X + offsetX,
					Y: p.Y + offsetY
				}
			});

			for (var i = 0; i < strokes.length; i++) {
				if (data.result == strokes[i].Name) {
					svg.append('path')
						.attr({
							'd': line(translatedPath),
							'stroke': strokes[i].Color,
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
		drawResult(data, recognizer.Unistrokes);
	});

});
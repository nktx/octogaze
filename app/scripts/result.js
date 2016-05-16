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
					'stroke': '#34495e',
					'stroke-width': '35px',
					'stroke-opacity': '0.08',
					'fill': 'none',
					'class': 'template'
				});
		}

		result.forEach(function (data){
			if (data.interface == '') {

				var resizedPath = ScaleTo(data.path, 500);
				var translatedPath = resizedPath.map(function(p){
					return {
						X: p.X + offsetX + 250,
						Y: p.Y + offsetY
					}
				});

				for (var i = 0; i < strokes.length; i++) {
					if (data.result == strokes[i].Name) {

						if (data.interface == 'NOGUIDE') {
							svg.append('path')
							.attr({
								'd': line(translatedPath),
								'stroke': '#f1c40f',
								'stroke-width': '1px',
								'fill': 'none',
								'class': 'result'
							});
						} else if (data.interface == 'REMAIN') {
							svg.append('path')
							.attr({
								'd': line(translatedPath),
								'stroke': '#e74c3c',
								'stroke-width': '1px',
								'fill': 'none',
								'class': 'result'
							});
						} else {
							svg.append('path')
							.attr({
								'd': line(translatedPath),
								'stroke': '#3498db',
								'stroke-width': '1px',
								'fill': 'none',
								'class': 'result'
							});
						}
					}
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
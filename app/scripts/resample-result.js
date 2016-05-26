$(function() {

	var line = d3.svg.line()
			.x(function(d) {
				return d.X;
			})
			.y(function(d) {
				return d.Y;
			});

	var margin = {top: 30, right: 20, bottom: 30, left: 50},
	width = 1080 - margin.left - margin.right,
	height = 460 - margin.top - margin.bottom;

	var x = d3.scale.linear().range([0, width]).domain([0, width/100]);
	var y = d3.scale.linear().range([height, 0]).domain([0, height]);

	var xAxis = d3.svg.axis().scale(x)
	    .orient('bottom').ticks(20);

	var yAxis = d3.svg.axis().scale(y)
	    .orient('left').ticks(5);

	var svg = d3.select('body')
	    .append('svg')
	        .attr('width', width + margin.left + margin.right)
	        .attr('height', height + margin.top + margin.bottom)
	    .append("g")
        .attr('transform', 
              "translate(" + margin.left + "," + margin.top + ")");;

  svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', "translate(0," + height + ")")
      .call(xAxis);

  svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

	function drawPath(path, color) {
		svg.append('path')
						.attr({
							'd': line(path),
							'stroke': color,
							'stroke-width': '1px',
							'fill': 'none',
							'class': 'template'
						});
	}

	function drawResult(result) {

		var line64 = [];
		var line32 = [];
		var line16 = [];
		var line8 = [];
		var line4 = [];

		var offsetX = $(window).width()/2;
		var offsetY = $(window).height()/2;

		console.log(result[0].curLength);

	  result[2].curLength.forEach(function (data, index){
			if (index !== 0) {
				line64.push({'X': data.Time/10, 'Y': height - data.Length64*2});
				line32.push({'X': data.Time/10, 'Y': height - data.Length32*2});
				line16.push({'X': data.Time/10, 'Y': height - data.Length16*2});
				line8.push({'X': data.Time/10, 'Y': height - data.Length8*2});
				line4.push({'X': data.Time/10, 'Y': height - data.Length4*2});	
			}
	  });

		drawPath(line64, '#34495E');
		drawPath(line32, '#5B6D7D');
		drawPath(line16, '#82909D');
		drawPath(line8, '#ABB4BE');
		drawPath(line4, '#D4DADE');
	}

	socket = io.connect();
	socket.emit('readfile');

	socket.on('filedata', function(data){
		console.log(data)
		drawResult(data);
	});

});
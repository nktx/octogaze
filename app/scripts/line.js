function drawGuidance(status, start, cur) {

	var FillSize = 20;
	var FillSizeThreshold = 5;
	var FillCapacity = 0.5;
	var FillCapacityThreshold = 0.3;

	canvas.selectAll('.menu-svg .guidance').remove();

	$.each(status, function(index, value) {
		var offsetX = 0;
		var offsetY = 0;

		if (value.Subtract[0]) {
			offsetX = value.Subtract[0].X;
			offsetY = value.Subtract[0].Y;
		}

		var guide = value.Subtract.map(function(element){
			return {
				X: element.X + cur.X - offsetX,
				Y: element.Y + cur.Y - offsetY
			};
    })
		
		if (guide[0]) {
			canvas.append('circle')
      	.attr({
      		'cx': guide.slice(-1)[0].X,
      		'cy': guide.slice(-1)[0].Y,
      		'r': Math.max(value.Score*(FillSize+FillSizeThreshold)-FillSizeThreshold, 0),
      		'fill': value.Color,
      		'fill-opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)-FillCapacityThreshold, 0),
      		'class': 'guidance'
      	});

      canvas.append('text')
      	.attr({
      		'dx': guide.slice(-1)[0].X - 5,
      		'dy': guide.slice(-1)[0].Y + 5,
      		'opacity': Math.max(value.Score*(FillCapacity+FillCapacityThreshold)-FillCapacityThreshold, 0),
      		'class': 'guidance'
      	})
				.text(value.Name);
		}
	});	
}
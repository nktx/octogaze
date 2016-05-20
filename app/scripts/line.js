function drawGuidance(status, start, cur) {

	var StrokeWidth = 40;
	var StrokeWidthThresold = 5;
	var StrokeCapacity = 0.5;
	var StrokeCapacityThresold = 0.3

	canvas.selectAll('.menu-svg .guidance').remove();

	$.each(status, function(index, value) {
		var offsetX = 0;
		var offsetY = 0;

		if (value.Subtract[0]) {
			offsetX = value.Subtract[0].X;
			offsetY = value.Subtract[0].Y;
		}

		var guide = value.Subtract.map(function(element, index){
			return {
				X: element.X + cur.X - offsetX - (cur.X - offsetX - start.X)*index/9 ,
				Y: element.Y + cur.Y - offsetY - (cur.Y - offsetY - start.Y)*index/9 
			};
    })
		
		if (guide[0]) {

			canvas.append('path')
				.attr({
					'd': line(guide),
					'stroke': value.Color,
					'stroke-width': value.Score*(StrokeWidth+StrokeWidthThresold)-StrokeWidthThresold +'px',
					'stroke-opacity': value.Score*(StrokeCapacity+StrokeCapacityThresold)-StrokeCapacityThresold,
					'class': 'guidance'
				});

      canvas.append('text')
      	.attr({
      		'dx': guide.slice(-1)[0].X - 5,
      		'dy': guide.slice(-1)[0].Y + 5,
      		'opacity': Math.max(value.Score*(StrokeCapacity+StrokeCapacityThresold)-StrokeCapacityThresold, 0),
      		'class': 'guidance'
      	})
				.text(value.Name);
		}
	});	
}
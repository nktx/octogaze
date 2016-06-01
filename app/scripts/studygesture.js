var gestures = [];
var gestureIndex = 0;

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

if (displayedInterface == 'LINE') {
	gestures.push({
		'Color': "#E74C3C",
		'Name': "NE",
		'Points': new Array(new Point(0,0), new Point(SquareSize,SquareSize*(-1)))
	});

	gestures.push({
		'Color': "#2ECC71",
		'Name': "SE",
		'Points': new Array(new Point(0,0), new Point(SquareSize,SquareSize))
	});

	gestures.push({
		'Color': "#3498DB",
		'Name': "SW",
		'Points': new Array(new Point(0,0), new Point(SquareSize*(-1),SquareSize))
	});

	gestures.push({
		'Color': "#F1C40F",
		'Name': "NW",
		'Points': new Array(new Point(0,0), new Point(SquareSize*(-1),SquareSize*(-1)))
	});
} else if (displayedInterface == 'CORNER') {
	gestures.push({
		'Color': "#3498DB",
		'Name': "RR",
		'Points': new Array(new Point(0,0), new Point(SquareSize,0), new Point(SquareSize,SquareSize), new Point(0,SquareSize), new Point(0,0))
	});

	gestures.push({
		'Color': "#E74C3C",
		'Name': "LR",
		'Points': new Array(new Point(0,0), new Point(SquareSize*(-1),0), new Point(SquareSize*(-1),SquareSize), new Point(0,SquareSize), new Point(0,0))
	});

	gestures.push({
		'Color': "#2ECC71",
		'Name': "RT",
		'Points': new Array(new Point(0,0), new Point(SquareSize/2,SquareSize*(-1)), new Point(SquareSize,0), new Point(0,0))
	});

	gestures.push({
		'Color': "#F1C40F",
		'Name': "LT",
		'Points': new Array(new Point(0,0), new Point(SquareSize*(-1)/2,SquareSize*(-1)), new Point(SquareSize*(-1),0), new Point(0,0))
	});
} else {
	var clockwise = new Array;
	var counterclockwise = new Array;

	for (var i = 0; i <= 330; i += 10) {
		clockwise.push(new Point((SquareSize/2)*Math.cos(toRadians(i)) - SquareSize/2, (SquareSize/2)*Math.sin(toRadians(i))));
	}

	for (var i = 180; i >= -150; i -= 10) {
		counterclockwise.push(new Point((SquareSize/2)*Math.cos(toRadians(i)) + SquareSize/2, (SquareSize/2)*Math.sin(toRadians(i))));
	}

	gestures.push({
		'Color': "#3498DB",
		'Name': "RC",
		'Points': clockwise
	});

	gestures.push({
		'Color': "#E74C3C",
		'Name': "LC",
		'Points': counterclockwise
	});
}
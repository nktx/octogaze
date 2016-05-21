var gestures = [];
var gestureIndex = 0;

gestures.push({
	'Color': "#E74C3C",
	'Name': "NE",
	'Points': new Array(new Point(0,0), new Point(SquareSize,SquareSize*(-1)))
});

gestures.push({
	'Color': "#F1C40F",
	'Name': "NW",
	'Points': new Array(new Point(0,0), new Point(SquareSize*(-1),SquareSize*(-1)))
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

// recognizer.AddGesture("#E74C3C", "NE", new Array(new Point(0,0), new Point(SquareSize,SquareSize*(-1))));
// recognizer.AddGesture("#F1C40F", "NW", new Array(new Point(0,0), new Point(SquareSize*(-1),SquareSize*(-1))));
// recognizer.AddGesture("#2ECC71", "SE", new Array(new Point(0,0), new Point(SquareSize,SquareSize)));
// recognizer.AddGesture("#3498DB", "SW", new Array(new Point(0,0), new Point(SquareSize*(-1),SquareSize)));
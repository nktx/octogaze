var gestures = [];
var gestureIndex = 0;

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

// gestures.push({
// 	'Color': ,
// 	'Name': ,
// 	'Points': 
// });
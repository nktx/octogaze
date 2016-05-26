var gestures = [];
var recognizer = new DollarRecognizer;

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

var clockwise = new Array;
var counterclockwise = new Array;

for (var i = 0; i <= 330; i += 10) {
	clockwise.push(new Point((SquareSize/2)*Math.cos(toRadians(i)) - SquareSize/2, (SquareSize/2)*Math.sin(toRadians(i))));
}

for (var i = 180; i >= -150; i -= 10) {
	counterclockwise.push(new Point((SquareSize/2)*Math.cos(toRadians(i)) + SquareSize/2, (SquareSize/2)*Math.sin(toRadians(i))));
}

gestures.push({
	'Color': "#9B59B6",
	'Name': "RC",
	'Points': clockwise
});

gestures.push({
	'Color': "#E67E22",
	'Name': "LC",
	'Points': counterclockwise
});

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

recognizer.DeleteUserGestures();

for (var i = 0; i < gestures.length; i++ ){
	recognizer.AddGesture(gestures[i].Color, gestures[i].Name, gestures[i].Points);
}
var gestures = [];
var gestureIndex = 0;

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
	'Color': "#3498DB",
	'Name': "RC",
	'Points': clockwise
});

gestures.push({
	'Color': "#E74C3C",
	'Name': "LC",
	'Points': counterclockwise
});
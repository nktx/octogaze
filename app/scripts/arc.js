var gestures = [];
var gestureIndex = 0;

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

var clockwise = new Array;
var counterclockwise = new Array;

for (var i = 90; i <= 450; i += 10) {
	clockwise.push(new Point((SquareSize/2)*Math.cos(toRadians(i)), (SquareSize/2)*Math.sin(toRadians(i)) - SquareSize/2 ));
}

for (var i = 90; i >= -270; i -= 10) {
	counterclockwise.push(new Point((SquareSize/2)*Math.cos(toRadians(i)), (SquareSize/2)*Math.sin(toRadians(i)) - SquareSize/2 ));
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
var gestures = [];
var recognizer = new DollarRecognizer;

function parseSvgToGesture(str) {
	var points = str.split(" ");
	
	var index = points[0].indexOf(',');
	var offsetX = parseInt(points[0].slice(0, index));
	var offsetY = parseInt(points[0].slice(index+1, points[0].length));

	var arr = [];
	for (var i = 0; i < points.length; i++) {
		var index = points[i].indexOf(',');
		arr.push(new Point(parseInt(points[i].substring(0, index)), parseInt(points[i].substr(index+1))));
	}

	arr = arr.map(function(d){ return new Point(d.X-offsetX, d.Y-offsetY)});
	return arr;
}

var undo = parseSvgToGesture("5.399,0 103.6,0 0,127.34 105.199,127.34");
var save = parseSvgToGesture("83.9,8.65 68.3,2.051 48.8,0 31.5,1.605 15.8,6.956 4.4,17.032 0,32.816 4.2,47.887 15.3,57.16 30.8,62.6 48,66.346 66.899,70.804 82.399,76.511 92.899,85.964 96.8,101.837 92.399,117.353 80.8,127.964 64.6,134.028 46.399,135.901 23.899,133.404 6.1,125.468");
var selectall = parseSvgToGesture("0,127.34 59.7,0 119.4,127.34");
var copy = parseSvgToGesture("109.7,14.714 92,4.191 67.2,0 36.2,6.242 15.4,22.293 3.7,44.141 0,67.772 4.8,94.078 18.1,114.767 38.5,128.321 64.6,133.226 89,129.302 107.7,118.423");
var paste = parseSvgToGesture("0,0 57.8,0 89.8,8.739 101.2,34.778 97.8,49.67 88.4,60.549 74.1,67.148 55.8,69.377 0,69.377 0,127.34");

gestures.push({
	'Color': "#9B59B6",
	'Name': "Save",
	'Points': ScaleTo(save, SquareSize)
});

gestures.push({
	'Color': "#F1C40F",
	'Name': "Undo",
	'Points': ScaleTo(undo, SquareSize)
});

gestures.push({
	'Color': "#3498DB",
	'Name': "SelectAll",
	'Points': ScaleTo(selectall, SquareSize)
});

gestures.push({
	'Color': "#E74C3C",
	'Name': "Paste",
	'Points': ScaleTo(paste, SquareSize)
});

gestures.push({
	'Color': "#2ECC71",
	'Name': "Copy",
	'Points': ScaleTo(copy, SquareSize)
});

recognizer.DeleteUserGestures();

for (var i = 0; i < gestures.length; i++ ){
	recognizer.AddGesture(gestures[i].Color, gestures[i].Name, gestures[i].Points);
}
function Point(x, y)
{
	this.X = x;
	this.Y = y;
}

$(function() {

	var menuMode = false;
	var initStart = false;
	var gesturePath = [];

	var curPos, prevPos, startPos;

	var menu = d3.select('body')
							.append('svg')
							.attr('height', $(window).height())
							.attr('width', $(window).width())
							.attr('class', 'menu-svg');

	var line = d3.svg.line()
						.x(function(d) {
							return d.X;
						})
						.y(function(d) {
							return d.Y;
						})
						.interpolate('basis');

	$(document).keydown(function(event){ 
		if (event.keyCode == 90) { 
			menuMode = true;
			$('#menu-status').text('on');
		}
	});

	$(document).keyup(function(event){ 
		if (event.keyCode == 90) { 
			menuMode = false;
			initStart = false;
			$('#menu-status').text('off');
			d3.selectAll('.menu-svg path').remove();
			console.log(gesturePath);
		}
	});

	$(document).mousemove(function(e) {
		if (menuOn) {
			if (!initStart) {
				startPos = new Point(e.pageX, e.pageY);
				prevPos = new Point(e.pageX, e.pageY);
				initStart = true;
			}
		
			curPos = new Point(e.pageX, e.pageY);
      gesturePath.push(new Point(curPos.X - startPos.X, curPos.Y - startPos.Y));

      menu.append('path')
					.attr({
						'd': line([prevPos, curPos]),
						'stroke': '#EFEFEF',
						'stroke-width': '5px'
					});

			prevPos = new Point(curPos.X, curPos.Y);
		}
	});

});
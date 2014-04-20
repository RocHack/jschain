document.onkeydown = checkKey;

var currentSelection = 0;
var numSelections = 0;

function checkKey(e)
{
    e = e || window.event;

    var selectedDiv = $($('#options').children()[currentSelection]).find('pre');

    if (e.keyCode == '13') //enter key
    {
    	complete(selectedDiv);
    }
    else
    {
	    $($('#options').children()[currentSelection]).find('pre').css('background-color','clear');

	    if (e.keyCode == '38' && currentSelection > 0)
	    {
	        // up arrow
			currentSelection -= 1;
	    }
	    else if (e.keyCode == '40' && currentSelection < numSelections-1)
	    {
	        // down arrow
	    	currentSelection += 1;
	    }

	    $($('#options').children()[currentSelection]).find('pre').css('background-color','#D7EBFC');
    }
}

function complete(option)
{
	console.log("generating from position "+window.getCurrentPosition());

	var cursor = $('#cursor');

	var snippet = $($(option).html());
	snippet.insertAfter(cursor);
	$("<br>").insertAfter(cursor);
	//$('#editor').append("\n");
	newOptions();

	$(snippet).find('.statement').each(function() {
		//deepest node, ie, one we can click
		if ($(this).children().length == 0)
		{
			$(this).click(function() {
				var node = $(this).data('node');

				window.setCurrentPathToNode(node);
				console.log(node);

				cursor.insertAfter($(this));
			});
		}
	});

	var node = $(option).data('node');
	window.registerNodeWithCurrentPath(node);
	window.setCurrentPathToNode(node);

	cursor.insertAfter(snippet);
}

function moveCursorToPath(path)
{

}

function newOptions()
{
	$('#options').html("");

	var snips = window.getSnippets(3);
	for (var i = 0; i < snips.length; i++)
	{
		code = snips[i];
		var pre = $('<pre></pre>').html(code);
		$('#options').append($('<li></li>').append(pre));
	}

	$('#options').append($('<li><pre contenteditable="true"></pre></li>'));

	numSelections = snips.length+1;

	currentSelection = 0;
    $($('#options').children()[currentSelection]).find('pre').css('background-color','#D7EBFC');
}

$(document).ready(function() {
	newOptions();
});

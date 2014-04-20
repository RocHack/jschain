document.onkeydown = checkKey;

var currentSelection = 0;
var numSelections = 0;

function checkKey(e)
{
    e = e || window.event;

    var selectedDiv = $($('#options').children()[currentSelection]);

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
	$('#editor').append($(option).text()+"\n");
	newOptions();
}

function newOptions()
{
	$('#options').html("");

	var snips = window.getSnippets(3);
	for (var i = 0; i < snips.length; i++)
	{
		code = snips[i];
		var pre = ($('<pre></pre>')).text(code);
		$('#options').append($('<li></li>')).append(pre);
	}

	$('#options').append($('<li><pre contenteditable="true"></pre></li>'));

	numSelections = snips.length+1;

	currentSelection = 0;
    $($('#options').children()[currentSelection]).find('pre').css('background-color','#D7EBFC');
}

$(document).ready(function() {
	newOptions();
});

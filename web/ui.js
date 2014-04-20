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

function isStatement(nodeType)
{
	if (nodeType == "BlockStatement") return false;
	return nodeType.match(/(Statement|Declaration)$/);
}

var cursor;
function addHandlers() {
	$('#options').on('click', 'pre', function() {
		var options = $('#options').children();
		$(options[currentSelection]).find('pre').css('background-color','clear');
		currentSelection = $(this.parentNode).index();
		$(options[currentSelection]).find('pre').css('background-color','#D7EBFC');
	});
	$("#editor").on('click', '.statement', function(e) {
		var el = $(this);
		var node = el.data('node');
		if (isStatement(node.type))
		{
			window.setCurrentPathToNode(node);
			cursor.insertAfter(el);
			newOptions();
			e.stopPropagation();
		}
	});
}

function complete(option)
{
	var selectedLine = cursor.parent().text();
	selectedLine = selectedLine.replace(/^\{\n/, "");
	var spaces = "";
	var numspaces = selectedLine.match(/^ */)[0].length;
	if (numspaces == 1) numspaces = 0;
	for (var i = 0; i < numspaces; i++)
		spaces += " ";
	console.log("line = ",selectedLine,"  spaces = ",numspaces);


	// console.log("generating from position ",window.getCurrentPosition());

	// console.log("cursor");

	var node = $($(option).children()[0]).data('node');
	console.log("snippet = ",$($(option).children()[0])," node = ",node);

	window.insertSnippet(node);

	if (node.type != "Program")
		window.setCurrentPathToNode(node);
	
	var snippet = $(option).children();
	snippet.each(function () {
		if (numspaces > 0)
			//$(this).prepend($("<span>"+spaces+"</span>"));
			$(this).css('padding-left','16px').css('display','inline-block');
		$(this).insertAfter(cursor);
	});
	$("<br>").insertAfter(cursor);
	newOptions();

	cursor.insertAfter(snippet);
}

function moveCursorToPath(path)
{

}

function newOptions()
{
	$('#options').html("");

	var snips = window.getSnippets(6);
	for (var i = 0; i < snips.length; i++)
	{
		code = snips[i];
		var pre = $('<pre></pre>').html(code);
		$('#options').append($('<li></li>').append(pre));
	}

	//$('#options').append($('<li><pre contenteditable="true"></pre></li>'));

	numSelections = snips.length;

	currentSelection = 0;
    $($('#options').children()[currentSelection]).find('pre').css('background-color','#D7EBFC');
}

$(document).ready(function() {
	cursor = $('#cursor');
	addHandlers();
	newOptions();
});

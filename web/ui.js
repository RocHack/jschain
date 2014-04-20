document.onkeydown = checkKey;

var snippets = [];
var currentSelection = 0;
var numSelections = 0;

function checkKey(e)
{
    e = e || window.event;

    var selectedDiv = $($('#options').children()[currentSelection]);

    if (e.keyCode == '13') //enter key
    {
		complete(snippets[currentSelection]);
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

// syntax tree of the current program
var program = window.startProgram();

var currentStubSelection = 0;

// references to current stubs
var stubReferences = [{
	path: ["Program", "body"],
	parent: program.body,
	property: 0,
	isList: true
}];

// patch the snippet in at the cursor node
function replaceStub(stubRef, snippet) {
	if (snippet instanceof Array) {
		for (var i = 0; i < snippet.length; i++) {
			stubRef.parent[stubRef.property + i] = snippet[i];
		}
	} else {
		stubRef.parent[stubRef.property] = snippet;
	}
}

// draw our program to the editor
function redraw() {
	var html = window.renderProgram(program);
	$("#editor").html(html);
}

var splice = Function.prototype.apply.bind(Array.prototype.splice);

function complete(snippet)
{
	//$('#editor').append($(option).text()+"\n");
	var stubRef = stubReferences[currentStubSelection];
	replaceStub(stubRef, snippet);
	// update stub selection and references list
	// remove replaced stub
	// add new stubs from the inserted snippet
	var newStubs = window.findStubs(snippet, stubRef);
	splice(stubReferences, [currentStubSelection, 1].concat(newStubs));
	currentStubSelection %= stubReferences.length;
	newOptions();
	redraw();
}

function newOptions()
{
	$('#options').html("");

	var stubRef = stubReferences[currentStubSelection];
	if (!stubRef) return;
	snippets = window.generateSnippets(3, stubRef.path, stubRef.isList);
	for (var i = 0; i < snippets.length; i++)
	{
		code = window.renderSnippet(snippets[i]);
		var pre = $('<pre></pre>').text(code);
		$('#options').append($('<li></li>').append(pre));
	}

	$('#options').append($('<li><pre contenteditable="true"></pre></li>'));

	numSelections = snippets.length+1;

	currentSelection = 0;
    $($('#options').children()[currentSelection]).find('pre').css('background-color','#D7EBFC');
}

$(document).ready(function() {
	newOptions();
	redraw();
});

document.onkeydown = checkKey;

var currentSelection = 0;
var numSelections = 0;
var editor;
var cursor;

function checkKey(e)
{
    e = e || window.event;

    var selectedDiv = $($('#options').children()[currentSelection]).find('pre');

    if (e.keyCode == 13)
    {
		//enter key
		if (numSelections > 0)
	    	complete(selectedDiv);
    }
	else if (e.keyCode == 32)
	{
		// space key
		newOptions();
		e.preventDefault();
    }
	else if (e.keyCode == 37)
	{
		// left arrow
		moveCursor(false);
	}
	else if (e.keyCode == 39)
	{
		// right arrow
		moveCursor(true);
	}
	else if (e.keyCode == 8)
	{
		e.preventDefault();

		// delete key
		deleteKey();
	}
    else if (e.keyCode == 38 || e.keyCode == 40)
    {
	    $($('#options').children()[currentSelection]).find('pre').css('background-color','clear');

	    if (e.keyCode == 38 && currentSelection > 0)
	    {
	        // up arrow
			currentSelection -= 1;
	    }
	    else if (e.keyCode == 40 && currentSelection < numSelections - 1)
	    {
	        // down arrow
	    	currentSelection += 1;
	    }

	    $($('#options').children()[currentSelection]).find('pre').css('background-color','#D7EBFC');
		e.preventDefault();
    }
}

function isStatement(nodeType)
{
	if (nodeType == "BlockStatement") return false;
	return nodeType.match(/(Statement|Declaration)$/);
}

function addHandlers() {
	$('#options').on('click', 'pre', function() {
		var options = $('#options').children();
		$(options[currentSelection]).find('pre').css('background-color','clear');
		currentSelection = $(this.parentNode).index();
		$(options[currentSelection]).find('pre').css('background-color','#D7EBFC');
	});
	editor.on('click', '.statement', function(e) {
		var el = $(this);
		var node = window.getNodeById(el.data('node-id'));
		if (isStatement(node.type))
		{
			window.setCurrentPathToNode(node);
			cursor.insertAfter(el);
			newOptions();
			e.stopPropagation();
		}
	});
}

// credit: https://stackoverflow.com/a/5386150
jQuery.fn.reverse = [].reverse;

jQuery.fn.eachDir = function(fn, forward) {
	var obj = forward ? this : this.reverse();
	return obj.each(fn);
};

function moveCursor(forward) {
	var dirAll = forward ? 'nextAll' : 'prevAll';
	// find the next/previous statement
	var node, elem, found;
	function findStatement(i, el) {
		var n = window.getNodeById($(el).data('node-id'));
		// console.log("NODE!", n, el.innerText);
		if (n) {
			// console.log("go to children");
			$(el).children('.statement').eachDir(findStatement, forward);
			if (found) return false;
		}
		if (!n) return;
		if (isStatement(n.type))
		{
			node = n;
			elem = el;
			found = true;
			return false;
		}
	}
	var from = cursor.prev();
	var i = 0;
	while (!found && from.length) {
		if (i++ > 50) throw new Error("too much recursion");
		from[dirAll]('.statement').each(findStatement);
		// console.log("go to parent", from);
		from = from.parent();
	}
	if (!from) {
		// set it to the beginning
	}
	// console.log("Found:", found, "elem", elem && elem.innerText);
	if (!node) return;
	window.setCurrentPathToNode(node);
	cursor.insertAfter(elem);
	scrollIntoView(editor, cursor);
	newOptions();
}

function selectDepth(li) {
	var depth = $(li).text();
	if (depth == $('#current-depth').html())
		return;

	$('#current-depth').html(depth);
	window.setDepth(+depth);

	newOptions();
}

function scrollIntoView(container, elem) {
	var offset = cursor.offset().top - editor.offset().top;
	if (offset < 0 || offset > container.height()) {
		container.scrollTop(container.scrollTop() + offset);
	}
}

function objectsEqual(a, b) {
	return JSON.stringify(a) == JSON.stringify(b);
}

function findNode(span, node)
{
	span = $(span);

	if (window.getNodeById(span.data('node-id')) == node)
		return span;

	var children = span.children();
	for (var i = 0; i < children.length; i++)
	{
		var found = findNode(children[i], node);
		if (found) return found;
	}
	return null;
}

function complete(option)
{
	var node = window.getNodeById($($(option).children()[0]).data('node-id'));
	var newCode = window.insertSnippet(node);

	$('#editor').html(newCode);

	if (node.type != 'Program')
		window.setCurrentPathToNode(node);

	restoreCursor(node);

	newOptions();
}

function restoreCursor(node)
{
	var cursorNode = findNode($('#editor'), node);
	if (!cursorNode)
		console.error("couldn't re-place cursor!");
	else
		cursor.insertAfter(cursorNode);
}

function deleteKey()
{
	var cursorPos = cursor.prev().prev();
	var nodeid = $(cursorPos).data('node-id');

	console.log('cursorPos = ',cursorPos[0], 'id = ',nodeid);

	console.log('getting node by id '+nodeid);
	var node = window.getNodeById(nodeid);

	console.log('node = ',node);

	var newCode = window.deleteCurrentSnippet();

	$('#editor').html(newCode);

	window.setCurrentPathToNode(node);
	restoreCursor(nodeid);

	newOptions();
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
	editor = $('#editor');
	cursor = $('#cursor');
	addHandlers();
	newOptions();

	$('.dropdown-menu').dropdown();

	$('#output').hide();
	$(".run-btn").click(function () {
		$('#output').show();
		var program = $('#editor').text();
		var ret;
		try {
			//var require = window.require;
			ret = eval(program);
		}
		catch (e) {
			ret = e;
		}
		$('#output').html(ret);
	});
});

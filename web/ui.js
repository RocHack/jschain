document.onkeydown = checkKey;

var currentSelection = 0;
var numSelections = 0;

var round = 0;

var snippets = [
[
'function parseList() {\n   reset();\n   pathAtLine = null;\n}',
'var slicedPath = nodes.line;', 
'for (var i = 0; d > 0; i++) {\n   var slicedPath = path[i];\n   var END = probs.type || node;\n}',
'if (node.type == null) {\n   pathAtLine = node.expression;\n}',
'var slicedPath = path.min(DEPTH * 2);'
],
[
"if (node.type == 'MemberExpression' && feature == 'property' && !node.computed)\n   append_to_path = '_id';",
"if (node.expr) {\n   var slicedPath = path.min(DEPTH * 2);\n   expr[key] = true;\n}",
"function getPathForLine(syntax, path) {\n    return pathAtLine;\n}",
"hash = {};",
"path = path.concat([\n            node.type,\n            FOLLOW\n        ]);"
],
[
"var nodeFeatures = node['_expr'] || node;",
"var FOLLOW = node.type == END ? type : type.toString().replace(/_/g, '__');",
'probs[type] = (node.prototype.hasOwnProperty.call(probs, key) ? probs[key] : 0) + 1;',
"var END_NODE = { 'VariableDeclaration': ['declarations'] };",
"parseNode(node[feature], slicedPath.concat(node.type, feature + append_to_path));"
],
[
'if (node.type == null) {\n   pathAtLine = node.expression;\n}',
'var slicedPath = nodes.line;', 
"function getPathForLine(syntax, path) {\n    return pathAtLine;\n}",
"var FOLLOW = node.type == END ? type : type.toString().replace(/_/g, '__');",
"if (node.expr) {\n   var slicedPath = path.min(DEPTH * 2);\n   expr[key] = true;\n   }"
],
[
"hash = {};",
'function parseList() {\n   reset();\n   pathAtLine = null;\n}',
'for (var i = 0; d > 0; i++) {\n   var i = probs.type || node;\n}',
'probs[type] = (node.prototype.hasOwnProperty.call(probs, key) ? probs[key] : 0) + 1;',
'var slicedPath = path.min(DEPTH * 2);'
],
[
"if (node.expr) {\n   var slicedPath = node.prototype[node.type][i];\n   if (!pathAtLine && startLineNum >= goalLineNum) {\n      node = path;\n   }\n}",
"for (var i = esprima.slice(-DEPTH * 2, path.length); extras > 0; i++) {\n   var probs = nodeFeatures[node.type][i];\n}",
"parseNode(END_NODE, path);",
"reset();",
"module.exports.parseSyntax = getPathForLine;"
],

[
'function parseList() {\n   reset();\n   pathAtLine = null;\n}',
'var slicedPath = nodes.line;', 
'for (var i = 0; d > 0; i++) {\n   var slicedPath = path[i];\n   var END = probs.type || node;\n}',
'if (node.type == null) {\n   pathAtLine = node.expression;\n}',
'var slicedPath = path.min(DEPTH * 2);'
],
[
"if (node.type == 'MemberExpression' && feature == 'property' && !node.computed)\n   append_to_path = '_id';",
"if (node.expr) {\n   var slicedPath = path.min(DEPTH * 2);\n   expr[key] = true;\n   }",
"function getPathForLine(syntax, path) {\n    return pathAtLine;\n}",
"hash = {};",
"path = path.concat([\n            node.type,\n            FOLLOW\n        ]);"
],
[
"var nodeFeatures = node['_expr'] || node;",
"var FOLLOW = node.type == END ? type : type.toString().replace(/_/g, '__');",
'probs[type] = (node.prototype.hasOwnProperty.call(probs, key) ? probs[key] : 0) + 1;',
"var END_NODE = { 'VariableDeclaration': ['declarations'] };",
"parseNode(node[feature], slicedPath.concat(node.type, feature + append_to_path));"
],
[
'if (node.type == null) {\n   pathAtLine = node.expression;\n}',
'var slicedPath = nodes.line;', 
"function getPathForLine(syntax, path) {\n    return pathAtLine;\n}",
"var FOLLOW = node.type == END ? type : type.toString().replace(/_/g, '__');",
"if (node.expr) {\n   var slicedPath = path.min(DEPTH * 2);\n   expr[key] = true;\n   }"
],
[
"hash = {};",
'function parseList() {\n   reset();\n   pathAtLine = null;\n}',
'for (var i = 0; d > 0; i++) {\n   var i = probs.type || node;\n}',
'probs[type] = (node.prototype.hasOwnProperty.call(probs, key) ? probs[key] : 0) + 1;',
'var slicedPath = path.min(DEPTH * 2);'
],
[
"if (node.expr) {\n   var slicedPath = node.prototype[node.type][i];\n   if (!pathAtLine && startLineNum >= goalLineNum) {\n      node = path;\n   }\n}",
"for (var i = esprima.slice(-DEPTH * 2, path.length); extras > 0; i++) {\n   var probs = nodeFeatures[node.type][i];\n}",
"parseNode(END_NODE, path);",
"reset();",
"module.exports.parseSyntax = getPathForLine;"
]
]

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

	var snips = snippets[round];
	for (var i = 0; i < snips.length; i++)
	{
		code = snips[i];
		$('#options').append($('<li><pre>'+code+'</pre></li>'));
	}

	$('#options').append($('<li><pre contenteditable="true"></pre></li>'));

	numSelections = snips.length+1;

	currentSelection = 0;
    $($('#options').children()[currentSelection]).find('pre').css('background-color','#D7EBFC');

    round += 1;
}

$(document).ready(function() {
	newOptions();
});
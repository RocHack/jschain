var parse = require("../parse");
var generate = require("../generate");
var escodegen = require("escodegen");
var esprima = require('esprima');


var escodegenOptions = {
	format: {
		indent: {
			style: "  "
		}
	}
};
var END = "_end";

var depth;
var model;

window.setDepth = function (d) {
	console.log("switching to depth",d);
	depth = d;
	model = window.corpusModel[d];
}

setDepth(4);

var tree;

var currentPosition = {"path":[]};

var astDomMap = {};

function array(length) {
	return new Array(length).join(".").split(".");
}

var hasOwnProp = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

function walkSyntax(syntax, fn) {
	if (!syntax || typeof syntax != "object") {
		return;
	}
	if (syntax.type) {
		fn(syntax);
	}
	for (var key in syntax) {
		if (key != "type" && hasOwnProp(syntax, key)) {
			walkSyntax(syntax[key], fn);
		}
	}
}

var FOLLOW = "F";
// looking for node in syntax
function getPath(syntax, node, depth, path, container, idx) {
	if (!path) {
		path = [];
	}
	if (!syntax || typeof syntax != "object") {
		return;
	}
	if (syntax.type == "ExpressionStatement")
		syntax = syntax.expression;

	if (syntax == node) {
		if (path[path.length-1] == FOLLOW || path[path.length-1] == 'body')
			path = path.concat(node.type, FOLLOW)
		return {"path":path, "container":container, "idx":idx};
	}

	if (syntax.type) {
		path = path.concat(syntax.type);
		if (depth) {
			path = path.slice(-depth*2);
		}
	}
	if (syntax instanceof Array) {
		for (var i = 0; i < syntax.length; i++) {
			var item = syntax[i];
			if (!item) continue;
			if (item.type == "ExpressionStatement")
				item = item.expression;

			var p = getPath(item, node, depth, path, syntax, i);
			if (p) return p;
			path.push(item.type, FOLLOW);
		}
		return;
	}
	for (var key in syntax) {
		if (key != "type" && hasOwnProp(syntax, key)) {
			var p = getPath(syntax[key], node, depth, path.concat(key), syntax, key);
			if (p) return p;
		}
	}
}

function setCurrentPath(path) {
	currentPosition = path;
}

window.setCurrentPathToNode = function (node) {

	if (node.type == "ExpressionStatement")
		node = node.expression;

	// console.log("looking for", node, " in ",tree);
	currentPosition = getPath(tree, node);
}

window.insertSnippet = function (node) {

	if (!tree)
	{
		tree = node;
		currentPosition = {"path":['Program','body'], "container":node.body, "idx":0};
	}
	else
	{
		if (isNaN(currentPosition.idx)) 
		{
			currentPosition.container[currentPosition.idx] = node;
		} 
		else 
		{
			currentPosition.container.splice(currentPosition.idx+1, 0, node);
		}
	}

	//console.log("generating tree", tree);
	return escodegen.generate(tree, escodegenOptions);
}

var maxId = 0;
var nodesById = {};
function labelNodeId(node) {
	node.idX = ++maxId;
	nodesById[node.idX] = node;
}

window.getNodeById = function (id) {
	var node = nodesById[id];
	if (!node) {
		//console.log("no node found with id", id);
	}
	return node;
};

function generateProgramSource() {
	var source;
	try {
		var syntax = generate.generateNode(model, currentPosition.path, true, depth);
		if (!syntax || syntax.type == END) {
			return;
		}
		walkSyntax(syntax, labelNodeId);
		
		source = escodegen.generate(syntax, escodegenOptions);
	} catch(e) {
		console.error("generate", e);
	}
	return source;
}

window.getSnippets = function (num) {
	if (currentPosition.path.length > 0)
	{
	    var path = currentPosition.path.slice(-(depth)*2);

		$('h1').css('font-size','1.75em');
		$('h1').text(path.join(", "))
	}
	console.log("path =",currentPosition.path);
	return array(num).map(generateProgramSource).filter(Boolean);
};

window.getCurrentPosition = function () {
	return currentPosition;
};

window.deleteCurrentSnippet = function () {
	if (isNaN(currentPosition.idx)) 
	{
		currentPosition.container[currentPosition.idx] = null;
	} 
	else
	{
		currentPosition.container.splice(currentPosition.idx, 1);
	}

	//console.log("generating tree", tree);
	return escodegen.generate(tree, escodegenOptions);
}
var parse = require("../parse");
var generate = require("../generate");
var escodegen = require("escodegen");

var escodegenOptions = {
	format: {
		indent: {
			style: "  "
		}
	}
};
var END = "_end";

var model = window.corpusModel;

var tree;

var currentPosition = {"path":[]};

var astDomMap = {};

function array(length) {
	return new Array(length).join(".").split(".");
}

var hasOwnProp = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

function objectsEqual(a, b) {
	return JSON.stringify(a) == JSON.stringify(b);
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

	if (objectsEqual(syntax, node)) {
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
	if (!currentPosition) {
		console.log("tree:", JSON.stringify(tree), 'Node:', JSON.stringify(node));
	}

	// console.log("current position is ",currentPosition);
}

window.insertSnippet = function (node) {
	if (!tree)
	{
		tree = node;
		currentPosition = {"path":['Program','body'], "container":node.body, "idx":0};
	}
	else
	{
		if (isNaN(currentPosition.idx)) {
			currentPosition.container[currentPosition.idx] = node;
		} else {
			currentPosition.container.splice(currentPosition.idx+1, 0, node);
		}
	}
}

function generateProgramSource() {
	console.log("**** generating snippet from path ",currentPosition.path);

	var syntax = generate.generateNode(model, currentPosition.path, true, 2);
	if (!syntax || syntax.type == END) {
		return;
	}
	var source;
	//try {
		source = escodegen.generate(syntax, escodegenOptions);
	// } catch(e) {
	// 	console.log("generate", e);
	// }
	return source;
}

window.getSnippets = function (num) {
	return array(num).map(generateProgramSource).filter(Boolean);
};

window.getCurrentPosition = function () {
	return currentPosition;
}

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
	//console.log(syntax, node, depth, path);
	if (!path) {
		path = [];
	}
	if (!syntax || typeof syntax != "object") {
		return;
	}
	if (objectsEqual(syntax, node)) {
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

	// console.log("looking for", node, " in ",tree);
	currentPosition = getPath(tree, node);

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
		currentPosition.container.splice(currentPosition.idx+1, 0, node);
	}
}

function generateProgramSource() {
	console.log("**** generating snippet from path ",currentPosition.path);

	var syntax = generate.generateNode(model, currentPosition.path, true);
	var source = escodegen.generate(syntax, escodegenOptions);
	return source;
}

window.getSnippets = function (num) {
	return array(num).map(generateProgramSource);
};

window.getCurrentPosition = function () {
	return currentPosition;
}

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

var currentPosition = ['Program', 'body'];

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
function getPath(syntax, node, depth, path) {
	console.log(syntax, node, depth, path);
	if (!path) {
		path = [];
	}
	if (!syntax || typeof syntax != "object") {
		return;
	}
	if (objectsEqual(syntax, node)) {
		return path;
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
			var p = getPath(item, node, depth, path);
			if (p) return p;
			path.push(item.type, FOLLOW);
		}
		return;
	}
	for (var key in syntax) {
		if (key != "type" && hasOwnProp(syntax, key)) {
			var p = getPath(syntax[key], node, depth, path.concat(key));
			if (p) return p;
		}
	}
}

function setCurrentPath(path) {
	currentPosition = path;
}

window.setCurrentPathToNode = function (node) {
	currentPosition = getPath(tree, node);
}

function generateProgramSource() {
	var syntax = generate.generateNode(model, currentPosition, true);
	var source = escodegen.generate(syntax, escodegenOptions);
	return source;
}

window.getSnippets = function (num) {
	return array(num).map(generateProgramSource);
};

window.getCurrentPosition = function () {
	return currentPosition;
}

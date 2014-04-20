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

var currentPosition = ['Program', 'body'];

var astDomMap = {};

function array(length) {
	return new Array(length).join(".").split(".");
}

function setCurrentPath(path) {
	currentPosition = path;
}

window.setCurrentPathToNode = function (node) {
	currentPosition = astDomMap[node];
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
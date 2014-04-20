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

function array(length) {
	return new Array(length).join(".").split(".");
}

function generateProgramSource() {
	var syntax = generate.generateProgram(model);
	var source = escodegen.generate(syntax, escodegenOptions);
	return source;
}

window.getSnippets = function (num) {
	return array(num).map(generateProgramSource);
};

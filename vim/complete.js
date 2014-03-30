// for use with complete.vim
// input: lines of code up to current line
// output: completion choices for current line

var showErrors = true;

var escodegen = require("../node_modules/escodegen");
var generateProgram = require("../generate").generateProgram;
var parseFile = require("../parse").parseFile;

var lines = [];
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
	var chunk = process.stdin.read();
	if (chunk !== null) {
		lines.push(chunk);
	}
});

// try to generate this many code snippets
var options = 5;

// make the code fit on a single line
var escodegenOptions = {
	format: {
		indent: {
			style: ""
		},
		newline: " "
	}
};

function processCode() {
	var source = lines.join("\n");
	try {
		var model = parseFile(source);
	} catch (e) {
		if (showErrors) {
			console.log(e.stack);
		}
	}
	for (var i = 0; i < options; i++) {
		try {
			var syntax = generateProgram(model);
			var code = escodegen.generate(syntax, escodegenOptions);
			process.stdout.write(code);
			process.stdout.write("\n");
		} catch (e) {
			if (showErrors) {
				console.log(e.stack);
			}
		}
	}
}

process.stdin.on('end', processCode);

// vim:set ft=js sw=4 sts=4 net

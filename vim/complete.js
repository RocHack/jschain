// for use with complete.vim
// input: lines of code up to current line
// output: completion choices for current line

var showErrors = true;

var escodegen = require("../node_modules/escodegen");
var esprima = require("../node_modules/esprima");
var generate = require("../generate");
var parse = require("../parse");

// the position at which we want to make an insertion
var lineNum = process.argv[2] || 0;

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

function outputMatch(match) {
	process.stdout.write("call complete_add(" + JSON.stringify(match) + ")\n");
}

function outputText(text) {
	text.toString().split("\n").map(outputMatch);
}

function processCode() {
	var source = lines.join("\n");
	var sourceSyntax = esprima.parse(source, {
		tolerant: true,
		loc: true
	});
	var model = parse.parseSyntax(sourceSyntax, lineNum);
	var path = parse.getPathForLine();
	//process.stderr.write("[" + path.join(", ") + "]\n");
	for (var i = 0; i < options; i++) {
		try {
			var node = generate.generateNode(model, path);
			if (node) {
				var code = escodegen.generate(node, escodegenOptions);
				outputMatch({
					word: code,
					//menu: JSON.stringify(node, null, 0)
					menu: node.type
				});
			}
		} catch (e) {
			if (showErrors) {
				outputText(e.stack);
			}
		}
	}
}

process.stdin.on('end', processCode);

// vim:set ft=js sw=4 sts=4 net

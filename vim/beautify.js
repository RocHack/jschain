// beautify.js
// Make code nice-looking
//
// Since vim completion functions can only be one line, we use this to expand
// the chosen code completion snippet to a multi-line form

var escodegen = require("../node_modules/escodegen");
var esprima = require("../node_modules/esprima");

process.stdin.setEncoding('utf8');

var lines = [];

process.stdin.on('readable', function() {
	var chunk = process.stdin.read();
	if (chunk !== null) {
		lines.push(chunk);
	}
});

function processCode() {
	var code = lines.join("\n");
	try {
		var syntax = esprima.parse(code, {tolerant: true});
		var codeNice = escodegen.generate(syntax);
		process.stdout.write(codeNice);
	} catch (e) {
		// return original code
		process.stdout.write(code);
	}
}

process.stdin.on('end', processCode);


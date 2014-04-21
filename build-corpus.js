var fs = require("fs");
var esprima = require("esprima");
var parse = require("./parse");

var modelDest = "web/corpus-model.js";

var space = +process.argv[2] || 0;


function buildCorpus(depth) {

	var model = {};

	var filesDir = "js-files";
	fs.readdirSync(filesDir).forEach(function (name) {
		if (!name.match(/\.js$/)) return;
		var source = fs.readFileSync(filesDir + "/" + name).toString();
		if (source[0] == "#") {
			// Remove shebang which esprima doesn't like
			source = source.substr(source.indexOf("\n")+1);
		}
		console.log("Parsing", name, "(" + source.length + " bytes)");
		var syntax;
		try {
			syntax = esprima.parse(source);
		} catch(e) {
			console.error("Error parsing JS:", e);
			return;
		}
		try {
			parse.parseSyntax(syntax, null, depth, model);
		} catch(e) {
			console.error("Error parsing syntax:", e);
		}
	});

	console.log("Writing model to", modelDest, space ? "with space=" + space : "");
	var corpusJSON = JSON.stringify(model, null, space);
	var corpusOutput = "window.corpusModel["+depth+"] = " + corpusJSON;

	return corpusOutput;
}

var output = "window.corpusModel = new Array(10);\n";
for (var d = 2; d < 7; d++)
{
	var corpusOutput = buildCorpus(d);
	output += corpusOutput + ";\n";
}

fs.writeFileSync(modelDest, output);

console.log(output.length + " bytes written to " + modelDest);

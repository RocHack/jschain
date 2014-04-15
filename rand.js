var escodegen = require("escodegen");
var esprima = require("esprima");
var parse = require("./parse");
var generate = require("./generate");
var fs = require("fs");

fs.readFile("parse.js", 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
	}

    var sourceSyntax = esprima.parse(data);
    var model = parse.parseSyntax(sourceSyntax);

    try
    {
        var syntax = generate.generateProgram(model);

        if (process.argv.length > 2)
        {
            //print out the model if an extra param is passed in
            console.log(JSON.stringify(model, null, 4));
        }
        else
        {
            console.log(escodegen.generate(syntax));
        }
    }
    catch (e)
    {
        console.log(JSON.stringify(model, null, 4));
        console.log(e.stack);
    }
});
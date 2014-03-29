var esprima = require("esprima");

var parseFunctions = {'Program':parseProgram, 'End':parseEnd, 'VariableDeclaration':parseVD};
var hash = {};

var BODY = 0;
var FOLLOW = 1;
var END_NODE = {type:"End"}

var DEPTH = 2;

parseFile('var answer = 42; var a = 30; var b = 20; var c = 1;');
console.log(JSON.stringify(hash, null, 2));

function traverse(path)
{
	console.log("traversing ",path);
	console.log("hash= ",hash);
	var working = hash;
	for (var d = DEPTH*2; d > 0; d--)
	{
		var elem = path[path.length-d];
		console.log("looking up ",elem, " in ",working);
		working = working[elem] || (working[elem] = {});
	}
	return working;
}

function parseEnd(end, path)
{
	console.log("parsing end ");

	var probs = traverse(path);
	probs[end.type] = (probs[end.type] || 0) + 1;
}

function parseVD(vd, path)
{
	console.log("parsing VD path=",path);

	if (path.length >= DEPTH*2)
	{
		var probs = traverse(path);
		probs[vd.type] = (probs[vd.type] || 0) + 1;
	}
}

function parseProgram(program)
{
	var statements = program.body;
	hash[program.type] = hash[program.type] || {};
	var null_prob = hash[program.type][null] || (hash[program.type][null] = {});

	var path = [program.type, BODY];
	for (var i = 0; i < statements.length; i++)
	{
		var statement = program.body[i];

		if (i == 0)
		{
			null_prob[statement.type] = (null_prob[statement.type] || 0) + 1;
		}

		parseNode(statement, path);

		path = path.concat([statement.type, FOLLOW]);
	}

	parseNode(END_NODE, path);
}

function parseNode(node, path)
{
	//var level traverse(path)
	parseFunctions[node.type](node, path);
}

function parseFile(text)
{
	var syntax = esprima.parse(text);
	parseNode(syntax);
}
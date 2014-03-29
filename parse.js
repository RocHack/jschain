var esprima = require("esprima");

var parseFunctions = 
{'Program':parseProgram, 
'End':parseEnd, 
'VariableDeclaration':parseVD, 
'IfStatement':parseIf, 
'BlockStatement':parseBS,
'BinaryExpression':parseBE};

var hash = {};

var BODY = "B";
var FOLLOW = "F";
var IF_CONS = "IF_C";
var IF_ALT = "IF_A";
var IF_TEST = "IF_T";

var END_NODE = {type:"End"};


var DEPTH = 2;

//parseFile('var answer = 42; var a = 30; var b = 20; var c = 1;');
parseFile("if (a=='5') { var a = 10; } else var b = 3;");

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

function addCount(node, path)
{
	if (path && path.length >= DEPTH*2)
	{
		var probs = traverse(path);
		probs[node.type] = (probs[node.type] || 0) + 1;
	}
}

function parseEnd(end, path)
{
}

function parseVD(vd, path)
{
}

function parseBE(node, path)
{
}

function parseIf(node, path)
{
	parseNode(node.test, path.concat([node.type, IF_TEST]));
	parseNode(node.consequent, path.concat([node.type, IF_CONS]));
	parseNode(node.alternate || END_NODE, path.concat([node.type, IF_ALT]));
}

function parseBS(node, path)
{
	path = path.concat([node.type, BODY]);
	var statements = node.body;
	for (var i = 0; i < statements.length; i++)
	{
		var statement = statements[i];
		parseNode(statement, path);
		path = path.concat([statement.type, FOLLOW]);
	}
	parseNode(END_NODE, path);
}

function parseProgram(program)
{
	var statements = program.body;
	hash[program.type] = hash[program.type] || {};
	var null_prob = hash[program.type][null] || (hash[program.type][null] = {});

	var path = [program.type, BODY];
	for (var i = 0; i < statements.length; i++)
	{
		var statement = statements[i];

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
	addCount(node, path);
	console.log("parsing ", node.type, " path=",path);
	if (parseFunctions[node.type])
	{
		parseFunctions[node.type](node, path);
	}
}

function parseFile(text)
{
	var syntax = esprima.parse(text);
	parseNode(syntax);
}
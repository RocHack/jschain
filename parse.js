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

var ret = parseFile('var answer = 42; var a = 30; var b = 20; var c = 1; ');
//var ret = parseFile("if (a=='5') { var a = 10; } else var b = 3;");
console.log(JSON.stringify(ret, null, 2));

function traverse(path)
{
	console.log("traversing ",path);
	console.log("hash= ",hash);
	var working = hash;

	for (var d = Math.min(DEPTH*2, path.length); d > 0; d--)
	{
		var elem = path[path.length-d];
		console.log("looking up ",elem, " in ",working);
		working = working[elem] || (working[elem] = {});
	}

	//if the path wasn't long enough, have to append nulls to make it the required depth
	var extras = DEPTH*2 - path.length;
	for (; extras > 0; extras -= 2) //-=2 because we're subtracting from DEPTH*2, ie, 'program' & 'F'...
		working = (working[null] = {});

	return working;
}

function addCount(node, path)
{
	var probs = traverse(path);
	probs[node.type] = (probs[node.type] || 0) + 1;
}

function parseEnd(end, path)
{
}

function parseVD(vd, path)
{
	//store declarations information
}

function parseBE(node, path)
{
	//store operator, lhs and rhs information
}

function parseIf(node, path)
{
	parseNode(node.test, path.concat([node.type, IF_TEST]));
	parseNode(node.consequent, path.concat([node.type, IF_CONS]));
	parseNode(node.alternate || END_NODE, path.concat([node.type, IF_ALT]));
}

function parseBlock(node, path)
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

function parseBS(node, path)
{
	parseBlock(node, path);
}

function parseProgram(program)
{
	parseBlock(program, []);
}

function parseNode(node, path)
{
	if (path)
		addCount(node, path);
	console.log("parsing ", node.type, " path=",path);
	if (parseFunctions[node.type])
	{
		parseFunctions[node.type](node, path);
	}
}

function parseFile(text)
{
	var syntax = esprima.parse(text);
	parseNode(syntax);
	return hash;
}

function reset()
{
	hash = {};
}

module.exports.parseFile = parseFile;
module.exports.reset = reset;
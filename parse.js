var esprima = require("esprima");
var fs = require('fs');

var parseFunctions = 
{'Program':parseProgram, 
'End':parseEnd, 
'VariableDeclaration':parseVD, 
'IfStatement':parseIf, 
'BlockStatement':parseBS,
'BinaryExpression':parseBE,
'AssignmentExpression':parseAE,
'ForStatement':parseFor,
'WhileStatement':parseWhile,
'FunctionDeclaration':parseFunc,
'FunctionExpression':parseFuncExp,
'ExpressionStatement':parseES,
'CallExpression':parseCall,
'ReturnStatement':parseReturn};

var hash = {};

var BODY = "B";
var FOLLOW = "F";
var IF_CONS = "IF_C";
var IF_ALT = "IF_A";
var IF_TEST = "IF_T";

var FOR_INIT = "FOR_INIT";
var FOR_UPDATE = "FOR_UPDATE";
var FOR_TEST = "FOR_TEST";
var FOR_BODY = "FOR_BODY";

var WHILE_TEST = "WHILE_TEST";
var WHILE_BODY = "WHILE_BODY";

var FUNC_BODY = "FUNC_BODY";
var FUNC_E_BODY = "FUNC_E_BODY";

var EXPR = "EXPR";
var AE_LEFT = "AE_LEFT";
var AE_RIGHT = "AE_RIGHT";

var BE_LEFT = "BE_LEFT";
var BE_RIGHT = "BE_RIGHT";
var BE_OP = "BE_OP";

var VD_INIT = "VD_INIT";

var RET_ARG = "RET_ARG";

var END_NODE = {type:"_end"};

var TOTAL = "_total";


var DEPTH, DEFAULT_DEPTH = 2;


var ret = parseFile('var answer = 42; var a = 30; var b = 20; var c = 1; var d = 2;');
var ret = parseFile("if (a=='5') { var a = 10; } else b = 3;");
var ret = parseFile("for (var i = 0; i < 5; i++) { var a = 4; if (a == '5') { b = 5; } }");
var ret = parseFile("while (i > 0) { var a = 4; if (a > 5) { b = 5; } }");
var ret = parseFile("function foo () { var a = function () { return 5; }; if (a == '5') { b = 5; } }");
var ret = parseFile("var hi = {}; h = (a = 3); function foo () { if (a == '5') { b = foo(); } else { hi = 2; } return b; } function test () { for (var i = 0; i > 3; i++) { test(); } } hi = 1; if (hi == 2) { hi = 2; }");

// var json = JSON.stringify(ret, null, 2);
// console.log(json);
console.log(JSON.stringify(ret));


function traverse(path)
{
	// console.log("traversing ",path);
	var working = hash;

	for (var d = Math.min(DEPTH*2, path.length); d > 0; d--)
	{
		var elem = path[path.length-d];
		// console.log("looking up ",elem, " in ",working);
		working = working[elem] || (working[elem] = {});
	}

	//if the path wasn't long enough, have to append nulls to make it the required depth
	var extras = DEPTH*2 - path.length;
	for (; extras > 0; extras -= 2) //-=2 because we're subtracting from DEPTH*2, ie, 'program' & 'F'...
		working = working[null] || (working[null] = {});

	working[TOTAL] = working[TOTAL] || 0;

	return working;
}

function addCount(node, path)
{
	var probs = traverse(path);
	var type = node.type || node;
	probs[type] = (probs[type] || 0) + 1;
	probs[TOTAL] += 1;
}

function parseEnd(end, path)
{
}

function parseVD(node, path) //VariableDeclaration
{
	parseNode(node.declarations[0].init, path.concat(node.type, VD_INIT));
	//store declarations information
}

function parseBE(node, path) //BinaryExpression
{
	//store operator, lhs and rhs information
	parseNode(node.left, path.concat(node.type, BE_LEFT));
	parseNode(node.right, path.concat(node.type, BE_RIGHT));
	parseNode(node.operator, path.concat(node.type, BE_OP));
}

function parseAE(node, path) //AssignmentExpression
{
	//store lhs, rhs
	parseNode(node.left, path.concat(node.type, AE_LEFT));
	parseNode(node.right, path.concat(node.type, AE_RIGHT));
}

function parseES(node, path) //ExpressionStatement
{
	parseNode(node.expression, path.concat(node.type, EXPR));
}

function parseCall(node, path)
{
}

function parseReturn(node, path)
{
	parseNode(node.argument, path.concat(node.type, RET_ARG));
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

function parseFor(node, path)
{
	parseNode(node.init, path.concat([node.type, FOR_INIT]));
	parseNode(node.test, path.concat([node.type, FOR_TEST]));
	parseNode(node.update, path.concat([node.type, FOR_UPDATE]));
	parseNode(node.body, path.concat([node.type, FOR_BODY]));
}

function parseWhile(node, path)
{
	parseNode(node.test, path.concat([node.type, WHILE_TEST]));
	parseNode(node.body, path.concat([node.type, WHILE_BODY]));
}

function parseBS(node, path)
{
	parseBlock(node, path);
}

function parseFunc(node, path)
{
	//params?
	parseNode(node.body, path.concat([node.type, FUNC_BODY]));
}

function parseFuncExp(node, path)
{
	//params?
	parseNode(node.body, path.concat([node.type, FUNC_E_BODY]));
}

function parseProgram(program)
{
	parseBlock(program, []);
}

function parseNode(node, path)
{
	if (path)
		addCount(node, path);
	// console.log("parsing ", node.type, " path=",path);
	if (parseFunctions[node.type])
	{
		parseFunctions[node.type](node, path);
	}
}

function parseFile(text, d)
{
	// reset();

	DEPTH = d || DEFAULT_DEPTH;
	var syntax = esprima.parse(text, {tolerant: true});
	parseNode(syntax);
	return hash;
}

function reset()
{
	hash = {};
}

module.exports.parseFile = parseFile;
module.exports.reset = reset;

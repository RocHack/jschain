var esprima = require("esprima");
var fs = require('fs');

var parseFunctions = 
{'Program':parseProgram, 
'End':parseEnd, 
'VariableDeclaration':parseVD, 
'IfStatement':parseIf, 
'BlockStatement':parseBS,
'BinaryExpression':parseBE,
'UnaryExpression':parseUnaryE,
'LogicalExpression':parseLE,
'AssignmentExpression':parseAE,
'ForStatement':parseFor,
'ForInStatement':parseForIn,
'WhileStatement':parseWhile,
'FunctionDeclaration':parseFunc,
'FunctionExpression':parseFuncExp,
'ConditionalExpression':parseCE,
'ArrayExpression':parseArrayExpression,
'ExpressionStatement':parseES,
'TryStatement':parseTryStatement,
'CatchClause':parseCatchClause,
'CallExpression':parseCall,
'ReturnStatement':parseReturn,
'UpdateExpression':parseUE,
'MemberExpression':parseME};

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

var FOR_LEFT = "FOR_LEFT";
var FOR_RIGHT = "FOR_RIGHT";

var WHILE_TEST = "WHILE_TEST";
var WHILE_BODY = "WHILE_BODY";

var FUNC_BODY = "FUNC_BODY";
var FUNC_E_BODY = "FUNC_E_BODY";

var TRY_BLOCK = "TRY_BLOCK";
var TRY_HANDLER = "TRY_HANDLER";
var TRY_GHANDLER = "TRY_GHANDLER";
var TRY_FINALIZER = "TRY_FINALIZER";

var EXPR = "EXPR";
var AE_LEFT = "AE_LEFT";
var AE_RIGHT = "AE_RIGHT";

var BE_LEFT = "BE_LEFT";
var BE_RIGHT = "BE_RIGHT";
var BE_OP = "BE_OP";

var UE_ARG = "UE_ARG";
var UE_OP = "UE_OP";

var ME_OBJ = "ME_OBJ";
var ME_PROP = "ME_PROP";
var ME_COMPUTED = "ME_COMPUTED";

var CALL_CALLEE = "CALL_CALLEE";

var VD_INIT = "VD_INIT";

var RET_ARG = "RET_ARG";

var UPDATE_ARG = "UPDATE_ARG";
var UPDATE_OP = "UPDATE_OP";

var END_NODE = {type:"_end"};

var TOTAL = "_total";


var DEPTH, DEFAULT_DEPTH = 2;


var goalLineNum;
var currentLineNum;
var pathAtLine = ['Program', BODY];

/*
var ret = parseFile('var answer = x.b(); var a = x.foo(); var b = 20; var c = 1; var d = 2;');

var ret = parseFile("if (a=='5') { var a = 10; } else b = 3;");
var ret = parseFile("for (var i = 0; i < 5; i++) { var a = x; if (a == '5') { b = 5; } }");
var ret = parseFile("while (i > 0) { var a = 4; if (a > 5) { b = 5; } i--; }");
var ret = parseFile("function foo () { var a = function () { return 5; }; if (a == '5') { b = 5; } }");
var ret = parseFile("var hi = {}; h = (a = 3); function foo () { if (a == '5') { b = foo(); } else { hi = 2; } return b; } function test () { for (var i = a; i > 3; i--) { test(); } } hi = 1; if (hi == 2) { hi = 2; }");

// var json = JSON.stringify(ret, null, 2);
// console.log(json);
console.log(JSON.stringify(ret));
*/

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

function parseUnaryE(node, path) //UnaryExpression
{
	//store operator, argument
	//prefix?
	parseNode(node.left, path.concat(node.type, BE_LEFT));
	parseNode(node.argument, path.concat(node.type, UE_ARG));
	parseNode(node.operator, path.concat(node.type, UE_OP));
}

function parseLE(node, path) //LogicalExpression
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
	parseNode(node.callee, path.concat(node.type, CALL_CALLEE));
}

function parseReturn(node, path)
{
	parseNode(node.argument, path.concat(node.type, RET_ARG));
}

function parseUE(node, path)
{
	parseNode(node.operator, path.concat(node.type, UPDATE_OP));
	parseNode(node.argument, path.concat(node.type, UPDATE_ARG));
}

function parseME(node, path)
{
	parseNode(node.object, path.concat(node.type, ME_OBJ));
	parseNode(node.property, path.concat(node.type, ME_PROP));
	parseNode(node.computed, path.concat(node.type, ME_COMPUTED));
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

function parseForIn(node, path)
{
	parseNode(node.left, path.concat([node.type, FOR_LEFT]));
	parseNode(node.right, path.concat([node.type, FOR_RIGHT]));
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

function parseCE(node, path)
{
	parseNode(node.test, path.concat([node.type, IF_TEST]));
	parseNode(node.consequent, path.concat([node.type, IF_CONS]));
	parseNode(node.alternate, path.concat([node.type, IF_ALT]));
}

function parseArrayExpression(node, path)
{
	var expressions = node.elements || [];
	path = path.concat([node.type, BODY]);
	for (var i = 0; i < expressions.length; i++)
	{
		var expression = expressions[i];
		parseNode(expression, path);
		path = path.concat([expression.type, FOLLOW]);
	}
	parseNode(END_NODE, path);
}

function parseHandlers(handlers, path)
{
	for (var i = 0; i < handlers.length; i++)
	{
		var handler = handlers[i];
		parseNode(handler, path);
		path = path.concat([handler.type, FOLLOW]);
	}
	parseNode(END_NODE, path);
}

function parseTryStatement(node, path)
{
	parseNode(node.block, path.concat(node.type, TRY_BLOCK));
	parseHandlers(node.guardedHandlers, path.concat(node.type, TRY_GHANDLER));
	parseHandlers(node.handlers, path.concat(node.type, TRY_HANDLER));
	parseNode(node.finalizer, path.concat(node.type, TRY_FINALIZER));
}

function parseCatchClause(node, path)
{
	// param
	parseNode(node.body, path.concat(node.type, BODY));
}

function parseProgram(program)
{
	parseBlock(program, []);
}

function parseNode(node, path)
{
	if (!node)
		node = END_NODE;
	addCount(node, path);
	// console.log("parsing ", node.type, " path=",path);
	// look for the node right before the goal line
	if (node.loc)
	{
		var startLineNum = node.loc.start.line;
		if (startLineNum < goalLineNum && startLineNum > currentLineNum)
		{
			currentLineNum = startLineNum;
			pathAtLine = path;
			//console.log(startLineNum, node);
		}
	}
	if (parseFunctions[node.type])
	{
		parseFunctions[node.type](node, path.slice(-DEPTH*2));
	}
}

function parseFile(text, d)
{
	// reset();

	DEPTH = d || DEFAULT_DEPTH;
	var syntax = esprima.parse(text, {tolerant: true});
	parseNode(syntax, []);
	return hash;
}

function parseSyntax(syntax, lineNum)
{
	reset();
	goalLineNum = lineNum;

	DEPTH = DEFAULT_DEPTH;
	parseNode(syntax, []);
	return hash;
}

function reset()
{
	hash = {};
	pathAtLine = ['Program', BODY];
	currentLineNum = 0;
}

function getPathForLine()
{
	return pathAtLine;
}

module.exports.parseFile = parseFile;
module.exports.parseSyntax = parseSyntax;
module.exports.reset = reset;
module.exports.getPathForLine = getPathForLine;

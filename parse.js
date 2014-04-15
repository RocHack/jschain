var esprima = require("esprima");

var FOLLOW = "F";

var END = "_end";
var END_NODE = {type: END};

var TOTAL = "_total";

var DEPTH, DEFAULT_DEPTH = 2;

var goalLineNum;
var currentLineNum;

var pathAtLine = ['Program', 'body'];

var nodeFeatures = 
{
'VariableDeclaration':['declarations'],
'VariableDeclarator':['init', 'id'],
'BinaryExpression':['left','right','operator'],
'UnaryExpression':['left','argument','operator'],
'LogicalExpression':['left','right','operator'],
'AssignmentExpression':['left','right'],
'NewExpression':['callee','arguments'],
'CallExpression':['arguments','callee'],
'Identifier':['name'],
'Literal':['value'],
'ReturnStatement':['argument'],
'UnaryExpression':['operator','argument'],
'MemberExpression':['computed','object','property'],
'IfStatement':['test','consequent','alternate'],
'ForStatement':['init','test','update','body'],
'ForInStatement':['left','right','body'],
'WhileStatement':['test','body'],
'BlockStatement':['body'],
'FunctionDeclaration':['params','id','body'],
'FunctionExpression':['params','body'],
'ConditionalExpression':['test','consequent','alternate'],
'ArrayExpression':['elements'],
'ObjectExpression':['properties'],
'Property':['key','value'],
'TryStatement':['block','guardedHandlers','handlers','finalizer'],
'CatchClause':['body'],
'ThrowStatement':['argument'],
'Program':['body'],
'UpdateExpression':['operator','argument']
};

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
		working = working._null || (working._null = {});

	working[TOTAL] = working[TOTAL] || 0;

	return working;
}
	
function addCount(node, path)
{
	var probs = traverse(path);
	var type = node.type || node;
	var key = (type == END) ? type : type.toString().replace(/_/g, "__");
	probs[key] = (Object.prototype.hasOwnProperty.call(probs, key) ? probs[key] : 0) + 1;
	probs[TOTAL] += 1;
	if (node.expr) {
		// mark that the node is wrapped by an expression
		var expr = probs['_expr'] || (probs['_expr'] = {});
		expr[type] = true;
	}
}

function parseList(nodes, path)
{
	for (var i = 0; i < nodes.length; i++)
	{
		var node = nodes[i];
		parseNode(node, path);
		path = path.concat([node.type, FOLLOW]);
	}
	parseNode(END_NODE, path);
}

function parseNode(node, path)
{
	if (node instanceof Array)
	{
		parseList(node, path);
		return;
	}

	if (!node)
	{
		node = END_NODE;
	}
	if (node.type == "ExpressionStatement")
	{
		node = node.expression;
		node.expr = true;
	}

	addCount(node, path);

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

	if (nodeFeatures[node.type])
	{
		var slicedPath = path.slice(-DEPTH*2);
		for (var i = 0; i < nodeFeatures[node.type].length; i++)
		{
			var feature = nodeFeatures[node.type][i];
			var append_to_path = '';
			if (node.type == 'MemberExpression' && feature == 'property' && !node.computed)
				append_to_path = '_id';
			parseNode(node[feature], slicedPath.concat(node.type, feature+append_to_path));
		}
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
	pathAtLine = ['Program', 'body'];
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

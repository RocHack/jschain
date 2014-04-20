var esprima = require("esprima");

var FOLLOW = "F";

var END = "_end";
var END_NODE = {type: END};

var TOTAL = "_total";

var DEPTH = 4;

var goalLineNum;

var pathAtLine;

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
'Literal':['raw'],
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
'UpdateExpression':['operator','argument'],
'ContinueStatement':[],
'BreakStatement':[]
};

function traverse(path)
{
	var working = hash;

	for (var d = Math.min(DEPTH*2, path.length); d > 0; d--) {
		var elem = path[path.length-d];
		//create the path as we go if it doesn't exist
		working = working[elem] || (working[elem] = {});
	}

	//if the path wasn't long enough, have to append nulls to make it the required depth
	var extras = DEPTH*2 - path.length;
	for (; extras > 0; extras -= 2) //-=2 because we're subtracting from DEPTH*2, ie, 'program' & 'F'...
		working = working._null || (working._null = {});

	//set the running total to 0 if it doesn't already exist
	working[TOTAL] = working[TOTAL] || 0;

	return working;
}
	
function addCount(node, path)
{
	var probs = traverse(path);
	var type = node.type || node;
	var key = (node.type == END) ? type : type.toString().replace(/_/g, "__");
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
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		parseNode(node, path);
		path = path.concat(node.type, FOLLOW);
	}
	parseNode(END_NODE, path);
}

function parseNode(node, path)
{
	//arrays are parsed with parseList
	if (node instanceof Array) {
		parseList(node, path);
		return;
	}

	//mark null nodes with "null" text
	if (node == null) {
		node = "null";
	}

	//for expression statements, use the actual statement & mark that it was wrapped in an expression
	if (node.type == "ExpressionStatement") {
		node = node.expression;
		node.expr = true;
	}

	addCount(node, path);

	// find the first node that starts after our goal line
	if (node.loc) {
		var startLineNum = node.loc.start.line;
		if (!pathAtLine && startLineNum >= goalLineNum) {
			pathAtLine = path;
			//console.log(startLineNum, node);
		}
	}

	var features = nodeFeatures[node.type];
	var slicedPath = path.slice(-DEPTH*2);
	if (features) {
		//go through each feature and add that to the model
		for (var i = 0; i < features.length; i++) {
			var feature = features[i];

			var append_to_path = '';
			if (node.type == 'MemberExpression' && feature == 'property' && !node.computed)
				append_to_path = '_id';

			parseNode(node[feature], slicedPath.concat(node.type, feature+append_to_path));
		}
	}
}

function parseSyntax(syntax, lineNum, depth, model)
{
	hash = model || {};
	if (depth) DEPTH = depth;
	pathAtLine = null;
	goalLineNum = lineNum;

	parseNode(syntax, []);
	return hash;
}

function getPathForLine()
{
	return pathAtLine;
}

module.exports.parseSyntax = parseSyntax;
module.exports.getPathForLine = getPathForLine;

var escodegen = require("escodegen");

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

var END = "_end";

var DEPTH = 3;

var maxPathLength = -(DEPTH-1)*2;

var generateFunctions = {
	'Program': generateProgram,
	'FunctionDeclaration': generateFD,
	'VariableDeclaration': generateVDeclaration,
	'EmptyExpression': generateEE,
	'BlockStatement': generateBS
};

function generateNode(model, path)
{
	// Pick the node type
	var type;
	var map = model;
	for (var i = 0; i < path.length; i++) {
		map = map[path[i]];
	}
	if (map.null) {
		map = map.null;
	}
	var total = map._total || 0;
	var pick = Math.random() * total;
	var sum = 0;
	for (var key in map) {
		if (key == "_total") continue;
		var count = map[key];
		sum += count;
		if (sum >= pick) {
			type = key;
			break;
		}
	}
	if (!type) {
		throw new Error("Unable to pick node type at", path);
	}

	var generate = generateFunctions[type];
	return generate ?
		generate(model, path.concat(type).slice(maxPathLength)) :
		generateUnknown(type, path);
}

function generateUnknown(type, path)
{
	return {type: type, path: path};
}

function generateEE()
{
	return {type: "EmptyExpression"};
}

function generateBlock(model, path)
{
	var sPath = path.concat(BODY).slice(maxPathLength);
	var statements = [];
	var statement = generateNode(model, sPath);
	while (statement && statement.type != END) {
		//console.log("generateBlock", path, statement);
		statements.push(statement);
		sPath = sPath.concat(statement.type, FOLLOW).slice(maxPathLength);
		statement = generateNode(model, sPath);
	}
	return statements;
}

function generateProgram(model)
{
	var path = ["Program"];
	return {
		type: "Program",
		body: generateBlock(model, path)
	};
}

function generateFD(model, path)
{
	return {
		type: "FunctionDeclaration",
		id: {
			"type": "Identifier",
			"name": ""
		},
		params: [],
		defaults: [],
		body: generateNode(model, path.concat(FUNC_BODY).slice(maxPathLength)),
		rest: null,
		generator: false,
		expression: false
	};
}

function generateVDeclaration(model, path)
{
	var declarations = [];
	declarations.push(generateVDeclarator(model, path));
	return {
		type: "VariableDeclaration",
		declarations: declarations,
		kind: "var"
	};

}

function generateVDeclarator(model, path)
{
	return {
		type: "VariableDeclarator",
		id: {
			"type": "Identifier",
			"name": "ID"
		},
		init: {
			"type": "Literal",
			"value": 0,
			"raw": "0"
		}
	};
}

function generateBS(model, path)
{
	return {
		type: "BlockStatement",
		body: generateBlock(model, path)
	};
}

/*
var m = {
	"Program": {
		"B": {
			"null": {
				"_total": 1,
				"FunctionDeclaration": 1
			},
			"VariableDeclaration": {
				"F": {
					"_total": 14,
					"_end": 14
				}
			},
			"FunctionDeclaration": {
				"FUNC_BODY": {
					"_total": 12,
					"BlockStatement": 12
				},
				"F": {
					"_total": 12,
					"_end": 12
				}
			}
		}
	},
	"FunctionDeclaration": {
		"FUNC_BODY": {
			"BlockStatement": {
				"B": {
					"_total": 12,
					"VariableDeclaration": 12
				}
			}
		}
	},
	"BlockStatement": {
		"B": {
			"VariableDeclaration": {
				"F": {
					"_total": 12,
					"_end": 12
				}
			}
		}
	}
};
*/

//var syntax = generateProgram(m);
//console.log(JSON.stringify(syntax, null, 2));
//console.log(escodegen.generate(syntax));

module.exports.generateProgram = generateProgram;

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

var EXPR = "EXPR";

var END = "_end";

var DEPTH = 3;


var generateFunctions = {
	'Program': generateProgram,
	'FunctionDeclaration': generateFD,
	'VariableDeclaration': generateVDeclaration,
	'EmptyExpression': generateEE,
	'BlockStatement': generateBS,
	'ForStatement': generateFor,
	'WhileStatement': generateWhile,
	'BinaryExpression': generateBE,
	'UpdateExpression': generateUE,
	'IfStatement': generateIf,
	'AssignmentExpression': generateAE,
	'ExpressionStatement': generateES,
	'_end': generateEnd
};

function generateNode(model, path)
{
	console.log("path before slice = ",path);
	var maxPathLength = -(DEPTH)*2;
	path = path.slice(maxPathLength);
	console.log("generating, path = ",path);
	// Pick the node type
	var type;
	var map = model;
	for (var i = 0; i < path.length; i++) {
		map = map[path[i]];
	}
	while (map.null) {
		map = map.null;
	}
	console.log("map = ",map);
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
		console.log("Unable to pick node type at", path, " map = ", map);
		throw new Error("Unable to pick node type at", path);
	}

	var generate = generateFunctions[type];
	return generate ?
		generate(model, path.concat(type)) :
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

function generateWhile(model, path)
{
	return {
        type: "WhileStatement",
        test: generateNode(model, path.concat(WHILE_TEST)),
        body: generateNode(model, path.concat(WHILE_BODY))
    }
}

function generateES(model, path)
{
	return {
	    "type": "ExpressionStatement",
	    "expression": generateNode(model, path.concat(EXPR))
	}
}

function generateEnd()
{
	return null;
}

function generateAE()
{
	return {
	    "type": "AssignmentExpression",
	    "operator": "=",
	    "left": {
	        "type": "Identifier",
	        "name": "ID"
	    },
	    "right": {
	        "type": "Literal",
	        "value": 0,
	        "raw": "0"
	    }
	}
}

function generateBlock(model, path)
{
	var sPath = path.concat(BODY);
	var statements = [];
	var statement = generateNode(model, sPath);
	while (statement && statement.type != END) {
		//console.log("generateBlock", path, statement);
		statements.push(statement);
		sPath = sPath.concat(statement.type, FOLLOW);
		statement = generateNode(model, sPath);
	}
	return statements;
}

function generateIf(model, path)
{
	return {
        "type": "IfStatement",
        "test": generateNode(model, path.concat(IF_TEST)),
        "consequent": generateNode(model, path.concat(IF_CONS)),
        "alternate": generateNode(model, path.concat(IF_ALT))
    }
}

function generateBE(model, path)
{
	return {
	    "type": "BinaryExpression",
	    "operator": "<",
	    "left": {
	        "type": "Identifier",
	        "name": "ID"
	    },
	    "right": {
	        "type": "Literal",
	        "value": 0,
	        "raw": "0"
	    }
	}
}

function generateUE(model, path)
{
	return {
        "type": "UpdateExpression",
        "operator": "++",
        "argument": {
            "type": "Identifier",
            "name": "ID"
        }
    }
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
			"name": "ID"
		},
		params: [],
		defaults: [],
		body: generateNode(model, path.concat(FUNC_BODY)),
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

function generateFor(model, path)
{
	return {
        type: "ForStatement",
        init: generateNode(model, path.concat(FOR_INIT)),
        test: generateNode(model, path.concat(FOR_TEST)),
        update: generateNode(model, path.concat(FOR_UPDATE)),
        body: generateNode(model, path.concat(FOR_BODY))
    }
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

 var m = {"Program":{"B":{"null":{"null":{"_total":1,"ForStatement":1}},"VariableDeclaration":{"F":{"null":{"_total":1,"VariableDeclaration":1},"VariableDeclaration":{"F":{"_total":1,"VariableDeclaration":1}}}},"IfStatement":{"IF_T":{"null":{"_total":1,"BinaryExpression":1}},"IF_C":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"IF_A":{"null":{"_total":1,"ExpressionStatement":1},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}}},"F":{"null":{"_total":1,"_end":1}}},"ForStatement":{"FOR_INIT":{"null":{"_total":1,"VariableDeclaration":1}},"FOR_TEST":{"null":{"_total":1,"BinaryExpression":1}},"FOR_UPDATE":{"null":{"_total":1,"UpdateExpression":1}},"FOR_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"_total":3,"VariableDeclaration":2,"_end":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"_end":1}},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"_end":1}}}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"_end":1},"F":{"_total":1,"_end":1}}}}}}};
//var m = {"Program":{"B":{"null":{"null":{"_total":1,"WhileStatement":1}},"VariableDeclaration":{"F":{"null":{"_total":1,"VariableDeclaration":1},"VariableDeclaration":{"F":{"_total":1,"VariableDeclaration":1}}}},"IfStatement":{"IF_T":{"null":{"_total":1,"BinaryExpression":1}},"IF_C":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"IF_A":{"null":{"_total":1,"ExpressionStatement":1},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}}},"F":{"null":{"_total":1,"_end":1}}},"ForStatement":{"FOR_INIT":{"null":{"_total":1,"VariableDeclaration":1}},"FOR_TEST":{"null":{"_total":1,"BinaryExpression":1}},"FOR_UPDATE":{"null":{"_total":1,"UpdateExpression":1}},"FOR_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}},"WhileStatement":{"WHILE_TEST":{"null":{"_total":1,"BinaryExpression":1}},"WHILE_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"_total":3,"VariableDeclaration":2,"_end":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":2,"ExpressionStatement":2}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"_end":1}},"ExpressionStatement":{"EXPR":{"_total":2,"AssignmentExpression":2},"F":{"_total":2,"_end":2}}}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":2,"BinaryExpression":2},"IF_C":{"_total":2,"BlockStatement":2},"IF_A":{"_total":2,"_end":2},"F":{"_total":2,"_end":2}}}}}},"WhileStatement":{"WHILE_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}}};

console.log(JSON.stringify(m, null, 2));
var syntax = generateProgram(m);
console.log(JSON.stringify(syntax, null, 2));
console.log(escodegen.generate(syntax));

module.exports.generateProgram = generateProgram;

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
var FUNC_E_BODY = "FUNC_E_BODY";

var EXPR = "EXPR";

var AE_LEFT = "AE_LEFT";
var AE_RIGHT = "AE_RIGHT";

var BE_LEFT = "BE_LEFT";
var BE_RIGHT = "BE_RIGHT";
var BE_OP = "BE_OP";

var RET_ARG = "RET_ARG";

var VD_INIT = "VD_INIT";

var END = "_end";

var DEPTH = 2;


var generateFunctions = {
	'Program': generateProgram,
	'FunctionDeclaration': generateFD,
	'FunctionExpression': generateFE,
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
	'CallExpression':generateCall,
	'Identifier':generateID,
	'Literal':generateLiteral,
	'ObjectExpression':generateOE,
	'ReturnStatement':generateReturn,
	'_end': generateEnd
};

function generateNode(model, path)
{
	var maxPathLength = -(DEPTH)*2;
	path = path.slice(maxPathLength);
	// Pick the node type
	var type;
	var map = model;
	for (var i = 0; i < path.length; i++) {
		map = map[path[i]];
	}
	while (map.null) {
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
		//console.log("Unable to pick node type at", path, " map = ", map);
		throw new Error("Unable to pick node type at", path);
	}

	//with operators, the type is the literal thing
	if (path[path.length-1] == BE_OP)
		return type;

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
    };
}

function generateES(model, path)
{
	return {
	    "type": "ExpressionStatement",
	    "expression": generateNode(model, path.concat(EXPR))
	};
}

function generateReturn(model, path)
{
	return {
        "type": "ReturnStatement",
        "argument": generateNode(model, path.concat(RET_ARG))
    };
}

function generateOE(model, path)
{
	return {
        "type": "ObjectExpression",
        "properties": []
    };
}

function generateID(model, path)
{
	return {
        "type": "Identifier",
        "name": "ID"
    };
}

function generateLiteral(model, path)
{
	return {
        "type": "Literal",
        "value": 0,
        "raw": "0"
    };
}

function generateCall(model, path)
{
	return {
        "type": "CallExpression",
        "callee": {
            "type": "Identifier",
            "name": "foo"
        },
        "arguments": []
    };
}

function generateEnd()
{
	return null;
}

function generateAE(model, path)
{
	return {
	    "type": "AssignmentExpression",
	    "operator": "=",
	    "left": generateNode(model, path.concat(AE_LEFT)),
	    "right": generateNode(model, path.concat(AE_RIGHT))
	};
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
    };
}

function generateBE(model, path)
{
	return {
	    "type": "BinaryExpression",
	    "operator": generateNode(model, path.concat(BE_OP)),
	    "left": generateNode(model, path.concat(BE_LEFT)),
	    "right": generateNode(model, path.concat(BE_RIGHT))
	};
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
    };
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

function generateFE(model, path)
{
	return {
        "type": "FunctionExpression",
        "id": null,
        "params": [],
        "defaults": [],
        "body": generateNode(model, path.concat(FUNC_E_BODY)),
        "rest": null,
        "generator": false,
        "expression": false
    }
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
		init: generateNode(model, path.concat(VD_INIT))
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

// var m = {"Program":{"B":{"null":{"null":{"_total":6,"VariableDeclaration":2,"IfStatement":1,"ForStatement":1,"WhileStatement":1,"FunctionDeclaration":1}},"VariableDeclaration":{"F":{"null":{"_total":2,"VariableDeclaration":1,"FunctionDeclaration":1},"VariableDeclaration":{"F":{"_total":1,"VariableDeclaration":1}},"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"FunctionDeclaration":1}}}},"IfStatement":{"IF_T":{"null":{"_total":1,"BinaryExpression":1}},"IF_C":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"IF_A":{"null":{"_total":1,"ExpressionStatement":1},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}}},"F":{"null":{"_total":1,"_end":1}}},"ForStatement":{"FOR_INIT":{"null":{"_total":1,"VariableDeclaration":1}},"FOR_TEST":{"null":{"_total":1,"BinaryExpression":1}},"FOR_UPDATE":{"null":{"_total":1,"UpdateExpression":1}},"FOR_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}},"WhileStatement":{"WHILE_TEST":{"null":{"_total":1,"BinaryExpression":1}},"WHILE_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}},"FunctionDeclaration":{"FUNC_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"_total":3,"VariableDeclaration":2,"_end":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":3,"ExpressionStatement":3}}}},"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"_total":1,"IfStatement":1}}},"F":{"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"ExpressionStatement":1}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"_end":1}},"ExpressionStatement":{"EXPR":{"_total":5,"AssignmentExpression":5},"F":{"_total":5,"_end":5}}}}},"IF_A":{"BlockStatement":{"B":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"_end":1}}}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}},"ExpressionStatement":{"EXPR":{"_total":1,"CallExpression":1},"F":{"_total":1,"_end":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":3,"BinaryExpression":3},"IF_C":{"_total":3,"BlockStatement":3},"IF_A":{"_total":3,"_end":3},"F":{"_total":3,"_end":3}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}},"IF_A":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}}}},"WhileStatement":{"WHILE_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}},"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}},"ForStatement":{"FOR_INIT":{"_total":1,"VariableDeclaration":1},"FOR_TEST":{"_total":1,"BinaryExpression":1},"FOR_UPDATE":{"_total":1,"UpdateExpression":1},"FOR_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}}}}},"F":{"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"_total":1,"ForStatement":1}}},"F":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"IfStatement":1}}}},"ExpressionStatement":{"F":{"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"_end":1},"F":{"_total":1,"_end":1}}}}}},"ExpressionStatement":{"F":{"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}}}}};
//var m = {"Program":{"B":{"null":{"null":{"_total":1,"WhileStatement":1}},"VariableDeclaration":{"F":{"null":{"_total":1,"VariableDeclaration":1},"VariableDeclaration":{"F":{"_total":1,"VariableDeclaration":1}}}},"IfStatement":{"IF_T":{"null":{"_total":1,"BinaryExpression":1}},"IF_C":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"IF_A":{"null":{"_total":1,"ExpressionStatement":1},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}}},"F":{"null":{"_total":1,"_end":1}}},"ForStatement":{"FOR_INIT":{"null":{"_total":1,"VariableDeclaration":1}},"FOR_TEST":{"null":{"_total":1,"BinaryExpression":1}},"FOR_UPDATE":{"null":{"_total":1,"UpdateExpression":1}},"FOR_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}},"WhileStatement":{"WHILE_TEST":{"null":{"_total":1,"BinaryExpression":1}},"WHILE_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"_total":3,"VariableDeclaration":2,"_end":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":2,"ExpressionStatement":2}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"_end":1}},"ExpressionStatement":{"EXPR":{"_total":2,"AssignmentExpression":2},"F":{"_total":2,"_end":2}}}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":2,"BinaryExpression":2},"IF_C":{"_total":2,"BlockStatement":2},"IF_A":{"_total":2,"_end":2},"F":{"_total":2,"_end":2}}}}}},"WhileStatement":{"WHILE_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}}};

var m = {"Program":{"B":{"null":{"_total":6,"VariableDeclaration":2,"IfStatement":1,"ForStatement":1,"WhileStatement":1,"FunctionDeclaration":1},"VariableDeclaration":{"VD_INIT":{"_total":2,"Literal":1,"ObjectExpression":1},"F":{"_total":2,"VariableDeclaration":1,"ExpressionStatement":1}},"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"ExpressionStatement":1},"F":{"_total":1,"_end":1}},"ForStatement":{"FOR_INIT":{"_total":1,"VariableDeclaration":1},"FOR_TEST":{"_total":1,"BinaryExpression":1},"FOR_UPDATE":{"_total":1,"UpdateExpression":1},"FOR_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}},"WhileStatement":{"WHILE_TEST":{"_total":1,"BinaryExpression":1},"WHILE_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}},"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"VD_INIT":{"_total":4,"Literal":4},"F":{"_total":4,"VariableDeclaration":3,"_end":1}},"IfStatement":{"IF_T":{"_total":3,"BinaryExpression":3},"IF_C":{"_total":3,"BlockStatement":3},"IF_A":{"_total":3,"_end":3},"F":{"_total":3,"_end":3}},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"FunctionDeclaration":1}}},"VD_INIT":{"FunctionExpression":{"FUNC_E_BODY":{"_total":1,"BlockStatement":1}}}},"IfStatement":{"IF_T":{"BinaryExpression":{"BE_LEFT":{"_total":6,"Identifier":6},"BE_RIGHT":{"_total":6,"Literal":6},"BE_OP":{"_total":6,"==":5,">":1}}},"IF_C":{"BlockStatement":{"B":{"_total":6,"VariableDeclaration":1,"ExpressionStatement":5}}},"IF_A":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}},"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}},"F":{"ReturnStatement":{"RET_ARG":{"_total":1,"Identifier":1},"F":{"_total":1,"_end":1}}}},"BlockStatement":{"B":{"VariableDeclaration":{"VD_INIT":{"_total":4,"Literal":3,"FunctionExpression":1},"F":{"_total":4,"_end":1,"IfStatement":3}},"ExpressionStatement":{"EXPR":{"_total":7,"AssignmentExpression":6,"CallExpression":1},"F":{"_total":7,"_end":7}},"ReturnStatement":{"RET_ARG":{"_total":1,"Literal":1},"F":{"_total":1,"_end":1}},"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"BlockStatement":1},"F":{"_total":1,"ReturnStatement":1}},"ForStatement":{"FOR_INIT":{"_total":1,"VariableDeclaration":1},"FOR_TEST":{"_total":1,"BinaryExpression":1},"FOR_UPDATE":{"_total":1,"UpdateExpression":1},"FOR_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}}}},"ExpressionStatement":{"EXPR":{"AssignmentExpression":{"AE_LEFT":{"_total":9,"Identifier":9},"AE_RIGHT":{"_total":9,"Literal":7,"AssignmentExpression":1,"CallExpression":1}}},"F":{"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"FunctionDeclaration":1}},"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"_end":1},"F":{"_total":1,"_end":1}}}},"ForStatement":{"FOR_INIT":{"VariableDeclaration":{"VD_INIT":{"_total":2,"Literal":2}}},"FOR_TEST":{"BinaryExpression":{"BE_LEFT":{"_total":2,"Identifier":2},"BE_RIGHT":{"_total":2,"Literal":2},"BE_OP":{"_total":2,"<":1,">":1}}},"FOR_BODY":{"BlockStatement":{"B":{"_total":2,"VariableDeclaration":1,"ExpressionStatement":1}}}},"WhileStatement":{"WHILE_TEST":{"BinaryExpression":{"BE_LEFT":{"_total":1,"Identifier":1},"BE_RIGHT":{"_total":1,"Literal":1},"BE_OP":{"_total":1,">":1}}},"WHILE_BODY":{"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}}},"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"_total":3,"VariableDeclaration":1,"IfStatement":1,"ForStatement":1}}},"F":{"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"ExpressionStatement":1}},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"IfStatement":1}}}},"FunctionExpression":{"FUNC_E_BODY":{"BlockStatement":{"B":{"_total":1,"ReturnStatement":1}}}},"AssignmentExpression":{"AE_RIGHT":{"AssignmentExpression":{"AE_LEFT":{"_total":1,"Identifier":1},"AE_RIGHT":{"_total":1,"Literal":1}}}}};

// console.log(JSON.stringify(m, null, 2));
var syntax = generateProgram(m);
// console.log(JSON.stringify(syntax, null, 2));
console.log(escodegen.generate(syntax));

module.exports.generateProgram = generateProgram;

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

var THROW_ARG = "THROW_ARG";

var EXPR = "EXPR";

var AE_LEFT = "AE_LEFT";
var AE_RIGHT = "AE_RIGHT";

var BE_LEFT = "BE_LEFT";
var BE_RIGHT = "BE_RIGHT";
var BE_OP = "BE_OP";

var UE_ARG = "UE_ARG";
var UE_OP = "UE_OP";

var ID_NAME = "ID_NAME";

var L_VAL = "L_VAL";

var ME_OBJ = "ME_OBJ";
var ME_PROP = "ME_PROP";
var ME_PROP_ID = "ME_PROP_ID";
var ME_COMPUTED = "ME_COMPUTED";

var CALL_CALLEE = "CALL_CALLEE";

var RET_ARG = "RET_ARG";

var UPDATE_ARG = "UPDATE_ARG";
var UPDATE_OP = "UPDATE_OP";

var VD_INIT = "VD_INIT";

var NEW_CALLEE = "NEW_CALLEE";
var NEW_ARGS = "NEW_ARGS";

var END = "_end";

var DEPTH = 2;


var generateFunctions = {
	'Program': generateProgram,
	'FunctionDeclaration': generateFD,
	'FunctionExpression': generateFE,
	'VariableDeclaration': generateVDeclaration,
	'EmptyStatement': generateEmptyStatement,
	'BlockStatement': generateBS,
	'ForStatement': generateFor,
	'ForInStatement': generateForIn,
	'WhileStatement': generateWhile,
	'BinaryExpression': generateBE,
	'UnaryExpression':generateUnaryE,
	'LogicalExpression': generateLE,
	'UpdateExpression': generateUE,
	'NewExpression': generateNew,
	'IfStatement': generateIf,
	'ConditionalExpression': generateCE,
	'AssignmentExpression': generateAE,
	'CallExpression':generateCall,
	'Identifier':generateID,
	'Literal':generateLiteral,
	'ObjectExpression':generateOE,
	'ReturnStatement':generateReturn,
	'MemberExpression':generateME,
	'ArrayExpression':generateArrayExpression,
	'TryStatement':generateTryStatement,
	'ThrowStatement':generateThrowStatement,
	'CatchClause':generateCatchClause,
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
	while (map._null) {
		map = map._null;
	}
	var total = map._total || 0;
	var pick = Math.random() * total;
	var sum = 0;
	for (var key in map) {
		if (key == "_total") continue;
		if (key == "_expr") continue;
		var count = map[key];
		sum += count;
		if (sum >= pick) {
			type = key;
			break;
		}
	}
	if (!type) {
		//console.log("Unable to pick node type at", path, " map = ", map);
		throw new Error("Unable to pick node type at [" + path.join(", ") + "]");
	}

	//with operators/ME_COMPUTED (true/false), the type is the literal thing
	var last = path[path.length-1];
	if (last == BE_OP || last == UPDATE_OP || last == UE_OP ||
		last == ID_NAME || last == L_VAL)
		return type;

	if (last == ME_COMPUTED)
		return (type === "true");

	var generate = generateFunctions[type];
	var node = generate ?
		generate(model, path.concat(type)) :
		generateUnknown(type, path);

	if (map._expr && key in map._expr) {
		node = {
			type: "ExpressionStatement",
			expression: node
		};
	}

	return node;
}

function generateUnknown(type, path)
{
	return {type: type, path: path};
}

function generateEmptyStatement()
{
	return {type: "EmptyStatement"};
}

function generateWhile(model, path)
{
	return {
        type: "WhileStatement",
        test: generateNode(model, path.concat(WHILE_TEST)),
        body: generateNode(model, path.concat(WHILE_BODY))
    };
}

function generateReturn(model, path)
{
	return {
        "type": "ReturnStatement",
        "argument": generateNode(model, path.concat(RET_ARG))
    };
}

function generateME(model, path)
{
	var computed = generateNode(model, path.concat(ME_COMPUTED));
	var meProp = computed ? ME_PROP : ME_PROP_ID;
	return {
        "type": "MemberExpression",
        "computed": computed,
        "object": generateNode(model, path.concat(ME_OBJ)),
        "property": generateNode(model, path.concat(meProp))
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
        "name": generateNode(model, path.concat(ID_NAME))
    };
}

function generateLiteral(model, path)
{
	return {
        "type": "Literal",
        "value": generateNode(model, path.concat(L_VAL)),
		"raw": "0"
    };
}

function generateCall(model, path)
{
	return {
        "type": "CallExpression",
        "callee": generateNode(model, path.concat(CALL_CALLEE)),
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
	var nodes = [];
	var node = generateNode(model, path);
	while (node && node.type != END) {
		//console.log("generateBlock", path, node);
		nodes.push(node);
		path = path.concat(node.type, FOLLOW);
		node = generateNode(model, path);
	}
	return nodes;
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

function generateCE(model, path)
{
	return {
        "type": "ConditionalExpression",
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

function generateUnaryE(model, path)
{
	return {
	    "type": "UnaryExpression",
	    "operator": generateNode(model, path.concat(UE_OP)),
	    "argument": generateNode(model, path.concat(UE_ARG)),
	    "prefix": true
	};
}

function generateLE(model, path)
{
	return {
	    "type": "LogicalExpression",
	    "operator": generateNode(model, path.concat(BE_OP)),
	    "left": generateNode(model, path.concat(BE_LEFT)),
	    "right": generateNode(model, path.concat(BE_RIGHT))
	};
}

function generateUE(model, path)
{
	return {
        "type": "UpdateExpression",
        "operator": generateNode(model, path.concat(UPDATE_OP)),
        "argument": generateNode(model, path.concat(UPDATE_ARG))
    };
}

function generateNew(model, path)
{
	return {
        "type": "NewExpression",
        "callee": generateNode(model, path.concat(NEW_CALLEE)),
        "arguments": generateBlock(model, path.concat(NEW_ARGS))
    };
}

function generateProgram(model)
{
	var path = ["Program"];
	return {
		type: "Program",
		body: generateBlock(model, path.concat(BODY))
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
		body: generateBlock(model, path.concat(BODY))
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

function generateForIn(model, path)
{
	return {
        type: "ForInStatement",
        left: generateNode(model, path.concat(FOR_LEFT)),
        right: generateNode(model, path.concat(FOR_RIGHT)),
        body: generateNode(model, path.concat(FOR_BODY)),
        each: false
    };
}

function generateArrayExpression(model, path)
{
	var sPath = path.concat(BODY);
	var exprs = [];
	var expr = generateNode(model, sPath);
	while (expr && expr.type != END) {
		exprs.push(expr);
		sPath = sPath.concat(expr.type, FOLLOW);
		expr = generateNode(model, sPath);
	}
	return {
        type: "ArrayExpression",
        elements: exprs
    }
}

function generateHandlers(model, path)
{
	var handlers = [];
	var handler = generateNode(model, path);
	while (handler && handler.type != END) {
		handlers.push(handler);
		path = path.concat(handler.type, FOLLOW);
		handler = generateNode(model, path);
	}
	return handlers;
}

function generateTryStatement(model, path)
{
	return {
        type: "TryStatement",
		block: generateNode(model, path.concat(TRY_BLOCK)),
		guardedHandlers: generateHandlers(model, path.concat(TRY_GHANDLER)),
		handlers: generateHandlers(model, path.concat(TRY_HANDLER)),
		finalizer: generateNode(model, path.concat(TRY_FINALIZER))
    };
}

function generateCatchClause(model, path)
{
	return {
		type: "CatchClause",
		param: {
			"type": "Identifier",
			"name": "e"
		},
		body: generateNode(model, path.concat(BODY))
	};
}

function generateThrowStatement(model, path)
{
	return {
		type: "ThrowStatement",
		argument: generateNode(model, path.concat(THROW_ARG)),
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

// var m = {"Program":{"B":{"null":{"null":{"_total":6,"VariableDeclaration":2,"IfStatement":1,"ForStatement":1,"WhileStatement":1,"FunctionDeclaration":1}},"VariableDeclaration":{"F":{"null":{"_total":2,"VariableDeclaration":1,"FunctionDeclaration":1},"VariableDeclaration":{"F":{"_total":1,"VariableDeclaration":1}},"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"FunctionDeclaration":1}}}},"IfStatement":{"IF_T":{"null":{"_total":1,"BinaryExpression":1}},"IF_C":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"IF_A":{"null":{"_total":1,"ExpressionStatement":1},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}}},"F":{"null":{"_total":1,"_end":1}}},"ForStatement":{"FOR_INIT":{"null":{"_total":1,"VariableDeclaration":1}},"FOR_TEST":{"null":{"_total":1,"BinaryExpression":1}},"FOR_UPDATE":{"null":{"_total":1,"UpdateExpression":1}},"FOR_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}},"WhileStatement":{"WHILE_TEST":{"null":{"_total":1,"BinaryExpression":1}},"WHILE_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}},"FunctionDeclaration":{"FUNC_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"_total":3,"VariableDeclaration":2,"_end":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":3,"ExpressionStatement":3}}}},"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"_total":1,"IfStatement":1}}},"F":{"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"ExpressionStatement":1}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"_end":1}},"ExpressionStatement":{"EXPR":{"_total":5,"AssignmentExpression":5},"F":{"_total":5,"_end":5}}}}},"IF_A":{"BlockStatement":{"B":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"_end":1}}}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}},"ExpressionStatement":{"EXPR":{"_total":1,"CallExpression":1},"F":{"_total":1,"_end":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":3,"BinaryExpression":3},"IF_C":{"_total":3,"BlockStatement":3},"IF_A":{"_total":3,"_end":3},"F":{"_total":3,"_end":3}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}},"IF_A":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}}}},"WhileStatement":{"WHILE_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}},"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}},"ForStatement":{"FOR_INIT":{"_total":1,"VariableDeclaration":1},"FOR_TEST":{"_total":1,"BinaryExpression":1},"FOR_UPDATE":{"_total":1,"UpdateExpression":1},"FOR_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}}}}},"F":{"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"_total":1,"ForStatement":1}}},"F":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"IfStatement":1}}}},"ExpressionStatement":{"F":{"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"_end":1},"F":{"_total":1,"_end":1}}}}}},"ExpressionStatement":{"F":{"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}}}}};
//var m = {"Program":{"B":{"null":{"null":{"_total":1,"WhileStatement":1}},"VariableDeclaration":{"F":{"null":{"_total":1,"VariableDeclaration":1},"VariableDeclaration":{"F":{"_total":1,"VariableDeclaration":1}}}},"IfStatement":{"IF_T":{"null":{"_total":1,"BinaryExpression":1}},"IF_C":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"IF_A":{"null":{"_total":1,"ExpressionStatement":1},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}}},"F":{"null":{"_total":1,"_end":1}}},"ForStatement":{"FOR_INIT":{"null":{"_total":1,"VariableDeclaration":1}},"FOR_TEST":{"null":{"_total":1,"BinaryExpression":1}},"FOR_UPDATE":{"null":{"_total":1,"UpdateExpression":1}},"FOR_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}},"WhileStatement":{"WHILE_TEST":{"null":{"_total":1,"BinaryExpression":1}},"WHILE_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"_total":3,"VariableDeclaration":2,"_end":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":2,"ExpressionStatement":2}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"_end":1}},"ExpressionStatement":{"EXPR":{"_total":2,"AssignmentExpression":2},"F":{"_total":2,"_end":2}}}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":2,"BinaryExpression":2},"IF_C":{"_total":2,"BlockStatement":2},"IF_A":{"_total":2,"_end":2},"F":{"_total":2,"_end":2}}}}}},"WhileStatement":{"WHILE_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}}};

var m = {"Program":{"B":{"null":{"_total":6,"VariableDeclaration":2,"IfStatement":1,"ForStatement":1,"WhileStatement":1,"FunctionDeclaration":1},"VariableDeclaration":{"VD_INIT":{"_total":2,"CallExpression":1,"ObjectExpression":1},"F":{"_total":2,"VariableDeclaration":1,"ExpressionStatement":1}},"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"ExpressionStatement":1},"F":{"_total":1,"_end":1}},"ForStatement":{"FOR_INIT":{"_total":1,"VariableDeclaration":1},"FOR_TEST":{"_total":1,"BinaryExpression":1},"FOR_UPDATE":{"_total":1,"UpdateExpression":1},"FOR_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}},"WhileStatement":{"WHILE_TEST":{"_total":1,"BinaryExpression":1},"WHILE_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}},"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}}}},"VariableDeclaration":{"VD_INIT":{"CallExpression":{"CALL_CALLEE":{"_total":2,"MemberExpression":2}},"FunctionExpression":{"FUNC_E_BODY":{"_total":1,"BlockStatement":1}}},"F":{"VariableDeclaration":{"VD_INIT":{"_total":4,"CallExpression":1,"Literal":3},"F":{"_total":4,"VariableDeclaration":3,"_end":1}},"IfStatement":{"IF_T":{"_total":3,"BinaryExpression":3},"IF_C":{"_total":3,"BlockStatement":3},"IF_A":{"_total":3,"_end":3},"F":{"_total":3,"_end":2,"ExpressionStatement":1}},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"FunctionDeclaration":1}}}},"CallExpression":{"CALL_CALLEE":{"MemberExpression":{"ME_OBJ":{"_total":2,"Identifier":2},"ME_PROP":{"_total":2,"Identifier":2},"ME_COMPUTED":{"_total":2,"false":2}}}},"IfStatement":{"IF_T":{"BinaryExpression":{"BE_LEFT":{"_total":6,"Identifier":6},"BE_RIGHT":{"_total":6,"Literal":6},"BE_OP":{"_total":6,"==":5,">":1}}},"IF_C":{"BlockStatement":{"B":{"_total":6,"VariableDeclaration":1,"ExpressionStatement":5}}},"IF_A":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}},"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}},"F":{"ExpressionStatement":{"EXPR":{"_total":1,"UpdateExpression":1},"F":{"_total":1,"_end":1}},"ReturnStatement":{"RET_ARG":{"_total":1,"Identifier":1},"F":{"_total":1,"_end":1}}}},"BlockStatement":{"B":{"VariableDeclaration":{"VD_INIT":{"_total":4,"Literal":2,"Identifier":1,"FunctionExpression":1},"F":{"_total":4,"_end":1,"IfStatement":3}},"ExpressionStatement":{"EXPR":{"_total":7,"AssignmentExpression":6,"CallExpression":1},"F":{"_total":7,"_end":7}},"ReturnStatement":{"RET_ARG":{"_total":1,"Literal":1},"F":{"_total":1,"_end":1}},"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"BlockStatement":1},"F":{"_total":1,"ReturnStatement":1}},"ForStatement":{"FOR_INIT":{"_total":1,"VariableDeclaration":1},"FOR_TEST":{"_total":1,"BinaryExpression":1},"FOR_UPDATE":{"_total":1,"UpdateExpression":1},"FOR_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"_end":1}}}},"ExpressionStatement":{"EXPR":{"AssignmentExpression":{"AE_LEFT":{"_total":9,"Identifier":9},"AE_RIGHT":{"_total":9,"Literal":7,"AssignmentExpression":1,"CallExpression":1}},"UpdateExpression":{"UPDATE_OP":{"_total":1,"--":1},"UPDATE_ARG":{"_total":1,"Identifier":1}},"CallExpression":{"CALL_CALLEE":{"_total":1,"Identifier":1}}},"F":{"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"FunctionDeclaration":1}},"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"_end":1},"F":{"_total":1,"_end":1}}}},"ForStatement":{"FOR_INIT":{"VariableDeclaration":{"VD_INIT":{"_total":2,"Literal":1,"Identifier":1}}},"FOR_TEST":{"BinaryExpression":{"BE_LEFT":{"_total":2,"Identifier":2},"BE_RIGHT":{"_total":2,"Literal":2},"BE_OP":{"_total":2,"<":1,">":1}}},"FOR_UPDATE":{"UpdateExpression":{"UPDATE_OP":{"_total":2,"++":1,"--":1},"UPDATE_ARG":{"_total":2,"Identifier":2}}},"FOR_BODY":{"BlockStatement":{"B":{"_total":2,"VariableDeclaration":1,"ExpressionStatement":1}}}},"WhileStatement":{"WHILE_TEST":{"BinaryExpression":{"BE_LEFT":{"_total":1,"Identifier":1},"BE_RIGHT":{"_total":1,"Literal":1},"BE_OP":{"_total":1,">":1}}},"WHILE_BODY":{"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}}},"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"_total":3,"VariableDeclaration":1,"IfStatement":1,"ForStatement":1}}},"F":{"FunctionDeclaration":{"FUNC_BODY":{"_total":1,"BlockStatement":1},"F":{"_total":1,"ExpressionStatement":1}},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"IfStatement":1}}}},"FunctionExpression":{"FUNC_E_BODY":{"BlockStatement":{"B":{"_total":1,"ReturnStatement":1}}}},"AssignmentExpression":{"AE_RIGHT":{"AssignmentExpression":{"AE_LEFT":{"_total":1,"Identifier":1},"AE_RIGHT":{"_total":1,"Literal":1}},"CallExpression":{"CALL_CALLEE":{"_total":1,"Identifier":1}}}}};

// console.log(JSON.stringify(m, null, 2));
// var syntax = generateProgram(m);
// console.log(JSON.stringify(syntax, null, 2));
// console.log(escodegen.generate(syntax));

module.exports.generateProgram = generateProgram;
module.exports.generateNode = generateNode;

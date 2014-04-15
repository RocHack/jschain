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

var FUNC_ID = "FUNC_ID";
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
var VD_ID = "VD_ID";

var PROP_KEY = "PROP_KEY";
var PROP_VAL = "PROP_VAL";

var LIST = "LIST";

var NEW_CALLEE = "NEW_CALLEE";
var NEW_ARGS = "NEW_ARGS";

var END = "_end";

var DEPTH = 2;


var generateFunctions = {
	'Program': generateProgram,
	'FunctionDeclaration': generateFD,
	'FunctionExpression': generateFE,
	'VariableDeclaration': generateVDeclaration,
    'VariableDeclarator': generateVDeclarator,
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
    'Property':generateProperty,
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
		return type.replace(/__/g, "_");

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
        "properties": generateList(model, path.concat(LIST))
    };
}

function generateProperty(model, path)
{
    return {
        "type": "Property",
        "key": generateNode(model, path.concat(PROP_KEY)),
        "value": generateNode(model, path.concat(PROP_VAL)),
        "kind": "init"
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
        "arguments": generateList(model, path.concat(LIST))
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

function generateList(model, path)
{
	var nodes = [];
	var node = generateNode(model, path);
	while (node && node.type != END) {
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
        "arguments": generateList(model, path.concat(NEW_ARGS))
    };
}

function generateProgram(model)
{
	var path = ["Program"];
	return {
		type: "Program",
		body: generateList(model, path.concat(BODY))
	};
}

function generateFD(model, path)
{
	return {
		type: "FunctionDeclaration",
		id: generateNode(model, path.concat(FUNC_ID)),
		params: generateList(model, path.concat(LIST)),
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
        "params": generateList(model, path.concat(LIST)),
        "defaults": [],
        "body": generateNode(model, path.concat(FUNC_E_BODY)),
        "rest": null,
        "generator": false,
        "expression": false
    }
}

function generateVDeclaration(model, path)
{
	return {
		type: "VariableDeclaration",
		declarations: generateList(model, path.concat(LIST)),
		kind: "var"
	};

}

function generateVDeclarator(model, path)
{
	return {
		type: "VariableDeclarator",
		id: generateNode(model, path.concat(VD_ID)),
		init: generateNode(model, path.concat(VD_INIT))
	};
}

function generateBS(model, path)
{
	return {
		type: "BlockStatement",
		body: generateList(model, path.concat(BODY))
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
	return {
        type: "ArrayExpression",
        elements: generateList(model, path.concat(LIST))
    }
}

function generateTryStatement(model, path)
{
	return {
        type: "TryStatement",
		block: generateNode(model, path.concat(TRY_BLOCK)),
		guardedHandlers: generateList(model, path.concat(TRY_GHANDLER)),
		handlers: generateList(model, path.concat(TRY_HANDLER)),
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

module.exports.generateProgram = generateProgram;
module.exports.generateNode = generateNode;

var parse = require("../parse");
var generate = require("../generate");
var escodegen = require("escodegen");

var stubProperty = "x-stub";
var stubValue = "__STUB" + "__";

var stubExpression = {
	type: "ThisExpression",
	"x-stub": stubValue
};
var stubStatement = {
	type: "ExpressionStatement",
	expression: stubExpression,
	"x-stub": stubValue
};

var escodegenOptions = {
	format: {
		indent: {
			style: "  "
		}
	},
	verbatim: stubProperty
};

var model = window.corpusModel;

function array(length) {
	return new Array(length).join(".").split(".");
}

var hasOwnProp = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

function walkSyntax(syntax, fn, parent, property) {
	if (!syntax || typeof syntax != "object") {
		return;
	}
	if (syntax.type) {
		var ret = fn(syntax, parent, property);
		if (ret === false) {
			return;
		}
	}
	for (var key in syntax) {
		if (key != "type" && hasOwnProp(syntax, key)) {
			walkSyntax(syntax[key], fn, syntax, key);
		}
	}
}

function stubFors(node) {
	// replace it with a statement that we can override with verbatim
	if (node.type == "ForStatement") {
		node.type = "ExpressionStatement";
		node.expression = stubExpression;
	}
}

// get a stub suitable for replacing the given node
function getStub(syntax) {
	var type = syntax.type;
	return type.match(/Expression$/) ? stubExpression :
		type.match(/Statement$/) ? stubStatement :
		type == "VariableDeclaration" ? stubStatement :
		new Error("Unstubbable type: " + type);
		//stubExpression;
}

function generateSnippet(path, isList) {
	if (isList) {
		var list = generate.generateList(model, path, false);
		if (list.length > 1) {
			// stubify the list
			return [list[0], getStub(list[0])];
		} else {
			return list;
		}
	} else {
		var syntax = generate.generateNode(model, path, false);
		//walkSyntax(syntax, stubFors);
		return syntax;
	}
}

window.generateSnippets = function (num, path, isList) {
	return array(num).map(generateSnippet.bind(null, path, isList));
};

window.startProgram = function () {
	return {
		type: 'Program',
		body: [stubStatement]
	};
};

window.renderProgram = function (program) {
	var source = escodegen.generate(program, escodegenOptions);
	return source;
};

window.renderSnippet = function renderSnippet(snippet) {
	//console.log("rendering", snippet);
	if (snippet instanceof Array) {
		return snippet.map(renderSnippet).join(" ");
	}
	var source = escodegen.generate(snippet, escodegenOptions);
	return source;
};

// look for stubs in the syntax node that replaced the given old stub
window.findStubs = function (syntax, oldStub) {
	var offset = 0;
	if (oldStub.isList) {
		offset = oldStub.property;
	}
	var oldPath = oldStub.path;
	var stubs = [];
	walkSyntax(syntax, function (node, parent, property) {
		if (node[stubProperty] == stubValue) {
			// TODO: set this stub's path to oldPath concat the path from
			// oldStub to this stub
			var path = oldPath;
			if (parent == syntax) {
				parent = oldStub.parent;
			}
			// numeric property if node is in a list
			var isList = false;
			if (!isNaN(property)) {
				property = +property + offset;
				isList = true;
			}
			stubs.push({
				path: path,
				parent: parent,
				property: property,
				isList: isList
			});
		}
		return false;
	});
	return stubs;
};

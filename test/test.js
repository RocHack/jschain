var parse = require("../parse");
var assert = require("assert")
describe('Parser', function(){
	beforeEach(function(){
		parse.reset();
	})

	it('should work w VD', function(){
		var vd = JSON.stringify(parse.parseFile('var answer = 42; var a = 30; var b = 20; var c = 1; var d = 2;',3));
		var vd_t = '{"Program":{"B":{"null":{"null":{"_total":1,"VariableDeclaration":1}},"VariableDeclaration":{"F":{"null":{"_total":1,"VariableDeclaration":1},"VariableDeclaration":{"F":{"_total":1,"VariableDeclaration":1}}}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"_total":3,"VariableDeclaration":2,"_end":1}}}}}}}';
		assert.deepEqual(vd, vd_t);
	})

	it('should work w IF', function(){
		var vd = JSON.stringify(parse.parseFile("if (a=='5') { var a = 10; } else b = 3;",3));
		var vd_t = '{"Program":{"B":{"null":{"null":{"_total":1,"IfStatement":1}},"IfStatement":{"IF_T":{"null":{"_total":1,"BinaryExpression":1}},"IF_C":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"IF_A":{"null":{"_total":1,"ExpressionStatement":1},"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"_end":1}}}}}}}';
		assert.deepEqual(vd, vd_t);
	})

	it('should work w FOR', function(){
		vd = JSON.stringify(parse.parseFile("for (var i = 0; i < 5; i++) { var a = 4; if (a == '5') { b = 5; } }", 3));
		vd_t = '{"Program":{"B":{"null":{"null":{"_total":1,"ForStatement":1}},"ForStatement":{"FOR_INIT":{"null":{"_total":1,"VariableDeclaration":1}},"FOR_TEST":{"null":{"_total":1,"BinaryExpression":1}},"FOR_UPDATE":{"null":{"_total":1,"UpdateExpression":1}},"FOR_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"_end":1},"F":{"_total":1,"_end":1}}}}}},"VariableDeclaration":{"F":{"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"_end":1}}}}}}}';
		assert.equal(vd, vd_t);
	})

	it('should work w WHILE', function(){
		vd = JSON.stringify(parse.parseFile("while (i < 0) { var a = 4; if (a == '5') { b = 5; } }", 3));
		vd_t = '{"Program":{"B":{"null":{"null":{"_total":1,"WhileStatement":1}},"WhileStatement":{"WHILE_TEST":{"null":{"_total":1,"BinaryExpression":1}},"WHILE_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"WhileStatement":{"WHILE_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"_end":1},"F":{"_total":1,"_end":1}}}}}},"VariableDeclaration":{"F":{"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"_end":1}}}}}}}';
		assert.equal(vd, vd_t);
	})

	it('should work w FUNC', function(){
		vd = JSON.stringify(parse.parseFile("function foo () { var a = function () {}; if (a == '5') { b = 5; } }", 3));
		vd_t = '{"Program":{"B":{"null":{"null":{"_total":1,"FunctionDeclaration":1}},"FunctionDeclaration":{"FUNC_BODY":{"null":{"_total":1,"BlockStatement":1},"BlockStatement":{"B":{"_total":1,"VariableDeclaration":1}}},"F":{"null":{"_total":1,"_end":1}}}}},"FunctionDeclaration":{"FUNC_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"_total":1,"IfStatement":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"_total":1,"BinaryExpression":1},"IF_C":{"_total":1,"BlockStatement":1},"IF_A":{"_total":1,"_end":1},"F":{"_total":1,"_end":1}}}}}},"VariableDeclaration":{"F":{"IfStatement":{"IF_C":{"BlockStatement":{"B":{"_total":1,"ExpressionStatement":1}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"ExpressionStatement":{"EXPR":{"_total":1,"AssignmentExpression":1},"F":{"_total":1,"_end":1}}}}}}}';
		assert.equal(vd, vd_t);
	})
})

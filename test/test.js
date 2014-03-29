var parse = require("../parse");
var assert = require("assert")
describe('Parser', function(){
	beforeEach(function(){
		parse.reset();
	})

	it('should work w VD', function(){
		vd = JSON.stringify(parse.parseFile('var answer = 42; var a = 30; var b = 20; var c = 1;', 2));
		vd_t = '{"Program":{"B":{"null":{"VariableDeclaration":1},"VariableDeclaration":{"F":{"VariableDeclaration":1}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":2,"End":1}}}}}'
		assert.equal(vd, vd_t);
	})

	it('should work w IF', function(){
		vd = JSON.stringify(parse.parseFile("if (a=='5') { var a = 10; } else var b = 3;", 2));
		vd_t = '{"Program":{"B":{"null":{"IfStatement":1},"IfStatement":{"IF_T":{"BinaryExpression":1},"IF_C":{"BlockStatement":1},"IF_A":{"VariableDeclaration":1},"F":{"End":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":1}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"End":1}}}}}'
		assert.equal(vd, vd_t);
	})

	it('should work w FOR', function(){
		vd = JSON.stringify(parse.parseFile("for (var i = 0; i < 5; i++) { var a = 4; if (a == '5') { b = 5; } }", 3));
		vd_t = '{"Program":{"B":{"null":{"null":{"ForStatement":1}},"ForStatement":{"FOR_INIT":{"null":{"VariableDeclaration":1}},"FOR_TEST":{"null":{"BinaryExpression":1}},"FOR_UPDATE":{"null":{"UpdateExpression":1}},"FOR_BODY":{"null":{"BlockStatement":1},"BlockStatement":{"B":{"VariableDeclaration":1}}},"F":{"null":{"End":1}}}}},"ForStatement":{"FOR_BODY":{"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":1}}}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"BinaryExpression":1},"IF_C":{"BlockStatement":1},"IF_A":{"End":1},"F":{"End":1}}}}}},"VariableDeclaration":{"F":{"IfStatement":{"IF_C":{"BlockStatement":{"B":{"AssignmentExpression":1}}}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"ExpressionStatement":{"F":{"End":1}}}}}}}';
		assert.equal(vd, vd_t);
	})

	it('should work w WHILE', function(){
		vd = JSON.stringify(parse.parseFile("while (i < 0) { var a = 4; if (a == '5') { b = 5; } }", 2));
		vd_t = '{"Program":{"B":{"null":{"WhileStatement":1},"WhileStatement":{"WHILE_TEST":{"BinaryExpression":1},"WHILE_BODY":{"BlockStatement":1},"F":{"End":1}}}},"WhileStatement":{"WHILE_BODY":{"BlockStatement":{"B":{"VariableDeclaration":1}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"IfStatement":1}},"ExpressionStatement":{"F":{"End":1}}}},"VariableDeclaration":{"F":{"IfStatement":{"IF_T":{"BinaryExpression":1},"IF_C":{"BlockStatement":1},"IF_A":{"End":1},"F":{"End":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"AssignmentExpression":1}}}}}';
		assert.equal(vd, vd_t);
	})
})
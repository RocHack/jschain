var parse = require("../parse");
var assert = require("assert")
describe('Parser', function(){
	beforeEach(function(){
		parse.reset();
	})

	it('should work w VD', function(){
		vd = JSON.stringify(parse.parseFile('var answer = 42; var a = 30; var b = 20; var c = 1;'));
		vd_t = '{"Program":{"null":{"VariableDeclaration":1},"B":{"VariableDeclaration":{"F":{"VariableDeclaration":1}}}},"VariableDeclaration":{"F":{"VariableDeclaration":{"F":{"VariableDeclaration":2,"End":1}}}}}'
		assert.equal(vd, vd_t);
	})

	it('should work w IF', function(){
		vd = JSON.stringify(parse.parseFile("if (a=='5') { var a = 10; } else var b = 3;"));
		vd_t = '{"Program":{"null":{"IfStatement":1},"B":{"IfStatement":{"IF_T":{"BinaryExpression":1},"IF_C":{"BlockStatement":1},"IF_A":{"VariableDeclaration":1},"F":{"End":1}}}},"IfStatement":{"IF_C":{"BlockStatement":{"B":{"VariableDeclaration":1}}}},"BlockStatement":{"B":{"VariableDeclaration":{"F":{"End":1}}}}}'
		assert.equal(vd, vd_t);
	})
})
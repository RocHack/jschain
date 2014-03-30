var generate = require("../generate");
var assert = require("assert");

describe('Generator', function(){

	it('should work w single VD', function(){
		var model = {"Program":{"B":{"null":{"_total":1,"VariableDeclaration":1},"VariableDeclaration":{"F":{"_total":1,"_end":1}}}}};
		var syntax = generate.generateProgram(model);
		var syntax_t = {"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"ID"},"init":{"type":"Literal","value":0,"raw":"0"}}],"kind":"var"}]};
		assert.deepEqual(syntax, syntax_t);
	});

});

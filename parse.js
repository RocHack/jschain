var esprima = require("esprima");
var syntax = esprima.parse('var answer = 42');
console.log(syntax);
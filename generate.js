var escodegen = require("escodegen");

var FOLLOW = "F";
var END = "_end";

var DEPTH = 5;

var nodeFeatures = 
{
'VariableDeclaration':['declarations',['kind','var']],
'VariableDeclarator':['init', 'id'],
'BinaryExpression':['left','right','operator'],
'UnaryExpression':['left','argument','operator'],
'LogicalExpression':['left','right','operator'],
'AssignmentExpression':['left','right',['operator','=']],
'NewExpression':['callee','arguments'],
'CallExpression':['arguments','callee'],
'Identifier':['name'],
'Literal':['raw'],
'ReturnStatement':['argument'],
'UnaryExpression':['operator','argument',['prefix',true]],
'MemberExpression':['computed','object','property'],
'IfStatement':['test','consequent','alternate'],
'ForStatement':['init','test','update','body'],
'ForInStatement':['left','right','body'],
'WhileStatement':['test','body'],
'BlockStatement':['body'],
'FunctionDeclaration':['params','id','body'],
'FunctionExpression':['params','body'],
'ConditionalExpression':['test','consequent','alternate'],
'ArrayExpression':['elements'],
'ObjectExpression':['properties'],
'Property':['key','value',['kind','init']],
'TryStatement':['block','guardedHandlers','handlers','finalizer'],
'CatchClause':['body',['param',{'type':'Identifier','name':'e'}]],
'ThrowStatement':['argument'],
'Program':['body'],
'UpdateExpression':['operator','argument'],
'EmptyStatement': [],
'ContinueStatement':[],
'BreakStatement':[]
};

function generateProgram(model)
{
    return {
        "type":"Program",
        "body":generateList(model, ['Program', 'body'])
    };
}

function generateList(model, path)
{
    var nodes = [];
    var node = generateNode(model, path);
    while (node.type != END) {
        nodes.push(node);
        path = path.concat(node.type, FOLLOW);
        node = generateNode(model, path);
    }
    return nodes;
}

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
    if (type == null) {
        //console.log("Unable to pick node type at", path, " map = ", map);
        throw new Error("Unable to pick node type at [" + path.join(", ") + "]");
    }

    //with operators/ME_COMPUTED (true/false), the type is the literal thing
    var last = path[path.length-1];
    var last2 = path[path.length-2];
    if (last == 'operator' || last == 'raw' || (last2 == 'Identifier' && last == 'name') || (last2 == 'Literal' && last == 'value'))
        return type.replace(/__/g, "_");

    if (type == "null")
        return null;

    if (last == 'computed')
        return (type === "true");

    var node = {'type':type};

    if (type == END)
        return node;

    var features = nodeFeatures[type];
    if (!features)
    {
        throw new Error("No known features for node type "+type+". path = "+path);
    }

    for (var i = 0; i < features.length; i++)
    {
        var feature = features[i];
        var feature_append = '';
        if (type == 'MemberExpression' && feature == 'property' && !node.computed)
            feature_append = '_id';

        //key with a default value, ie, it shouldn't be generated. form is feature = [key, value]
        if (feature instanceof Array)
        {
            node[feature[0]] = feature[1];
        }
        else
        {
            var newPath = path.concat(type, feature+feature_append);

            if (feature == "properties" || feature == "arguments" || (feature == "body" && type == "BlockStatement")
                || feature == "params" || feature == "declarations" || feature == "elements"
                || feature == "guardedHandlers" || feature == "handlers")
            {
                node[feature] = generateList(model, newPath);
            }
            else
            {
                node[feature] = generateNode(model, newPath);
            }
        }
    }

    if (type == "Literal")
    {
        //turn raw into a value, needed by escodegen, with eval
        node["value"] = eval(node.raw);
    }

    if (map._expr && key in map._expr) {
        node = {
            type: "ExpressionStatement",
            expression: node
        };
    }

    return node;
}

module.exports.generateProgram = generateProgram;
module.exports.generateNode = generateNode;

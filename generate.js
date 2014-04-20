var escodegen = require("escodegen");

var FOLLOW = "F";
var END = "_end";

var DEPTH = 4;

var singleElementLists = false;

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
'BreakStatement':[],
'_end':[]
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
    
    if (singleElementLists)      
    {
        if (node.type == END)
            return [];
        //while (node.type == END)
            //node = generateNode(model, path);
        return [node];
    }

    while (node.type != END) {
        nodes.push(node);
        path = path.concat(node.type, FOLLOW);
        node = generateNode(model, path);
    }
    return nodes;
}

function generateNode(model, path, sel)
{
    if (sel != undefined)
        singleElementLists = sel;

    if (!path || path.length == 0)
    {
        return generateProgram(model);
    }

    //cut off the path at given depth
    var maxPathLength = -(DEPTH)*2;
    path = path.slice(maxPathLength);

    var prevTransition = path[path.length-1];
    var prevNodeType = path[path.length-2];

    var map = model;
    //walk the model
    for (var i = 0; i < path.length; i++) {
        map = map[path[i]];
    }
    //skip past all the _nulls if there are any (ie path isn't long enough)
    while (map._null) {
        map = map._null;
    }

    var newType = pickNodeType(map);

    if (newType == null) {
        //console.log("Unable to pick node type at", path, " map = ", map);
        throw new Error("Unable to pick node type at [" + path.join(", ") + "]");
    }

    //with operators/identifier names, the type is the literal thing
    if (prevTransition == 'operator' || 
        prevTransition == 'raw' || 
        (prevNodeType == 'Identifier' && prevTransition == 'name'))
        //escape any variables that use underscores with two, our reserved variables use only one
        return newType.replace(/__/g, "_");

    //'computed' (for member expressions) should be a boolean
    if (prevTransition == 'computed')
        return (newType === "true");

    //means the value for this new node is literally null, not a literal which happens to be "null"
    if (newType == "null")
        return null;

    var node = instantiateNode(newType, model, path);

    //wrap an expression statement around it if it was flagged by parse to require
    if (map._expr && newType in map._expr) {
        node = {
            type: "ExpressionStatement",
            expression: node
        };
    }

    return node;
}

function pickNodeType(map)
{
    var type;

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

    return type;
}

function instantiateNode(type, model, path)
{
    var node = {'type':type};

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

            if (feature == "properties" || feature == "arguments" ||
                feature == "params" || feature == "declarations" || 
                feature == "elements" || feature == "guardedHandlers" || feature == "handlers" ||
                (feature == "body" && type == "BlockStatement")) //only BlockStatement's body is a list, Program's body is a BlockStatement
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

    return node;
}

module.exports.generateProgram = generateProgram;
module.exports.generateNode = generateNode;

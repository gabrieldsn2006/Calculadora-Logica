/* ETAPA I */

VAL = ["Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","Z","X","C","V","B","N","M","1","0"]
OP = ["¬","∧","∨","→","↔"]

global_expression = ""

function expressionToString(expression) {
    return global_expression.replace(/1/g, "true").replace(/0/g, "false")
}

function updateExpression(str) {
    global_expression += str
    document.getElementById("label").innerHTML = expressionToString(global_expression)
}

function addValue(value) {
    if (global_expression != "") {
        if (OP.includes(global_expression.slice(-1)) || global_expression.slice(-1) == "(") updateExpression(value)
    } else updateExpression(value)
}

function addOperation(value) {   
    if (value == "¬") {
        if (global_expression.slice(-1) == "(" || (OP.includes(global_expression.slice(-1)) && global_expression.slice(-1) != "¬") || global_expression == "") updateExpression(value)
    } else if (global_expression.slice(-1) == ")" || VAL.includes(global_expression.slice(-1))) updateExpression(value)
}

function addParentesis(value) {
    if (value == "(") {
        if (global_expression == "" || OP.includes(global_expression.slice(-1)) || global_expression.slice(-1) == "(") updateExpression(value)
    }
    if (value == ")") {
        let count = 0
        for (let i = 0; i < global_expression.length; i++) {
            if (global_expression[i] == "(") count++
            if (global_expression[i] == ")") count--
        }
        if (count > 0 && (VAL.includes(global_expression.slice(-1)) || global_expression.slice(-1) == ")")) updateExpression(value)
    }
}

function clr() {
    global_expression = ""
    updateExpression("")
}

function del() {
    global_expression = global_expression.slice(0, -1)
    updateExpression("")
}

function result() {
    let count = 0
    for (let i = 0; i < global_expression.length; i++) {
        if (global_expression[i] == "(") count++
        if (global_expression[i] == ")") count--
    }
    if (count == 0 && !(OP.includes(global_expression.slice(-1))) && global_expression != "") {
        // global_expression = "hello world!"
        updateExpression("")
        printTable(truthTable())
    }
}



/* ETAPA II */



class Node {
    constructor(value, left, right) {
        this.value = value
        this.left = left
        this.right = right
    }
}

function order(op) {
    if (op == "¬") return 2
    if (op == "∧" || op == "∨") return 1
    if (op == "→" || op == "↔") return 0
}

function findRoot(expression) /* retorna index da raiz */ {
    // procuro a ultima operação a ser realizada
    
    let scope = 0
    let rootScope = -1
    let rootIndex = -1
    

    for (let i = 0; i < expression.length; i++) {
        if (expression[i] == "(") {
            scope++
        }
        if (expression[i] == ")") {
            scope--
        }
        if (OP.includes(expression[i])) {
            if (rootIndex == -1) {
                rootScope = scope
                rootIndex = i
            } else {
                if (scope < rootScope) {
                    rootScope = scope
                    rootIndex = i
                } else if (scope == rootScope) {
                    if (order(expression[i]) < order(expression[rootIndex])) {
                        rootScope = scope
                        rootIndex = i
                    }
                }
            }
        }
    }
    return rootIndex
}


// função insana
function buildTree(expression) /* retorna o nó da raiz */ {
    if (expression[0] == "(" && expression.slice(-1) == ")" ) {
        expression = expression.slice(1, -1)
    } // talvez isso tenho simplificado um problema que já tinha resolvido com gambiarra (ou seja o código pode ser simplificado em algum ponto)
    
    if (VAL.includes(expression)) {
        return new Node(expression, null, null)
    }

    var left_side, right_side

    let index = findRoot(expression)
    
    if (expression[index] == "¬") { // not
        let end = findEnd(index, expression)
        if (expression[index+1] == "(") {
            right_side = buildTree(expression.slice(index+2, end))
        } else {
            right_side = buildTree(expression.slice(index+1, end))
        }
        return new Node(expression[index], null, right_side)
    } else { //qualquer outra op

        let start = findStart(index, expression)
        if (expression[index-1] == ")") {
            left_side = buildTree(expression.slice(start, index-1))
        } else {
            left_side = buildTree(expression.slice(start, index))
        }

        let end = findEnd(index, expression)
        if (expression[index+1] == "(") {
            right_side = buildTree(expression.slice(index+2, end))
        } else {
            right_side = buildTree(expression.slice(index+1, end))
        }

        return new Node(expression[index], left_side, right_side)
    }
}

function findStart(start, expression) {
    while (expression[start] != "(" && start >= 0) {start--}
    return start + 1
}

function findEnd(end, expression) {
    while (expression[end] != ")" && end <= expression.length) {end++}
    return end
}



/* ETAPA III */



function findVariables(expression) {
    return Array.from(new Set(expression.match(/[A-Z]/g)))
}

function solve(tree, entries) /* retorna a boolean da expressão */ {
    if (!(OP.includes(tree.value))) {
        if (tree.value == "1") return true
        if (tree.value == "0") return false
        return entries[tree.value]
    }
    
    if (tree.value == "¬") {
        return (!(solve(tree.right, entries)))
    }
    if (tree.value == "∧") {
        return (solve(tree.left, entries) && solve(tree.right, entries))
    }
    if (tree.value == "∨") {
        return (solve(tree.left, entries) || solve(tree.right, entries))
    }
    if (tree.value == "→") {
        return (!(solve(tree.left, entries)) || solve(tree.right, entries))
    }
    if (tree.value == "↔") {
        return (solve(tree.left, entries) == solve(tree.right, entries))
    }
}

function truthTable() /* console.log */ {
    var matrix = []
    
    let variables = findVariables(global_expression)

    let line = 0
    
    let tree = buildTree(global_expression)

    console.log(tree)

    for (let i = (2**variables.length)-1; i >= 0 ; i--) {
        matrix.push([])

        let entries = {}
        let bin = i.toString(2).padStart(variables.length, "0");
    
        for (let j = 0; j < variables.length; j++) {
            assigned_value = bin[j] === "1";

            entries[variables[j]] = assigned_value;
            matrix[line].push(assigned_value);
        }

        matrix[line].push(solve(tree, entries))
        line++
    }

    matrix.unshift([])
    for (let i = 0; i < variables.length; i++) {
        matrix[0].push(variables[i])
    }
    matrix[0].push(expressionToString(global_expression))

    return matrix
}

function printTable(m) {
    for (let i = 0; i < m.length; i++) {
        for (let j = 0; j < m[i].length; j++) {
            document.write(m[i][j])
            document.write(" | ")
        }
        document.write("<br>")
    }
}



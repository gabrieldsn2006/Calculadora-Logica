/* ETAPA I */

VAL = ["Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","Z","X","C","V","B","N","M","1","0"]
OP = ["¬","∧","∨","→","↔"]

global_expression = ""

function expressionToString(expression) {
    return expression.replace(/1/g, "true").replace(/0/g, "false")
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
    document.getElementById("table_content").innerHTML = ""
}

function del() {
    global_expression = global_expression.slice(0, -1)
    updateExpression("")
    document.getElementById("table_content").innerHTML = ""
}

function result() {
    let count = 0
    for (let i = 0; i < global_expression.length; i++) {
        if (global_expression[i] == "(") count++
        if (global_expression[i] == ")") count--
    }
    if (count == 0 && !(OP.includes(global_expression.slice(-1))) && global_expression != "") {
        // global_expression = "hello world!"
        // updateExpression("")
        printTable( (new Expression(global_expression)).table )
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

class Expression {
    tree
    table

    constructor(expression) {
        this.tree = buildTree(expression)
        this.table = truthTable(expression, this.tree)
    }
}

function order(op) { /* retorna um valor de prioridade (comparar para saber qual resolver por último) */
    if (op == "¬") return 2
    if (op == "∧" || op == "∨") return 1
    if (op == "→" || op == "↔") return 0
}

function findRoot(expression) { /* retorna index da raiz (ultima operação a ser realizada) */
    
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

function sliceParentesis(expression) { /* retorna expressão sem o parentesis mais externo se possível (talvez possa ser otimizada) */
    let index = findRoot(expression)

    if (index == -1) {
        for (let i = 0; i < expression.length; i++) {
            if (VAL.includes(expression[i])) {
                index = i
                break
            }
        }
    }

    let unsolvedLeft = 0
    for (let i = index-1; i >= 0; i--) {
        if (expression[i] == "(") unsolvedLeft++
        if (expression[i] == ")") unsolvedLeft--
    }

    let unsolvedRight = 0
    for (let i = index+1; i < expression.length; i++) {
        if (expression[i] == "(") unsolvedRight--
        if (expression[i] == ")") unsolvedRight++
    }

    while (unsolvedLeft > 0 && unsolvedRight > 0) {
        expression = expression.slice(1, -1)
        unsolvedLeft--
        unsolvedRight--
    }

    return expression
}

function buildTree(expression) { /* retorna o Node raiz (arvore) */ 
    expression = sliceParentesis(expression)
    
    if (VAL.includes(expression)) {
        return new Node(expression, null, null)
    }

    let rootIndex = findRoot(expression)

    let right_side = buildTree(expression.slice(rootIndex+1))

    if (expression[rootIndex] == "¬") { // not
        return new Node(expression[rootIndex], null, right_side)
    } else { // qualquer outra op
        let left_side = buildTree(expression.slice(0, rootIndex))
        return new Node(expression[rootIndex], left_side, right_side)
    }
}



/* ETAPA III */



function solve(tree, entries) { /* retorna a boolean da expressão para um conjunto de entradas */ 
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

function findVariables(expression) { /* retorna um array com as variáveis da expressão */
    return Array.from(new Set(expression.match(/[A-Z]/g)))
}

function truthTable(expression, tree) { /* retorna matriz que representa a tabela-verdade */ 
    var matrix = []
    
    let variables = findVariables(expression)

    let line = 0

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
    matrix[0].push(expressionToString(expression))

    return matrix
}

// function printTable(m) { /* debug */
//     for (let i = 0; i < m.length; i++) {
//         for (let j = 0; j < m[i].length; j++) {
//             document.write(m[i][j])
//             document.write(" | ")
//         }
//         document.write("<br>")
//     }
// }



/* FRONT-END TABLE */
/* table_content */

function printTable(m) {
    let tableTag = document.getElementById("table_content")
    
    for (let i = 0; i < m.length; i++) {
        for (let j = 0; j < m[i].length; j++) {
            tableTag.innerHTML += `${m[i][j]}`
            tableTag.innerHTML += " | "
        }
        tableTag.innerHTML += "<br>"
    }
}
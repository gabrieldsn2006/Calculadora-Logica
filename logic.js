/* ETAPA I - SINTAXE */

VAL = ["Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","Z","X","C","V","B","N","M","1","0"]
OP = ["¬","∧","∨","→","↔","⊻"]

global_expression = ""

function expressionToString(expression) {
    return expression.replace(/1/g, "true").replace(/0/g, "false")
}

function updateExpression(str) {
    hideTable()
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
        if (document.getElementById("table").style.display == "none") {
            let e = new Expression(global_expression)
            buildTableTag(e.table)
            displayTable()
            displayType(e.type)
        }
    }
}



/* ETAPA II - ESTRUTURA DA EXPRESSÃO */



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
    type

    constructor(expression) {
        this.tree = buildTree(expression)
        this.table = truthTable(expression, this.tree)
        this.type = verifyType(this.table)
    }
}

function verifyType(matrix) { /* verifica se é tautologia, contradição ou contigência */
    let trueValues = 0
    let total = 0
    for (let i = 1; i < matrix.length; i++) {
        if (matrix[i][matrix[0].length-1]) trueValues++
        total++
    }

    if (trueValues == 0) return "Contradição."
    if (trueValues == total) return "Tautologia."
    return "Contigência."
}

function order(op) { /* retorna um valor de prioridade (comparar para saber qual resolver por último) */
    if (op == "¬") return 2
    if (op == "∧" || op == "∨" || op == "⊻") return 1
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
                    if (order(expression[i]) <= order(expression[rootIndex])) {
                        rootScope = scope
                        rootIndex = i
                    }
                }
            }
        }
    }
    return rootIndex
}

function sliceParentesis(expression) { /* retorna expressão sem o parentesis mais externo se possível */
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



/* ETAPA III - RESOLVENDO EXPRESSÃO */



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
    if (tree.value == "⊻") {
        return (solve(tree.left, entries) != solve(tree.right, entries))
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



/* FRONT-END TABLE */

function displayTable() {
    let item = document.getElementById("table")
    item.style.display = "block"
}

function hideTable() {
    let item = document.getElementById("table")
    document.getElementById("table_content").innerHTML = ""
    item.style.display = "none"
}

function buildTableTag(matrix) {
    const tableTag = document.getElementById("table_content");
    matrix.forEach((line, index) => {
        const tr = document.createElement("tr");

        line.forEach(cell => {
            const item = index === 0 ? "th" : "td";
            const td = document.createElement(item);
            td.textContent = cell;
            tr.appendChild(td);
        })
        tableTag.appendChild(tr);
    })
}

function displayType(type) {
    document.getElementById("type").innerHTML = type
}
'use strict';

const safeEvalMathExpression = (expr) => {

    const exprSansBrackets = expr.replaceAll('(', '').replaceAll(')', '') ;
    const modExprLen = exprSansBrackets.length ;
    const allowedCharsLength = (exprSansBrackets.match(/[0-9]|\.|\+|\*|-|\//g)).length ;
    if (allowedCharsLength !== modExprLen) {
        return 0 ;
    } else {
        return (eval(expr));
    }

};

module.exports = safeEvalMathExpression;
/* Exact, finite examples for the rational-number power explorer. */
(function (root) {
    'use strict';

    const cases = [
        { id: 'positive', expression: '2³', numerator: 2, denominator: 1, exponent: 3, choices: ['6', '8', '9'] },
        { id: 'negative-even', expression: '(−2)²', numerator: -2, denominator: 1, exponent: 2, choices: ['−4', '4', '−8'] },
        { id: 'negative-odd', expression: '(−2)³', numerator: -2, denominator: 1, exponent: 3, choices: ['8', '−6', '−8'] },
        { id: 'outside-minus', expression: '−2²', numerator: 2, denominator: 1, exponent: 2, outsideMinus: true, choices: ['4', '−4', '−8'] },
        { id: 'fraction', expression: '(1/2)³', numerator: 1, denominator: 2, exponent: 3, choices: ['1/6', '1/8', '3/2'] },
        { id: 'negative-fraction', expression: '(−1/2)²', numerator: -1, denominator: 2, exponent: 2, choices: ['−1/4', '1/4', '1/2'] },
        { id: 'zero', expression: '0³', numerator: 0, denominator: 1, exponent: 3, choices: ['3', '1', '0'] }
    ];

    function greatestCommonDivisor(a, b) {
        while (b !== 0) [a, b] = [b, a % b];
        return a;
    }

    function fractionText(numerator, denominator) {
        return (numerator < 0 ? '−' : '') + Math.abs(numerator) + (denominator === 1 ? '' : '/' + denominator);
    }

    function powerTrace(id) {
        const item = cases.find(example => example.id === id);
        if (!item) throw new Error('未知的乘方案例');
        const numerator = (item.outsideMinus ? -1 : 1) * item.numerator ** item.exponent;
        const denominator = item.denominator ** item.exponent;
        const divisor = greatestCommonDivisor(Math.abs(numerator), denominator);
        const result = fractionText(numerator / divisor, denominator / divisor);
        const factor = fractionText(item.numerator, item.denominator);
        let explanation;
        if (item.outsideMinus) {
            explanation = `指数 ${item.exponent} 只作用于 ${factor}；前面的负号在乘方外，最后把乘积变成负数。`;
        } else if (item.numerator < 0) {
            explanation = item.exponent % 2 === 0
                ? `负号属于底数。${item.exponent} 个负因数相乘，结果为正。`
                : `负号属于底数。${item.exponent} 个负因数相乘，结果为负。`;
        } else if (item.numerator === 0) {
            explanation = `底数是 0；${item.exponent} 个 0 相乘，结果仍是 0。`;
        } else if (item.denominator > 1) {
            explanation = `分子、分母分别相乘 ${item.exponent} 次，得到 ${result}。`;
        } else {
            explanation = `${item.exponent} 个相同因数 ${factor} 相乘，得到 ${result}。`;
        }
        return {
            id: item.id,
            expression: item.expression,
            exponent: item.exponent,
            factors: Array(item.exponent).fill(factor),
            outsideMinus: !!item.outsideMinus,
            choices: [...item.choices],
            result,
            explanation
        };
    }

    const api = { cases: cases.map(({ id, expression }) => ({ id, expression })), powerTrace };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.RationalPowerModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

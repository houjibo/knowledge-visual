/* Finite arithmetic for the middle-school rational-number keypad. */
(function (root) {
    'use strict';

    const MAX_LENGTH = 80;
    const MAX_MAGNITUDE = 1e8;

    function evaluate(expression) {
        if (typeof expression !== 'string' || !expression.trim()) throw new Error('请先输入算式');
        if (expression.length > MAX_LENGTH) throw new Error('算式太长，请清除后重试');

        const tokens = [];
        let cursor = 0;
        while (cursor < expression.length) {
            const rest = expression.slice(cursor);
            if (/^\s/.test(rest)) { cursor++; continue; }
            const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
            if (number) {
                const value = Number(number[0]);
                if (!Number.isFinite(value)) throw new Error('数字超出可计算范围');
                tokens.push(value);
                cursor += number[0].length;
                continue;
            }
            const token = rest[0];
            if (!'+-×÷()'.includes(token)) throw new Error('算式包含不支持的字符');
            tokens.push(token);
            cursor++;
        }

        let index = 0;
        function bounded(value) {
            if (!Number.isFinite(value) || Math.abs(value) > MAX_MAGNITUDE) {
                throw new Error('结果超出本计算器的显示范围');
            }
            return value;
        }
        function primary() {
            const token = tokens[index++];
            if (typeof token === 'number') return token;
            if (token === '(') {
                const value = sum();
                if (tokens[index++] !== ')') throw new Error('括号未闭合');
                return value;
            }
            throw new Error('算式缺少数字或括号');
        }
        function unary() {
            if (tokens[index] === '+' || tokens[index] === '-') {
                const sign = tokens[index++];
                const value = unary();
                return sign === '-' ? -value : value;
            }
            return primary();
        }
        function product() {
            let value = unary();
            while (tokens[index] === '×' || tokens[index] === '÷') {
                const op = tokens[index++];
                const right = unary();
                if (op === '÷' && right === 0) throw new Error('除数不能为 0');
                value = bounded(op === '×' ? value * right : value / right);
            }
            return value;
        }
        function sum() {
            let value = product();
            while (tokens[index] === '+' || tokens[index] === '-') {
                const op = tokens[index++];
                const right = product();
                value = bounded(op === '+' ? value + right : value - right);
            }
            return value;
        }

        const rawValue = bounded(sum());
        if (index !== tokens.length) throw new Error('算式有误，请检查括号或运算符');
        const value = Object.is(rawValue, -0) ? 0 : rawValue;
        const rounded = Math.round(value * 1e6) / 1e6;
        const approximate = rounded === 0 ? value !== 0 : Math.abs(value - rounded) > 1e-10;
        const text = Object.is(rounded, -0) ? '0' : String(rounded);
        return { value, text, approximate, rule: signRule(expression, value) };
    }

    function signRule(expression, result) {
        const match = expression.match(/^\s*(?:\((-?\d+(?:\.\d+)?)\)|(-?\d+(?:\.\d+)?))\s*([×÷])\s*(?:\((-?\d+(?:\.\d+)?)\)|(-?\d+(?:\.\d+)?))\s*$/);
        if (!match) return '';
        const left = Number(match[1] ?? match[2]);
        const right = Number(match[4] ?? match[5]);
        const op = match[3];
        if (result === 0) {
            return op === '×'
                ? '0 与任何有理数相乘都得 0；0 既不是正数也不是负数。'
                : '0 除以非零数得 0；0 既不是正数也不是负数。';
        }
        const sameSign = (left > 0 && right > 0) || (left < 0 && right < 0);
        return sameSign ? '两个非零数同号相乘或相除，结果为正。' : '两个非零数异号相乘或相除，结果为负。';
    }

    const api = { evaluate };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.RationalNumberModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

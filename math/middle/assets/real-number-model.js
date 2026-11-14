(function (root, factory) {
    const model = factory();
    if (typeof module === 'object' && module.exports) module.exports = model;
    if (root) root.KVRealNumberModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const decimalPattern = '(?:\\d+(?:\\.\\d{0,8})?|\\.\\d{1,8})';
    const numberPattern = new RegExp(`^([+-]?${decimalPattern})(?:/(${decimalPattern}))?$`);
    const rootPattern = new RegExp(`^([+-]?)√(?:\\((${decimalPattern})\\)|(${decimalPattern}))$`);
    const constantPattern = new RegExp(`^([+-]?)(π|e)(?:([*/+-])(${decimalPattern}))?$`);

    function gcd(a, b) {
        while (b !== 0n) [a, b] = [b, a % b];
        return a;
    }

    function reduced(numerator, denominator) {
        if (denominator === 0n) return null;
        if (denominator < 0n) {
            numerator = -numerator;
            denominator = -denominator;
        }
        const divisor = gcd(numerator < 0n ? -numerator : numerator, denominator);
        return {numerator: numerator / divisor, denominator: denominator / divisor};
    }

    function decimalRatio(raw) {
        const match = /^([+-]?)(?:(\d+)(?:\.(\d{0,8}))?|\.(\d{1,8}))$/.exec(raw);
        if (!match) return null;
        const decimals = match[3] === undefined ? (match[4] || '') : match[3];
        const digits = (match[2] || '0') + decimals;
        const sign = match[1] === '-' ? -1n : 1n;
        return reduced(sign * BigInt(digits), 10n ** BigInt(decimals.length));
    }

    function squareRootIfExact(value) {
        if (value < 0n) return null;
        let root = BigInt(Math.floor(Math.sqrt(Number(value))));
        while (root * root > value) root--;
        while ((root + 1n) * (root + 1n) <= value) root++;
        return root * root === value ? root : null;
    }

    function rationalResult(label, ratio) {
        if (!ratio) return null;
        const value = Number(ratio.numerator) / Number(ratio.denominator);
        if (!Number.isFinite(value)) return null;
        const isInteger = ratio.numerator % ratio.denominator === 0n;
        return {label, value, kind: 'rational', isInteger,
            isNatural: isInteger && ratio.numerator >= 0n};
    }

    function parseNumber(input) {
        if (typeof input !== 'string' || input.length > 40) return null;
        const label = input.replace(/\s/g, '').replace(/−/g, '-').replace(/×/g, '*').replace(/pi/gi, 'π').replace(/sqrt/gi, '√');
        if (!label) return null;

        const number = numberPattern.exec(label);
        if (number) {
            const numerator = decimalRatio(number[1]);
            const denominator = number[2] ? decimalRatio(number[2]) : null;
            if (!numerator || (number[2] && (!denominator || denominator.numerator === 0n))) return null;
            const ratio = denominator
                ? reduced(numerator.numerator * denominator.denominator,
                    numerator.denominator * denominator.numerator)
                : numerator;
            return rationalResult(label, ratio);
        }

        const root = rootPattern.exec(label);
        if (root) {
            const radicand = decimalRatio(root[2] || root[3]);
            if (!radicand || radicand.numerator < 0n) return null;
            const sign = root[1] === '-' ? -1 : 1;
            const value = sign * Math.sqrt(Number(radicand.numerator) / Number(radicand.denominator));
            if (!Number.isFinite(value)) return null;
            const rootNumerator = squareRootIfExact(radicand.numerator);
            const rootDenominator = squareRootIfExact(radicand.denominator);
            if (rootNumerator !== null && rootDenominator !== null) {
                const ratio = reduced(BigInt(sign) * rootNumerator, rootDenominator);
                return rationalResult(label, ratio);
            }
            return {label, value, kind: 'irrational', isInteger: false, isNatural: false};
        }

        const constant = constantPattern.exec(label);
        if (constant) {
            const sign = constant[1] === '-' ? -1 : 1;
            const base = (constant[2] === 'π' ? Math.PI : Math.E) * sign;
            const operand = constant[4] ? decimalRatio(constant[4]) : null;
            if (constant[4] && !operand) return null;
            const amount = operand ? Number(operand.numerator) / Number(operand.denominator) : 0;
            let value = base;
            if (constant[3] === '*') value *= amount;
            if (constant[3] === '/') value /= amount;
            if (constant[3] === '+') value += amount;
            if (constant[3] === '-') value -= amount;
            if (!Number.isFinite(value)) return null;
            if (constant[3] === '*' && operand.numerator === 0n) {
                return {label, value: 0, kind: 'rational', isInteger: true, isNatural: true};
            }
            return {label, value, kind: 'irrational', isInteger: false, isNatural: false};
        }
        return null;
    }

    function squareArea(areaText) {
        const area = decimalRatio(String(areaText));
        if (!area || area.numerator < 0n) return null;
        const result = parseNumber(`√${areaText}`);
        if (!result) return null;
        return {...result, area: Number(area.numerator) / Number(area.denominator),
            isSqrtTwo: area.numerator === 2n * area.denominator};
    }

    return {parseNumber, squareArea};
});

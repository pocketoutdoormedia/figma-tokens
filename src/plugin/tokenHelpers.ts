import {appendTypeToToken} from '@/app/components/createTokenObj';
import {getAliasValue} from '@/utils/aliases';
import checkIfAlias from '@/utils/checkIfAlias';
import {SingleTokenObject} from 'Types/tokens';
import {mergeDeep} from './helpers';

export function findAllAliases(tokens) {
    return tokens.filter((token) => checkIfAlias(token, tokens));
}

export function reduceToValues(tokens) {
    const reducedTokens = Object.entries(tokens).reduce((prev, group) => {
        prev.push({[group[0]]: group[1]});
        return prev;
    }, []);

    const assigned = mergeDeep({}, ...reducedTokens);

    return assigned;
}

export function resolveTokenValues(tokens, previousCount = undefined) {
    const aliases = findAllAliases(tokens);
    let returnedTokens = tokens;
    returnedTokens = tokens.map((t) => {
        let returnValue;
        // Iterate over Typography and boxShadow Object to get resolved values
        if (['typography', 'boxShadow'].includes(t.type)) {
            returnValue = Object.entries(t.value).reduce((acc, [key, value]) => {
                acc[key] = getAliasValue(value, tokens);
                return acc;
            }, {});
        } else {
            // If we're not dealing with special tokens, just return resolved value
            returnValue = getAliasValue(t, tokens);
        }
        return {
            ...t,
            value: returnValue,
            rawValue: t.rawValue || t.value,
        };
    });
    if (aliases.length > 0 && (previousCount > aliases.length || !previousCount)) {
        return resolveTokenValues(returnedTokens, aliases.length);
    }

    return returnedTokens;
}

export function computeMergedTokens(tokens, usedTokenSet): SingleTokenObject[] {
    const mergedTokens = [];
    // Reverse token set order (right-most win) and check for duplicates
    Object.entries(tokens)
        .reverse()
        .forEach((tokenGroup: [string, SingleTokenObject[]]) => {
            if (usedTokenSet.includes(tokenGroup[0])) {
                tokenGroup[1].forEach((token) => {
                    if (!mergedTokens.some((t) => t.name === token.name)) mergedTokens.push(appendTypeToToken(token));
                });
            }
        });
    return mergedTokens;
}

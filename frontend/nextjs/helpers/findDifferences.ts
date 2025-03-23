type Value = string | number | boolean | null | undefined | object | Value[]; // Possible value types
type Changes = { [key: string]: { before: Value; after: Value } | Changes }; // Recursive changes type

interface ComparableObjects {
    [key: string]: any;
}

export function findDifferences(o1: ComparableObjects, o2: ComparableObjects): Changes {
    const changes: Changes = {};

    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(o1), ...Object.keys(o2)]);

    allKeys.forEach((key) => {
        // Handle cases where a key exists in one object but not the other
        if (!(key in o1)) {
            changes[key] = { before: undefined, after: o2[key] };
        } else if (!(key in o2)) {
            changes[key] = { before: o1[key], after: undefined };
        } else {
            // Both objects have the key - compare values
            if (typeof o1[key] === 'object' && typeof o2[key] === 'object') {
                if (o1[key] === null || o2[key] === null) {
                    if (o1[key] !== o2[key]) {
                        changes[key] = { before: o1[key], after: o2[key] };
                    }
                } else if (Array.isArray(o1[key]) && Array.isArray(o2[key])) {
                    // Compare arrays
                    if (o1[key].length !== o2[key].length || o1[key].some((val: any, index: number) => val !== o2[key][index])) {
                        changes[key] = { before: o1[key], after: o2[key] };
                    }
                } else {
                    // Recursively compare nested objects
                    const nestedChanges = findDifferences(o1[key], o2[key]);
                    if (Object.keys(nestedChanges).length > 0) {
                        changes[key] = { before: o1[key], after: o2[key] };
                    }
                }
            } else if (o1[key] !== o2[key]) {
                changes[key] = { before: o1[key], after: o2[key] };
            }
        }
    });

    return changes;
}

export default findDifferences;
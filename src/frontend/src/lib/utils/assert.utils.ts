/**
 * Simple assertion function that throws an error if condition is false
 * @param {boolean} condition - The condition to check
 * @param {string} message - Error message to display if assertion fails
 */
export const assert = (condition: boolean, message: string) => {
	if (!condition) {
		throw new Error(`Assertion failed: ${message}`);
	}
};

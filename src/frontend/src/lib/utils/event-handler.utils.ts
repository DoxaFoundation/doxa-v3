/**
 * Event handler utilities with TypeScript type definitions
 */

/**
 * Creates a function that will only execute once
 * @param fn The function to be executed once
 */
function once<E extends Event>(fn: (event: E) => void): (event: E) => void {
	return function (this: unknown, event: E): void {
		if (fn) fn.call(this, event);
		fn = null as unknown as (event: E) => void;
	};
}

/**
 * Creates a function that prevents the default event behavior before executing the callback
 * @param fn The function to execute after preventing default
 */
function preventDefault<E extends Event>(fn: (event: E) => void): (event: E) => void {
	return function (this: unknown, event: E): void {
		event.preventDefault();
		fn.call(this, event);
	};
}

/**
 * Creates a function that stops event propagation before executing the callback
 * @param fn The function to execute after stopping propagation
 */
function stopPropagation<E extends Event>(fn: (event: E) => void): (event: E) => void {
	return function (this: unknown, event: E): void {
		event.stopPropagation();
		fn.call(this, event);
	};
}

export { once, preventDefault, stopPropagation };

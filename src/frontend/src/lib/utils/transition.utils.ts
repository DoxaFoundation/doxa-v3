// Custom flip transition
import { cubicOut } from 'svelte/easing';

export function flip(
	node: HTMLElement,
	{
		duration = 400,
		delay = 0,
		easing = cubicOut,
		axis = 'x' // 'x' for horizontal flip, 'y' for vertical flip
	}
) {
	return {
		duration,
		delay,
		easing,
		css: (t: number) => {
			const rotation = (1 - t) * 180;
			return `
        transform: rotate${axis.toUpperCase()}(${rotation}deg);
        opacity: ${t};
      `;
		}
	};
}

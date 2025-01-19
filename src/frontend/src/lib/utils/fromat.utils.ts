import { from6Decimals } from './decimals.utils';

export function formatNumber(number: number): string {
	let [intPart, decimalPart] = number.toString().split('.');
	intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
	return decimalPart ? `${intPart}.${decimalPart}` : intPart;
}

export function displayBalanceInFormat(balance: bigint): string {
	return formatNumber(from6Decimals(balance));
}

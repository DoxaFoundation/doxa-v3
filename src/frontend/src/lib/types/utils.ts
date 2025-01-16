export type Option<T> = T | null | undefined;

export interface ResultSuccess<T = unknown> {
	success: boolean;
	err?: T;
}

import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        [x: string]: any;
        menuClass?: string | undefined;
        onClick?: (() => void) | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type NavHamburgerProps = typeof __propDef.props;
export type NavHamburgerEvents = typeof __propDef.events;
export type NavHamburgerSlots = typeof __propDef.slots;
/**
 * [Go to docs](https://flowbite-svelte.com/)
 * ## Props
 * @prop export let menuClass: string = 'h-6 w-6 shrink-0';
 * @prop export let onClick: (() => void) | undefined = undefined;
 */
export default class NavHamburger extends SvelteComponentTyped<NavHamburgerProps, NavHamburgerEvents, NavHamburgerSlots> {
}
export {};
//# sourceMappingURL=NavHamburger.svelte.d.ts.map
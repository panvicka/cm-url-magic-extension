
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	/** @returns {void} */
	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/** @type {typeof globalThis} */
	const globals =
		typeof window !== 'undefined'
			? window
			: typeof globalThis !== 'undefined'
			? globalThis
			: // @ts-ignore Node typings have this
			  global;

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @template {keyof SVGElementTagNameMap} K
	 * @param {K} name
	 * @returns {SVGElement}
	 */
	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.2.19';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	const DEV_SUBDOMAIN = 'ksb-dev.bitgrip.berlin';
	const DEFAULT_LANG = 'demo-de-de';
	const DEFAULT_PROD_LANG = 'de-de';
	var Environments;
	(function (Environments) {
	    Environments["DEV_PREVIEW"] = "DEV_PREVIEW";
	    Environments["STAGE"] = "STAGE";
	    Environments["STAGE_PREVIEW"] = "STAGE_PREVIEW";
	    Environments["PROD"] = "PROD";
	    Environments["PROD_PREVIEW"] = "PROD_PREVIEW";
	    Environments["LOCALHOST"] = "LOCALHOST";
	})(Environments || (Environments = {}));
	const Environment = [
	    {
	        name: Environments.DEV_PREVIEW,
	        label: 'preview dev',
	        path: `preview.${DEV_SUBDOMAIN}`
	    },
	    {
	        name: Environments.STAGE,
	        label: 'stage',
	        path: `stage.${DEV_SUBDOMAIN}`
	    },
	    {
	        name: Environments.STAGE_PREVIEW,
	        label: 'preview stage',
	        path: `preview-stage.${DEV_SUBDOMAIN}`
	    },
	    {
	        name: Environments.PROD,
	        label: 'production',
	        path: 'ksb.com'
	    },
	    {
	        name: Environments.PROD_PREVIEW,
	        label: 'preview prod',
	        path: 'preview-e2e-sales.ksb.com'
	    },
	    {
	        name: Environments.LOCALHOST,
	        label: 'localhost',
	        path: 'localhost:8081'
	    }
	];

	const evaluateEnvironment = (userInputValue) => {
	    let foundEnvironment;
	    if (userInputValue.includes('.com')) {
	        foundEnvironment = Environment.find((env) => env.name === Environments.PROD);
	    }
	    if (userInputValue.includes('preview-e2e-sales')) {
	        foundEnvironment = Environment.find((env) => env.name === Environments.PROD_PREVIEW);
	    }
	    if (userInputValue.includes('ksb-dev')) {
	        foundEnvironment = Environment.find((env) => env.name === Environments.DEV_PREVIEW);
	    }
	    if (userInputValue.includes('ksb-stage') && !userInputValue.includes('preview')) {
	        foundEnvironment = Environment.find((env) => env.name === Environments.STAGE);
	    }
	    if (userInputValue.includes('ksb-stage') && userInputValue.includes('preview')) {
	        foundEnvironment = Environment.find((env) => env.name === Environments.STAGE_PREVIEW);
	    }
	    if (userInputValue.includes('localhost')) {
	        foundEnvironment = Environment.find((env) => env.name === Environments.LOCALHOST);
	    }
	    return foundEnvironment;
	};
	const evaluateLanguage = (userInputValue) => {
	    const regexToMatchLanguage = /(?:\/|^)([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/;
	    const regexToMatchDemoLanguage = /(?:^|\/)(demo-[a-z]{2}-[a-z]{2})(?:\/|$)/;
	    let language = '';
	    let matchedLanguage = userInputValue.match(regexToMatchDemoLanguage);
	    if (matchedLanguage) {
	        language = matchedLanguage[1];
	    }
	    else {
	        matchedLanguage = userInputValue.match(regexToMatchLanguage);
	        if (matchedLanguage) {
	            language = matchedLanguage[1];
	        }
	    }
	    return language;
	};
	const evaluateTicketNumber = (userInputValue) => {
	    const regexToMatchOnlyTheTicketNumbers = /KSBP-(\d+)/i;
	    const matchedTicketNumber = userInputValue.match(regexToMatchOnlyTheTicketNumbers);
	    if (matchedTicketNumber && matchedTicketNumber[1]) {
	        return matchedTicketNumber[1];
	    }
	    else {
	        return undefined;
	    }
	};
	const evaluatePath = (userInputValue, environment, language) => {
	    const regexToMatchTheRestOfTheURLLocalhost = /http:\/\/localhost:8081(\/.*)/;
	    const regexToMatchTheRestOfTheURL = /\.berlin(\/.*)/;
	    const regexToMatchTheRestOfTheURLProd = /\.ksb.com(\/.*)/;
	    let matchedRestURL;
	    let path = '';
	    if (environment?.name === Environments.PROD || environment?.name === Environments.PROD_PREVIEW) {
	        matchedRestURL = userInputValue.match(regexToMatchTheRestOfTheURLProd);
	        if (matchedRestURL) {
	            path = matchedRestURL[1];
	            path = language ? path?.replace(language, '') : path;
	            path = path.replace(/^\/+/, '');
	        }
	    }
	    else if (environment?.name === Environments.LOCALHOST) {
	        matchedRestURL = userInputValue.match(regexToMatchTheRestOfTheURLLocalhost);
	        if (matchedRestURL) {
	            path = matchedRestURL[1];
	            path = language ? path?.replace(language, '') : path;
	            path = path.replace(/^\/+/, '');
	        }
	    }
	    else {
	        matchedRestURL = userInputValue.match(regexToMatchTheRestOfTheURL);
	        if (matchedRestURL) {
	            path = matchedRestURL[1];
	            path = language ? path?.replace(language, '') : path;
	            path = path.replace(/^\/+/, '');
	        }
	    }
	    return path;
	};

	const getLocalHostPath = ({ language, path }) => {
	    return [
	        {
	            name: 'Localhost',
	            href: `http://localhost:8081/${language || DEFAULT_PROD_LANG}/${path}`
	        }
	    ];
	};
	const getJiraTicketPath = ({ ticketNumber }) => {
	    if (!ticketNumber)
	        return [];
	    return [
	        {
	            name: 'Jira Ticket',
	            href: `https://bitgrip.atlassian.net/browse/KSBP-${ticketNumber}`
	        }
	    ];
	};
	const getProdPreviewPath = ({ language, path }) => {
	    return [
	        {
	            name: 'Prod Preview',
	            href: `https://preview-e2e-sales.ksb.com/${language || DEFAULT_PROD_LANG}/${path}`
	        }
	    ];
	};
	const getProdPath = ({ language, path }) => {
	    return [
	        {
	            name: 'Prod',
	            href: `https://www.ksb.com/${language || DEFAULT_PROD_LANG}/${path}`
	        },
	        {
	            name: 'CM Prod Content',
	            href: `https://live-resources-e2e-sales.ksb.com/api/v1/page/${language}/${path}`
	        }
	    ];
	};
	const getStagePreviewPath = ({ language, path }) => {
	    return [
	        {
	            name: 'Stage Preview',
	            href: `https://preview.ksb-stage.bitgrip.berlin/${language}/${path}`
	        },
	        {
	            name: 'CM Stage Preview Content',
	            href: `https://preview-api.ksb-stage.bitgrip.berlin/api/v1/page/${language}/${path}`
	        }
	    ];
	};
	const getDevPath = ({ language, path }) => {
	    return [
	        {
	            name: 'Dev Preview',
	            href: `https://preview.ksb-dev.bitgrip.berlin/${language || DEFAULT_LANG}/${path}`
	        },
	        {
	            name: 'CM Dev Preview Content',
	            href: `https://preview-api.ksb-dev.bitgrip.berlin/api/v1/page/${language || DEFAULT_LANG}/${path}`
	        }
	    ];
	};
	const getBranchDeploymentPaths = ({ ticketNumber, language, path }) => {
	    const links = [];
	    if (!ticketNumber)
	        return links;
	    return [
	        {
	            name: 'Branch Deployment',
	            href: `https://ksbp-${ticketNumber}.ksb-dev.bitgrip.berlin/${language || DEFAULT_LANG}/${path}`
	        }
	    ];
	};
	const linkCreator = (userInfo) => {
	    const { language = DEFAULT_LANG, path = '', ticketNumber, optionalTicketNumber, environment } = userInfo;
	    let links = [];
	    if (ticketNumber || optionalTicketNumber) {
	        let useTicketNumber = ticketNumber || optionalTicketNumber;
	        if (ticketNumber && optionalTicketNumber) {
	            useTicketNumber = optionalTicketNumber;
	        }
	        links = [
	            ...links,
	            ...getBranchDeploymentPaths({
	                ticketNumber: useTicketNumber,
	                language: language,
	                path
	            })
	        ];
	        links = [
	            ...links,
	            ...getJiraTicketPath({ ticketNumber: ticketNumber || optionalTicketNumber })
	        ];
	    }
	    if (environment?.name === Environments.PROD) {
	        links = [
	            ...links,
	            ...getProdPreviewPath({ language, path }),
	            ...getStagePreviewPath({ language, path }),
	            ...getLocalHostPath({ language, path })
	        ];
	    }
	    if (environment?.name === Environments.PROD_PREVIEW) {
	        links = [
	            ...links,
	            ...getProdPath({ language, path }),
	            ...getStagePreviewPath({ language, path }),
	            ...getLocalHostPath({ language, path })
	        ];
	    }
	    if (environment?.name === Environments.DEV_PREVIEW) {
	        links = [
	            ...links,
	            ...getStagePreviewPath({ language, path }),
	            ...getLocalHostPath({ language, path })
	        ];
	    }
	    if (environment?.name === Environments.STAGE_PREVIEW) {
	        links = [...links, ...getDevPath({ language, path }), ...getLocalHostPath({ language, path })];
	    }
	    if (environment?.name === Environments.LOCALHOST) {
	        links = [
	            ...links,
	            ...getDevPath({ language, path }),
	            ...getProdPath({ language, path }),
	            ...getStagePreviewPath({ language, path })
	        ];
	    }
	    return links;
	};

	/* src/App.svelte generated by Svelte v4.2.19 */

	const { console: console_1 } = globals;

	const file = "src/App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[5] = list[i];
		return child_ctx;
	}

	// (92:4) {#each links as link}
	function create_each_block(ctx) {
		let div2;
		let div0;
		let a0;
		let t0_value = /*link*/ ctx[5].name + "";
		let t0;
		let a0_href_value;
		let t1;
		let small;
		let a1;
		let t2_value = /*link*/ ctx[5].href + "";
		let t2;
		let a1_href_value;
		let t3;
		let div1;
		let button;
		let svg;
		let path;
		let t4;
		let hr;

		const block = {
			c: function create() {
				div2 = element("div");
				div0 = element("div");
				a0 = element("a");
				t0 = text(t0_value);
				t1 = space();
				small = element("small");
				a1 = element("a");
				t2 = text(t2_value);
				t3 = space();
				div1 = element("div");
				button = element("button");
				svg = svg_element("svg");
				path = svg_element("path");
				t4 = space();
				hr = element("hr");
				attr_dev(a0, "href", a0_href_value = /*link*/ ctx[5].href);
				attr_dev(a0, "target", "_blank");
				add_location(a0, file, 115, 10, 3803);
				attr_dev(a1, "href", a1_href_value = /*link*/ ctx[5].href);
				attr_dev(a1, "target", "_blank");
				add_location(a1, file, 116, 17, 3872);
				add_location(small, file, 116, 10, 3865);
				add_location(div0, file, 114, 8, 3787);
				attr_dev(path, "stroke-linecap", "round");
				attr_dev(path, "stroke-linejoin", "round");
				attr_dev(path, "d", "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75");
				add_location(path, file, 132, 14, 4327);
				attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg, "fill", "none");
				attr_dev(svg, "viewBox", "0 0 24 24");
				attr_dev(svg, "stroke-width", "1.5");
				attr_dev(svg, "stroke", "currentColor");
				add_location(svg, file, 125, 12, 4116);
				attr_dev(button, "class", "copy-to-clip-button");
				attr_dev(button, "data-tooltip", "Copy link");
				attr_dev(button, "data-placement", "right");
				add_location(button, file, 120, 10, 3972);
				add_location(div1, file, 119, 8, 3956);
				attr_dev(div2, "class", "grid");
				add_location(div2, file, 113, 6, 3760);
				add_location(hr, file, 141, 6, 4992);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				append_dev(div2, div0);
				append_dev(div0, a0);
				append_dev(a0, t0);
				append_dev(div0, t1);
				append_dev(div0, small);
				append_dev(small, a1);
				append_dev(a1, t2);
				append_dev(div2, t3);
				append_dev(div2, div1);
				append_dev(div1, button);
				append_dev(button, svg);
				append_dev(svg, path);
				insert_dev(target, t4, anchor);
				insert_dev(target, hr, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*links*/ 4 && t0_value !== (t0_value = /*link*/ ctx[5].name + "")) set_data_dev(t0, t0_value);

				if (dirty & /*links*/ 4 && a0_href_value !== (a0_href_value = /*link*/ ctx[5].href)) {
					attr_dev(a0, "href", a0_href_value);
				}

				if (dirty & /*links*/ 4 && t2_value !== (t2_value = /*link*/ ctx[5].href + "")) set_data_dev(t2, t2_value);

				if (dirty & /*links*/ 4 && a1_href_value !== (a1_href_value = /*link*/ ctx[5].href)) {
					attr_dev(a1, "href", a1_href_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div2);
					detach_dev(t4);
					detach_dev(hr);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(92:4) {#each links as link}",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let link_1;
		let t0;
		let main;
		let div0;
		let t1;
		let t2_value = /*isActive*/ ctx[0].toString() + "";
		let t2;
		let t3;
		let div1;
		let t4;
		let t5;
		let t6;
		let div2;
		let each_value = ensure_array_like_dev(/*links*/ ctx[2]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				link_1 = element("link");
				t0 = space();
				main = element("main");
				div0 = element("div");
				t1 = text("Is Active: ");
				t2 = text(t2_value);
				t3 = space();
				div1 = element("div");
				t4 = text("Active Tab URL: ");
				t5 = text(/*activeTabUrl*/ ctx[1]);
				t6 = space();
				div2 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				document.title = "You App Name";
				attr_dev(link_1, "rel", "stylesheet");
				attr_dev(link_1, "href", "/build/bundle.css");
				add_location(link_1, file, 104, 2, 3483);
				attr_dev(div0, "class", "container");
				add_location(div0, file, 108, 2, 3577);
				attr_dev(div1, "class", "container");
				add_location(div1, file, 109, 2, 3641);
				attr_dev(div2, "class", "container");
				add_location(div2, file, 111, 2, 3704);
				attr_dev(main, "class", "text-base");
				add_location(main, file, 107, 0, 3550);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				append_dev(document.head, link_1);
				insert_dev(target, t0, anchor);
				insert_dev(target, main, anchor);
				append_dev(main, div0);
				append_dev(div0, t1);
				append_dev(div0, t2);
				append_dev(main, t3);
				append_dev(main, div1);
				append_dev(div1, t4);
				append_dev(div1, t5);
				append_dev(main, t6);
				append_dev(main, div2);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div2, null);
					}
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*isActive*/ 1 && t2_value !== (t2_value = /*isActive*/ ctx[0].toString() + "")) set_data_dev(t2, t2_value);
				if (dirty & /*activeTabUrl*/ 2) set_data_dev(t5, /*activeTabUrl*/ ctx[1]);

				if (dirty & /*links*/ 4) {
					each_value = ensure_array_like_dev(/*links*/ ctx[2]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div2, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(main);
				}

				detach_dev(link_1);
				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		let isActive = false;
		let activeTabUrl = "";
		let links = [];
		let userInfo = {};

		// Listen for URL updates from the background script
		if (typeof chrome !== "undefined" && chrome.tabs) {
			chrome.runtime.onMessage.addListener(message => {
				if (message.newUrl) {
					$$invalidate(1, activeTabUrl = message.newUrl);
					isActiveUrlRelevant(); // Check URL relevance whenever the URL changes

					userInfo = {
						environment: undefined,
						ticketNumber: "",
						subdomain: "",
						secondLevelDomain: "",
						language: "",
						path: ""
					};

					if (activeTabUrl) {
						userInfo.environment = evaluateEnvironment(activeTabUrl);
						userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl);
						userInfo.language = evaluateLanguage(activeTabUrl);
						userInfo.path = evaluatePath(activeTabUrl, userInfo.environment, userInfo.language);
					} // userInfo.optionalTicketNumber = evaluateTicketNumber(optionalUserInput);
				}
			});
		}

		// Function to check if the active tab URL is relevant
		const isActiveUrlRelevant = () => {
			if (typeof chrome !== "undefined" && chrome.tabs) {
				chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
					if (tabs.length > 0 && tabs[0].url) {
						const environment = evaluateEnvironment(tabs[0].url);
						console.log(environment);
						console.log(tabs[0].url);

						if (environment?.name) {
							console.log("Relevant environment detected");
							$$invalidate(1, activeTabUrl = tabs[0].url);
							$$invalidate(0, isActive = true); // Update isActive here inside the callback

							if (activeTabUrl) {
								userInfo.environment = evaluateEnvironment(activeTabUrl);
								userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl);
								userInfo.language = evaluateLanguage(activeTabUrl);
								userInfo.path = evaluatePath(activeTabUrl, userInfo.environment, userInfo.language);
							} // userInfo.optionalTicketNumber = evaluateTicketNumber(optionalUserInput);

							$$invalidate(2, links = linkCreator(userInfo));
							console.log(links);
						} else {
							$$invalidate(0, isActive = false); // If the environment is not relevant, set to false
						}
					} else {
						$$invalidate(0, isActive = false); // No active tab or URL found
					}
				});
			} else {
				$$invalidate(0, isActive = false); // If chrome API is not available, default to false
			}
		};

		// Call this function when the component mounts
		onMount(() => {
			isActiveUrlRelevant(); // Check the active tab URL on mount
		});

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			evaluateEnvironment,
			evaluateLanguage,
			evaluatePath,
			evaluateTicketNumber,
			linkCreator,
			onMount,
			isActive,
			activeTabUrl,
			links,
			userInfo,
			isActiveUrlRelevant
		});

		$$self.$inject_state = $$props => {
			if ('isActive' in $$props) $$invalidate(0, isActive = $$props.isActive);
			if ('activeTabUrl' in $$props) $$invalidate(1, activeTabUrl = $$props.activeTabUrl);
			if ('links' in $$props) $$invalidate(2, links = $$props.links);
			if ('userInfo' in $$props) userInfo = $$props.userInfo;
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [isActive, activeTabUrl, links];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}
	}

	// @ts-ignore
	const app = new App({
	    target: document.body,
	});

	return app;

})();

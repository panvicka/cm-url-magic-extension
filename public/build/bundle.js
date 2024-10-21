
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35731/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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

	function action_destroyer(action_result) {
		return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
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
	 * @returns {void} */
	function set_input_value(input, value) {
		input.value = value == null ? '' : value;
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

	/**
	 * Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname).
	 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
	 *
	 * Component events created with `createEventDispatcher` create a
	 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
	 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
	 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
	 * property and can contain any type of data.
	 *
	 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
	 * ```ts
	 * const dispatch = createEventDispatcher<{
	 *  loaded: never; // does not take a detail argument
	 *  change: string; // takes a detail argument of type string, which is required
	 *  optional: number | null; // takes an optional detail argument of type number
	 * }>();
	 * ```
	 *
	 * https://svelte.dev/docs/svelte#createeventdispatcher
	 * @template {Record<string, any>} [EventMap=any]
	 * @returns {import('./public.js').EventDispatcher<EventMap>}
	 */
	function createEventDispatcher() {
		const component = get_current_component();
		return (type, detail, { cancelable = false } = {}) => {
			const callbacks = component.$$.callbacks[type];
			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
				callbacks.slice().forEach((fn) => {
					fn.call(component, event);
				});
				return !event.defaultPrevented;
			}
			return true;
		};
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

	/** @returns {void} */
	function add_flush_callback(fn) {
		flush_callbacks.push(fn);
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
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

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

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
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
	function bind(component, name, callback) {
		const index = component.$$.props[name];
		if (index !== undefined) {
			component.$$.bound[index] = callback;
			callback(component.$$.ctx[index]);
		}
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
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
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
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
	    Environments["JIRA"] = "JIRA";
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
	    },
	    {
	        name: Environments.JIRA,
	        label: 'Jira',
	        path: 'bitgrip.atlassian.net'
	    }
	];

	const evaluateEnvironment = (userInputValue) => {
	    let foundEnvironment;
	    if (userInputValue.includes('ksb.com')) {
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
	    if (userInputValue.includes('bitgrip.atlassian.net/browse')) {
	        foundEnvironment = Environment.find((env) => env.name === Environments.JIRA);
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

	/* src/Footer.svelte generated by Svelte v4.2.19 */
	const file$3 = "src/Footer.svelte";

	function create_fragment$3(ctx) {
		let footer;
		let t0;
		let svg0;
		let path0;
		let t1;
		let a;
		let svg1;
		let g0;
		let g1;
		let g2;
		let path1;
		let path2;

		const block = {
			c: function create() {
				footer = element("footer");
				t0 = text("Build with ");
				svg0 = svg_element("svg");
				path0 = svg_element("path");
				t1 = text("\n\tand\n\t");
				a = element("a");
				svg1 = svg_element("svg");
				g0 = svg_element("g");
				g1 = svg_element("g");
				g2 = svg_element("g");
				path1 = svg_element("path");
				path2 = svg_element("path");
				attr_dev(path0, "stroke-linecap", "round");
				attr_dev(path0, "stroke-linejoin", "round");
				attr_dev(path0, "d", "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z");
				add_location(path0, file$3, 9, 2, 195);
				attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg0, "fill", "none");
				attr_dev(svg0, "viewBox", "0 0 24 24");
				attr_dev(svg0, "stroke-width", "1.5");
				attr_dev(svg0, "stroke", "currentColor");
				attr_dev(svg0, "class", "footer-logo svelte-kqarzk");
				add_location(svg0, file$3, 1, 12, 45);
				attr_dev(g0, "id", "SVGRepo_bgCarrier");
				attr_dev(g0, "stroke-width", "0");
				add_location(g0, file$3, 24, 4, 620);
				attr_dev(g1, "id", "SVGRepo_tracerCarrier");
				attr_dev(g1, "stroke-linecap", "round");
				attr_dev(g1, "stroke-linejoin", "round");
				add_location(g1, file$3, 24, 51, 667);
				attr_dev(path1, "fill", "#ff3e00");
				attr_dev(path1, "d", "M395 115c-35-51-106-66-157-34l-89 57a103 103 0 00-46 69 108 108 0 0010 69 103 103 0 00-15 39 109 109 0 0019 82c35 51 106 66 157 34l89-57a103 103 0 0046-69 108 108 0 00-10-69 103 103 0 0015-39 109 109 0 00-19-82");
				add_location(path1, file$3, 29, 5, 797);
				attr_dev(path2, "fill", "#ffffff");
				attr_dev(path2, "d", "M230 402a71 71 0 01-77-28 66 66 0 01-11-50 62 62 0 012-8l2-5 5 3a115 115 0 0035 17l3 1v4a20 20 0 003 13 21 21 0 0023 9 20 20 0 006-3l89-57a19 19 0 008-12 20 20 0 00-3-15 21 21 0 00-23-9 20 20 0 00-5 3l-34 21a65 65 0 01-19 8 71 71 0 01-76-28 66 66 0 01-11-50 62 62 0 0128-41l89-57a65 65 0 0118-8 71 71 0 0177 28 66 66 0 0111 50 63 63 0 01-2 8l-2 5-5-3a115 115 0 00-35-17l-3-1v-4a20 20 0 00-3-13 21 21 0 00-23-9 20 20 0 00-6 3l-89 57a19 19 0 00-8 12 20 20 0 003 15 21 21 0 0023 9 20 20 0 005-3l34-21a65 65 0 0119-8 71 71 0 0176 28 66 66 0 0111 50 62 62 0 01-28 41l-89 57a65 65 0 01-18 8");
				add_location(path2, file$3, 32, 12, 1055);
				attr_dev(g2, "id", "SVGRepo_iconCarrier");
				add_location(g2, file$3, 28, 8, 764);
				attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg1, "aria-label", "Svelte");
				attr_dev(svg1, "role", "img");
				attr_dev(svg1, "viewBox", "0 0 512 512");
				attr_dev(svg1, "fill", "#000000");
				attr_dev(svg1, "class", "footer-logo svelte-kqarzk");
				add_location(svg1, file$3, 17, 3, 470);
				attr_dev(a, "href", "https://svelte.dev");
				add_location(a, file$3, 16, 1, 438);
				attr_dev(footer, "class", "container-fluid svelte-kqarzk");
				add_location(footer, file$3, 0, 0, 0);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, footer, anchor);
				append_dev(footer, t0);
				append_dev(footer, svg0);
				append_dev(svg0, path0);
				append_dev(footer, t1);
				append_dev(footer, a);
				append_dev(a, svg1);
				append_dev(svg1, g0);
				append_dev(svg1, g1);
				append_dev(svg1, g2);
				append_dev(g2, path1);
				append_dev(g2, path2);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(footer);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$3($$self, $$props) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Footer', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
		});

		return [];
	}

	class Footer extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Footer",
				options,
				id: create_fragment$3.name
			});
		}
	}

	/* src/UserInputField.svelte generated by Svelte v4.2.19 */
	const file$2 = "src/UserInputField.svelte";

	function create_fragment$2(ctx) {
		let div;
		let label_1;
		let t0;
		let t1;
		let input;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				div = element("div");
				label_1 = element("label");
				t0 = text(/*label*/ ctx[1]);
				t1 = space();
				input = element("input");
				attr_dev(label_1, "for", "text");
				add_location(label_1, file$2, 13, 1, 246);
				attr_dev(input, "type", "text");
				attr_dev(input, "name", "text");
				attr_dev(input, "placeholder", "Text");
				attr_dev(input, "aria-label", "Text");
				add_location(input, file$2, 14, 1, 281);
				add_location(div, file$2, 12, 0, 239);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, label_1);
				append_dev(label_1, t0);
				append_dev(div, t1);
				append_dev(div, input);
				set_input_value(input, /*value*/ ctx[0]);

				if (!mounted) {
					dispose = [
						listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
						listen_dev(input, "input", /*input_handler*/ ctx[4], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

				if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
					set_input_value(input, /*value*/ ctx[0]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('UserInputField', slots, []);
		const dispatch = createEventDispatcher();

		function change(e) {
			dispatch('change', { value: e.target.value });
		}

		let { value = '' } = $$props;
		let { label = '' } = $$props;
		const writable_props = ['value', 'label'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<UserInputField> was created with unknown prop '${key}'`);
		});

		function input_input_handler() {
			value = this.value;
			$$invalidate(0, value);
		}

		const input_handler = e => change(e);

		$$self.$$set = $$props => {
			if ('value' in $$props) $$invalidate(0, value = $$props.value);
			if ('label' in $$props) $$invalidate(1, label = $$props.label);
		};

		$$self.$capture_state = () => ({
			createEventDispatcher,
			dispatch,
			change,
			value,
			label
		});

		$$self.$inject_state = $$props => {
			if ('value' in $$props) $$invalidate(0, value = $$props.value);
			if ('label' in $$props) $$invalidate(1, label = $$props.label);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [value, label, change, input_input_handler, input_handler];
	}

	class UserInputField extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 0, label: 1 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "UserInputField",
				options,
				id: create_fragment$2.name
			});
		}

		get value() {
			throw new Error("<UserInputField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set value(value) {
			throw new Error("<UserInputField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get label() {
			throw new Error("<UserInputField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set label(value) {
			throw new Error("<UserInputField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	async function copyText(text) {
	    if ('clipboard' in navigator) {
	        await navigator.clipboard.writeText(text);
	    }
	    else {
	        //? This is the fallback deprecated way of copying text to the clipboard.
	        //? Only runs if it can't find the clipboard API.
	        const element = document.createElement('input');
	        element.type = 'text';
	        element.disabled = true;
	        element.style.setProperty('position', 'fixed');
	        element.style.setProperty('z-index', '-100');
	        element.style.setProperty('pointer-events', 'none');
	        element.style.setProperty('opacity', '0');
	        element.value = text;
	        document.body.appendChild(element);
	        element.click();
	        element.select();
	        document.execCommand('copy');
	        document.body.removeChild(element);
	    }
	}
	function parseOptions(options) {
	    return typeof options == 'string' ? { text: options } : options;
	}
	function addListeners(element, cb, events = ['click']) {
	    for (const event of events) {
	        element.addEventListener(event, cb, true);
	    }
	}
	function removeListeners(element, cb, events = ['click']) {
	    for (const event of events) {
	        element.removeEventListener(event, cb, true);
	    }
	}
	/**
	 * A svelte action to copy text to clipboard.
	 *
	 * @see https://svelte-copy.willow.codes
	 *
	 * @example
	 *
	 * <script>
	 *     import { copy } from 'svelte-copy';
	 * </script>
	 *
	 * <button use:copy={'Hello World'}>
	 *     Click me!
	 * </button>
	 */
	const copy = (element, initialOptions) => {
	    let options = parseOptions(initialOptions);
	    const handle = async (event) => {
	        const text = options.text;
	        try {
	            await copyText(text);
	            options.onCopy?.({ text, event });
	        }
	        catch (e) {
	            const error = new Error(`${e instanceof Error ? e.message : e}`, {
	                cause: e,
	            });
	            options.onError?.({ error, event });
	        }
	    };
	    addListeners(element, handle, options.events);
	    return {
	        update(newOptions) {
	            removeListeners(element, handle, options.events);
	            options = parseOptions(newOptions);
	            addListeners(element, handle, options.events);
	        },
	        destroy() {
	            removeListeners(element, handle, options.events);
	        },
	    };
	};

	/* src/LinkWithCopyButton.svelte generated by Svelte v4.2.19 */
	const file$1 = "src/LinkWithCopyButton.svelte";

	function create_fragment$1(ctx) {
		let div1;
		let a0;
		let t0_value = /*link*/ ctx[0].name + "";
		let t0;
		let a0_href_value;
		let t1;
		let div0;
		let button;
		let svg;
		let path;
		let copy_action;
		let t2;
		let a1;
		let t3_value = /*link*/ ctx[0].href + "";
		let t3;
		let a1_href_value;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				div1 = element("div");
				a0 = element("a");
				t0 = text(t0_value);
				t1 = space();
				div0 = element("div");
				button = element("button");
				svg = svg_element("svg");
				path = svg_element("path");
				t2 = space();
				a1 = element("a");
				t3 = text(t3_value);
				attr_dev(a0, "href", a0_href_value = /*link*/ ctx[0].href);
				attr_dev(a0, "target", "_blank");
				attr_dev(a0, "class", "contrast");
				add_location(a0, file$1, 8, 1, 118);
				attr_dev(path, "stroke-linecap", "round");
				attr_dev(path, "stroke-linejoin", "round");
				attr_dev(path, "d", "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75");
				add_location(path, file$1, 18, 4, 387);
				attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr_dev(svg, "fill", "none");
				attr_dev(svg, "viewBox", "0 0 24 24");
				attr_dev(svg, "stroke-width", "1.5");
				attr_dev(svg, "stroke", "currentColor");
				attr_dev(svg, "class", "svelte-5sktt2");
				add_location(svg, file$1, 11, 3, 245);
				attr_dev(button, "class", "svelte-5sktt2");
				add_location(button, file$1, 10, 2, 212);
				attr_dev(a1, "href", a1_href_value = /*link*/ ctx[0].href);
				attr_dev(a1, "target", "_blank");
				add_location(a1, file$1, 25, 2, 960);
				attr_dev(div0, "class", "wrapper svelte-5sktt2");
				add_location(div0, file$1, 9, 1, 188);
				attr_dev(div1, "class", "grid container-fluid svelte-5sktt2");
				add_location(div1, file$1, 7, 0, 82);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div1, anchor);
				append_dev(div1, a0);
				append_dev(a0, t0);
				append_dev(div1, t1);
				append_dev(div1, div0);
				append_dev(div0, button);
				append_dev(button, svg);
				append_dev(svg, path);
				append_dev(div0, t2);
				append_dev(div0, a1);
				append_dev(a1, t3);

				if (!mounted) {
					dispose = action_destroyer(copy_action = copy.call(null, button, /*link*/ ctx[0].href));
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*link*/ 1 && t0_value !== (t0_value = /*link*/ ctx[0].name + "")) set_data_dev(t0, t0_value);

				if (dirty & /*link*/ 1 && a0_href_value !== (a0_href_value = /*link*/ ctx[0].href)) {
					attr_dev(a0, "href", a0_href_value);
				}

				if (copy_action && is_function(copy_action.update) && dirty & /*link*/ 1) copy_action.update.call(null, /*link*/ ctx[0].href);
				if (dirty & /*link*/ 1 && t3_value !== (t3_value = /*link*/ ctx[0].href + "")) set_data_dev(t3, t3_value);

				if (dirty & /*link*/ 1 && a1_href_value !== (a1_href_value = /*link*/ ctx[0].href)) {
					attr_dev(a1, "href", a1_href_value);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div1);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$1.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('LinkWithCopyButton', slots, []);
		let { link } = $$props;

		$$self.$$.on_mount.push(function () {
			if (link === undefined && !('link' in $$props || $$self.$$.bound[$$self.$$.props['link']])) {
				console.warn("<LinkWithCopyButton> was created without expected prop 'link'");
			}
		});

		const writable_props = ['link'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LinkWithCopyButton> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('link' in $$props) $$invalidate(0, link = $$props.link);
		};

		$$self.$capture_state = () => ({ copy, link });

		$$self.$inject_state = $$props => {
			if ('link' in $$props) $$invalidate(0, link = $$props.link);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [link];
	}

	class LinkWithCopyButton extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, { link: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "LinkWithCopyButton",
				options,
				id: create_fragment$1.name
			});
		}

		get link() {
			throw new Error("<LinkWithCopyButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set link(value) {
			throw new Error("<LinkWithCopyButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/App.svelte generated by Svelte v4.2.19 */

	const { console: console_1 } = globals;
	const file = "src/App.svelte";

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[12] = list[i];
		return child_ctx;
	}

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[9] = list[i];
		return child_ctx;
	}

	// (152:1) {:else}
	function create_else_block(ctx) {
		let each_1_anchor;
		let current;
		let each_value_1 = ensure_array_like_dev(/*links*/ ctx[1]);
		let each_blocks = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},
			m: function mount(target, anchor) {
				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert_dev(target, each_1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*links*/ 2) {
					each_value_1 = ensure_array_like_dev(/*links*/ ctx[1]);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block_1(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					group_outros();

					for (i = each_value_1.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value_1.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(152:1) {:else}",
			ctx
		});

		return block;
	}

	// (144:1) {#if !isActive}
	function create_if_block_1(ctx) {
		let div;
		let h6;
		let t1;
		let each_1_anchor;
		let current;
		let each_value = ensure_array_like_dev(/*interestingLinks*/ ctx[4]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				div = element("div");
				h6 = element("h6");
				h6.textContent = "Sorry! Not sure what to do with this URL... here some convenient links for you!";
				t1 = space();

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
				add_location(h6, file, 159, 3, 5340);
				attr_dev(div, "class", "container-fluid");
				add_location(div, file, 158, 2, 5307);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, h6);
				insert_dev(target, t1, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(target, anchor);
					}
				}

				insert_dev(target, each_1_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*interestingLinks*/ 16) {
					each_value = ensure_array_like_dev(/*interestingLinks*/ ctx[4]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
					detach_dev(t1);
					detach_dev(each_1_anchor);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(144:1) {#if !isActive}",
			ctx
		});

		return block;
	}

	// (153:2) {#each links as link}
	function create_each_block_1(ctx) {
		let linkwithcopybutton;
		let t;
		let hr;
		let current;

		linkwithcopybutton = new LinkWithCopyButton({
				props: { link: /*link*/ ctx[12] },
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(linkwithcopybutton.$$.fragment);
				t = space();
				hr = element("hr");
				attr_dev(hr, "class", "svelte-vrwop8");
				add_location(hr, file, 168, 3, 5622);
			},
			m: function mount(target, anchor) {
				mount_component(linkwithcopybutton, target, anchor);
				insert_dev(target, t, anchor);
				insert_dev(target, hr, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const linkwithcopybutton_changes = {};
				if (dirty & /*links*/ 2) linkwithcopybutton_changes.link = /*link*/ ctx[12];
				linkwithcopybutton.$set(linkwithcopybutton_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(linkwithcopybutton.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(linkwithcopybutton.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(hr);
				}

				destroy_component(linkwithcopybutton, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1.name,
			type: "each",
			source: "(153:2) {#each links as link}",
			ctx
		});

		return block;
	}

	// (148:2) {#each interestingLinks as interestingLink}
	function create_each_block(ctx) {
		let linkwithcopybutton;
		let t;
		let hr;
		let current;

		linkwithcopybutton = new LinkWithCopyButton({
				props: { link: /*interestingLink*/ ctx[9] },
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(linkwithcopybutton.$$.fragment);
				t = space();
				hr = element("hr");
				attr_dev(hr, "class", "svelte-vrwop8");
				add_location(hr, file, 163, 3, 5536);
			},
			m: function mount(target, anchor) {
				mount_component(linkwithcopybutton, target, anchor);
				insert_dev(target, t, anchor);
				insert_dev(target, hr, anchor);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(linkwithcopybutton.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(linkwithcopybutton.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
					detach_dev(hr);
				}

				destroy_component(linkwithcopybutton, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(148:2) {#each interestingLinks as interestingLink}",
			ctx
		});

		return block;
	}

	// (159:1) {#if userInfo?.environment?.name !== Environments.JIRA && isActive}
	function create_if_block(ctx) {
		let form;
		let fieldset;
		let userinputfield;
		let updating_value;
		let current;

		function userinputfield_value_binding(value) {
			/*userinputfield_value_binding*/ ctx[5](value);
		}

		let userinputfield_props = {
			label: "Optional ticket number if needed..."
		};

		if (/*optionalInputUrlParam*/ ctx[3] !== void 0) {
			userinputfield_props.value = /*optionalInputUrlParam*/ ctx[3];
		}

		userinputfield = new UserInputField({
				props: userinputfield_props,
				$$inline: true
			});

		binding_callbacks.push(() => bind(userinputfield, 'value', userinputfield_value_binding));
		userinputfield.$on("change", /*change_handler*/ ctx[6]);

		const block = {
			c: function create() {
				form = element("form");
				fieldset = element("fieldset");
				create_component(userinputfield.$$.fragment);
				add_location(fieldset, file, 174, 3, 5728);
				add_location(form, file, 173, 2, 5718);
			},
			m: function mount(target, anchor) {
				insert_dev(target, form, anchor);
				append_dev(form, fieldset);
				mount_component(userinputfield, fieldset, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				const userinputfield_changes = {};

				if (!updating_value && dirty & /*optionalInputUrlParam*/ 8) {
					updating_value = true;
					userinputfield_changes.value = /*optionalInputUrlParam*/ ctx[3];
					add_flush_callback(() => updating_value = false);
				}

				userinputfield.$set(userinputfield_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(userinputfield.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(userinputfield.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(form);
				}

				destroy_component(userinputfield);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(159:1) {#if userInfo?.environment?.name !== Environments.JIRA && isActive}",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let link_1;
		let t0;
		let main;
		let current_block_type_index;
		let if_block0;
		let t1;
		let t2;
		let footer1;
		let footer0;
		let current;
		const if_block_creators = [create_if_block_1, create_else_block];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (!/*isActive*/ ctx[0]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
		let if_block1 = /*userInfo*/ ctx[2]?.environment?.name !== Environments.JIRA && /*isActive*/ ctx[0] && create_if_block(ctx);
		footer0 = new Footer({ $$inline: true });

		const block = {
			c: function create() {
				link_1 = element("link");
				t0 = space();
				main = element("main");
				if_block0.c();
				t1 = space();
				if (if_block1) if_block1.c();
				t2 = space();
				footer1 = element("footer");
				create_component(footer0.$$.fragment);
				document.title = "CM URL Magic Extension";
				attr_dev(link_1, "rel", "stylesheet");
				attr_dev(link_1, "href", "/build/bundle.css");
				add_location(link_1, file, 153, 1, 5214);
				attr_dev(main, "class", "svelte-vrwop8");
				add_location(main, file, 156, 0, 5281);
				add_location(footer1, file, 189, 0, 6122);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				append_dev(document.head, link_1);
				insert_dev(target, t0, anchor);
				insert_dev(target, main, anchor);
				if_blocks[current_block_type_index].m(main, null);
				append_dev(main, t1);
				if (if_block1) if_block1.m(main, null);
				insert_dev(target, t2, anchor);
				insert_dev(target, footer1, anchor);
				mount_component(footer0, footer1, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block0 = if_blocks[current_block_type_index];

					if (!if_block0) {
						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block0.c();
					} else {
						if_block0.p(ctx, dirty);
					}

					transition_in(if_block0, 1);
					if_block0.m(main, t1);
				}

				if (/*userInfo*/ ctx[2]?.environment?.name !== Environments.JIRA && /*isActive*/ ctx[0]) {
					if (if_block1) {
						if_block1.p(ctx, dirty);

						if (dirty & /*userInfo, isActive*/ 5) {
							transition_in(if_block1, 1);
						}
					} else {
						if_block1 = create_if_block(ctx);
						if_block1.c();
						transition_in(if_block1, 1);
						if_block1.m(main, null);
					}
				} else if (if_block1) {
					group_outros();

					transition_out(if_block1, 1, 1, () => {
						if_block1 = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block0);
				transition_in(if_block1);
				transition_in(footer0.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block0);
				transition_out(if_block1);
				transition_out(footer0.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(main);
					detach_dev(t2);
					detach_dev(footer1);
				}

				detach_dev(link_1);
				if_blocks[current_block_type_index].d();
				if (if_block1) if_block1.d();
				destroy_component(footer0);
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
		let activeTabUrl = '';
		let links = [];
		let userInfo = {};
		let optionalInputUrlParam = '';

		let interestingLinks = [
			{
				name: 'Preview Demo DE',
				href: 'https://preview.ksb-dev.bitgrip.berlin/demo-de-de'
			},
			{
				name: 'Preview Stage',
				href: 'https://preview.ksb-stage.bitgrip.berlin/de-de'
			},
			{
				name: 'Live Stage',
				href: 'https://live.ksb-stage.bitgrip.berlin/de-de'
			},
			{
				name: 'Preview Prod',
				href: 'https://preview-e2e-sales.ksb.com/de-de'
			},
			{
				name: 'CM Dev Studio',
				href: 'https://studio.ksb-dev.bitgrip.berlin'
			},
			{
				name: 'CM Stage Studio',
				href: 'https://studio.ksb-stage.bitgrip.berlin'
			},
			{
				name: 'CM Stage Prod',
				href: 'https://studio-e2e-sales.ksb.com'
			},
			{
				name: 'Localhost node-app',
				href: 'http://localhost:8081/demo-de-de/'
			},
			{
				name: 'Storybook',
				href: 'http://localhost:5010'
			},
			{
				name: 'AT Monitor',
				href: 'https://jenkins.infra.bitgrip.berlin/job/KSB/view/AT-Monitor/'
			}
		];

		// Listen for URL updates from the background script
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			chrome.runtime.onMessage.addListener(message => {
				if (message.newUrl) {
					activeTabUrl = message.newUrl;
					isActiveUrlRelevant(); // Check URL relevance whenever the URL changes

					$$invalidate(2, userInfo = {
						environment: undefined,
						ticketNumber: '',
						subdomain: '',
						secondLevelDomain: '',
						language: '',
						path: ''
					});

					if (activeTabUrl) {
						$$invalidate(2, userInfo.environment = evaluateEnvironment(activeTabUrl), userInfo);
						$$invalidate(2, userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl), userInfo);
						$$invalidate(2, userInfo.language = evaluateLanguage(activeTabUrl), userInfo);
						$$invalidate(2, userInfo.path = evaluatePath(activeTabUrl, userInfo.environment, userInfo.language), userInfo);
					} // userInfo.optionalTicketNumber = evaluateTicketNumber(optionalUserInput);
				}
			});
		}

		const isActiveUrlRelevant = () => {
			if (typeof chrome !== 'undefined' && chrome.tabs) {
				chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
					if (tabs.length > 0 && tabs[0].url) {
						console.log(tabs[0].url);
						const environment = evaluateEnvironment(tabs[0].url);
						console.log(environment);
						console.log(tabs[0].url);

						if (environment?.name) {
							activeTabUrl = tabs[0].url;
							$$invalidate(0, isActive = true); // Update isActive here inside the callback

							if (environment.name === Environments.JIRA) {
								$$invalidate(2, userInfo.environment = evaluateEnvironment(activeTabUrl), userInfo);
								$$invalidate(2, userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl), userInfo);
							} else {
								// Re-evaluate and update userInfo and links for the new valid URL
								$$invalidate(2, userInfo.environment = evaluateEnvironment(activeTabUrl), userInfo);

								$$invalidate(2, userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl), userInfo);
								$$invalidate(2, userInfo.language = evaluateLanguage(activeTabUrl), userInfo);
								$$invalidate(2, userInfo.path = evaluatePath(activeTabUrl, userInfo.environment, userInfo.language), userInfo);
							}

							$$invalidate(1, links = linkCreator(userInfo)); // Update links for the new URL
							console.log(links);
							console.log(userInfo?.environment?.name);
						} else {
							// Invalid URL: Reset the state
							$$invalidate(0, isActive = false);

							$$invalidate(1, links = []); // Clear the links if the URL is invalid
							activeTabUrl = ''; // Clear the active URL
							console.log('Invalid URL or irrelevant environment');
						}
					} else {
						// No active tab or URL found, reset state
						$$invalidate(0, isActive = false);

						$$invalidate(1, links = []);
						activeTabUrl = '';
						console.log('No active tab or URL found');
					}
				});
			} else {
				// If chrome API is not available, reset state
				$$invalidate(0, isActive = false);

				$$invalidate(1, links = []);
				activeTabUrl = '';
				console.log('Chrome API not available');
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

		function userinputfield_value_binding(value) {
			optionalInputUrlParam = value;
			$$invalidate(3, optionalInputUrlParam);
		}

		const change_handler = () => {
			console.log(optionalInputUrlParam);
			$$invalidate(2, userInfo.optionalTicketNumber = evaluateTicketNumber(optionalInputUrlParam), userInfo);
			$$invalidate(1, links = linkCreator(userInfo)); // Update links for the new URL
		};

		$$self.$capture_state = () => ({
			evaluateEnvironment,
			evaluateLanguage,
			evaluatePath,
			evaluateTicketNumber,
			linkCreator,
			Environments,
			onMount,
			Footer,
			UserInputField,
			LinkWithCopyButton,
			isActive,
			activeTabUrl,
			links,
			userInfo,
			optionalInputUrlParam,
			interestingLinks,
			isActiveUrlRelevant
		});

		$$self.$inject_state = $$props => {
			if ('isActive' in $$props) $$invalidate(0, isActive = $$props.isActive);
			if ('activeTabUrl' in $$props) activeTabUrl = $$props.activeTabUrl;
			if ('links' in $$props) $$invalidate(1, links = $$props.links);
			if ('userInfo' in $$props) $$invalidate(2, userInfo = $$props.userInfo);
			if ('optionalInputUrlParam' in $$props) $$invalidate(3, optionalInputUrlParam = $$props.optionalInputUrlParam);
			if ('interestingLinks' in $$props) $$invalidate(4, interestingLinks = $$props.interestingLinks);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			isActive,
			links,
			userInfo,
			optionalInputUrlParam,
			interestingLinks,
			userinputfield_value_binding,
			change_handler
		];
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

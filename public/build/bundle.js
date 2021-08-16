
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var bundle = (function () {
    'use strict';

    function noop() { }
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
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
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
        flushing = false;
        seen_callbacks.clear();
    }
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
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.40.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.40.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (19:24) {#each items as row}
    function create_each_block(ctx) {
    	let div2;
    	let p;
    	let t0_value = /*row*/ ctx[3].title + "";
    	let t0;
    	let t1;
    	let div0;
    	let span0;
    	let t2_value = /*row*/ ctx[3].class + "";
    	let t2;
    	let t3;
    	let span1;
    	let t4_value = /*row*/ ctx[3].name + "";
    	let t4;
    	let t5;
    	let div1;
    	let span2;
    	let t6_value = /*row*/ ctx[3].gift + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			div1 = element("div");
    			span2 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(p, "class", "solutions__bottom_row-left");
    			add_location(p, file, 20, 28, 606);
    			add_location(span0, file, 22, 32, 763);
    			add_location(span1, file, 23, 32, 820);
    			attr_dev(div0, "class", "solutions__bottom_row-center");
    			add_location(div0, file, 21, 28, 688);
    			add_location(span2, file, 26, 32, 981);
    			attr_dev(div1, "class", "solutions__bottom_row-right");
    			add_location(div1, file, 25, 28, 907);
    			attr_dev(div2, "class", "solutions__bottom_row");
    			add_location(div2, file, 19, 28, 542);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, p);
    			append_dev(p, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(span1, t4);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, span2);
    			append_dev(span2, t6);
    			append_dev(div2, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*row*/ ctx[3].title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*items*/ 1 && t2_value !== (t2_value = /*row*/ ctx[3].class + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*items*/ 1 && t4_value !== (t4_value = /*row*/ ctx[3].name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*items*/ 1 && t6_value !== (t6_value = /*row*/ ctx[3].gift + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(19:24) {#each items as row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div15;
    	let div14;
    	let div0;
    	let t1;
    	let div13;
    	let div1;
    	let t2;
    	let div12;
    	let div5;
    	let div2;
    	let t4;
    	let div3;
    	let t5;
    	let t6;
    	let t7;
    	let div4;
    	let t8;
    	let t9;
    	let t10;
    	let button0;
    	let t12;
    	let div11;
    	let div6;
    	let t14;
    	let div7;
    	let p0;
    	let t15;
    	let br;
    	let t16;
    	let span;
    	let t18;
    	let div10;
    	let div8;
    	let t20;
    	let p1;
    	let t22;
    	let div9;
    	let t24;
    	let button1;
    	let mounted;
    	let dispose;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div15 = element("div");
    			div14 = element("div");
    			div0 = element("div");
    			div0.textContent = "Итого, в ваше Готовое решение входит:";
    			t1 = space();
    			div13 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div12 = element("div");
    			div5 = element("div");
    			div2 = element("div");
    			div2.textContent = "Всего";
    			t4 = space();
    			div3 = element("div");
    			t5 = text(/*old_sum*/ ctx[2]);
    			t6 = text(" ₽");
    			t7 = space();
    			div4 = element("div");
    			t8 = text(/*sum*/ ctx[1]);
    			t9 = text(" ₽");
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "купить";
    			t12 = space();
    			div11 = element("div");
    			div6 = element("div");
    			div6.textContent = "Рассрочка без процентов";
    			t14 = space();
    			div7 = element("div");
    			p0 = element("p");
    			t15 = text("все проценты");
    			br = element("br");
    			t16 = text("\n                                    за вас платит ");
    			span = element("span");
    			span.textContent = "vincko:";
    			t18 = space();
    			div10 = element("div");
    			div8 = element("div");
    			div8.textContent = "12 мес.";
    			t20 = space();
    			p1 = element("p");
    			p1.textContent = "по";
    			t22 = space();
    			div9 = element("div");
    			div9.textContent = "1 000 ₽";
    			t24 = space();
    			button1 = element("button");
    			button1.textContent = "В рассрочку";
    			attr_dev(div0, "class", "solutions__bottom_title");
    			add_location(div0, file, 13, 16, 237);
    			attr_dev(div1, "class", "solutions__bottom_left");
    			add_location(div1, file, 17, 20, 432);
    			attr_dev(div2, "class", "solutions__bottom_column-title");
    			add_location(div2, file, 33, 28, 1279);
    			attr_dev(div3, "class", "solutions__bottom_column-oldprice");
    			add_location(div3, file, 36, 28, 1425);
    			attr_dev(div4, "class", "solutions__bottom_column-newprice");
    			add_location(div4, file, 39, 28, 1580);
    			attr_dev(button0, "class", "solutions__bottom_column-btn grey");
    			add_location(button0, file, 42, 28, 1731);
    			attr_dev(div5, "class", "solutions__bottom_column");
    			add_location(div5, file, 32, 24, 1212);
    			attr_dev(div6, "class", "solutions__bottom_column-title");
    			add_location(div6, file, 47, 28, 2004);
    			add_location(br, file, 51, 47, 2263);
    			add_location(span, file, 52, 50, 2318);
    			add_location(p0, file, 51, 32, 2248);
    			attr_dev(div7, "class", "solutions__bottom_column-interest");
    			add_location(div7, file, 50, 28, 2168);
    			attr_dev(div8, "class", "solutions__bottom_column-select");
    			add_location(div8, file, 56, 32, 2521);
    			add_location(p1, file, 59, 32, 2682);
    			attr_dev(div9, "class", "solutions__bottom_column-price");
    			add_location(div9, file, 60, 32, 2724);
    			attr_dev(div10, "class", "solutions__bottom_column-monthprice");
    			add_location(div10, file, 55, 28, 2439);
    			attr_dev(button1, "class", "solutions__bottom_column-btn yellow");
    			add_location(button1, file, 64, 28, 2915);
    			attr_dev(div11, "class", "solutions__bottom_column");
    			add_location(div11, file, 46, 24, 1937);
    			attr_dev(div12, "class", "solutions__bottom_right");
    			add_location(div12, file, 31, 20, 1150);
    			attr_dev(div13, "class", "solutions__bottom_wrapper");
    			add_location(div13, file, 16, 16, 372);
    			attr_dev(div14, "class", "container");
    			add_location(div14, file, 12, 12, 197);
    			attr_dev(div15, "class", "solutions__bottom");
    			add_location(div15, file, 11, 0, 153);
    			add_location(main, file, 10, 0, 146);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div0);
    			append_dev(div14, t1);
    			append_dev(div14, div13);
    			append_dev(div13, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div13, t2);
    			append_dev(div13, div12);
    			append_dev(div12, div5);
    			append_dev(div5, div2);
    			append_dev(div5, t4);
    			append_dev(div5, div3);
    			append_dev(div3, t5);
    			append_dev(div3, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, t8);
    			append_dev(div4, t9);
    			append_dev(div5, t10);
    			append_dev(div5, button0);
    			append_dev(div12, t12);
    			append_dev(div12, div11);
    			append_dev(div11, div6);
    			append_dev(div11, t14);
    			append_dev(div11, div7);
    			append_dev(div7, p0);
    			append_dev(p0, t15);
    			append_dev(p0, br);
    			append_dev(p0, t16);
    			append_dev(p0, span);
    			append_dev(div11, t18);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div10, t20);
    			append_dev(div10, p1);
    			append_dev(div10, t22);
    			append_dev(div10, div9);
    			append_dev(div11, t24);
    			append_dev(div11, button1);

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", handleBuy, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items*/ 1) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*old_sum*/ 4) set_data_dev(t5, /*old_sum*/ ctx[2]);
    			if (dirty & /*sum*/ 2) set_data_dev(t8, /*sum*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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

    function handleBuy() {
    	console.log('handleBuy');
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { items } = $$props;
    	let { sum } = $$props;
    	let { old_sum } = $$props;
    	const writable_props = ['items', 'sum', 'old_sum'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('items' in $$props) $$invalidate(0, items = $$props.items);
    		if ('sum' in $$props) $$invalidate(1, sum = $$props.sum);
    		if ('old_sum' in $$props) $$invalidate(2, old_sum = $$props.old_sum);
    	};

    	$$self.$capture_state = () => ({ items, sum, old_sum, handleBuy });

    	$$self.$inject_state = $$props => {
    		if ('items' in $$props) $$invalidate(0, items = $$props.items);
    		if ('sum' in $$props) $$invalidate(1, sum = $$props.sum);
    		if ('old_sum' in $$props) $$invalidate(2, old_sum = $$props.old_sum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, sum, old_sum];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { items: 0, sum: 1, old_sum: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !('items' in props)) {
    			console_1.warn("<App> was created without expected prop 'items'");
    		}

    		if (/*sum*/ ctx[1] === undefined && !('sum' in props)) {
    			console_1.warn("<App> was created without expected prop 'sum'");
    		}

    		if (/*old_sum*/ ctx[2] === undefined && !('old_sum' in props)) {
    			console_1.warn("<App> was created without expected prop 'old_sum'");
    		}
    	}

    	get items() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sum() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sum(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get old_sum() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set old_sum(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    windows.itd_basket = new App({
    	target: document.getElementById('b-vincko-basket-component'),
    	props: {
    		items: [{
    			id: null,
    			title: 'Комплект оборудования',
    			name1: 'Премиум',
    			name2: 'AJAX SmartHome'
    		},
    		{
    			id: null,
    			title: 'Охранная компания',
    			name1: '12 месяев обслуживания',
    			name2: 'ООО “Зубряков Охрана Компания Ва'
    		}
    		]
    	}
    });

    var app$1 = app;

    return app$1;

}());
//# sourceMappingURL=bundle.js.map

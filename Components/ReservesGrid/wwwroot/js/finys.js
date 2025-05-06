
// finys namespace
var finys = window.finys ||= {};

{
    // constants //

    finys.SortOrder = {
        ASCENDING: 0,
        DESCENDING: 1
    };

    finys.MergeResult = {
        NONE: 0,
        SKIPPED: 1 << 0,
        KEEP_TARGET: 1 << 1,
        KEEP_SOURCE: 1 << 2,
    };

    finys.FilterLogic = {
        AND: 0,
        OR: 1
    };

    finys.ToggleStyle = {
        DEFAULT: 0,
        PILL: 1
    };

    finys.ReCaptchaVersion = {
        VERSION_2: 1 << 0,
        VERSION_3: 1 << 1,
        DEFAULT: 1 << 0 | 1 << 1
    };

    finys.ItemStatus = {
        AVAILABLE: 0,
        DEPLOYED: 1,
        DISPOSED: 2
    };

    finys.ValidationType = {
        NONE: 0,
        NO_VALUE: 1 << 0,
        INVALID_VALUE: 1 << 1,
        UNSUPPORTED_VALUE: 1 << 2
    };
    finys.ValidationType.ALL = finys.ValidationType.NO_VALUE
        | finys.ValidationType.INVALID_VALUE
        | finys.ValidationType.UNSUPPORTED_VALUE;

    finys.FinysEnvironment = {
        Unknown: 0,
        Development: 1,
        Staging: 2,
        Production: 3
    };

    finys.Quadrant = {
        TOP_LEFT: 1,
        TOP_RIGHT: 2,
        BOTTOM_RIGHT: 3,
        BOTTOM_LEFT: 4
    };

    finys.Theme = {
        DEFAULT: 0,
        NEUTRAL: 1,
        PRIMARY: 2,
        SECONDARY: 3,
        SUCCESS: 4,
        WARNING: 5,
        INFO: 6,
        DANGER: 7
    };

    finys.themes = [
        "primary",
        "primary-dark",
        "secondary",
        "secondary-light",
        "success",
        "success-dark",
        "info",
        "info-light",
        "warning",
        "warning-dark",
        "danger",
        "danger-dark",
        "neutral",
        "neutral-dark"
    ];

    finys.meta = function (name, value) {
        const element = $(document)
            .find(`meta[name=${name}]`);
        if (element) {
            if (value === undefined)
                return element.attr("content");
            element.attr("content", value);
            return value;
        }
        return null;
    }

    finys.reCaptchaKeys = {};
    finys.reCaptchaKeys[finys.ReCaptchaVersion.VERSION_2] = finys.meta("recaptcha-v2");
    finys.reCaptchaKeys[finys.ReCaptchaVersion.VERSION_3] = finys.meta("recaptcha-v3");

    finys.ajaxModules = {};

    finys.environment = finys.FinysEnvironment.UNKNOWN;
    finys.machineName = null;
    finys.isAuthenticated = null;
    finys.userName = null;

    const config = finys.config ??= {};
    config.values = {};
    config.getValue = function (code, $default) {
        const v = config.values[code];
        if (v === undefined
            || v === null)
            return $default;
        return v;
    };
    config.isEnabled = function (code, $default) {
        return !finys.format.isFalsy(config.getValue(code, $default));
    };
    config.interpolate = function (value) {
        const i = function (v) {
            return finys.format.interpolate(v, config.values, "Config");
        };
        const $i = function (j) {
            const text = i(j.text());
            j.text(text);
            return text;
        };
        if (value instanceof jQuery)
            return $i(value);
        return i(value);
    };


    // Predicate is false for array[i - 1] and true for array[i]
    // https://stackoverflow.com/a/41956372/4979159
    finys.binarySearch = function (array, predicate) {
        let lo = -1,
            hi = array.length;
        while (1 + lo < hi) {
            const mi = lo + ((hi - lo) >> 1);
            if (predicate(array[mi])) hi = mi;
            else lo = mi;
        }
        return hi;
    };


    // check string falsyness
    finys.isFalsy = function (value) {
        if (typeof value == 'boolean')
            return !value;

        const falsy = ['false', 'no', 'off', 'disabled'];

        return !value
            || falsy.indexOf(
                value.toString()
                    .toLowerCase()) != -1;
    };

    finys.isAutofilled = function (obj) {
        if (obj instanceof jQuery)
            obj = obj[0];

        try {
            return obj.matches(':autofill');
        }
        catch (err) {
            try {
                return obj.matches(':-webkit-autofill');
            }
            catch (er) {
                return false;
            }
        }
    };

    const _getDefaultPredicate = function (value) {
        switch (typeof value) {
            case 'number':
                return (a, b) => a > b;
            case 'string':
                return (a, b) => a.localeCompare(b) > 0;
            default: return null;
        }
    };

    finys.hasFlag = function (value, flag) {
        return (value & flag) === flag;
    };

    finys.insertSorted = function (arr, value, predicate) {
        predicate = predicate || _getDefaultPredicate(value);
        let i = finys.binarySearch(arr, i => predicate(i, value));
        if (i < 0) i = ~i;
        arr.splice(i, 0, value);
        return i;
    };

    finys.insertSortedBy = function (arr, value, prop) {
        return finys.insertSorted(arr, value, (a, b) => prop(a) > prop(b));
    };
    finys.insertSortedByDescending = function (arr, value, prop) {
        return finys.insertSorted(arr, value, (a, b) => prop(b) > prop(a));
    };

    finys.debounce = function (func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args)
            }, delay)
        }
    }


    finys.Attribute = class {

        constructor(name, value) {
            this.Name = name;
            this.Value = value || null;
        }
        render() {
            const val = this.renderValue();
            if (val)
                return `${this.Name}='${val}'`;
            else return this.Name;
        }
        renderValue() {
            return this.Value;
        }
    }
    finys.ParamAttribute = class extends finys.Attribute {
        constructor(name) {
            super(name, []);
        }


        add(key, value) {
            let p;

            if (key instanceof finys.forms.Parameter)
                p = key;

            else p = new finys.forms.Parameter(key, value);

            this.Value.push(p);

            return p;
        };
        get(key) {
            for (let i = 0; i < this.Value.length; i++) {
                const cur = this.Value[i];
                if (cur.Key == key)
                    return cur;
            }
            return null;
        };
        set(key, value) {
            let p = this.get(key);

            if (p) p.Value = value;
            else {
                p = new finys.forms.Parameter(key, value);
                this.Value.push(p);
            }

            return p;
        };
        remove(key) {
            this.Value = this.Value.filter(i => i.Key !== key);
        };
        renderValue() {
            const result = [];

            for (let i = 0; i < this.Value.length; i++)
                result.push(this.Value[i].render());
            return result.join(", ");
        }
    }
    finys.StyleAttribute = class extends finys.ParamAttribute {
        constructor() {
            super("style", []);
        };

        renderValue() {
            const result = [];

            for (let i = 0; i < this.Value.length; i++)
                result.push(this.Value[i].render());
            return result.join(";");
        }
    }
    finys.ClassAttribute = class extends finys.Attribute {
        constructor($class) {
            super("class", []);

            if ($class)
                this.add($class);
        };


        add(c) {
            if (typeof c == 'string')
                this.add(c.split(/\s+/));
            else {
                for (let i = 0; i < c.length; i++)
                    this.Value.push(c[i]);
            }
        };
        remove(c) {
            this.Value = this.Value.filter(i => i !== c);
        };
        renderValue() {
            return this.Value.join(" ");
        }
    }

    finys.ScreenObject = class {
        constructor(options) {
            options ||= {};

            this.Sequence = options.Sequence || 0;
            this.Identity = options.Identity || null;
            this.Uid = options.Uid || UUID.generate();
            this.DOM = options.DOM || null;
            this.Attributes = [];
            this.IsDestroyed = false;
            this._Tracked = [];

            if (options.Attributes)
                for (const a of options.Attributes)
                    this.addAttribute(a.Name, a.Value);
        }

        getElement() {
            if (this.DOM)
                return $(this.DOM);
            return null;
        };
        hide() {
            if (this.DOM)
                this.getElement()
                    .hide();
        };
        show() {
            if (this.DOM)
                this.getElement()
                    .show();
        };
        track(obj) {
            this._Tracked.push(obj);
        };
        preRender() {
            this.addAttribute("data-uid", this.Uid);
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}></div>`;
        };
        initialize() {
            const e = this.getElement();
            if (this.Identity)
                e?.data(this.Identity, this);
        };
        goto() {
            if (this.DOM)
                this.getElement()
                    .trigger("goto");
        };
        isVisible() {
            return !!(this.DOM.offsetWidth
                || this.DOM.offsetHeight
                || this.DOM.getClientRects().length);
        };
        renderAttributes() {
            if (this.Attributes.length == 0)
                return "";

            let seed = this.Attributes[0].render();

            for (let i = 1; i < this.Attributes.length; i++) {
                seed += " ";
                seed += this.Attributes[i].render();
            }

            return seed;
        };
        getAttribute(name) {
            for (let i = 0; i < this.Attributes.length; i++) {
                const cur = this.Attributes[i];
                if (cur.Name == name)
                    return cur;
            }
            return null;
        };
        addAttribute(attr, value) {
            let a = null;
            const s = typeof attr == 'string';

            if (s) {
                switch (attr) {
                    case 'class':
                        this.addClass(value);
                        return;
                    case 'style':
                        this.style(value);
                        return;
                    default:
                        a = this.getAttribute(attr);
                        break;
                }
            }
            else a = this.getAttribute(attr.Name);

            if (!a) {
                if (s) a = new finys.Attribute(attr);
                else a = attr;

                this.Attributes.push(a);
            }

            if (value)
                a.Value = value;

            return a;
        };
        removeAttribute(name) {
            this.Attributes = this.Attributes.filter(i => i.Name !== name);
        };
        hasClass(c) {
            if (this.DOM)
                return this.getElement()
                    .hasClass(c);

            const $class = this.getAttribute("class");
            if ($class == null)
                return false;
            return $class.Value.indexOf(c) != -1;
        };
        addClass(c) {
            if (this.DOM) {
                this.getElement()
                    .addClass(c);
                return;
            }
            const $class = this.addAttribute(new finys.ClassAttribute());
            $class.add(c);
        };
        removeClass(c) {
            if (this.DOM) {
                this.getElement()
                    .removeClass(c);
                return;
            }
            const $class = this.getAttribute("class");
            if ($class != null)
                $class.remove(c);
        };
        style(name, value) {
            const $style = this.addAttribute(new finys.StyleAttribute());
            $style.set(name, value);
        };
        removeStyle(name) {
            const $style = this.getAttribute("style");
            if ($style != null)
                $style.remove(name);
        };
        appendTo(container) {
            const r = this.render(),
                result = $(r).appendTo(container);

            this.DOM = result[0];
            this.initialize();

            return result;
        };
        prependTo(container) {
            const r = this.render(),
                result = $(r).prependTo(container);

            this.DOM = result[0];
            this.initialize();

            return result;
        };
        insertAfter(target) {
            const r = this.render(),
                result = $(r).insertAfter(target);

            this.DOM = result[0];
            this.initialize();

            return result;
        };
        insertBefore(target) {
            const r = this.render(),
                result = $(r).insertBefore(target);

            this.DOM = result[0];
            this.initialize();

            return result;
        };
        getBounds() {
            return finys.getBounds(this.DOM);
        };
        getContentBounds() {
            return finys.getContentBounds(this.DOM);
        };
        within(coords) {
            return this.getBounds()
                .contains(coords);
        };
        destroy() {
            if (this.IsDestroyed)
                return;

            for (const t of this._Tracked)
                t.destroy();

            if (this.DOM)
                this.getElement()
                    .remove();

            this.IsDestroyed = true;
        };

    }


    finys.EventHandler = function (options) {
        this.Id = options.Id ?? Symbol();
        this.Handler = options.Handler;
        this.Count = options.Count ?? -1;
        this._ExecCount = 0;
    };
    finys.EventHandler.prototype.execute = function (...args) {
        this._ExecCount++;
        return this.Handler(...args);
    };
    finys.EventHandler.prototype.removable = function () {
        return this.Count > -1
            && this._ExecCount >= this.Count;
    };




    finys.EventHandlerCollection = function () {
        this.Values = {};
    };
    finys.EventHandlerCollection.prototype.add = function (handler) {
        this.Values[handler.Id] = handler;
    };
    finys.EventHandlerCollection.prototype.remove = function (handler) {
        if (typeof handler === 'symbol'
            && delete this.Values[handler])
            return 1;
        let result = 0;
        for (const i of Object.getOwnPropertySymbols(this.Values)) {
            if (this.Values[i]?.Handler === handler) {
                delete this.Values[i];
                result++;
            }
        }
        return result;
    };
    finys.EventHandlerCollection.prototype.trigger = function (...args) {
        const r = [];
        for (const i of Object.getOwnPropertySymbols(this.Values)) {
            const h = this.Values[i];
            if (!h) continue;

            r.push(h.execute(...args));
            if (h.removable())
                delete this.Values[i];
        }
        return Promise.allSettled(r);
    };



    finys.EventContainer = function (options) {
        if (options instanceof finys.EventContainer)
            options = options.Handlers;

        this.Handlers = {};

        if (options) {
            for (const n in options) {
                const cur = options[n],
                    coll = this.Handlers[n] = new finys.EventHandlerCollection();
                if (cur.Values) {
                    for (const i of Object.getOwnPropertySymbols(cur.Values)) {
                        coll.add(new finys.EventHandler(cur.Values[i]));
                    }
                }
                else {
                    for (const i in cur)
                        coll.add(new finys.EventHandler(cur[i]));
                }
  
            }
        }
    };

    finys.EventContainer.prototype.on = function (event, handler, count) {
        const events = event.split(/\s+/),
            h = new finys.EventHandler({
                Handler: handler,
                Count: count
            });
        for (const e of events) {
            if (!this.Handlers[e])
                this.Handlers[e] = new finys.EventHandlerCollection();
            this.Handlers[e].add(h);
        }
        return h.Id;
    };
    finys.EventContainer.prototype.once = function (event, handler) {
        return this.on(event, handler, 1);
    };
    finys.EventContainer.prototype.off = function (event, handler) {
        let result = 0;
        if (typeof event === 'symbol') {
            for (const i in this.Handlers)
                result += this.Handlers[i].remove(event);
            return result;
        }
        const events = event.split(/\s+/);
        for (const e of events) {
            if (!this.Handlers[e])
                continue;
            result += this.Handlers[e].remove(handler);
        }
        return result;
    };
    finys.EventContainer.prototype.trigger = function (event, ...args) {
        if (typeof event === 'object')
            return this.trigger(event.type, event, ...args);
        return this.Handlers[event]?.trigger(...args);
    };
    finys.EventContainer.prototype.clear = function () {
        this.Handlers = {};
    };


    finys.subscribers = new finys.EventContainer();
    finys.once = function (event, handler) {
        return finys.subscribers.once(event, handler);
    };
    finys.on = function (event, handler, count) {
        return finys.subscribers.on(event, handler, count);
    };
    finys.off = function (event, handler) {
        return finys.subscribers.off(event, handler);
    };
    finys.trigger = function (event, ...args) {
        const r = [];
        r.push(finys.subscribers.trigger(event, ...args));

        if (event instanceof jQuery.Event)
            r.push($(document).trigger(event, ...args));

        return Promise.allSettled(r);
    };
    finys.ready = function (handler) {
        return finys.once("ready", handler);
    };
    finys.authenticated = function (handler) {
        return finys.once("authenticated", handler);
    };

    finys.once("read-info", i => {
        finys.environment = i.FinysEnvironment;
        finys.machineName = i.Environment;
        finys.isAuthenticated = i.UserLoggedIn;
        finys.userName = i.UserName;
        config.values = i.Config;
        finys.trigger("ready");
        if (finys.isAuthenticated)
            finys.trigger("authenticated");
    });


    // Stripts an object of all properties that are not primitives or objects
    finys.cleanProps = function (value) {
        let r = null;
        switch (typeof value) {
            case 'object':
                if (!value)
                    break;
                if (value instanceof Array) {
                    r = [];
                    for (const i of value)
                        r.push(finys.cleanProps(i));
                }
                else {
                    r = {};
                    for (const i in value)
                        r[i] = finys.cleanProps(value[i]);
                }
                break;
            case 'function':
                break;
            default:
                r = value;
                break;
        }
        return r;
    };

    // Coalesce values on undefined, as opposed to null coalescing
    finys.coalesce = function (...values) {
        let r = undefined;
        for (const i of values) {
            r = i;
            if (r !== undefined)
                break;
        }
        return r;
    };


    // Coalesces input values on undefined
    finys.toDateOrDefault = function (...values) {
        const v = finys.coalesce(...values);
        if (v instanceof Date) return v;
        if (v) return new Date(v);
        return null;
    };


    // Coalesces input values on undefined
    finys.toStringOrDefault = function (...values) {
        const v = finys.coalesce(...values);
        if (!v) return null;
        if (typeof v === 'string') return v;
        return v.toString();
    };


    finys.getEventCoords = function (e) {
        e ||= window.event;
        if (e.clientX === undefined)
            return null;
        return new finys.Vector2({
            x: e.clientX,
            y: e.clientY
        });
    };
    finys.getOffsetCoords = function (e) {
        const off = $(e).offset();
        return new finys.Vector2({
            x: off.left,
            y: off.top
        });
    };
    finys.getLocalOffsetCoords = function (e) {
        if (e instanceof $)
            e = e[0];
        return new finys.Vector2({
            x: e.offsetLeft,
            y: e.offsetTop
        });
    };

    finys.getBounds = function (e) {
        if (e instanceof $)
            e = e[0];

        const r = e.getBoundingClientRect();

        return new finys.Rect({
            min: {
                x: r.x,
                y: r.y
            },
            max: {
                x: r.x + r.width,
                y: r.y + r.height
            }
        });
    };
    finys.getContentBounds = function (e) {
        if (e instanceof $)
            e = e[0];

        const r = e.getBoundingClientRect();

        return new finys.Rect({
            min: {
                x: r.x,
                y: r.y
            },
            max: {
                x: r.x + e.scrollWidth,
                y: r.y + e.scrollHeight
            }
        });
    };
    finys.getLocalBounds = function (e) {
        if (e instanceof $)
            e = e[0];

        const m = finys.getLocalOffsetCoords(e);

        return new finys.Rect({
            min: m,
            max: {
                x: m.x + e.offsetWidth,
                y: m.y + e.offsetHeight
            }
        });
    };


    finys.Block = function (options) {
        options ||= {};

        this.Index = options.Index || 0;
        this.Length = options.Length || 0;
    };
    finys.Block.prototype.extents = function () {
        return this.Index + this.Length;
    };
    finys.Block.prototype.offset = function (value) {
        return new finys.Block({
            Index: this.Index + value,
            Length: this.Length
        });
    };
    finys.Block.prototype.extend = function (target) {
        const i = Math.min(this.Index, target.Index);
        return new finys.Block({
            Index: i,
            Length: Math.max(this.extents(), target.extents()) - i
        });
    };


    finys.Vector2 = function (options) {
        options ||= {};

        this.x = options.x || 0;
        this.y = options.y || 0;
    };
    finys.Vector2.diff = function (a, b) {
        return new finys.Vector2({
            x: a.x - b.x,
            y: a.y - b.y
        });
    };
    finys.Vector2.sum = function (a, b) {
        return new finys.Vector2({
            x: a.x + b.x,
            y: a.y + b.y
        });
    };
    finys.Vector2.mult = function (a, b) {
        return new finys.Vector2({
            x: a.x * b,
            y: a.y * b
        });
    };
    finys.Vector2.div = function (a, b) {
        return new finys.Vector2({
            x: a.x / b,
            y: a.y / b
        });
    };
    finys.Vector2.dot = function (a, b) {
        return (a.x * b.x) + (a.y * b.y);
    };
    finys.Vector2.slope = function (a, b) {
        const d = finys.Vector2.diff(a, b);
        return Math.atan2(d.y, d.x);
    };
    finys.Vector2.sqrDistance = function (a, b) {
        return finys.Vector2.diff(b, a)
            .sqrMagnitude();
    };
    finys.Vector2.distance = function (a, b) {
        return Math.sqrt(finys.Vector2.sqrDistance(a, b));
    };
    finys.Vector2.rotate = function (value, theta, pivot) {
        if (!pivot)
            pivot = new finys.Vector2();

        const cos = Math.cos(theta),
            sin = Math.sin(theta),
            off = finys.Vector2.diff(value, pivot);

        return new finys.Vector2({
            x: (off.x * cos) - (off.y * sin) + pivot.x,
            y: (off.y * cos) + (off.x * sin) + pivot.y
        });
    };

    finys.Vector2.prototype.sqrMagnitude = function () {
        return finys.Vector2.dot(this, this);
    };
    finys.Vector2.prototype.magnitude = function () {
        return Math.sqrt(this.sqrMagnitude());
    };
    finys.Vector2.prototype.normalized = function () {
        return finys.Vector2.div(this, this.magnitude());
    };
    finys.Vector2.prototype.equals = function (value) {
        return this.x == value.x
            && this.y == value.y;
    };


    finys.Rect = function (options) {
        options ||= {};

        this.min = new finys.Vector2(options.min);
        this.max = new finys.Vector2(options.max);
    };
    finys.Rect.prototype.getHeight = function () {
        return this.max.y - this.min.y;
    };
    finys.Rect.prototype.getWidth = function () {
        return this.max.x - this.min.x;
    };
    finys.Rect.prototype.getLeft = function () {
        return this.min.x;
    };
    finys.Rect.prototype.getRight = function () {
        return this.max.x;
    };
    finys.Rect.prototype.getTop = function () {
        return this.min.y;
    };
    finys.Rect.prototype.getBottom = function () {
        return this.max.y;
    };
    finys.Rect.prototype.getCenter = function () {
        return new finys.Vector2({
            x: (this.max.x + this.min.x) / 2.0,
            y: (this.max.y + this.min.y) / 2.0
        });
    };
    finys.Rect.prototype.contains = function (coords) {
        return coords.x >= this.min.x
            && coords.y >= this.min.y
            && coords.x <= this.max.x
            && coords.y <= this.max.y;
    };


    finys.Event = function (name, options) {
        const t = this;
        if (!(t instanceof finys.Event))
            return new finys.Event(name, options);

        $.Event.call(this, name, options);
        this.Name = name;
    };
    finys.inherits(finys.Event, $.Event);

    finys.Event.UPDATE = "f-update";
    finys.Event.CHANGE = "f-change";

    finys.Option = function (options) {
        options ||= {};

        this.Text = options.Text ?? null;
        this.Value = options.Value ?? null;
    };


    finys.Collection = function (values) {
        values ||= [];
        this.Values = [...values];
        this.Sorter = null;
    };

    finys.Collection.prototype.sortedBy = function (prop, order) {
        if (order === finys.SortOrder.DESCENDING)
            this.Sorter = (a, b) => prop(b) >= prop(a);
        else this.Sorter = (a, b) => prop(a) > prop(b);
    };
    finys.Collection.prototype.sortedByDescending = function (prop) {
        this.sortedBy(prop, finys.SortOrder.DESCENDING);
    };
    finys.Collection.prototype.contains = function (item) {
        return this.Values.indexOf(item) !== -1;
    };
    finys.Collection.prototype.count = function () {
        return this.Values.length;
    };
    finys.Collection.prototype.add = function (item) {
        if (this.Sorter)
            return finys.insertSorted(this.Values, item, this.Sorter);
        this.Values.push(item);
        return this.Values.length - 1;
    };
    finys.Collection.prototype.removeAt = function (index) {
        return this.Values.splice(index, 1)[0];
    };
    finys.Collection.prototype.remove = function (item) {
        for (let i = 0; i < this.Values.length; i++)
            if (item == this.Values[i])
                return this.removeAt(i);
        return null;
    };
    finys.Collection.prototype.addRange = function (items) {
        for (const i of items)
            this.add(i);
    };
    finys.Collection.prototype.forEach = function (handler) {
        for (let i = 0; i < this.Values.length; i++)
            if (handler(this.Values[i], i) === false)
                break;
    };
    finys.Collection.prototype.any = function (predicate) {
        for (const i of this.Values)
            if (!predicate || predicate(i))
                return true;
        return false;
    };
    finys.Collection.prototype.all = function (predicate) {
        for (const i of this.Values)
            if (!predicate(i))
                return false;
        return true;
    };
    finys.Collection.prototype.first = function (predicate) {
        for (const i of this.Values)
            if (!predicate
                || predicate(i))
                return i;
        return undefined;
    };
    finys.Collection.prototype.select = function* (delegate) {
        for (const i of this.Values)
            yield delegate?.(i) ?? i;
    };
    finys.Collection.prototype.map = function (delegate) {
        const result = [];
        for (const i of this.select(delegate))
            result.push(i);
        return result;
    };
    finys.Collection.prototype.clear = function () {
        return this.Values = [];
    };


    finys.Address = class {
        constructor(options) {
            this.LineOne = options.LineOne;
            this.LineTwo = options.LineTwo;
            this.City = options.City;
            this.State = options.State;
            this.ZipCode = options.ZipCode;
        }
    }

    finys.Contact = class {
        constructor(options) {
            this.Id = options.Id;
            this.InsuredType = options.InsuredType;
            this.LegalEntity = options.LegalEntity;
            this.NameFirst = options.NameFirst;
            this.NameMiddle = options.NameMiddle;
            this.NameLast = options.NameLast;
            this.NamePrefix = options.NamePrefix;
            this.NameSuffix = options.NameSuffix;
            this.CompanyName = options.CompanyName;
            this.PhoneHome = options.PhoneHome;
            this.PhoneBusiness = options.PhoneBusiness;
            this.PhoneMobile = options.PhoneMobile;
            this.PhoneFax = options.PhoneFax;
            this.EmailAddress = options.EmailAddress;
            this.DBA = options.DBA;
            this.SocialSecurity = options.SocialSecurity;
            this.TaxId = options.TaxId;
            this.BirthDate = options.BirthDate;
            this.Sex = options.Sex;
        }
    }
    finys.Contact.prototype.getDisplayName = function () {
        const result = this.getLongName();
        return result || "Name not on file";
    };
    finys.Contact.prototype.getLongName = function () {
        if (this.CompanyName)
            return this.CompanyName;
        const result = [];
        if (this.NamePrefix)
            result.push(this.NamePrefix);
        if (this.NameFirst)
            result.push(this.NameFirst);
        if (this.NameMiddle)
            result.push(this.NameMiddle);
        if (this.NameLast)
            result.push(this.NameLast);
        if (this.NameSuffix)
            result.push(this.NameSuffix);
        return result.join(' ');
    };
    finys.Contact.prototype.getShortName = function () {
        if (this.CompanyName)
            return this.CompanyName;
        const result = [];
        if (this.NameFirst)
            result.push(this.NameFirst);
        if (this.NameLast)
            result.push(this.NameLast);
        return result.join(' ');
    };
    finys.Contact.prototype.getDisplayPhoneBusiness = function () {
        if (this.PhoneBusiness != null)
            return finys.format.phone(this.PhoneBusiness);
        return finys.format.NOT_ON_FILE;
    };
    finys.Contact.prototype.getDisplayPhoneFax = function () {
        if (this.PhoneFax != null)
            return finys.format.phone(this.PhoneFax);
        return finys.format.NOT_ON_FILE;
    };
    finys.Contact.prototype.getDisplayPhoneHome = function () {
        if (this.PhoneHome != null)
            return finys.format.phone(this.PhoneHome);
        return finys.format.NOT_ON_FILE;
    };
    finys.Contact.prototype.getDisplayPhoneMobile = function () {
        if (this.PhoneMobile != null)
            return finys.format.phone(this.PhoneMobile);
        return finys.format.NOT_ON_FILE;
    };
    finys.Contact.prototype.getDisplayEmailAddress = function () {
        return this.EmailAddress || finys.format.NOT_ON_FILE;
    };


    finys.applyEvents = function (item, ...args) {
        const items = item.find("[data-event]");

        items.each(function (i) {
            const cur = $(this),
                e = cur.attr("data-event");
            cur.on("click", () => cur.trigger(e, ...args));
        });
    };



    finys.ObservableObject = class extends finys.ScreenObject {
        constructor(options) {
            options ||= {};
            super(options);

            this.Subscribers = new finys.EventContainer(options.Subscribers);
        };


        on(event, handler, count) {
            return this.Subscribers.on(event, handler, count);
        };
        once(event, handler) {
            return this.Subscribers.once(event, handler);
        };
        off(event, handler) {
            return this.Subscribers.off(event, handler);
        };
        trigger(event, ...args) {
            const r = [];
            r.push(this.Subscribers.trigger(event, ...args));

            if (event instanceof jQuery.Event) {
                const e = this.getElement();
                if (e) {
                    event.sender = this;
                    r.push(e.trigger(event, ...args));
                }
            }
            return Promise.allSettled(r);
        };
        destroy() {
            this.trigger("destroy");
            this.Subscribers.clear();

            super.destroy();
        };
    }




    finys.ObservableCollection = class extends finys.Collection {
        constructor(values) {
            super(values);

            this.Subscribers = new finys.EventContainer();
        }
        on(event, handler) {
            return this.Subscribers.on(event, handler);
        };
        off(event, handler) {
            return this.Subscribers.off(event, handler);
        };
        trigger(event, ...args) {
            const r = [];
            r.push(this.Subscribers.trigger(event, ...args));

            if (event instanceof jQuery.Event) {
                const e = this.getElement();
                if (e)
                    r.push(e.trigger(event, ...args));
            }
            return Promise.allSettled(r);
        };
        removeAt(index) {
            const item = super.removeAt(index);
            this.trigger("remove", item);
        };
        add(item) {
            super.add(item);
            this.trigger("add", item);
        };
        clear() {
            const items = this.Values;
            super.clear();

            for (const item of items)
                this.trigger("remove", item);
        };

    };





    finys.Pool = class extends finys.ObservableObject {
        constructor(options) {
            super();

            this.Items = new finys.Collection();
            this.Create = options.Create;
            this.Amount = options.Amount || 1;
            this.Grow = options.Grow !== false;
            this.Deploys = 0;
            this.UniqueDeploys = 0;
            this.Returns = 0;

            this.grow(this.Amount);
        };


        use(handler) {
            const i = this.take();
            handler(i.Value);
            this.return(i);
        };

        async useAwait(handler) {
            const i = this.take();
            await handler(i.Value);
            this.return(i);
        };
        clean() {
            let c = this.Items.count();
            while (c > 0 && c > this.Amount) {
                let f = false;
                for (let i = c; i-- > 0;) {
                    const item = this.Items[i];
                    if (item.Status === finys.ItemStatus.AVAILABLE) {
                        this.Items.removeAt(i);
                        item.onDestroy()
                        c = this.Items.count();
                        f = true;
                        break;
                    }
                }
                if (!f) return;
            }
        };
        grow(amount) {
            for (let i = 0; i < amount; i++)
                this.make();
        };
        make() {
            const result = new finys.Pooled({
                Value: this.Create(),
                Pool: this
            });
            this.Items.add(result);
            return result;
        };
        take(options) {
            let result = null;
            this.Items.forEach(i => {
                if (i.Status === finys.ItemStatus.AVAILABLE) {
                    result = i;
                    return false;
                }
            });

            if (!result) {
                if (!this.Grow)
                    return null;
                result = this.make();
            }

            result.onDeploy(options);
            this.Deploys++;
            if (result.Deploys === 1)
                this.UniqueDeploys++;

            return result;

        };
        return(...items) {
            for (const i of items) {
                i.onReturn();
                this.Returns++;
            }
        };
    }



    finys.Pooled = class extends finys.ObservableObject {
        constructor(options) {
            super();

            this.Value = options.Value;
            this.Pool = options.Pool;
            this.Status = finys.ItemStatus.AVAILABLE;
            this.Deploys = 0;
            this.Returns = 0;
        };


        return() {
            this.Pool.return(this);
        };
        onDeploy(options) {
            this.Status = finys.ItemStatus.DEPLOYED;
            this.Deploys++;
            this.Pool.trigger("deploy", this.Value, options);
        };
        onReturn() {
            this.Status = finys.ItemStatus.AVAILABLE;
            this.Returns++;
            this.Pool.trigger("return", this.Value);
        };
        onDestroy() {
            this.Status = finys.ItemStatus.DISPOSED;
            this.Pool.trigger("destroy", this.Value);
        };

    }


    finys.ScreenEntity = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            super(options);

            this.EffectiveDate = null;
            this.ReceiveDate = null;
            this.TerminationDate = null;
            this.ViewDate = null;
            this.NoticeDate = null;

            if (options.EffectiveDate) {
                if (typeof options.EffectiveDate == 'string')
                    this.EffectiveDate = new Date(options.EffectiveDate).getTime();
                else this.EffectiveDate = options.EffectiveDate;
            }
            if (options.ReceiveDate) {
                if (typeof options.ReceiveDate == 'string')
                    this.ReceiveDate = new Date(options.ReceiveDate).getTime();
                else this.ReceiveDate = options.ReceiveDate;
            }
            if (options.TerminationDate) {
                if (typeof options.TerminationDate == 'string')
                    this.TerminationDate = new Date(options.TerminationDate).getTime();
                else this.TerminationDate = options.TerminationDate;
            }
            if (options.ViewDate) {
                if (typeof options.ViewDate == 'string')
                    this.ViewDate = new Date(options.ViewDate).getTime();
                else this.ViewDate = options.ViewDate;
            }
            if (options.NoticeDate) {
                if (typeof options.NoticeDate == 'string')
                    this.NoticeDate = new Date(options.NoticeDate).getTime();
                else this.NoticeDate = options.NoticeDate;
            }
        };
    }



    finys.File = class extends finys.ScreenEntity {
        constructor(options) {
            super(options);

            this.FileId = options.FileId;
            this.DocumentId = options.DocumentId;
            this.FileToken = options.FileToken;
            this.FileName = options.FileName;
            // The below is deprecated and should not be used
            this.Route = `/Portal/FileManager/GetFile/${this.FileName}?ft=${this.FileToken}`;

        };

        getRoute() {
            return `/Portal/FileManager/GetFile/${this.FileName}?ft=${encodeURIComponent(this.FileToken)}`;
        };
        download() {
            const pop = window.open(this.getRoute(), '_blank');

            if (pop) pop.focus();
            else alert("Please allow popups for this website.");
        };
    }



    finys.Window = class extends finys.ScreenEntity {
        #IsRefreshing = false;

        constructor(options) {
            super(options);

            this.Title = options.Title;
            this.Width = options.Width;
            this.Height = options.Height;
            this.Html = options.Html;
            this.Container = options.Container ?? $('#kendo-temp')[0];
            this.Load = options.Load || null;
            this.Links = options.Links || [];
            this.OnClose = options.OnClose || null;
            this.KendoWindow = null;
            this.Depth = options.Depth || null;

            if (this.Load && !(this.Load instanceof finys.AjaxData))
                this.Load = new finys.AjaxData(this.Load);

            this.initializeLinks();
        };

        initializeLinks() {
            if (!this.Links.length) {
                this.Links.push(new finys.forms.Button({
                    Text: "Continue",
                    Type: finys.Theme.PRIMARY,
                    OnClick: () => this.close()
                }));
            }
        }

        refresh() {
            if (!this.Load)
                return;
            this.#IsRefreshing = true;
            this.initialize();
        };
        open() {
            if (this.KendoWindow)
                this.KendoWindow.close();

            this.appendTo(this.Container);
            return this.waitCloseAsync();
        };
        initialize() {
            super.initialize();

            if (this.Load) {
                const e = this.getElement(),
                    a = new finys.AjaxData({
                        Url: this.Load.Url,
                        Type: this.Load.Type,
                        Async: this.Load.Async,
                        Cache: this.Load.Cache,
                        Data: this.Load.Data,
                        DataType: this.Load.DataType,
                        Success: this.Load.Success,
                        Error: this.Load.Error,
                        ContentType: this.Load.ContentType,
                        IsPassive: this.Load.IsPassive,
                        Shield: this.Load.Shield,
                        Headers: this.Load.Headers,
                        Container: e
                    });
                a.execute()
                    .then(() => this.openKendoWindow());
            }
            else this.openKendoWindow();
        };
        openKendoWindow() {
            if (this.#IsRefreshing)
                return;

            const e = this.getElement();

            this.KendoWindow = e
                .kendoWindow({
                    title: this.Title,
                    resizable: false,
                    modal: true,
                    visible: false,
                    width: this.Width,
                    height: this.Height,
                    close: i => this.onClose(i)
                })
                .data("kendoWindow");

            this.KendoWindow
                .toFront();

            const col = e.find(".f-controls .f-column-right");

            if (col.length)
                for (const l of this.Links)
                    l.appendTo(col);

            this.show();
        };
        waitCloseAsync() {
            return new Promise((resolve, reject) => {
                if (this.isVisible())
                    this.once("close", () => resolve());
                else resolve();
            });
        };
        show() {
            if (!this.#IsRefreshing) {
                this.KendoWindow
                    .center()
                    .open();

                this.setDepth();
            }
            this.#IsRefreshing = false;
        };
        close() {
            if (this.KendoWindow)
                this.KendoWindow.close();
        };
        setDepth(value) {
            this.Depth = value ?? this.Depth;
            if (!this.Depth)
                return;

            const w = this.getWindowElement(),
                o = $(".k-overlay:has(+ .k-widget.k-window)");
            w.css("z-index", this.Depth);
            o.css("z-index", this.Depth - 1);
        };
        getWindowElement() {
            const e = this.getElement();
            return e.closest(".k-widget.k-window");
        };
        getViewModel() {
            const j = this.getElement(),
                v = j.find("[viewmodelname]");
            if (v.length)
                return window[v.attr("viewmodelname")];
            return null;
        };
        onClose(e) {
            this.trigger("close");
            if (this.OnClose)
                this.OnClose(e);
        };
        preRender() {
            super.preRender();
            if (this.Load)
                this.addClass("f-content");
        };
        renderBody() {
            if (this.Html)
                return this.Html;
            return "";
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
            ${this.renderBody()}
        </div>`;
        };
        destroy() {
            for (const l of this.Links)
                l.destroy();

            if (this.KendoWindow) {
                this.KendoWindow.destroy();
                this.KendoWindow = null;
            }

            super.destroy();
        };

    }



    finys.FormWindow = class extends finys.Window {
        constructor(options) {
            super(options);
        };

        render() {
            this.preRender();

            return `<form ${this.renderAttributes()}>
            ${this.renderBody()}
        </form>`;
        };
    }




    finys.Prompt = class extends finys.Window {
        constructor(options) {
            super(options);

            this.Title = options.Title || "Alert";
            this.Width = options.Width || "240px";
            this.MaxContentHeight = options.MaxContentHeight || "100%";
            this.Message = options.Message;
        };

        onClose(e) {
            super.onClose(e);
            this.destroy();
        };
        renderContent() {
            return `<div class="f-content" style='max-height:${this.MaxContentHeight}'>
                <p class="f-message">${this.Message}</p>
            </div>`;
        };
        renderControls() {
            return `<div class='f-controls'>
            <div class='f-column-left'></div>
            <div class='f-column-right'></div>
        </div>`;
        };
        preRender() {
            super.preRender();
            this.addClass("f-prompt");
        };
        renderBody() {
            return `${this.renderContent()}${this.renderControls()}`;
        };
    }




    finys.confirm = function (options) {
        const w = new finys.Confirm(options);
        w.open();
        return w;
    };



    finys.Confirm = class extends finys.Prompt {
        constructor(options) {
            super(options);
            options.Width ||= "300px";
            this.OnConfirm = options.OnConfirm ?? null;
            options.Title ??= "Confirm";
            this.addClass("f-confirm-window");
        };

        initializeLinks() {
            this.Links.push(new finys.forms.Button({
                Text: "Cancel",
                Class: "f-secondary-light",
                OnClick: () => this.onCancel()
            }));
            this.Links.push(new finys.forms.Button({
                Text: "Okay",
                Type: finys.Theme.PRIMARY,
                OnClick: () => this.onConfirm()
            }));
        }

        onCancel() {
            this.trigger("cancel");
            this.close();
        }
        onConfirm() {
            if (this.OnConfirm)
                this.OnConfirm();
            this.trigger("confirm");
            this.close();
        }
    }




    finys.Faq = class extends finys.ScreenEntity {
        constructor(options) {
            super(options);

            this.Question = options.Question;
            this.Answer = options.Answer;
            this.Domain = options.Domain;
            this.SubDomain = options.SubDomain;
            this.Link = null;
        };

        onClick(e) {
            this.toggle();
        }
        isOpen() {
            return this.getElement()
                .hasClass("f-open");
        };
        toggle() {
            if (this.isOpen())
                this.close();

            else this.open();
        };
        open() {
            this.getElement()
                .addClass("f-open");
        };
        close() {
            this.getElement()
                .removeClass("f-open");
        };
        preRender() {
            super.preRender();

            this.addClass("f-faq-group");
        };
        onWindowClick(e) {
            const coords = { x: e.clientX, y: e.clientY };

            if (!this.isOpen())
                return;

            if (this.within(coords))
                return;

            this.close();
        };
        initialize() {
            super.initialize();

            var f = this,
                j = this.getElement(),
                answer = this.renderAnswer(),
                c = function () { f.onClick.apply(f, arguments); };

            this.windowClickListener = function () { f.onWindowClick.apply(f, arguments); };

            $(window).on("click", this.windowClickListener);

            if (this.Link)
                this.Link.destroy();

            this.Link = finys.forms.Link({
                Text: this.Question,
                OnClick: c
            });
            this.Link.appendTo(j);

            $(answer).appendTo(j);
        };
        renderAnswer() {
            return `<label class='f-faq-label-group'>${this.Answer}</label>`;
        };
        destroy() {
            this.Link.destroy();

            $(window).off("click", this.windowClickListener);

            super.destroy();
        };
    }




    finys.UploadOverlay = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            if (typeof options == 'string')
                options = { Message: options };

            super(options);

            this.Message = options.Message || "Drop files here to upload";
            this.IsAvailable = false;
        };


        initialize() {
            super.initialize();

            var available = function (dom) {
                return (('draggable' in dom) || ('ondragstart' in dom && 'ondrop' in dom))
                    && 'FormData' in window
                    && 'FileReader' in window;
            };

            var main = this.getElement(),
                d = this,
                enter = function () { d.dragEnter.apply(d, arguments); },
                exit = function () { d.dragExit.apply(d, arguments); };

            this.IsAvailable = available(this.DOM);

            if (this.IsAvailable) {
                main.parent()
                    .on('dragover dragenter', enter);
                main.on('dragleave dragend drop', exit);
            }

            main.hide();
        };
        droppable() {
            return this.getElement()
                .parent()
                .hasClass("f-droppable");
        };
        dragEnter(e) {
            if (!this.droppable())
                return true;

            e.preventDefault();
            e.stopPropagation();

            this.getElement()
                .show();
        };
        dragExit(e) {
            e.preventDefault();
            e.stopPropagation();

            this.getElement()
                .hide();
        };
        preRender() {
            super.preRender();

            this.addAttribute("id", "file-drop");
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
            <div class='f-upload-arrow'></div>
            <div>${this.Message}</div>
        </div>`;
        };

    }



    finys.isFileDragSupported = function (dom) {
        return (('draggable' in dom) || ('ondragstart' in dom && 'ondrop' in dom))
            && 'FormData' in window
            && 'FileReader' in window;
    };


    finys.UploadDrop = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            super(options);

            var d = this,
                open = function () { d.open.apply(d, arguments); };

            this.Url = options.Url;
            this.Method = options.Method || 'POST';
            this.MultipleCaption = options.MultipleCaption || '${count} files selected';
            this.Overlay = options.Overlay;
            this.Accept = options.Accept;
            this.DroppedFiles = false;
            this.IsAdvanced = false;
            this.LinkMore = finys.forms.Link({
                Text: "Upload more?",
                Class: "f-drop-retry",
                OnClick: open
            });
            this.LinkRetry = finys.forms.Link({
                Text: "Try again!",
                Class: "f-drop-retry",
                OnClick: open
            });

            if (typeof this.Overlay == "string")
                this.Overlay = $(this.Overlay)[0];

            if (this.Overlay instanceof jQuery)
                this.Overlay = this.Overlay[0];
        };


        initialize() {
            super.initialize();

            var main = this.getElement(),
                d = this,
                input = this.getInput(),
                enter = function () { d.dragEnter.apply(d, arguments); },
                exit = function () { d.dragExit.apply(d, arguments); },
                onSubmit = function () { d.onSubmit.apply(d, arguments); };

            this.onDrop = function () { d.drop.apply(d, arguments); };

            this.IsAdvanced = finys.isFileDragSupported(this.DOM);

            this.LinkMore.appendTo(main.find(".f-drop-success"));
            this.LinkRetry.appendTo(main.find(".f-drop-error"));

            input.on('change submit', onSubmit);

            if (this.IsAdvanced) {
                main.addClass('f-advanced');

                main.on('dragover dragenter', enter);
                main.on('dragleave dragend drop', exit);
                main.on('drop', this.onDrop);
            }

            if (this.Overlay) {
                $(this.Overlay).addClass("f-droppable");
                $("#file-drop").on('drop', this.onDrop);
            }
        };
        dragEnter(e) {
            e.preventDefault();
            e.stopPropagation();

            this.getElement()
                .addClass('f-is-dragover');
        };
        dragExit(e) {
            e.preventDefault();
            e.stopPropagation();

            this.getElement()
                .removeClass('f-is-dragover');
        };
        drop(e) {
            e.preventDefault();
            e.stopPropagation();

            this.DroppedFiles = e.originalEvent.dataTransfer.files;
            this.submit();
        };
        open() {
            this.getInput()
                .trigger('click');
        };
        submit() {
            this.getInput()
                .trigger('submit');
        };
        getInput() {
            return this.getElement()
                .find('input[type="file"]');
        };
        onSubmit(e) {
            var d = this,
                drop = this.getElement(),
                $input = this.getInput(),
                name = $input.attr('name'),
                input = $input.get(0);

            e.preventDefault();

            if (drop.hasClass('f-is-uploading'))
                return false;

            this.showUploading();

            if (this.IsAdvanced) {
                var data = new FormData();

                if (this.DroppedFiles) {
                    $.each(this.DroppedFiles, function (i, file) {
                        data.append(name + i, file);
                    });
                }

                if (input.files) {
                    $.each(input.files, function (i, file) {
                        data.append(name + i, file);
                    });
                }

                this.DroppedFiles = [];
                $input.val(null);

                d.trigger('upload', data);

                finys.ajax({
                    Url: this.Url,
                    Type: this.Method,
                    Data: data,
                    ContentType: false,
                    Success: function (r) {
                        if (r.Data.length) {
                            d.showSuccess();
                            d.trigger('success', r.Data);
                        }
                        else d.showError();
                    }
                });
            } else {
                var name = `uploadiframe${new Date().getTime()}`,
                    frame = $(`<iframe name='${name}' style='display: none;'></iframe>`);

                $('body').append(frame);
                drop.attr('target', name);

                frame.one('load', function () {
                    var r = JSON.parse(frame.contents().find('body').text());

                    if (r.data.length) {
                        d.showSuccess();
                        d.trigger('success', r.data);
                    }
                    else d.showError();

                    drop.removeAttr('target');

                    frame.remove();
                });
            }
        };
        showSuccess() {
            var drop = this.getElement();

            drop.addClass('f-is-success');

            drop.removeClass('f-is-uploading');
            drop.removeClass('f-is-error');
        };
        showUploading() {
            var drop = this.getElement();

            drop.addClass('f-is-uploading');

            drop.removeClass('f-is-success');
            drop.removeClass('f-is-error');
        };
        showError(message) {
            var drop = this.getElement(),
                err = drop.find('.f-drop-error > span');

            err.text(message);
            drop.addClass('f-is-error');

            drop.removeClass('f-is-uploading');
            drop.removeClass('f-is-success');
        };
        showFiles(files) {
            var drop = this.getElement(),
                label = drop.find('label'),
                caption = files[0].name;

            if (files.length > 1)
                caption = finys.format.interpolate(this.MultipleCaption, {
                    count: files.length
                });

            label.text(caption);
        };
        preRender() {
            super.preRender();

            this.addClass("f-upload-drop");
            this.addAttribute("enctype", "multipart/form-data");

            if (this.Overlay)
                this.addClass("f-overlay");

            this.addAttribute("method", this.Method);
            this.addAttribute("action", this.Url);
        };
        render() {
            this.preRender();

            var renderAccept = function (accept) {
                if (!accept)
                    return "";

                return finys.Attribute("accept", accept).render();
            };

            return `<form ${this.renderAttributes()}>
            <div class='f-drop-input'>
                <input class='f-drop-file' type='file' id='file' name='files[]' ${renderAccept(this.Accept)} multiple />
                <label for='file'>
                    <div class='f-upload-arrow'></div>
                    <strong>Choose a file</strong>
                    <span class='f-drop-dragndrop'>&nbsp;or drop it here</span>.
                </label>
                <button class='f-drop-button' type='submit'>Upload</button>
            </div>
            <div class='f-drop-uploading'>Uploading&hellip;</div>
            <div class='f-drop-success'>Done!&nbsp;</div>
            <div class='f-drop-error'>Error!&nbsp;<span></span>.&nbsp;</div>
        </form>`;
        };
        destroy() {
            if (this.LinkMore)
                this.LinkMore.destroy();

            if (this.LinkRetry)
                this.LinkRetry.destroy();

            if (this.Overlay) {
                $(this.Overlay).removeClass("f-droppable");
                $("#file-drop").off('drop', this.onDrop);
            }

            super.destroy();
        };


    }

    finys.ThumbnailArray = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            super(options);

            this.Enabled = options.Enabled;
            this.Files = [];

            if (this.Enabled === undefined)
                this.Enabled = true;

            for (let i = 0; options.Files && i < options.Files.length; i++) {
                var cur = new finys.Thumbnail(options.Files[i]);
                t.Enabled = this.Enabled;
                cur.Parent = this;
                this.Files.push(cur);
            }
        };

        serialize() {
            var r = [];

            for (let i = 0; i < this.Files.length; i++) {
                var cur = new finys.File(this.Files[i]);
                r.push(cur);
            }

            return finys.format.stringify(r);
        };
        add(file) {
            var j = this.getElement();
            var t = new finys.Thumbnail(file);
            t.Enabled = this.Enabled;
            t.Parent = this;
            this.Files.push(t);
            t.appendTo(j);
        };
        remove(uid) {
            if (typeof uid == 'object')
                uid = uid.Uid;

            for (let i = 0; i < this.Files.length; i++) {
                var cur = this.Files[i];

                if (cur.Uid != uid)
                    continue;

                cur.Parent = null;
                this.trigger("remove", cur);

                cur.destroy();
                this.Files.splice(i, 1);
                break;
            }
        };
        clear() {
            for (let i = 0; i < this.Files.length; i++) {
                var cur = this.Files[i];
                cur.Parent = null;
                cur.destroy();
            }
            this.Files = [];
        };
        initialize() {
            super.initialize();

            var j = this.getElement();

            for (let i = 0; i < this.Files.length; i++) {
                var cur = this.Files[i];
                cur.appendTo(j);
            }
        };
        preRender() {
            super.preRender();

            this.addClass("f-thumbnail-array");
        };
        destroy() {
            this.clear();

            super.destroy();
        };
    }


    finys.Thumbnail = class extends finys.File {
        constructor(options) {
            super(options);

            this.Enabled = options.Enabled;
            this.Parent = options.Parent;

            if (this.Enabled === undefined)
                this.Enabled = true;
        };


        initialize() {
            super.initialize();

            var j = this.getElement(),
                close = j.find('.f-thumbnail-close'),
                t = this,
                c = function () { t.onClick.apply(t, arguments); },
                r = function () { t.remove.apply(t, arguments); };

            j.on('click', c);
            close.on('click', r);
        };
        onClick(e) {
            this.download();

            e.preventDefault();
        };
        remove() {
            if (this.Enabled)
                this.Parent.remove(this.Uid);
        };
        preRender() {
            super.preRender();

            this.addClass("f-thumbnail");

            if (!this.Enabled)
                this.addAttribute("disabled");
        };
        render() {
            this.preRender();

            if (/\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(this.FileName))
                return this.renderAsImage();
            return this.renderAsIcon();
        };
        renderAsImage() {
            return `<div ${this.renderAttributes()}>
            <div class='f-thumbnail-close' titleline='Remove'></div>
            <div class='f-thumbnail-content' title='${this.FileName}'>
                <div class='f-thumbnail-image'>
                    <img src='${this.getRoute()}' />
                </div>
                <div class='f-thumbnail-caption'>${this.FileName}</div>
            </div>
        </div>`;
        };
        renderAsIcon() {
            return `<div ${this.renderAttributes()}>
            <div class='f-thumbnail-close' title='Remove'></div>
            <div class='f-thumbnail-content' title='${this.FileName}'>
                <div class='f-thumbnail-image'>
                    <div class='f-paper-icon'>
                        <div class='f-line'></div>
                        <div class='f-line'></div>
                        <div class='f-line'></div>
                        <div class='f-line'></div>
                    </div>
                </div>
                <div class='f-thumbnail-caption'>${this.FileName}</div>
            </div>
        </div>`;
        };

    }


    finys.FileManager = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            super(options);

            var f = this,
                u = function () { f.onUpload.apply(f, arguments); },
                s = function () { f.onUploadSuccess.apply(f, arguments); },
                r = function () { f.onRemove.apply(f, arguments); };

            this.UploadDrop = new finys.UploadDrop({
                Url: options.UploadUrl,
                Method: options.UploadMethod,
                MultipleCaption: options.MultipleCaption,
                Overlay: options.Overlay,
                Accept: options.Accept
            });
            this.ReadUrl = options.ReadUrl;
            this.ReadMethod = options.ReadMethod || 'POST';
            this.RemoveUrl = options.RemoveUrl;
            this.RemoveMethod = options.RemoveMethod || 'POST';
            this.Enabled = options.Enabled;
            this.Array = new finys.ThumbnailArray({
                Enabled: options.Enabled
            });

            if (this.Enabled === undefined)
                this.Enabled = true;

            this.UploadDrop.on('upload', u);
            this.UploadDrop.on('success', s);
            this.Array.on('remove', r);
        };

        onUpload(data) {
            this.trigger('upload', data);
        };
        onRemoveSuccess(file) {
            this.trigger('remove-success', file);
        };
        onReadSuccess(files) {
            this.trigger('read-success', files);
            this.Array.clear();
            for (let i = 0; files && i < files.length; i++)
                this.Array.add(files[i]);
        };
        onUploadSuccess(files) {
            this.trigger('upload-success', files);
            for (let i = 0; files && i < files.length; i++)
                this.Array.add(files[i]);
        };
        initialize() {
            super.initialize();

            var j = this.getElement();

            if (this.Enabled)
                this.UploadDrop.appendTo(j);
            this.Array.appendTo(j);

            this.read();
        };
        preRender() {
            super.preRender();

            this.addClass("f-file-manager");
        };
        read() {
            var f = this,
                data = new FormData();

            this.trigger('read', data);

            finys.ajax({
                Url: this.ReadUrl,
                Type: this.ReadMethod,
                Data: data,
                ContentType: false,
                Success: function (r) {
                    if (r.Data)
                        f.onReadSuccess(r.Data);
                }
            });
        };
        onRemove(file) {
            var f = this,
                data = new FormData();

            finys.formAppend(data, file, "file");
            this.trigger('remove', data);

            finys.ajax({
                Url: this.RemoveUrl,
                Type: this.RemoveMethod,
                Data: data,
                ContentType: false,
                Success: function (r) {
                    if (r.Success)
                        f.onRemoveSuccess(file);
                }
            });
        };
        remove(file) {
            this.Array.remove(file);
        };
        destroy() {
            this.UploadDrop.destroy();
            this.Array.destroy();

            super.destroy();
        };
    }




    finys.Toggle = class extends finys.ObservableObject {
        constructor(options) {
            super(options);

            this.ViewModel = options.ViewModel;
            this.SourceBind = options.SourceBind;
            this.Style = options.Style || finys.ToggleStyle.DEFAULT;
            this.Width = options.Width || '60px';
        };

        onClick(e) {
            this.toggle();
        };
        toggle() {
            var val = this.getElement()
                .hasClass("f-enabled");
            this.setValue(!val);
        };
        update() {
            var value = this.getValue(),
                j = this.getElement();

            if (value)
                j.addClass("f-enabled");
            else j.removeClass("f-enabled");

            this.trigger("update", this);
        };
        getValue() {
            var field = this.printField(),
                value = this.ViewModel.get(field);

            return !finys.format.isFalsy(value);
        };
        setValue(value) {
            var cur = this.getValue(),
                field = this.printField();

            if (cur == value)
                return;

            this.ViewModel.set(field, value);

            this.update();
        };
        enable() {
            this.setValue(true);
        };
        disable() {
            this.setValue(false);
        };
        printField() {
            return `dc.${this.SourceBind.Table}.${this.SourceBind.Field}`;
        };
        initialize() {
            super.initialize();

            var j = this.getElement(),
                t = this,
                c = function () { t.onClick.apply(t, arguments); };

            j.on('click', c);

            this.update();
        };
        preRender() {
            super.preRender();

            this.addClass("f-switch");
            this.addAttribute("title", "Toggle");

            this.style("width", this.Width);

            if (this.Style == finys.ToggleStyle.PILL)
                this.addClass("f-pill");
        };
    }




    finys.MergeField = class extends finys.ScreenEntity {
        constructor(options) {
            super(options);

            this.Table = options.SourceBind.Table;
            this.Field = options.SourceBind.Field;
            this.Type = options.Control.Type.toLowerCase();
        };

        preRender() {
            super.preRender();

            this.addClass("f-field");
        };
        render() {
            this.preRender();

            return `<li ${this.renderAttributes()}>
            <div class='f-content'>
                <div class='f-message'>${this.Field}</div>
            </div>
        </li>`;
        };
        renderHeader() {
            return `<li class='f-header'>
            <label>
                <b>${this.Table}</b>
            </label>
        </li>`;
        };
        renderField() {
            return `\${${this.Table}.${this.Field}${this.renderFormat()}}`;
        };
        renderFormat() {
            switch (this.Type) {
                case "datetime": return ":MM/dd/yyyy";
                case "decimal": return ":D2";
            }
            return "";
        };
        onClick() {
            this.toClipboard();
            ShowInfo({
                IsException: false,
                Message: `Field successfully copied to clipboard as ${this.renderField()}`
            });
        };
        toClipboard() {
            finys.toClipboard(this.renderField());
        };
        appendHeader(container) {
            var r = this.renderHeader();

            return $(r).appendTo(container);
        };
        initialize(container) {
            super.initialize();

            var j = this.getElement(),
                n = this,
                c = function () { n.onClick.apply(n, arguments); };

            j.on("click", c);
        };
    }




    finys.AjaxModule = class extends finys.ObservableObject {
        constructor(options) {
            super(options);

            options ||= {};

            this.Parent = null;
        }


        setParent(parent) {
            this.Parent = parent;
        };
        initialize() {
            this.trigger("initialize");
        };
        execute() {
            this.trigger("execute");

            return true;
        };
        success(result) {
            this.trigger("success");

            return true;
        };

    }



    finys.ReCaptchaControl = class extends finys.ScreenObject {
        constructor(options) {
            options ||= {};
            super(options);

            this.Scale = options.Scale;

            if (this.Scale)
                this.style("transform", `scale(${this.Scale})`);
        };
        preRender() {
            super.preRender();

            this.addClass("recaptcha-control");
        };
        validate() {
            const j = this.getElement(),
                re = j.children('div').eq(0),
                response = j.find('.g-recaptcha-response');

            if (response.length
                && !response.val()) {
                re.addClass('f-invalid');
                return false;
            }

            re.removeClass('f-invalid');
            return true;
        };
    }

    finys.ReCaptchaBranding = class extends finys.ScreenObject {
        constructor(options) {
            options ||= {};
            super(options);
        };


        preRender() {
            super.preRender();

            this.addClass("recaptcha-branding");
        };
        render() {
            this.preRender();

            return `<span ${this.renderAttributes()}>This site is protected by reCAPTCHA and the Google <a href='https://policies.google.com/privacy' target='_blank'>Privacy Policy</a> and <a href='https://policies.google.com/terms' target='_blank'>Terms of Service</a> apply.</span>`;
        };

    }


    finys.ReCaptchaConfig = class {
        constructor(options) {
            options ||= {};
            this.Version = options.Version || finys.ReCaptchaVersion.DEFAULT;
            this.Control = options.Control;
            this.Branding = options.Branding;
        };

        validate() {
            return this.Control.validate();
        };

    }

    finys.ReCaptchaModule = class extends finys.AjaxModule {
        constructor(options) {
            if (options instanceof finys.ReCaptchaConfig)
                options = { Config: options };

            super(options);

            options ||= {};

            this.Config = options.Config;
            this.Action = options.Action;
        };

        setParent(parent) {
            super.setParent(parent);

            if (!this.Action)
                this.Action = /(?:[^?\/]+\/)*([^?\/]+)/.exec(this.Parent.Url)[1];
        }
        execute() {
            const a = this,
                branding = $(".recaptcha-branding:visible"),
                v2 = this.Config.Control
                    .getElement()
                    .find('.g-recaptcha-response')
                    .val();

            if (!branding.length) {
                ShowInfo({
                    IsException: false,
                    Message: `ERROR: reCAPTCHA enabled for action '${this.Action}' but reCAPTCHA has not been initialized on this page.`
                });
                return;
            }

            if (!this.Config.validate())
                return false;

            if (v2 !== undefined) {
                this.trigger("execute", finys.ReCaptchaVersion.VERSION_2);
                a.Parent.Headers['FinysReCaptchaToken'] = v2;
                a.Parent.Headers['FinysReCaptchaVersion'] = finys.ReCaptchaVersion.VERSION_2;
                a.Parent.ajax();
            }
            else if ((this.Config.Version & finys.ReCaptchaVersion.VERSION_3) > 0) {
                this.trigger("execute", finys.ReCaptchaVersion.VERSION_3);
                grecaptcha.ready(function () {
                    grecaptcha.execute(finys.reCaptchaKeys[finys.ReCaptchaVersion.VERSION_3], { action: a.Action })
                        .then(function (token) {
                            a.Parent.Headers['FinysReCaptchaToken'] = token;
                            a.Parent.Headers['FinysReCaptchaVersion'] = finys.ReCaptchaVersion.VERSION_3;
                            a.Parent.ajax();
                        });
                });
            }

            return false;
        };
        challenge() {
            if ((this.Config.Version & finys.ReCaptchaVersion.VERSION_2) > 0) {
                const c = this.Config.Control.getElement(),
                    wrap = c.closest(".fb-child"),
                    v2 = c
                        .find('.g-recaptcha-response')
                        .val();

                wrap.show();

                if (v2) grecaptcha.reset(this.Config.Control.DOM);
                else {
                    grecaptcha.render(this.Config.Control.DOM, {
                        'sitekey': finys.reCaptchaKeys[finys.ReCaptchaVersion.VERSION_2]
                    });
                }

                this.trigger("challenge", finys.ReCaptchaVersion.VERSION_2);
            }
            else {
                ShowInfo({
                    IsException: false,
                    Message: "No bots allowed"
                });
            }
        };
        success(result) {
            if (result.Type == "ReCaptcha") {
                this.challenge();
                return false;
            }
            return super.success(result);
        }
    }



    finys.ajaxModules["ReCaptcha"] =
        i => new finys.ReCaptchaModule(i);


    finys.AjaxData = class extends finys.ObservableObject {
        constructor(options) {
            super(options);

            options ||= {};

            this.Url = options.Url;
            this.Type = options.Type ?? "POST";
            this.Async = options.Async !== false;
            this.Cache = options.Cache === true;
            this.HandleErrors = options.HandleErrors === true;
            this.Container = options.Container ?? $("#appContent")[0];
            this.Data = options.Data ?? "";
            this.DataType = options.DataType ?? "json";
            this.Success = options.Success ?? function (r) { };
            this.Error = options.Error ?? function (response, error) { };
            this.ContentType = options.ContentType ?? "application/json";
            this.IsPassive = options.IsPassive === true;
            this.Shield = options.Shield;
            this.Headers = [];
            this.Modules = [];
            this._Wait = null;

            if (options.Headers)
                for (const header in options.Headers)
                    this.Headers[header] = options.Headers[header];

            /* System headers */
            this.Headers["Finys-Session"] ??= finys.ui.getSessionIdentifier();

            if (this.Shield === undefined)
                this.Shield = !this.IsPassive;

            if (typeof this.Container == "string")
                this.Container = $(this.Container)[0];

            if (this.Container instanceof jQuery)
                this.Container = this.Container[0];

            this.attachModules(options);
            this.initialize();
        };

        initialize() {
            for (let i = 0; i < this.Modules.length; i++)
                this.Modules[i].initialize();
        };
        attachModules(options) {
            const entries = Object.entries(options);
            for (let i = 0; i < entries.length; i++) {
                const cur = entries[i],
                    name = cur[0],
                    val = cur[1],
                    m = finys.ajaxModules[name];
                if (m) {
                    if (typeof val == "object")
                        this[name] = m(val);

                    else if (val === true)
                        this[name] = m();

                    else continue;

                    this[name].setParent(this);
                    this.Modules.push(this[name]);
                }
            }
        };
        onError(response, error) {
            this.Error(response, error);

            fnResetSessionDuration(); //Session Timeout

            finys.complete(this._Wait);

            if (this.HandleErrors && response.status == 500) {
                ShowInfo({
                    Height: '90%',
                    Width: '90%',
                    IsException: true,
                    Message: response.responseText
                });
            }
        };
        setBrowserPageTitle(r) {
            if (this.Container != $("#appContent")[0]
                || !r.hasOwnProperty("Title"))
                return;

            $(document).attr('title', "Finys - " + r.Title);
        };
        setContent(r) {
            this.trigger("pre-set-content");
            const $c = $(this.Container);

            r.handled = true;

            this.cleanupViewModels();
            if ($c.hasClass("f-content k-window-content"))
                kendo.destroy($c.children());
            else kendo.destroy($c);
            $c.empty();
            $c.html(r.HTML);

            this.setRequiredClasses();
            this.setDisbledClasses();
            this.trigger("set-content");
        };
        setRequiredClasses() {
            $(this.Container)
                .find("input[class*=requiredStyle], select[class*=requiredStyle]")
                .each(function () {
                    const $t = $(this);
                    switch ($t.attr('data-role')) {
                        case 'dropdownlist':
                            $t.prev()
                                .children()
                                .first()
                                .addClass('requiredStyle');
                            break;
                        case 'multiselect':
                            $t.parent()
                                .children()
                                .first()
                                .addClass('requiredStyle');
                            break;
                        case 'numerictextbox':
                            $t.parent()
                                .addClass('requiredStyle');
                            $t.parent()
                                .parent()
                                .removeClass('requiredStyle');
                            break;
                    }
                });
        };
        setDisbledClasses() {
            $(this.Container)
                .find(".k-textbox")
                .each(function () {
                    const $t = $(this);
                    if ($t.attr('disabled') == 'disabled')
                        $t.addClass('k-disabled');
                    else $t.removeClass('k-disabled');
                });
        };
        cleanupViewModels() {
            $(this.Container)
                .find("[viewModelName]")
                .each(function (i, e) {
                    const $e = $(e),
                        $w = $(window),
                        n = $e.attr('viewModelName'),
                        vm = window[n];

                    if (vm !== undefined
                        && window.errorWin !== undefined) {
                        $(window.errorWin.wrapper)
                            .off('transitionend', vm.errorWin_OnTransitionEnd);
                        $w.off('scroll', vm.errorWin_OnWindowScroll);
                        $w.off('resize', vm.errorWin_OnWindowResize);
                        window
                            .errorWin
                            .wrapper
                            .find('.k-window-actions')
                            .off('click', vm.errorWin_OnPinClick);
                    }

                    window[n] = undefined;

                    try {
                        delete window[n];
                    } catch (e) { };
                });
        };
        async execute() {
            this.trigger("execute");

            let handled = false;
            for (const i of this.Modules)
                if (!i.execute())
                    handled = true;

            if (handled)
                return;

            return await this.ajax();
        };
        ajax() {
            this.trigger("ajax-begin");

            return new Promise((resolve, reject) => {
                const data = {
                    async: this.Async,
                    type: this.Type,
                    url: this.Url,
                    data: this.Data,
                    cache: this.Cache,
                    dataType: this.DataType,
                    contentType: this.ContentType,
                    processData: false,
                    headers: this.Headers,
                    error: (response, error) => {
                        const args = {
                            response: response,
                            error: error
                        };
                        this.trigger("ajax-error", args);
                        this.onError(response, error);
                        reject(error);
                    },
                    success: (result) => {
                        this.trigger("ajax-success", result);

                        let handled = false;
                        for (const i of this.Modules)
                            if (!i.success(result))
                                handled = true;

                        if (handled) {
                            finys.complete(this._Wait);
                            resolve();
                            return;
                        }

                        const args = {
                            data: result,
                            handled: false
                        };

                        let delayResolve = false;

                        try {
                            fnResetSessionDuration(); //Session Timeout

                            if (result && result.Type) {

                                switch (result.Type) {
                                    case "View":
                                        this.Success(args);
                                        if (!args.handled) {
                                            this.setBrowserPageTitle(result); //Page Title
                                            this.setContent(result);
                                        }
                                        delayResolve = true;
                                        $(() => {
                                            resolve(result);
                                            finys.complete(this._Wait);
                                        });
                                        break;
                                    case "Info":
                                        this.Success(args);
                                        if (!args.handled)
                                            ShowInfo(result);
                                        break;
                                    case "DynamicView":
                                        this.Success(args);
                                        if (!args.handled)
                                            this.setContent(result);
                                        break;
                                    case "FileToken":
                                        this.Success(args);
                                        ShowFile(result);
                                        break;
                                }
                            }
                            else this.Success(result);

                            if (!delayResolve)
                                resolve(result);
                        }
                        catch (error) {
                            reject(error);
                        }
                        finally {
                            if (!delayResolve)
                                finys.complete(this._Wait);
                        }
                    }
                };

                if (this.Shield)
                    this._Wait = finys.wait();

                $.ajax(data);
            });
        };


    }

    finys.ajax = async function (options) {
        const a = new finys.AjaxData(options);
        return await a.execute();
    };



    finys.TimeoutInfo = class {
        IsInitialized = false;
        IsTimedOut = false;
        TimeoutDuration = null;
        WarningDuration = null;
        Timeout = null;
        Warning = null;
        NotificationPopup = null;
        Countdown = 0;
        CountdownTimer = null;
        TimeoutTimer = null;
        WarningTimer = null;
        NotificationDOM = null;
        #Updating = null;
        #Extending = null;

        get NotificationElement() {
            this.NotificationDOM ??= $("#timeoutNotification")[0];
            if (!this.NotificationDOM)
                return null;
            return $(this.NotificationDOM);
        };

        constructor(options = {}) {
            this.IsTimedOut = options.IsTimedOut === true;
            this.TimeoutDuration = options.TimeoutDuration ?? null;
            this.WarningDuration = options.WarningDuration ?? null;
            this.Timeout = finys.toDateOrDefault(options.Timeout);
            this.Warning = finys.toDateOrDefault(options.Warning);
        };

        async #updateAsync() {
            if (this.IsTimedOut)
                return;
            const r = await $.ajax({
                type: "GET",
                url: '/PeekTimeout',
                contentType: "application/json"
            });
            this.IsTimedOut = r.IsTimedOut === true;
            this.TimeoutDuration = r.TimeoutDuration ?? null;
            this.WarningDuration = r.WarningDuration ?? null;
            this.Timeout = finys.toDateOrDefault(r.Timeout);
            this.Warning = finys.toDateOrDefault(r.Warning);
            this.apply();
        };
        async #extendAsync() {
            if (this.IsTimedOut)
                return;
            if (!this.IsInitialized) {
                await this.updateAsync();
                return;
            }
            this.Timeout = finys.toDateOrDefault(Date.now() + this.TimeoutDuration);
            this.Warning = finys.toDateOrDefault(this.Timeout - this.WarningDuration);
            this.apply();
        };
        async updateAsync() {
            if (this.IsTimedOut
                || (this.Warning - Date.now()) > 10000)
                return;

            if (!this.#Updating)
                this.#Updating = this.#updateAsync();

            await this.#Updating;
            this.#Updating = null;
        };
        async extendAsync() {
            if (this.IsTimedOut)
                return;
            if (!this.#Extending)
                this.#Extending = this.#extendAsync();

            await this.#Extending;
            this.#Extending = null;
        };
        apply() {
            const offset = this.Timeout - Date.now();
            // If only 10 seconds left, don't even bother to show
            // warning, instead just log user out immediately
            if (this.IsTimedOut
                || offset <= 10000)
                this.timeout();
            else if (this.Countdown > 0) {
                // If warning notification is open and timeout has
                // been extended past warning duration threshold,
                // then hide the notification
                if (offset > (this.WarningDuration + 10000))
                    this.hideWarning();
                // If warning notification is open and timeout has
                // been extended but not past warning duration
                // threshold, then just extend the countdown
                else this.syncCountdown();
            }
            else this.queueWarning();
            this.IsInitialized = true;
        };
        queueWarning() {
            if (this.IsTimedOut)
                return;
            const offset = this.Warning - Date.now();
            // Show timeout warning if within a second of now
            if (offset <= 1000)
                this.showWarning();
            else this.resetWarningTimer(offset);
        };
        printCountdown() {
            const count = this.Countdown / 1000,
                min = Math.floor(count / 60),
                sec = count % 60;
            return `${min.toFixed().padStart(2, '0')}:${sec.toFixed().padStart(2, '0')}`;
        };
        getNotificationPosition() {
            return new finys.Vector2({
                x: window.innerWidth / 2 - ((window.innerWidth * 0.7) / 2),
                y: window.innerHeight / 2 - ((window.innerHeight * 0.7) / 2)
            });
        };
        extendClick(e) {
            if (this.IsTimedOut)
                return;
            $.ajax({
                type: "POST",
                url: '/FinysPortal/Session/ExtendSession',
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: r => this.updateAsync()
            });
        };
        hideWarning() {
            const pos = this.getNotificationPosition();

            this.Countdown = 0;
            this.clearCountdownTimer();
            this.NotificationPopup?.hide();

            this.NotificationPopup = this.NotificationElement
                .kendoNotification({
                    position: {
                        pinned: true,
                        top: pos.y,
                        left: pos.x
                    },
                    autoHideAfter: 4000,
                    hideOnClick: true,
                    show: e => e.element[0].parentElement.style.zIndex = 10004,
                    width: "70%",
                    height: "70%",
                    templates: [{
                        type: "info",
                        template: $("#extendSessionTemplate").html()
                    }]
                }).data("kendoNotification");

            $('#countdownTime').text('');
            this.NotificationPopup.info({
                message: "The session has been extended"
            });

            this.queueWarning();
        };
        showWarning() {
            const pos = this.getNotificationPosition();

            this.clearWarningTimer();
            this.syncCountdown();
            this.NotificationPopup?.hide();

            this.NotificationPopup = this.NotificationElement
                .kendoNotification({
                    position: {
                        pinned: true,
                        top: pos.y,
                        left: pos.x
                    },
                    autoHideAfter: 0,
                    hideOnClick: false,
                    show: e => e.element[0].parentElement.style.zIndex = 10004,
                    width: "70%",
                    height: "70%",
                    templates: [{
                        type: "info",
                        template: $("#countdownTemplate").html()
                    }]
                }).data("kendoNotification");

            this.NotificationPopup.info({
                message: "The session will timeout in"
            });

            const t = $('#countdownTime'),
                s = $("#extendSession");
            t.text(this.printCountdown());
            s.bind("click", e => this.extendClick(e));

            this.resetCountdownTimer();
        };
        syncCountdown() {
            this.Countdown = Math.max(this.Timeout - Date.now(), 0);
            this.resetTimeoutTimer(this.Countdown);
        };
        timeout() {
            const t = this.IsTimedOut;
            this.IsTimedOut = true;
            $('#countdownTime').text("00:00");
            this.destroy();
            document.cookie = "logoutType=SessionTimeout";
            if (t)
                window.location = "/";
            else
                //Logout function will handle Session.Abandon and save
                logOut();
        };
        resetCountdownTimer() {
            const t = $('#countdownTime');
            this.clearCountdownTimer();
            this.CountdownTimer = setInterval(() => {
                this.Countdown = Math.max(this.Countdown - 1000, 0);
                t.text(this.printCountdown());
            }, 1000);
        };
        resetTimeoutTimer(timeout) {
            this.clearTimeoutTimer();
            this.TimeoutTimer = setTimeout(() => this.updateAsync(), timeout);
        };
        resetWarningTimer(delay) {
            this.clearWarningTimer();
            this.WarningTimer = setTimeout(() => this.updateAsync(), delay);
        };
        clearCountdownTimer() {
            if (this.CountdownTimer) {
                clearInterval(this.CountdownTimer);
                this.CountdownTimer = null;
            }
        };
        clearTimeoutTimer() {
            if (this.TimeoutTimer) {
                clearTimeout(this.TimeoutTimer);
                this.TimeoutTimer = null;
            }
        };
        clearWarningTimer() {
            if (this.WarningTimer) {
                clearTimeout(this.WarningTimer);
                this.WarningTimer = null;
            }
        };
        destroy() {
            this.NotificationPopup?.hide();
            this.clearCountdownTimer();
            this.clearTimeoutTimer();
            this.clearWarningTimer();
        };
    };


    finys.timeout = new finys.TimeoutInfo();



    finys.Waiter = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            super(options);

            this.IsWaiting = false;
            this.IsPaused = false;
            this._Waiting = [];
            this._PendingWait = [];
            this._PendingComplete = [];
        };

        wait(timeout) {
            const result = Symbol(),
                w = this.IsWaiting;

            this._Waiting.push(result);
            this.IsWaiting = true;

            if (this.IsPaused)
                this._PendingWait.push(result);
            else {
                if (!w) this.trigger("begin-wait");
                this.trigger("wait", result);
            }
            if (timeout)
                setTimeout(() => this.complete(result), timeout);
            return result;
        };
        complete(id) {
            const i = this._Waiting.indexOf(id);
            if (i == -1)
                return;

            this._Waiting.splice(i, 1);

            if (!this._Waiting.length)
                this.IsWaiting = false;

            if (this.IsPaused)
                this._PendingComplete.push(id);
            else {
                this.trigger("complete", id);
                if (!this.IsWaiting)
                    this.trigger("end-wait");
            }
        };
        isWaiting() {
            return this.IsWaiting
                && !this.IsPaused;
        };
        pause() {
            if (this.IsPaused)
                return;
            this.IsPaused = true;

            for (const p of this._PendingComplete)
                this.trigger("complete", p);
            this._PendingComplete = [];

            if (this.IsWaiting)
                this.trigger("end-wait");
        };
        resume() {
            if (!this.IsPaused)
                return;
            this.IsPaused = false;

            if (this.IsWaiting)
                this.trigger("begin-wait");

            for (const p of this._PendingWait)
                this.trigger("wait", p);
            this._PendingWait = [];
        };
        reset() {
            const w = this.IsWaiting;
            this.IsWaiting = false;
            this.IsPaused = false;
            this._Waiting = [];
            this._PendingWait = [];
            this._PendingComplete = [];
            if (w) this.trigger("end-wait");
        };

    }



    finys.waiter = new finys.Waiter();
    finys.waiter.on("begin-wait", () => kendo.ui.progress($('body'), true));
    finys.waiter.on("end-wait", () => kendo.ui.progress($('body'), false));


    finys.wait = i => finys.waiter.wait(i);
    finys.complete = i => finys.waiter.complete(i);


    finys.initializeReCaptcha = function (options) {
        if (typeof options == "string"
            || options instanceof jQuery)
            options = { Container: options };

        const template = "<div class='fb-child'></div>",
            result = {
                Version: options.Version,
                Control: new finys.ReCaptchaControl({
                    Scale: options.Scale
                }),
                Branding: new finys.ReCaptchaBranding()
            };

        let c = null;
        if (options.After)
            c = $(template).insertAfter(options.After);
        else if (options.Before)
            c = $(template).insertBefore(options.Before);
        else
            c = $(template).appendTo(options.Container);

        const b = $(template).insertAfter(c);

        c.hide();
        result.Control.appendTo(c);
        result.Branding.appendTo(b);
        return new finys.ReCaptchaConfig(result);
    };



    finys.Menu = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            options.Container ??= $("#f-context-menus")[0];

            super(options);
            
            this.Container = options.Container;
            this.Position = options.Position || finys.getEventCoords();
            this.Quadrant = options.Quadrant || finys.getQuadrant(this.Position);
            this.IsOpen = false;

            if (this.Container instanceof jQuery)
                this.Container = this.Container[0];
        };

        preRender() {
            super.preRender();

            this.addClass("f-menu");

            const s = $(window),
                w = s.width(),
                h = s.height();

            switch (this.Quadrant) {
                case finys.Quadrant.TOP_LEFT:
                    this.style("left", this.Position.x + "px");
                    this.style("top", this.Position.y + "px");
                    this.style("border-top-left-radius", "0px");
                    break;
                case finys.Quadrant.TOP_RIGHT:
                    this.style("right", w - this.Position.x + "px");
                    this.style("top", this.Position.y + "px");
                    this.style("border-top-right-radius", "0px");
                    break;
                case finys.Quadrant.BOTTOM_RIGHT:
                    this.style("right", w - this.Position.x + "px");
                    this.style("bottom", h - this.Position.y + "px");
                    this.style("border-bottom-right-radius", "0px");
                    break;
                case finys.Quadrant.BOTTOM_LEFT:
                    this.style("left", this.Position.x + "px");
                    this.style("bottom", h - this.Position.y + "px");
                    this.style("border-bottom-left-radius", "0px");
                    break;
            }
        };
        onWindowClick(e) {
            const coords = finys.getEventCoords(e);

            if (this.IsOpen && !this.within(coords))
                this.destroy();
        };
        onWindowResize(e) {
            if (this.IsOpen)
                this.destroy();
        };
        initialize() {
            super.initialize();

            const w = $(window);

            this._onWindowResize = i => this.onWindowResize(i);
            this._onWindowClick = i => this.onWindowClick(i);

            w.on("resize", this._onWindowResize);
            w.on("click", this._onWindowClick);
        };
        renderContent() {
            return '';
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
            ${this.renderContent()}
        </div>`;
        };
        open() {
            const c = $(this.Container),
                result = this.getElement()
                    || this.appendTo(c);

            setTimeout(() => {
                this.IsOpen = true;
                c.addClass("f-menu-open");
                this.trigger('open');
            }, 10);

            return result;
        };
        close() {
            const c = $(this.Container);

            c.removeClass("f-menu-open");

            this.IsOpen = false;
            this.trigger('close');
        };
        destroy() {
            const w = $(window);

            this.close();

            w.off("resize", this._onWindowResize);
            w.off("click", this._onWindowClick);

            super.destroy();
        };

    }



    finys.ContextMenu = class extends finys.Menu {
        constructor(options) {
            options ||= {};

            super(options);

            this.MenuItems = new finys.Collection();
            this.MenuItems.sortedBy(i => i.Order);

            if (options.MenuItems)
                for (const i of options.MenuItems)
                    this.add(i);
        };


        add(item) {
            const result = new finys.MenuItem(item);
            result.on("click", () => this.destroy());
            this.MenuItems.add(result);
            return result;
        };
        renderContent() {
            return "<div class='f-menu-items'></div>";
        };
        preRender() {
            super.preRender();

            this.addClass("f-context-menu");
        };
        initialize() {
            super.initialize();

            const e = this.getElement(),
                l = e.find(".f-menu-items");

            this.MenuItems.forEach(i => {
                if (i.isVisible())
                    i.appendTo(l);
            });
        };
        destroy() {
            if (this.IsDestroyed)
                return;

            this.MenuItems.forEach(i => i.destroy());
            this.MenuItems = null;

            super.destroy();
        };


    }


    finys.MenuToggle = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            options.Identity ||= "finysMenuToggle";
            super(options);

            this.MenuItems = options.MenuItems || [];
            this.IsVertical = options.IsVertical || false;
            this.IsStealthy = options.IsStealthy || false;
        };


        onClick(e) {
            const menu = new finys.ContextMenu({
                MenuItems: this.MenuItems,
                Position: finys.getEventCoords(e)
                    || this.getBounds().getCenter()
            });

            menu.on('open', () => this.addClass('f-open'));
            menu.on('close', () => this.removeClass('f-open'));

            menu.open();
        };
        preRender() {
            super.preRender();

            this.addClass("f-more");
            this.addAttribute("type", "button");
            this.addAttribute("title", "See more options");
            if (this.IsStealthy)
                this.addClass("f-stealthy");
            if (this.IsVertical)
                this.addClass("f-vertical");
        };
        render() {
            this.preRender();

            return `<button ${this.renderAttributes()}>
                ${finys.vector.MORE}
            </button>`;
        };
        initialize() {
            super.initialize();

            const m = this.getElement();
            m.on("click", e => this.onClick(e));

            if (!this.MenuItems.length)
                m.css("visibility", "hidden");
        };



    }

    finys.MenuItem = class extends finys.ObservableObject {
        constructor(options) {
            if (typeof options == 'string')
                options = { Text: options };

            super(options);

            this.Text = options.Text;
            this.Comment = options.Comment || null;
            this.IsVisible = options.IsVisible || null;
            this.IsDisabled = options.IsDisabled || null;
            this.ToolTipText = options.ToolTipText || null;
            this.OnClick = null;
            this.Order = options.Order || 0;
            this.Event = options.Event || null;

            this.initOnCLick(options);
        };
        initOnCLick(options) {
            if (options.IsDisabled != true) {
                switch (typeof options.OnClick) {
                    case 'function':
                        this.on("click", options.OnClick);
                        break;
                    case 'string':
                        this.OnClick = options.OnClick;
                        break;
                }

                // options.Click deprecated
                switch (typeof options.Click) {
                    case 'function':
                        this.on("click", options.Click);
                        break;
                    case 'string':
                        this.OnClick = options.Click;
                        break;
                }
            }
        };
        isVisible() {
            switch (typeof this.IsVisible) {
                case 'function':
                    return this.IsVisible();
                case 'boolean':
                    return this.IsVisible;
            }
            return true;
        };
        preRender() {
            super.preRender();

            this.addAttribute("type", "button");
            if (this.OnClick)
                this.addAttribute("onclick", `${this.OnClick};return false;`);
        };
        render() {
            this.preRender();

            return `<button ${this.renderAttributes()}>
            <div class='f-content'>
                ${this.renderToolTip()}
                <div class='f-message'>
                    ${this.Text}
                </div>
                ${this.renderComment()}
            </div>
        </button>`;
        };
        renderComment() {
            if (this.Comment)
                return `<div class='f-comment'>
                ${this.Comment}
            </div>`;
            return "";
        };
        preRender() {
            super.preRender();

            this.addClass("f-menu-item");
            if (this.IsDisabled)
                this.addClass("f-menu-item-disabled");

        };
        renderToolTip() {
            if (this.ToolTipText)
                return `<span class="f-tooltiptext">${this.ToolTipText}</span>`;
            else
                return "";
        };
        initialize() {
            super.initialize();

            const e = this.getElement();
            e.on("click", i => this.onClick(i));
        };
        onClick(e) {
            this.trigger("click", e);
        };

    }


    finys.DragController = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            super(options);

            this.Bindings = new finys.Collection();
            this.reset();

            this._onMouseDown = e => this.onMouseDown(e);
            this._onMouseMove = e => this.onMouseMove(e);
            this._onMouseUp = e => this.onMouseUp(e);
        };



        reset() {
            this.HasDragged = false;
            this.IsDragging = false;
            this.Start = null;
            this.Position = new finys.Vector2();
            this.Offset = new finys.Vector2();
        };
        unbindAll() {
            const w = $(window);

            this.reset();

            this.Bindings.forEach(i => $(i).off("mousedown", this._onMouseDown));
            this.Bindings.clear();

            w.off("mousemove", this._onMouseMove);
            w.off("mouseup", this._onMouseUp);
        };
        unbind(e) {
            if (!(e instanceof jQuery))
                e = $(e);

            this.reset();

            this.Bindings.remove(e[0]);
            e.off("mousedown", this._onMouseDown);

            if (!this.Bindings.count()) {
                const w = $(window);
                w.off("mousemove", this._onMouseMove);
                w.off("mouseup", this._onMouseUp);
            }
        };
        bind(e) {
            if (!(e instanceof jQuery))
                e = $(e);

            if (!this.Bindings.count()) {
                const w = $(window);
                w.on("mousemove", this._onMouseMove);
                w.on("mouseup", this._onMouseUp);
            }

            this.Bindings.add(e[0]);
            e.on("mousedown", this._onMouseDown);
        };
        onMouseDown(e) {
            this.Start = finys.getEventCoords(e);
            this.IsDragging = true;
        };
        onMouseMove(e) {
            if (!this.IsDragging)
                return;

            this.HasDragged = true;
            this.updateOffset(e);

            this.trigger("drag", finys.Vector2.sum(this.Position, this.Offset));
        };
        updateOffset(e) {
            const c = finys.getEventCoords(e);
            this.Offset = finys.Vector2.diff(c, this.Start);
        };
        onMouseUp(e) {
            if (!this.IsDragging)
                return;

            this.updateOffset(e);
            this.Position = finys.Vector2.sum(this.Position, this.Offset);
            this.IsDragging = false;
            this.Start = null;
        };
        destroy() {
            super.destroy();

            this.unbindAll();
        };

    }


    finys.CarouselItem = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            super(options);

            this.Title = options.Title || null;
            this.Order = options.Order || 0;
        };


        getTitle() {
            return this.Title;
        };
        onEnter() {

        };
        onExit() {

        };
    }



    finys.CarouselNavigation = class extends finys.ObservableObject {
        constructor(items) {
            super();

            this.Items = new finys.Collection();
            this.Items.sortedBy(i => i.Order || 0);

            if (items)
                for (const i of items)
                    this.add(i);
        };


        count() {
            return this.Items.count();
        };
        add(item) {
            const index = this.Items.add(item);

            if (this.DOM)
                this.appendLink(item, index);

            this.update();
            return index;
        };
        removeAt(index) {
            const item = this.Items.removeAt(index);
            this.removeLink(item);
            this.update();
        };
        clear() {
            const e = this.getElement(),
                n = e.find(".f-carousel-navigation");

            n.empty();
            this.Items.clear();
        };
        goto(index) {
            this.activate(index);
        };
        deactivate() {
            const e = this.getElement(),
                a = e.find("button.f-carousel-navigation-link.f-active");

            a.removeClass("f-active");
        };
        activate(index) {
            this.deactivate();

            const e = this.getElement(),
                a = e.find(`button.f-carousel-navigation-link:eq(${index})`);

            a.addClass("f-active");
        };
        update() {
            if (this.count() > 1)
                this.show();
            else this.hide();
        };
        initialize() {
            super.initialize();

            this.Items.forEach((v, i) => this.appendLink(v, i));
            this.update();
        };
        preRender() {
            super.preRender();

            this.addClass("f-carousel-navigation-bar");
        };
        getTitle(item) {
            if (typeof item.getTitle === 'function') {
                const t = item.getTitle();
                if (t) return `title="${t}"`;
            }
            return "";
        };
        removeLink(item) {
            const e = this.getElement(),
                l = e.find(`button.f-carousel-navigation-link[data-uid=${item.Uid}]`);

            l.remove();
        };
        appendLink(item, index) {
            const e = this.getElement(),
                b = $(`<button type="button" class="f-carousel-navigation-link" data-uid="${item.Uid}" ${this.getTitle(item)}></button>`);
            if (index > 0) {
                const l = e.find(`.f-carousel-navigation > button.f-carousel-navigation-link:nth-child(${index})`);
                b.insertAfter(l);
            }
            else {
                const n = e.find(".f-carousel-navigation");
                b.appendTo(n);
            }
            b.on("click", () => this.trigger("navigate", item));
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
            <div class="f-carousel-navigation"></div>
        </div>`;
        };
        destroy() {
            this.clear();
            super.destroy();
        };
    }

    finys.ContentPanel = class extends finys.ObservableObject {
        constructor(items) {
            super();

            this.Items = new finys.Collection(items);
            this.Items.sortedBy(i => i.Order || 0);
            this.Moving = 0;
            this.Index = 0;
            this.IsActive = false;
            this._ResizeObserver = new ResizeObserver(() => this.update());
        };


        add(item) {
            const index = this.Items.add(item);
            if (this.DOM) {
                const e = this.getElement();
                if (index > 0) {
                    const l = e.find(`.f-content-panel > :nth-child(${index})`);
                    item.insertAfter(l);
                }
                else {
                    const p = e.find(".f-content-panel");
                    item.appendTo(p);
                }
                this.update();
            }
            return index;
        };
        removeAt(index) {
            if (this.Index == index)
                this.deactivate();

            const item = this.Items.removeAt(index);
            item.destroy();
            this.update();
        };
        count() {
            return this.Items.count();
        };
        getItem(index) {
            if (index === undefined)
                index = this.Index;
            return this.Items.Values[index];
        };
        activeItem() {
            return this.getItem();
        };
        clear() {
            this.Items.forEach(i => i.destroy());
            this.Items.clear();
            this.update();
        };
        update() {
            const e = this.getElement();

            this.DOM.style.setProperty("--panel-slide-count", this.count());
            this.DOM.style.setProperty("--panel-window-width", `${e.width()}px`);
            this.DOM.style.setProperty("--panel-window-height", `${e.height()}px`);
        };
        preRender() {
            super.preRender();

            this.addClass("f-content-panel-window");
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
            <div class="f-content-panel"></div>
        </div>`;
        };
        deactivate() {
            if (!this.IsActive)
                return;

            const e = this.getElement(),
                item = this.Items.Values[this.Index],
                p = e.find(".f-content-panel"),
                a = p.children(".f-active");

            a.removeClass("f-active");

            if (item)
                item.onExit();
            this.IsActive = false;
        };
        activate(index) {
            if (index === undefined)
                index = this.Index;

            if (this.IsActive
                && this.Index === index)
                return;

            this.deactivate();
            this.Index = index;
            this.IsActive = true;

            const e = this.getElement(),
                p = e.find(".f-content-panel"),
                n = p.children(`:eq(${index})`);

            n.addClass("f-active");

            this.Items.Values[index].onEnter();
        };
        goto(index, animate) {
            if (animate)
                this.start();

            this.DOM.style.setProperty("--panel-slide-index", index);
            this.activate(index);

            setTimeout(() => this.stop(), 500);

            return this.Items.Values[index];
        };
        onClick(e) {
            if (e.target == this.DOM)
                this.trigger("click", e);
        };
        start() {
            const e = this.getElement();
            e.addClass("f-animate");
            this.Moving++;
        };
        stop() {
            this.Moving = Math.max(0, this.Moving - 1);

            if (this.Moving > 0) return;

            const e = this.getElement();
            e.removeClass("f-animate");
        };
        initialize() {
            super.initialize();

            const e = this.getElement(),
                p = e.find(".f-content-panel");

            this.Items.forEach(i => i.appendTo(p));

            e.on("click", e => this.onClick(e));
            this._ResizeObserver.observe(this.DOM);

            this.update();
        };
        destroy() {
            this.clear();
            this._ResizeObserver.unobserve(this.DOM);
            super.destroy();
        };
    }

    finys.Carousel = class extends finys.ObservableObject {
        constructor(options) {
            options ||= {};
            super();

            this.Panel = new finys.ContentPanel(options.Items);
            this.Navigation = new finys.CarouselNavigation(options.Items);

            this.Panel.on("click", i => this.trigger("panel-click", i));
            this.Navigation.on("navigate", i => this.select(i.Uid, true));
        };


        add(item) {
            this.Panel.add(item);
            const index = this.Navigation.add(item);
            this.update();
            return index;
        };
        remove(item) {
            const i = this.getIndex(item.Uid);
            this.Panel.removeAt(i);
            this.Navigation.removeAt(i);
            this.update();

            if (this.count() > 0
                && i == this.Panel.Index)
                this.goto(Math.max(i - 1, 0), true);
        };
        clear() {
            this.Panel.clear();
            this.Navigation.clear();
            this.update();
        };
        getItem(index) {
            return this.Panel.getItem(index);
        };
        activeItem() {
            return this.Panel.activeItem();
        };
        preRender() {
            super.preRender();

            this.addClass("f-carousel");
        };
        count() {
            return this.Panel.count();
        };
        getIndex(uid) {
            let result = 0;
            this.Panel.Items.forEach((v, i) => {
                if (v.Uid == uid) {
                    result = i;
                    return false;
                }
            });
            return result;
        };
        select(uid, animate) {
            const i = this.getIndex(uid);
            this.goto(i, animate);
        };
        activate() {
            this.Panel.activate();
            this.Navigation.activate(this.Panel.Index);
        };
        deactivate() {
            this.Panel.deactivate();
            this.Navigation.deactivate();
        };
        goto(index, animate) {
            if (this.Panel.IsActive
                && this.Panel.Index === index)
                return;
            this.Navigation.goto(index);
            const item = this.Panel.goto(index, animate);
            this.update();
            this.trigger("goto", index, item);
        };
        update() {
            if (!this.DOM)
                return;

            const e = this.getElement(),
                l = e.find("button.f-carousel-chev.f-carousel-chev-l"),
                r = e.find("button.f-carousel-chev.f-carousel-chev-r");

            if (this.Panel.Index === 0) l.hide();
            else l.show();

            if (this.Panel.Index >= (this.count() - 1)) r.hide();
            else r.show();
        };
        forward() {
            const i = this.Panel.Index + 1;
            if (this.count() > i)
                this.goto(i, true);
        };
        backward() {
            const i = this.Panel.Index - 1;
            if (i >= 0
                && this.count() > i)
                this.goto(i, true);
        };
        initialize() {
            super.initialize();

            const e = this.getElement(),
                l = e.find("button.f-carousel-chev.f-carousel-chev-l"),
                r = e.find("button.f-carousel-chev.f-carousel-chev-r");

            this.Panel.appendTo(e);
            this.Navigation.appendTo(e);

            l.on("click", () => this.backward());
            r.on("click", () => this.forward());
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
            <button type="button" title="Previous" class="f-carousel-chev f-carousel-chev-l">
                ${finys.vector.CHEV_W}
            </button>
            <button type="button" title="Next" class="f-carousel-chev f-carousel-chev-r">
                ${finys.vector.CHEV_E}
            </button>
        </div>`;
        };
        destroy() {
            this.Panel.destroy();
            this.Navigation.destroy();

            super.destroy();
        };
    }


    finys.ResizeHandle = class extends finys.ObservableObject {
        constructor(options) {
            super(options);

        };


        preRender() {
            super.preRender();

            this.addClass("f-resize-handle");
        };
        update() {

        };
    }


    finys.Loader = class extends finys.ScreenObject {
        constructor(options) {
            options ||= {};
            super(options);
        };


        preRender() {
            super.preRender();

            this.addClass("f-loader");
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
            <span class="f-loader-dot"></span>
            <span class="f-loader-dot"></span>
            <span class="f-loader-dot"></span>
        </div>`;
        };

    }


    finys.ValidationOptions = class {
        constructor(options) {
            options ||= {};

            this.Masks = {};

            if (options.Masks)
                for (const t in options.Masks)
                    this.set(options.Masks[t], t);
        };
        copy() {
            return new finys.ValidationOptions(this);
        };
        set(mask, type) {
            if (type === undefined)
                type = finys.ValidationType.ALL;
            this.Masks[type] = mask;
        };
        restrict(mask, type) {
            if (type === undefined)
                type = finys.ValidationType.ALL;
            this.Masks[type] &= mask;
        };
        enable(mask, type) {
            if (type === undefined)
                type = finys.ValidationType.ALL;
            this.Masks[type] |= mask;
        };
        disable(mask, type) {
            if (type === undefined)
                type = finys.ValidationType.ALL;
            this.Masks[type] ^= mask;
        };
        inverse(type) {
            this.Masks[type] = ~this.Masks[type];
        };
        canValidate(component, type) {
            if (type === undefined)
                type = finys.ValidationType.ALL;
            const a = this.Masks[finys.ValidationType.ALL],
                t = this.Masks[type];
            return (type === finys.ValidationType.ALL
                || a === undefined
                || finys.hasFlag(a, component))
                && (t === undefined
                    || finys.hasFlag(t, component));
        };

    }

    finys.Validation = class {
        constructor(options) {
            this.Controls = new finys.Collection();
            this.Type = options.Type;
            this.Message = options.Message;

            if (options.Field)
                this.Controls.add(options.Field);

            if (options.Controls) {
                if (options.Controls.Values)
                    this.Controls.addRange(options.Controls.Values);
                else {
                    for (const ctrl of options.Controls)
                        if (ctrl)
                            this.Controls.add(ctrl);
                }
            }
        };
        apply() {
            this.Controls.forEach(i => i.markInvalid());
        };
        addControl(value) {
            this.Controls.add(value);
        };
        isInvalid() {
            const invalid = finys.ValidationType.NO_VALUE
                | finys.ValidationType.INVALID_VALUE
                | finys.ValidationType.UNSUPPORTED_VALUE;

            return finys.hasFlag(invalid, this.Type);
        };
    }


    finys.ValidationCollection = class extends finys.Collection {
        constructor(options) {
            super();

            this.Length = 0;
            this.Options = new finys.ValidationOptions(options);
            this.IsValid = true;
            this.IsSuccess = true;
        };


        add(item) {
            if (!(item instanceof finys.Validation))
                item = new finys.Validation(item);

            super.add(item);

            this.Length++;
            if (item.isInvalid()) {
                this.IsValid = false;
                this.IsSuccess = false;
            }
        };
        isValid(type) {
            for (const v of this.Values)
                if (finys.hasFlag(type, v.Type))
                    return false;
            return true;
        };
        clear() {
            super.clear();

            this.Length = 0;
            this.IsValid = true;
            this.IsSuccess = true;
        };
        apply(errors) {
            switch (typeof errors) {
                case 'string':
                    errors = $(errors);
                case 'boolean':
                    errors = null;
            }

            this.forEach(i => i.apply());

            if (errors)
                errors.text(this.getMessage());
        };
        getMessage() {
            let msg = "";
            if (!this.IsValid) {
                for (const val of this.getValidations()) {
                    if (msg)
                        return "Please complete all required fields";
                    msg = val.Message;
                }
            }
            return msg;
        };
        * getValidations() {
            for (const val of this.Values)
                if (val.isInvalid())
                    yield val;
        };
    }



    finys.IndicatorContent = class {
        constructor(options) {
            this.Icon = options.Icon;
            this.Text = options.Text;
        };
        render() {
            return `<div class='f-control-content'>
                ${this.Icon}
                <div class='f-indicator-control-text'>
                    ${this.Text}
                </div>
            </div>`;
        };
    }




    finys.IndicatorControl = class extends finys.ObservableObject {
        constructor(options) {
            super();

            this.AllowReadonly = options.AllowReadonly === true;
            this.IsEnabled = options.IsEnabled !== false;
            this.Id = options.Id;
            this.Order = options.Order ?? 0;
            this.Content = [];
            this.Index = 0;
            this.IsSuccess = false;
            this.IsPassing = false;
            this.IsBouncing = false;
            this.IsExpanded = false;

            if (options.Content instanceof Array) {
                for (const c of options.Content)
                    this.Content.push(new finys.IndicatorContent(c));
            }
            else this.Content.push(new finys.IndicatorContent(options.Content));
        };


        isRequired() {
            return false;
        };
        update() {

        };
        enable(value) {
            const e = value !== false;

            this.IsEnabled = e;
            if (!e) this.addClass("f-disabled");
            else this.removeClass("f-disabled");
        };
        tryBounce() {
            const result = !this.IsPassing
                && this.isVisible()
                && this.isRequired();
            this.bounce(result);
            return result;
        };
        bounce(value) {
            this.IsBouncing = value !== false;
            if (this.IsBouncing)
                this.addClass("f-control-bounce");
            else this.removeClass("f-control-bounce");
        };
        expand(value) {
            this.IsExpanded = value !== false;
            if (this.IsExpanded)
                this.addClass("f-control-expand");
            else this.removeClass("f-control-expand");
        };
        success(value) {
            this.IsSuccess = value !== false;
            if (this.IsSuccess)
                this.addClass("f-is-success");
            else this.removeClass("f-is-success");
            this.passing(value);
        };
        passing(value) {
            this.IsPassing = value !== false;
            if (this.IsPassing) {
                this.addClass("f-is-passing");
                this.markValid();
            }
            else this.removeClass("f-is-passing");
        };
        indicate(index) {
            const e = this.getElement(),
                content = e.find(".f-control-content");

            this.Index = finys.math.clamp(index, 0, this.Content.length - 1);
            const indicated = content.eq(this.Index);

            content.removeClass("f-indicated");
            indicated.addClass("f-indicated");
        };
        markValid() {
            this.removeClass("f-invalid");
        };
        markInvalid() {
            this.addClass("f-invalid");
        };
        preRender() {
            super.preRender();

            this.addClass("f-indicator-control");
            this.addAttribute("type", "button");
            if (this.AllowReadonly)
                this.addClass("f-allow-readonly");
        };
        renderContent() {
            const value = [];
            for (const c of this.Content)
                value.push(c.render());
            return value.join('');
        };
        render() {
            this.preRender();

            return `<button ${this.renderAttributes()}>
                ${this.renderContent()}
            </button>`;
        };
        initialize() {
            super.initialize();

            const e = this.getElement();

            e.on("click", i => {
                if (this.IsEnabled
                    || this.AllowReadonly)
                    this.onClick(i);
                e.blur();
            });

            this.indicate(0);
        };
        onClick(e) {
            this.trigger("click", e);
        };

    }


    finys.IndicatorPanel = class extends finys.ScreenObject {
        constructor() {
            super({
                Identity: "finysIndicatorPanel"
            });

            this.Controls = {};
            this.IsEnabled = true;
        };


        bounce(value) {
            if (value === false)
                for (const c in this.Controls)
                    this.Controls[c].bounce(false);
            else {
                let b = false;
                for (const c in this.Controls) {
                    if (b)
                        this.Controls[c].bounce(false);
                    else if (this.Controls[c].tryBounce())
                        b = true;
                }
            }
        };
        addControl(id, control) {
            control.Id = id;
            this.add(control);
        };
        add(control) {
            this.Controls[control.Id] = control;

            const e = this.getElement();
            if (e)
                control.appendTo(e);
        };
        getControl(id) {
            return this.Controls[id];
        };
        preRender() {
            super.preRender();

            this.addClass("f-indicator-panel");
        };
        initialize() {
            super.initialize();

            const e = this.getElement(),
                coll = new finys.Collection();

            coll.sortedBy(i => i.Order);
            for (const c in this.Controls)
                coll.add(this.Controls[c]);
            coll.forEach(i => i.appendTo(e));

            this.update();
        };
        success(control, value) {
            const c = this.getControl(control);
            if (c) {
                c.success(value);
                if (c.IsBouncing)
                    this.bounce();
            }
        };
        passing(control, value) {
            const c = this.getControl(control);
            if (c) {
                c.passing(value);
                if (c.IsBouncing)
                    this.bounce();
            }
        };
        enable(value) {
            const e = value !== false;

            this.IsEnabled = e;
            for (const c in this.Controls)
                this.Controls[c].enable(this.IsEnabled);
        };
        update() {
            for (const c in this.Controls)
                this.Controls[c].update();
        };
        markInvalid(control) {
            const c = this.getControl(control);
            if (c) c.markInvalid();
        };
        markValid() {
            for (const c in this.Controls)
                this.Controls[c].markValid();
        };
        destroy() {
            for (const c in this.Controls)
                this.Controls[c].destroy();

            this.Controls = null;
            super.destroy();
        };
    }


    finys.TableSelection = class extends finys.Collection {
        constructor(options) {
            options ||= {};

            super();

            this.Count = options.Count;
            this.Filters = options.Filters ?? null;
            this.IdSelector = options.IdSelector;
            this.DescriptionDelegate = options.DescriptionDelegate;
            this.ValueName = new finys.format.DescriptionMap(options.ValueName);

            if (options.Values)
                for (const value of options.Values)
                    this.add(value);
        };


        containsId(id) {
            return this.any(i => this.IdSelector(i) == id);
        };
        getIds() {
            const result = [];
            this.forEach(i => result.push(this.IdSelector(i)));
            return result;
        };
        getDescription(capitalize) {
            if (this.Count == 1
                && this.Values.length == 1) {
                if (capitalize)
                    return this.DescriptionDelegate(this.Values[0], finys.format.DescriptionType.CAPITALIZED);
                return this.DescriptionDelegate(this.Values[0], 0);
            }
            if (this.Count > 1) {
                if (capitalize)
                    return `${this.Count} ${this.ValueName.get(finys.format.DescriptionType.PLURAL | finys.format.DescriptionType.CAPITALIZED)}`;
                return `${this.Count} ${this.ValueName.get(finys.format.DescriptionType.PLURAL)}`;
            }
            if (capitalize)
                return `1 ${this.ValueName.get(finys.format.DescriptionType.CAPITALIZED)}`;
            return `1 ${this.ValueName.get(0)}`;
        };
    }



    finys.TablePage = class extends finys.Collection {
        constructor(options) {
            options ||= {};

            super();

            this.Total = options.Total ?? 0;
            this.Filters = options.Filters ?? null;
            this.IdSelector = options.IdSelector ?? (i => i.Id);

            if (options.Values)
                for (const value of options.Values)
                    this.add(value);
        };


        getItem(id) {
            for (const value of this.Values)
                if (this.IdSelector(value) == id)
                    return value;
            return null;
        };
    }



    finys.ActionContent = class {
        constructor(options) {
            this.Icon = options.Icon;
            this.Text = options.Text;
        };
        render() {
            return `${this.Icon}
            <div class='f-action-text'>
                ${this.Text}
            </div>`;
        };

    }



    finys.TableAction = class extends finys.ObservableObject {
        constructor(options) {
            super();

            this.IsEnabled = options.IsEnabled !== false;
            this.Id = options.Id;
            this.Order = options.Order ?? 0;
            this.Content = {};
            this.Panel = null;

            this.Content.Enabled = new finys.ActionContent(options.Content.Enabled);
            this.Content.Disabled = new finys.ActionContent(options.Content.Disabled);
        };


        read() {
            this.Panel.read();
        };
        setPage(page) {
            this.Panel.setPage(page);
        };
        deselectAll() {
            this.Panel.deselectAll();
        };
        selectAll() {
            this.Panel.selectAll();
        };
        select(id) {
            this.Panel.select(id);
        };
        deselect(id) {
            this.Panel.deselect(id);
        };
        getSelection() {
            return this.Panel.getSelection();
        };
        enable(value) {
            const j = this.getElement(),
                e = value !== false;

            this.IsEnabled = e;
            if (!e) j.addClass("f-disabled");
            else j.removeClass("f-disabled");
        };
        setPanel(value) {
            this.Panel = value;
        };
        preRender() {
            super.preRender();

            this.addClass("f-table-action");
            this.addAttribute("type", "button");
        };
        render() {
            this.preRender();

            return `<button ${this.renderAttributes()}>
                <div class='f-action-content'>
                    ${this.Content.Enabled.render()}
                </div>
                <div class='f-action-content f-action-disabled'>
                    ${this.Content.Disabled.render()}
                </div>
            </button>`;
        };
        onPageSet() {

        };
        onDataBound(e) {

        };
        onDataBinding(e) {

        };
        initialize() {
            super.initialize();

            const e = this.getElement();

            e.on("click", i => {
                if (this.IsEnabled)
                    this.onClick(i);
            });
        };
        onClick(e) {
            this.trigger("click", e);
        };

    }





    finys.TableActionPanel = class extends finys.ScreenObject {
        constructor(options) {
            options ||= {};
            options.Identity ||= "finysTableActionPanel";

            super(options);

            this.Table = options.Table;
            this.CheckboxColumn = options.CheckboxColumn ?? 1;
            this.DescriptionDelegate = options.DescriptionDelegate ?? ((i, t) => this.ValueName(t));
            this.ValueName = new finys.format.DescriptionMap(options.ValueName);
            this.Height = options.Height ?? "70px";
            this.Page = options.Page ?? null;
            this.Actions = {};

            this.Selection = [];
            this.SelectAll = false;

            this.HeaderCheckboxDOM = null;
            this.CounterDOM = null;
        }


        enable(value) {
            const e = value !== false;

            this.IsEnabled = e;
            for (const a in this.Actions)
                this.Actions[a].enable(this.IsEnabled);
        };
        setPage(page) {
            this.Page = page;
            for (const a in this.Actions)
                this.Actions[a].onPageSet();
        };
        addAction(id, action) {
            action.Id = id;
            this.add(action);
        };
        add(action) {
            this.Actions[action.Id] = action;
            action.setPanel(this);

            const e = this.getElement();
            if (e) {
                const actions = e.find(".f-panel-actions");
                action.appendTo(actions);
            }
        };
        getControl(id) {
            return this.Actions[id];
        };
        read() {
            this.Table.dataSource.read();
        };
        deselectAll() {
            this.SelectAll = false;
            this.Selection = [];
            this.update();
        };
        selectAll() {
            this.SelectAll = true;
            this.Selection = [];
            for (const item of this.Table.dataSource.data())
                this.Selection.push(item.Id);
            this.update();
        };
        select(id) {
            this.Selection.push(id);
            this.update();
        };
        deselect(id) {
            const index = this.Selection.indexOf(id);
            if (index === -1)
                return;
            this.SelectAll = false;
            this.Selection.splice(index, 1);
            this.update();
        };
        getCount() {
            if (this.SelectAll)
                return this.Table.dataSource.total();
            return this.Selection.length;
        };
        update() {
            this.updateHeaderCheckbox();

            const count = this.getCount();
            this.updateTable();

            if (count > 0) {
                this.setCounter(count);
                this.show();
            }
            else this.hide();
        };
        updateHeaderCheckbox() {
            //Header Checkbox influence
            if (!this.Selection.length) {
                this.HeaderCheckboxDOM.checked = this.SelectAll;
                this.HeaderCheckboxDOM.indeterminate = false;
            }
            else if (!this.HeaderCheckboxDOM.indeterminate) {
                this.HeaderCheckboxDOM.checked = this.SelectAll;
                this.HeaderCheckboxDOM.indeterminate = true;
            }
            else if (this.Selection.length == this.Table.dataSource.total()) {
                this.SelectAll = true;
                this.HeaderCheckboxDOM.checked = true;
                this.HeaderCheckboxDOM.indeterminate = false;
            }
        };
        updateTable() {
            const t = this.getTableElement(),
                rows = t.find("table > tbody > tr");

            for (let i = 0; i < rows.length; i++) {
                const r = $(rows[i]),
                    c = r.find(`td:nth-child(${this.CheckboxColumn}) > input[type=checkbox]`)[0],
                    selected = this.isSelected(r);

                if (selected) {
                    c.checked = true;
                    r.addClass("f-selected");
                }
                else {
                    c.checked = false;
                    r.removeClass("f-selected");
                }
            }
        };
        getItem(id) {
            return this.Page.getItem(id);
        };
        isSelected(row) {
            if (this.SelectAll)
                return true;

            const item = this.Table.dataItem(row),
                id = this.Page.IdSelector(item),
                index = this.Selection.indexOf(id);

            return index !== -1;
        };
        onHeaderSelectionChange(e) {
            if (e.target.checked)
                this.selectAll();
            else this.deselectAll();

            e.target.indeterminate = false;
        };
        onRowSelectionChange(e) {
            const r = $(e.target).closest("tr"),
                item = this.Table.dataItem(r),
                id = this.Page.IdSelector(item);

            //Checkbox rules
            if (e.target.checked)
                this.select(id);
            else this.deselect(id);
        };
        onDataBound(e) {
            const t = this.getTableElement(),
                checks = t.find(`table > tbody > tr > td:nth-child(${this.CheckboxColumn}) > input[type=checkbox]`);

            for (let i = 0; i < checks.length; i++)
                $(checks[i]).on("change", this._onRowSelectionChange);

            this.update();

            for (const a in this.Actions)
                this.Actions[a].onDataBound(e);
        };
        onDataBinding(e) {
            this.clearRowEvents();

            for (const a in this.Actions)
                this.Actions[a].onDataBinding(e);
        };
        clearRowEvents(e) {
            const t = this.getTableElement(),
                checks = t.find(`table > tbody > tr > td:nth-child(${this.CheckboxColumn}) > input[type=checkbox]`);

            for (let i = 0; i < checks.length; i++)
                $(checks[i]).off("change", this._onRowSelectionChange);
        };
        initialize() {
            super.initialize();
            const e = this.getElement(),
                actions = e.find(".f-panel-actions"),
                close = e.find("button.f-panel-close"),
                t = this.getTableElement(),
                c = t.find(`th:nth-child(${this.CheckboxColumn}) > input[type=checkbox]`),
                coll = new finys.Collection();

            coll.sortedBy(i => i.Order);
            this.DOM.style.setProperty("--action-panel-height", this.Height);

            this._onHeaderSelectionChange = i => this.onHeaderSelectionChange(i);
            this._onRowSelectionChange = i => this.onRowSelectionChange(i);
            this._onDataBound = i => this.onDataBound(i);
            this._onDataBinding = i => this.onDataBinding(i);

            close.on("click", i => this.deselectAll());
            c.on("change", this._onHeaderSelectionChange);
            this.Table.bind("dataBound", this._onDataBound);
            this.Table.bind("dataBinding", this._onDataBinding);

            for (const a in this.Actions)
                coll.add(this.Actions[a]);
            coll.forEach(i => i.appendTo(e));

            this.HeaderCheckboxDOM = c[0];
            this.CounterDOM = e.find(".f-panel-counter")[0];
        };
        getSelection() {
            const v = [];

            for (const value of this.Page.Values)
                if (this.Selection.indexOf(this.Page.IdSelector(value)) !== -1)
                    v.push(value);

            return new finys.TableSelection({
                Count: this.getCount(),
                Values: v,
                Filters: this.Page.Filters,
                IdSelector: this.Page.IdSelector,
                DescriptionDelegate: this.DescriptionDelegate,
                ValueName: this.ValueName
            });
        };
        getTableElement() {
            return $(this.Table.element);
        };
        getHeaderCheckboxElement() {
            if (this.HeaderCheckboxDOM)
                return $(this.HeaderCheckboxDOM);
            return null;
        };
        getCounterElement() {
            if (this.CounterDOM)
                return $(this.CounterDOM);
            return null;
        };
        setCounter(value) {
            const text = finys.format.count(value);
            this.getCounterElement()
                .text(text);
        };
        hide() {
            this.removeClass("f-open");
        };
        show() {
            this.addClass("f-open");
        };
        preRender() {
            super.preRender();

            this.addClass("f-table-action-panel");
        };
        render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
                <div class="f-panel-counter"></div>
                <div class="f-panel-text">${this.ValueName.get(finys.format.DescriptionType.PLURAL | finys.format.DescriptionType.CAPITALIZED)} selected</div>
                <div class="f-panel-actions"></div>
                <button type="button" title="Close" class="f-panel-close">×</button>
            </div>`;
        };
        destroy() {
            const c = this.getHeaderCheckboxElement();

            this.clearRowEvents();
            c.off("change", this._onHeaderSelectionChange);
            this.Table.unbind("dataBound", this._onDataBound);
            this.Table.unbind("dataBinding", this._onDataBinding);

            for (const a in this.Actions)
                this.Actions[a].destroy();

            this.Controls = null;
            super.destroy();
        };

    }





    finys.SortOption = function (options) {
        options ||= {};

        this.Field = options.Field ?? options.field ?? null;
        this.Direction = options.Direction ?? options.direction ?? options.dir;

        if (typeof this.Direction === 'string'
            && this.Direction.length) {
            switch (this.Direction[0].toLowerCase()) {
                case 'a':
                    this.Direction = finys.SortOrder.ASCENDING;
                    break;
                case 'd':
                    this.Direction = finys.SortOrder.DESCENDING;
                    break;
                default:
            }
        }
    };



    finys.QueryOptions = class {
        constructor(options) {
            options ||= {};

            this.Skip = options.Skip ?? options.skip ?? 0;
            this.Take = options.Take ?? options.take ?? 15;
            this.Sort = [];

            if (options.Sort)
                for (const sort of options.Sort)
                    this.Sort.push(new finys.SortOption(sort));
            if (options.sort)
                for (const sort of options.sort)
                    this.Sort.push(new finys.SortOption(sort));
        };
        toString() {
            return kendo.stringify(this);
        };
    }


    finys.EnvironmentInfobox = class extends finys.Menu {
        constructor(options) {
            options ||= {};

            super(options);

            this.Environment = options.Environment;
            this.MachineName = options.MachineName;
        }


        renderContent() {
            return `<ul class="f-environment-details">
                <li class="f-environment-name">
                    <label class="f-environment-label">Environment</label>
                    <div class="f-environment-value">${this.Environment}</div>
                </li>
                    <li class="f-environment-machine">
                    <label class="f-environment-label">Machine Name</label>
                    <div class="f-environment-value">${this.MachineName}</div>
                </li>
            </ul>`;
        };
        preRender() {
            super.preRender();

            this.addClass("f-environment-infobox");
        };
    }





    finys.initSmartForm = function (options) {
        if (typeof options.Element == 'string')
            options.Element = $(options.Element);

        const result = new finys.SmartForm(options);
        result.initialize();

        return result;
    };




    finys.SmartFieldInfo = function (options) {
        this.Name = options.Name;
        this.IsIncluded = options.IsIncluded === true;
        this.IsReadonly = options.IsReadonly !== false;
        this.Index = options.Index ?? null;
    };




    finys.SmartPath = class {
        constructor(options) {
            options ||= {};

            this.Value = options.Value ?? null;
            this.Parts = options.Parts ?? [];
            this.Root = options.Root ?? null;
            this.Target = options.Target ?? null;
        };
        static parse(value) {
            const p = value.split('.');
            return new finys.SmartPath({
                Value: value,
                Parts: p,
                Root: p[0],
                Target: p[Math.max(0, p.length - 1)]
            });
        };
        print(nodes, delimiter) {
            delimiter ??= '.';
            nodes ??= this.Parts.length;

            const b = [],
                c = 0;
            if (nodes > 0)
                c = Math.min(nodes, this.Parts.length);
            else c = Math.max(this.Parts.length + nodes, 0);

            for (let i = 0; i < c; i++) {
                if (i > 0)
                    b.push(delimiter);
                b.push(this.Parts[i]);
            }
            return b.join('');
        };
        extend(prop) {
            const r = this.Value + `.${prop}`;
            return finys.SmartPath.parse(r);
        };
        equals(value) {
            return this.Value === value.Value;
        };
    }



    finys.SmartFormContext = class {
        constructor(options) {
            options ||= {};

            this.Guid = options.Guid;
            this.Config = options.Config ?? {};
            this.Name = options.Name;
            this.SmartPath = finys.SmartPath.parse(options.SmartPath);
            this.TriggersEnabled = options.TriggersEnabled !== false;
            this.Fields = [];
            this.Triggers = options.Triggers ?? [];

            if (options.Fields)
                for (const f of options.Fields)
                    this.Fields.push(new finys.SmartFieldInfo(f));
        };
        getField(name) {
            for (const f of this.Fields)
                if (f.Name == name)
                    return f;
            return null;
        };
        enableTriggers(value) {
            this.TriggersEnabled = value !== false;
        };
        hasField(name) {
            return !!this.getField(name);
        };
        hasTrigger(value) {
            const path = value.split('.'),
                field = path[path.length - 1];
            return this.TriggersEnabled
                && this.Triggers.indexOf(field) != -1;
        };
        traceField(path) {
            const p = path.split('.');

            if (p.length !== (this.SmartPath.Parts.length + 2))
                return null;

            for (let i = 0; i < this.SmartPath.Parts.length; i++)
                if (this.SmartPath.Parts[i] !== p[i + 1])
                    return null;

            return this.SmartPath.extend(p[p.length - 1]);
        };
    }



    finys.SmartControl = class extends finys.ObservableObject {
        constructor(element) {
            if (typeof element == 'string')
                element = $(element);

            super({
                DOM: element[0]
            });

            this.IsEnabled = false;
            this._IsRequired = false;
            this.IsRequired = false;
            this.IsFocused = false;
            this.Id = null;
            this.Role = null;
            this.KendoControl = null;
            this.HiddenMaskDisplay = false;

            this.initialize();
        };


        markInvalid() {
            const e = this.getElement();
            e.addClass('f-invalid');
        };
        markValid() {
            const e = this.getElement();
            e.removeClass('f-invalid');
        };
        enable(value) {
            if (finys.policy?.context.isReadOnly === true)
                return;

            const e = this.getElement();

            this.IsEnabled = value !== false;
            e.data("finysEditable", this.IsEnabled);

            if (this.KendoControl)
                this.KendoControl.enable(this.IsEnabled);
            else {
                if (this.IsEnabled) {
                    e.attr("disabled", null);
                    e.removeClass("k-disabled");
                }
                else {
                    e.attr("disabled", "disabled");
                    e.addClass("k-disabled");
                }
            }
        };
        require(value) {
            if (finys.policy?.context.isReadOnly === true)
                return;

            this.IsRequired = value !== false;

            const e = this.getElement(),
                i = this.getRequirednessElement();

            if (this.IsRequired) {
                e.attr("required", "required");
                i.addClass("requiredStyle");
            }
            else {
                e.attr("required", null);
                i.removeClass("requiredStyle");
            }
        };
        reset() {
            this.IsRequired = this._IsRequired;
            this.require(this.IsRequired);
        };
        onFocusIn(e) {
            this.IsFocused = true;
            this.trigger("focus-in", this, e);
        };
        onFocusOut(e) {
            this.IsFocused = false;
            this.trigger("focus-out", this, e);
        };
        getRequirednessElement() {
            const result = [];

            switch (this.Role) {
                case 'button':
                case "dropdownlist":
                case "multiselect":
                case "combobox":
                    break;
                default:
                    return this.getElement();
            }
            return $(result);
        };
        initialize() {
            const e = this.getElement();

            this.KendoControl = this.getKendoControl();

            this.Id = e.attr("id") ?? null;
            this.IsEnabled = !e.attr("disabled");
            this._IsRequired = !!e.attr("required");
            this.IsRequired = this._IsRequired;
            this.HiddenMaskDisplay = e.data('hiddenMaskDisplay') === true;

            e.data("finysSmartControl", this);
            e.data("finysEditable", this.IsEnabled);

            e.on("focusin", e => this.onFocusIn(e));
            e.on("focusout", e => this.onFocusOut(e));
        };
        getKendoControl() {
            const e = this.getElement();
            this.Role = e.attr("data-role") ?? e.attr("type");

            switch (this.Role) {
                case "maskedtextbox":
                    return e.data("kendoMaskedTextBox");
                case "datepicker":
                    return e.data("kendoDatePicker");
                case "numerictextbox":
                    return e.data("kendoNumericTextBox");
                case "dropdownlist":
                    return e.data("kendoDropDownList");
                case "multiselect":
                    return e.data("kendoMultiSelect");
                case "combobox":
                    return e.data("kendoComboBox");
            }
            return null;
        };
        destroy() {
            this.DOM = null;
            super.destroy();
        };
    }






    finys.SmartField = class extends finys.ObservableObject {
        constructor(options) {
            if (typeof options.Element == 'string')
                options.Element = $(options.Element);

            super({
                DOM: options.Element[0]
            });

            this.Parent = options.Parent;
            this.Field = options.Field;
            this.IsVisible = false;
            this.IsEnabled = false;
            this._IsRequired = false;
            this.IsRequired = false;
            this.IsFocused = false;
            this.Controls = new finys.Collection();
            this.HiddenMaskId = null;

            this.initialize();
        }


        markInvalid() {
            this.Controls.forEach(i => i.markInvalid());
        };
        markValid() {
            this.Controls.forEach(i => i.markValid());
        };
        get() {
            return this.Parent.get(this.Field);
        };
        set(value) {
            return this.Parent.set(this.Field, value);
        };
        updateHiddenMask() {
            if (this.HiddenMaskId)
                this.Parent.ViewModel[`${this.HiddenMaskId}_SetMaskedValue`]();
        };
        enable(value) {
            if (finys.policy?.context.isReadOnly === true)
                return;

            this.IsEnabled = value !== false;
            this.Controls.forEach(i => i.enable(this.IsEnabled));
            this.updateHiddenMask();
        };
        require(value) {
            if (finys.policy?.context.isReadOnly === true)
                return;

            this.IsRequired = value !== false;
            this.Controls.forEach(i => i.require(this.IsRequired));
        };
        reset() {
            this.IsRequired = this._IsRequired;
            this.Controls.forEach(i => i.reset());
        };
        onFocusIn(e) {
            this.IsFocused = true;
            this.trigger("focus-in", e);
        };
        onFocusOut(e) {
            this.IsFocused = false;
            this.trigger("focus-out", e);
        };
        findControls() {
            const e = this.getElement(),
                c = e.find("input");

            c.each((i, v) => {
                const s = new finys.SmartControl($(v));
                this.Controls.add(s);
                if (s.HiddenMaskDisplay)
                    this.HiddenMaskId = s.Id;
                s.on("focus-in", e => this.onFocusIn(e));
                s.on("focus-out", e => this.onFocusOut(e));
            });
        };
        hasValue() {
            const v = this.get();
            return v !== null
                && v !== undefined
                && v !== '';
        };
        isValid() {
            return !this.IsRequired
                || this.hasValue();
        };
        initialize() {
            const e = this.getElement();

            this.findControls();

            this.IsVisible = e.is(":visible");

            this.IsEnabled = !this.Controls.any(i => !i.IsEnabled);
            this._IsRequired = this.Controls.any(i => i._IsRequired);
            this.IsRequired = this._IsRequired;

            e.data("finysSmartField", this);
        };
        destroy() {
            this.DOM = null;
            this.Controls.forEach(i => i.destroy());
            this.Controls = null;
            super.destroy();
        };
    }




    finys.SmartForm = class extends finys.ObservableObject {
        constructor(options) {
            if (typeof options.Element == 'string')
                options.Element = $(options.Element);

            super({
                DOM: options.Element[0],
                Identity: options.Identity ?? "finysSmartForm"
            });

            this.Context = new finys.SmartFormContext(options.Context);
            this.ViewModel = options.ViewModel;
            this.ParentViewModel = options.ParentViewModel;
            this.Fields = new finys.Collection();
            this.AutofillEnabled = options.AutofillEnabled !== false;
            this.IsEnabled = options.IsEnabled !== false;
            this._IsRequired = options.IsRequired !== false;
            this.IsRequired = this._IsRequired;
            this.IsVisible = false;
            this.WaitRefresh = false;
            this.ChangesWaiter = new finys.Waiter();
            this.PendingChanges = [];
            this.Listeners = [];
            this.IsFocused = false;
            this._FocusCheck = null;
            this._PolicyWait = [];

            this.ChangesWaiter.on("begin-wait", () => this.onBeginWait());
            this.ChangesWaiter.on("end-wait", () => this.onEndWait());

            if (finys.policy?.context.isReadOnly === true)
                options.Element.addClass("f-inquire-mode");
            if (!this.IsEnabled)
                options.Element.addClass("f-disabled");
        }

        wait(timeout) {
            return this.ChangesWaiter.wait(timeout);
        };
        complete(id) {
            this.ChangesWaiter.complete(id);
        };
        isVisible() {
            return this.IsVisible;
        };
        enableTriggers(value) {
            this.Context.enableTriggers(value);
        };
        tryAddField(element) {
            const $e = $(element),
                s = $e.find("[smart-field]");

            if (!s.length)
                return;

            const n = s.attr("smart-field"),
                i = this.getField(n);

            if (!i) return;

            const f = new finys.SmartField({
                Parent: this,
                Field: i,
                Element: $e
            });
            f.on("focus-in", i => this.onFocusIn(f, i));
            f.on("focus-out", i => this.onFocusOut(f, i));
            this.Fields.add(f);
            if (f.IsVisible)
                this.IsVisible = true;
        };
        getSequence() {
            return this.get("Sequence");
        };
        initialize() {
            super.initialize();

            const e = this.getElement(),
                val = window['validationObject'],
                i = new finys.Event("initialized"),
                c = e.children(".fb-child");

            c.each((i, e) => this.tryAddField(e));

            this.ViewModel.bind("change", i => this.onChange(i));

            if (val?.SmartPath == this.Context.SmartPath.Value
                && this.hasField(val.FieldName)) {
                const controls = getControlsByDataBind_Property(this.getSmartPath(val.FieldName));
                if (controls?.length > 0) {
                    setFocusElement(controls);
                    window['validationObject'] = null;
                }
            }
            this.trigger(i);
        };
        onBeginWait() {
            if (finys.policy)
                this._PolicyWait.push(finys.policy.context.wait());
        };
        onEndWait() {
            this.triggerChanges();
            if (!finys.policy) return;
            for (var i = 0; i < this._PolicyWait.length; i++)
                finys.policy.context.complete(this._PolicyWait[i]);
        };
        hasListener(field) {
            for (const l of this.Listeners)
                if (l.equals(field))
                    return true;
            return false;
        };
        listen(field) {
            const p = finys.SmartPath.parse(field);
            if (!this.hasListener(field))
                this.Listeners.push(p);
        };
        hasPending(field) {
            for (const p of this.PendingChanges)
                if (p.equals(field))
                    return true;
            return false;
        };
        pushPending(field) {
            if (!this.hasPending(field))
                this.PendingChanges.push(field);
        };
        triggerChanges(field) {
            if (field)
                this.pushPending(field);
            if (this.PendingChanges.length) {
                this.trigger("change", this.PendingChanges);
                this.PendingChanges = [];
            }
        };
        traceField(path) {
            let result = this.Context.traceField(path);
            if (result)
                return result;
            for (const l of this.Listeners)
                if (path === `dc.${l.Value}`)
                    return l;
            return null;
        };
        onChange(options) {
            const field = this.traceField(options.field);
            if (field) {
                if (this.ChangesWaiter.isWaiting())
                    this.pushPending(field);
                else this.triggerChanges(field);
            }
        };
        smartRefresh(options) {
            this.WaitRefresh = false;
            if (options.field && document.activeElement != document.body)
                document.activeElement.blur();
            window['controlSelectionField'] = options.field;
            finys.policy?.context.refreshScreen();
            this.destroy();
        };
        isValid() {
            return !this.Fields.any(i => !i.isValid());
        };
        anyEnteredValue() {
            return this.Fields.any(i => i.IsVisible && i.hasValue());
        };
        getSmartField(name) {
            return this.Fields.first(i => i.Field.Name == name);
        };
        getSmartPath(name) {
            return `dc.${this.Context.SmartPath.Value}.${name}`;
        };
        getField(name) {
            return this.Context.getField(name);
        };
        hasField(name) {
            return this.Context.hasField(name);
        };
        get(field) {
            if (typeof field == 'string')
                return this.get(this.getField(field));

            if (!field)
                return undefined;

            return this.ViewModel.get(this.getSmartPath(field.Name));
        };
        set(field, value) {
            if (typeof field == 'string')
                return this.set(this.getField(field), value);

            if (!field || field.IsReadonly)
                return false;

            const val = this.get(field.Name);
            if (val !== value) {
                this.ViewModel.set(this.getSmartPath(field.Name), value);
                return true;
            }
            return false;
        };
        merge(field, value) {
            if (typeof field == 'string')
                return this.merge(this.getField(field), value);

            if (value === null || value === undefined) {
                const val = this.get(field.Name);
                if (val === null || val === undefined)
                    return finys.MergeResult.SKIPPED;
                return finys.MergeResult.KEEP_TARGET;
            }
            if (this.set(field, value))
                return finys.MergeResult.KEEP_SOURCE;
            return finys.MergeResult.SKIPPED;
        };
        clear(...fields) {
            const w = this.wait();
            let result = false;
            for (const f of this.getFields(...fields))
                if (this.set(f, null))
                    result = true;
            this.complete(w);
            return result;
        };
        * getFields(...fields) {
            for (const f of this.Context.Fields)
                if (!fields.length
                    || fields.indexOf(f.Name) != -1)
                    yield f;
        };
        * getSmartFields(...fields) {
            for (const f of this.Fields.Values)
                if (!fields.length
                    || fields.indexOf(f.Field.Name) != -1)
                    yield f;
        };
        enable(value, ...mask) {
            if (finys.policy?.context.isReadOnly === true)
                return;

            if (typeof value === 'string')
                return this.enable(true, value, ...mask);

            const e = value !== false;

            if (mask.length)
                this.IsEnabled = this.IsEnabled || e;
            else this.IsEnabled = e;

            for (const f of this.getSmartFields(...mask))
                f.enable(e);
        };
        require(value, ...mask) {
            if (finys.policy?.context.isReadOnly === true)
                return;

            if (typeof value === 'string')
                return this.require(true, value, ...mask);

            const e = value !== false;

            if (mask.length)
                this.IsRequired = this._IsRequired;
            else this.IsRequired = e;

            for (const f of this.getSmartFields(...mask))
                f.require(e);
        };
        reset() {
            this.IsRequired = this._IsRequired;
            this.Fields.forEach(i => i.reset());
        };
        onFocusIn(field, e) {
            this.trigger("field-focus-in", field, e);

            const v = this.IsFocused;
            this._FocusCheck = null;
            this.IsFocused = true;
            if (!v) this.trigger("focus-in", field, e);
        };

        onFocusOut(field, e) {
            this.trigger("field-focus-out", field, e);

            const v = this.IsFocused;
            const c = Symbol();
            this._FocusCheck = c;
            setTimeout(() => {
                if (this._FocusCheck === c) {
                    this.IsFocused = false;
                    if (v) this.trigger("focus-out", field, e);
                }
            }, 100);
        };
        destroy() {
            this.DOM = null;
            this.ChangesWaiter.destroy();
            this.Fields.forEach(i => i.destroy());
            this.Fields.clear();
            super.destroy();
        };
    }

    finys.getQuadrant = function (coords) {
        const s = $(window),
            w = s.width() / 2,
            h = s.height() / 2;

        if (coords.x < w) {
            if (coords.y < h)
                return finys.Quadrant.TOP_LEFT;
            return finys.Quadrant.BOTTOM_LEFT;
        }
        if (coords.y < h)
            return finys.Quadrant.TOP_RIGHT;
        return finys.Quadrant.BOTTOM_RIGHT;
    };

    finys.toClipboard = function (value) {
        navigator.clipboard.writeText(value);
    };

    finys.merge = function (target, source) {
        for (const prop in source) {
            const valSource = source[prop],
                valTarget = target[prop];

            if (valSource === undefined
                || prop === "_events"
                || prop === "__proto__")
                continue;

            if (!valSource
                || valTarget === undefined
                || valTarget === null) {
                target[prop] = valSource;
                continue;
            }

            switch (typeof valSource) {
                case "function":
                    continue;
                case "object":
                    finys.merge(valTarget, valSource);
                    break;
                default:
                    target[prop] = valSource;
                    break;
            }
        }

        return target;
    };

    finys.concat = function (...obj) {
        const result = {};

        for (const o of obj)
            if (o) finys.merge(result, o);

        return result;
    };

    // strip an object of all fields which cannot be picked up by an ajax action
    finys.cleanParams = function (obj) {
        const result = {};

        for (const param in obj) {
            const val = obj[param];

            if (val === undefined
                || val === null
                || param === "_events"
                || param === "__proto__"
                || param === "uid")
                continue;

            switch (typeof val) {
                case "function":
                    continue;
                case "object":
                    if (val instanceof jQuery
                        || val instanceof HTMLElement)
                        continue;
                    result[param] = finys.cleanParams(val);
                    break;
                default:
                    result[param] = val;
                    break;
            }
        }
        return result;
    };

    finys.formAppend = function (formData, obj, name) {
        const clean = finys.cleanParams(obj);

        for (const param in clean) {
            const val = clean[param];
            if (name)
                formData.append(
                    `${name}.${param}`,
                    val);
            else formData.append(param, val);
        }
    };


}

{
    // math namespace
    const math = finys.math ||= {};

    math.roundToDecimals = function (value, decimals) {
        const v = Math.pow(10, decimals);
        return Math.round(value * v) / v;
    };

    math.msbEqual = function (left, right) {
        return (left ^ right) <= (left & right);
    };

    math.msbLessThan = function (left, right) {
        return left < right
            && left < (left ^ right);
    };

    math.msbLessThanOrEqual = function (left, right) {
        return left < right
            || (left ^ right) <= (left & right);
    };

    math.clamp = function (number, min, max) {
        return Math.max(min, Math.min(number, max));
    };
}

{
    //forms namespace
    const forms = finys.forms ||= {};

    forms.SourceBind = class {
        constructor(options) {
            if (typeof options === 'string')
                options = { Field: options };

            this.Table = options.Table || null;
            this.Field = options.Field;
        }

        render() {
            if (this.Table)
                return `dc.${this.Table}.${this.Field}`;
            return this.Field;
        }

    }




    forms.EventOptions = class {
        constructor(options) {
            this.Events = Object.entries(options);
        }
        applyOptions(bind) {
            let value = "{ ";

            for (let i = 0; i < this.Events.length; i++) {
                const cur = this.Events[i];
                if (i > 0)
                    value += ", "
                value += `${cur[0]}: ${cur[1]}`;
            }
            value += " }";

            bind.add(new finys.forms.Parameter("events", value));
        }
    }


    forms.Control = class extends finys.ScreenObject {
        constructor(options) {
            super(options);

            if (options.Type)
                options.Type = options.Type.toLowerCase();

            if (options.Events
                && !(options.Events instanceof forms.EventOptions))
                options.Events = new forms.EventOptions(options.Events);

            if (options.SourceBind
                && !(options.SourceBind instanceof forms.SourceBind))
                options.SourceBind = new forms.SourceBind(options.SourceBind);

            this.Id = options.Id || null;
            this.Type = options.Type || null;
            this.Label = options.Label || "";
            this.AutomationId = options.AutomationId ?? options.Id ?? null;
            this._IsRequired = options.IsRequired === true;
            this.IsRequired = this._IsRequired;
            this.IsEnabled = options.IsEnabled !== false;
            this.MaxLength = options.MaxLength || null;
            this.Mask = options.Mask || null;
            this.UnmaskOnPost = options.UnmaskOnPost !== false;
            this.Value = options.Value || null;
            this.Id = options.Id || null;
            this.Width = options.Width || null;
            this.AutofillId = options.AutofillId || null;
            this.Events = options.Events;
            this.SourceBind = options.SourceBind;
            this.KendoControl = null;
            this.ControlDOM = null;
            this._AutofillIdSet = false;
        }

        getKendoControl() {
            if (!this.KendoControl) {
                const i = this.getControl();

                switch (this.Type) {
                    case "int":
                    case "int32":
                    case "money":
                    case "decimal":
                        this.KendoControl = i.data("kendoNumericTextBox");
                        break;
                    case "datetime":
                        this.KendoControl = i.data("kendoDatePicker");
                        break;
                    case "varchar":
                    case "string":
                        if (this.Mask)
                            this.KendoControl = i.data("kendoMaskedTextBox");
                        break;
                }
            }
            return this.KendoControl;
        };
        enable(value) {
            if (finys.policy?.context.isReadOnly === true)
                return;

            const e = value !== false;

            if (this.IsEnabled == e)
                return;

            this.IsEnabled = e;

            if (!this.DOM)
                return;

            const k = this.getKendoControl();
            if (k) {
                k.enable(this.IsEnabled);
                return;
            }

            const i = this.getControl();

            if (!this.IsEnabled) {
                i.prop("disabled", true);
                i.addClass("k-disabled");
            }
            else {
                i.prop("disabled", false);
                i.removeClass("k-disabled");
            }
        };
        require(value) {
            if (finys.policy?.context.isReadOnly === true)
                return false;

            const e = value !== false;

            if (this.IsRequired == e)
                return false;

            this.IsRequired = e;

            if (!this.DOM)
                return true;

            const i = this.getControl();

            if (!e) {
                i.removeClass("requiredStyle");
                i.attr("required", null);
            }
            else {
                i.addClass("requiredStyle");
                i.attr("required", "");
            }
            return true;
        };
        render() {
            this.preRender();

            if (this.Type == "button")
                return `<div class='fb-child'>${this.renderControl()}</div>`;

            return `<div class='fb-child'>${this.renderLabel()}${this.renderControl()}</div>`;
        };
        renderLabel() {
            if (this.Label) {
                if (this.Id)
                    return `<label class='fb-label' for='${this.Id}'><b>${this.Label}</b></label>`;
                return `<label class='fb-label'><b>${this.Label}</b></label>`;
            }
            return "";
        };
        renderControl() {
            switch (this.Type) {
                default: return `<input ${this.renderAttributes()}>`;
            }
        };
        markInvalid() {
            const i = this.getControl();
            i.addClass('f-invalid');
        };
        markValid() {
            const i = this.getControl();
            i.removeClass('f-invalid');
        };
        * validate() {
            if (this.IsRequired
                && !this.getValue()) {
                yield new finys.Validation({
                    Field: this,
                    Type: finys.ValidationType.NO_VALUE,
                    Message: `${this.Label} is required`
                });
            }
        };
        bind(attr) {
            if (this.SourceBind)
                attr.add(new finys.forms.Parameter("value", this.SourceBind.render()));

            if (this.Events)
                this.Events.applyOptions(attr);
        };
        preRender() {
            super.preRender();

            const b = this.addAttribute(new finys.ParamAttribute('data-bind'));

            this.addClass("fb-input");

            this.bind(b);

            if (this.Id)
                this.addAttribute("id", this.Id);

            if (this.AutomationId)
                this.addAttribute("data-automation-id", this.AutomationId);

            if (this.Width)
                this.style("width", this.Width);

            if (finys.policy?.context.isReadOnly !== true
                && this.IsRequired) {
                this.addClass("requiredStyle");
                this.addAttribute("required");
            }

            if (finys.policy?.context.isReadOnly === true
                || !this.IsEnabled)
                this.addAttribute("disabled", "disabled");

            if (this.MaxLength && this.MaxLength < 1000)
                this.addAttribute("maxlength", this.MaxLength);

            if (this.Value)
                this.addAttribute("value", this.Value);

            if (this.AutofillId)
                this.addAttribute("autocomplete", this.AutofillId);

            switch (this.Type) {
                case "int":
                case "int32":
                    this.addAttribute("data-role", "numerictextbox");
                    this.addAttribute("data-format", "n0");
                    break;
                case "datetime":
                    this.addAttribute("data-role", "datepicker");
                    break;
                case "money":
                    this.addAttribute("data-role", "numerictextbox");
                    this.addAttribute("data-format", "c");
                    break;
                case "decimal":
                    this.addAttribute("data-role", "numerictextbox");
                    this.addAttribute("data-format", "n");
                    break;
                case "varchar":
                case "string":
                    if (this.Mask) {
                        this.addAttribute("data-role", "maskedtextbox");
                        this.addAttribute("data-mask", this.Mask);
                        this.addAttribute("data-unmask-on-post", this.UnmaskOnPost.toString());
                        this.addAttribute("data-clear-prompt-char", "true");
                    }
                    else this.addClass("k-textbox kendoText k-input-solid k-input-md k-rounded-md k-valid k-input");
                    break;
                case "button":
                    this.addAttribute("type", "button");
                    this.addAttribute("role", "button");
                    this.addAttribute("data-role", "button");
                    break;
            }
        };
        initialize() {
            super.initialize();

            this.setElements();
            const c = this.getControl();
            c.on("change", i => this.onChange(i));
        };
        setElements() {
            const c = this.getElement()
                .find(`input[data-uid=${this.Uid}]`);

            this.ControlDOM = c[0];
        };
        onChange(e) {
            const k = this.getKendoControl();
            if (this.Mask && this.AutofillId && k) {
                if (!this._AutofillIdSet) {
                    const c = this.getControl();
                    c.attr("autocomplete", this.AutofillId);
                }
                k.trigger("change");
            }
        };
        getValue() {
            const i = this.getControl();

            let val = null;

            if (this.Value)
                val = i.attr("value");
            else if (this.Mask)
                val = this.getKendoControl()
                    .value()
                    .trimEnd();
            else val = i.val();

            return val;
        };
        getControl() {
            return $(this.ControlDOM);
        };
        getControlBounds() {
            return finys.getBounds(
                this.getControl());
        };
        withinControl(coords) {
            return this.getControlBounds()
                .contains(coords);
        };
        isAutofilled() {
            return finys.isAutofilled(
                this.getControl());
        };

    }




    forms.TextAreaControl = class extends forms.Control {
        constructor(options) {
            options.Type ||= "string";
            super(options);

            this.Rows = options.Rows ?? null;
            this.Columns = options.Columns ?? null;
        }


        renderControl() {
            return `<textarea ${this.renderAttributes()}></textarea>`;
        };
        setElements() {
            const c = this.getElement()
                .find(`textarea[data-uid=${this.Uid}]`);

            this.ControlDOM = c[0];
        };
        preRender() {
            super.preRender();

            if (this.Rows)
                this.addAttribute("rows", this.Rows.toString());
            if (this.Columns)
                this.addAttribute("cols", this.Columns.toString());
        };
        getValue() {
            const i = this.getControl();
            return i.val();
        };
    }




    forms.DecimalControl = class extends forms.Control {
        constructor(options) {
            options.Type ||= "decimal";
            super(options);

            this.MinValue = options.MinValue ?? null;
            this.MaxValue = options.MaxValue ?? null;
            this.Decimals = options.Decimals ?? null;
            this.Spinners = options.Spinners !== false;
        }
        preRender() {
            super.preRender();

            this.addAttribute("data-format", this.getFormat());
            if (this.Decimals !== null)
                this.addAttribute("data-decimals", this.Decimals);
            if (this.MinValue !== null)
                this.addAttribute("data-min", this.MinValue);
            if (this.MaxValue !== null)
                this.addAttribute("data-max", this.MaxValue);
            if (!this.Spinners)
                this.addAttribute("data-spinners", "false");
        };
        getFormat() {
            if (this.Decimals !== null)
                return `n${this.Decimals}`;
            return "n";
        };
    }






    forms.DropDownControl = class extends forms.Control {
        constructor(options) {
            super(options);

            this.Source = options.Source ?? null;
            this.ValuePrimitive = options.ValuePrimitive !== false;
            this.OptionLabel = options.OptionLabel || "Select...";
            this.TextField = options.TextField || "Text";
            this.ValueField = options.ValueField || "Value";
            this.AutoBind = options.AutoBind === true;
            this.Filter = options.Filter || null;
            this.FromAutofill = options.FromAutofill ?? null;
            this.ToAutofill = options.ToAutofill ?? null;
            this.Options = [];
            this.HiddenControlDOM = null;
            this.RequirednessDOM = null;

            if (options.Options)
                for (const option of options.Options)
                    this.Options.push(new forms.SelectOption(option));
        };

        getKendoControl() {
            if (!this.KendoControl) {
                const i = this.getControl();
                this.KendoControl = i.data("kendoDropDownList");
            }
            return this.KendoControl;
        };

        require(value) {

            const r = super.require(value);
            if (!r || !this.DOM)
                return r;

            const j = this.getElement(),
                k = j.find("span.k-widget"),
                w = k.find(".k-dropdown-wrap > .k-input");

            if (!this.IsRequired) {
                k.removeClass("requiredStyle");
                w.removeClass("requiredStyle");
            }
            else {
                k.addClass("requiredStyle");
                w.addClass("requiredStyle");
            }
            return true;
        }


        markInvalid() {
            const i = this.getRequirednessElement();
            i.addClass('f-invalid');
        }
        markValid() {
            const i = this.getRequirednessElement();
            i.removeClass('f-invalid');
        }
        bind(attr) {
            super.bind(attr);

            if (this.Source)
                attr.add(new finys.forms.Parameter("source", this.Source));
        }
        renderOptions() {
            const result = [];
            for (const option of this.Options)
                result.push(option.render());
            return result.join('');
        };
        renderControl() {
            return `<select ${this.renderAttributes()}>
                ${this.renderOptions()}
            </select>`;
        };
        renderHiddenControl() {
            return `<input class="f-hidden-control" tabindex="-1" autocomplete="${this.AutofillId || "off"}">`;
        };
        render() {
            this.preRender();
            return `<div class='fb-child'>${this.renderLabel()}${this.renderHiddenControl()}${this.renderControl()}</div>`;
        };
        getHiddenControl() {
            return $(this.HiddenControlDOM);
        };
        getRequirednessElement() {
            return $(this.RequirednessDOM);
        };
        initialize() {
            super.initialize();
            const h = this.getHiddenControl();
            h.on("change", i => this.onHiddenControlChange(i));
        };
        setElements() {
            const e = this.getElement(),
                c = e.find(`select[data-uid=${this.Uid}]`),
                h = e.find("input.f-hidden-control"),
                r = e.find("span.k-dropdown-wrap");

            this.ControlDOM = c[0];
            this.HiddenControlDOM = h[0];
            this.RequirednessDOM = r[0];
        };
        onChange(e) {
            this.getHiddenControl().val(this.toAutofillValue(e.target.value));
        };
        onHiddenControlChange(e) {
            const k = this.getKendoControl();
            if (!k)
                return;
            k.refresh();
            k.value(this.fromAutofillValue(e.target.value));
            k.trigger("change");
        };
        fromAutofillValue(value) {
            if (this.FromAutofill)
                return this.FromAutofill(value);
            return value;
        }
        toAutofillValue(value) {
            if (this.ToAutofill)
                return this.ToAutofill(value);
            return value;
        }
        preRender() {
            super.preRender();

            if (finys.policy?.context.isReadOnly === true) {
                this.removeAttribute("disabled");
                this.removeClass("k-disabled");
            }
            else this.addAttribute("data-option-label", this.OptionLabel);

            if (this.Filter
                && finys.policy?.context.isReadOnly !== true)
                this.addAttribute("data-filter", this.Filter);

            this.addAttribute("data-role", "dropdownlist");
            this.addAttribute("data-value-primitive", this.ValuePrimitive);
            this.addAttribute("data-text-field", this.TextField);
            this.addAttribute("data-value-field", this.ValueField);
            this.addAttribute("data-auto-bind", this.AutoBind);
        }

    }


    forms.MultiSelectControl = class extends forms.DropDownControl {
        constructor(options) {
            super(options);

            this.Placeholder = options.Placeholder || "Select...";
            this.ClearButton = options.ClearButton === true;
        }


        getKendoControl() {
            if (!this.KendoControl) {
                const i = this.getControl();
                this.KendoControl = i.data("kendoMultiSelect");
            }
            return this.KendoControl;
        };
        require(value) {
            const r = super.require(value);
            if (!r || !this.DOM)
                return r;

            const j = this.getElement(),
                k = j.find(".k-widget.k-multiselect");

            if (!this.IsRequired)
                k.removeClass("requiredStyle");
            else
                k.addClass("requiredStyle");
            return true;
        };
        setElements() {
            const e = this.getElement(),
                c = e.find(`select[data-uid=${this.Uid}]`),
                h = e.find("input.f-hidden-control"),
                r = e.find(".k-widget.k-multiselect");

            this.ControlDOM = c[0];
            this.HiddenControlDOM = h[0];
            this.RequirednessDOM = r[0];
        };
        preRender() {
            super.preRender();

            if (finys.policy?.context.isReadOnly === true) {
                this.removeAttribute("disabled");
                this.removeClass("k-disabled");
            }
            else {
                this.addAttribute("data-placeholder", this.Placeholder);
                this.addAttribute("data-clear-button", this.ClearButton);
            }

            if (this.Filter
                && finys.policy?.context.isReadOnly !== true)
                this.addAttribute("data-filter", this.Filter);

            this.addAttribute("data-role", "multiselect");
            this.addAttribute("data-value-primitive", this.ValuePrimitive);
            this.addAttribute("data-text-field", this.TextField);
            this.addAttribute("data-value-field", this.ValueField);
            this.addAttribute("data-auto-bind", this.AutoBind);
        };

    }




    forms.ComboBoxControl = class extends forms.DropDownControl {
        constructor(options) {
            super(options);
            this.Placeholder = options.Placeholder || "Select...";
        }


        getKendoControl() {
            if (!this.KendoControl) {
                const i = this.getControl();
                this.KendoControl = i.data("kendoComboBox");
            }
            return this.KendoControl;
        };
        require(value) {
            const r = super.require(value);
            if (!r || !this.DOM)
                return r;

            const j = this.getElement(),
                k = j.find("span.k-widget.k-combobox");

            if (!this.IsRequired)
                k.removeClass("requiredStyle");
            else
                k.addClass("requiredStyle");
            return true;
        };
        setElements() {
            const e = this.getElement(),
                c = e.find(`select[data-uid=${this.Uid}]`),
                h = e.find("input.f-hidden-control"),
                r = e.find("span.k-widget.k-combobox");

            this.ControlDOM = c[0];
            this.HiddenControlDOM = h[0];
            this.RequirednessDOM = r[0];
        };
        preRender() {
            super.preRender();

            if (finys.policy?.context.isReadOnly === true) {
                this.removeAttribute("disabled");
                this.removeClass("k-disabled");
            }
            else this.addAttribute("data-placeholder", this.Placeholder);

            if (this.Filter
                && finys.policy?.context.isReadOnly !== true)
                this.addAttribute("data-filter", this.Filter);

            this.addAttribute("data-role", "combobox");
            this.addAttribute("data-value-primitive", this.ValuePrimitive);
            this.addAttribute("data-text-field", this.TextField);
            this.addAttribute("data-value-field", this.ValueField);
            this.addAttribute("data-auto-bind", this.AutoBind);
        };


    }



    forms.SelectOption = class {
        constructor(options) {
            this.Value = options.Value;
            this.Text = options.Text;
        }
        render() {
            return `<option value="${this.Value}">${this.Text}</option>`;
        }
    }



    forms.Parameter = class {
        constructor(key, value) {
            this.Key = key;
            this.Value = value;
        };
        render() {
            const val = this.renderValue();
            if (val)
                return `${this.Key}: ${val}`;
            else return this.Key;
        };
        renderValue() {
            return this.Value;
        }
    }


    forms.Link = class extends finys.ScreenObject {
        constructor(options) {
            super(options);

            this.Text = options.Text;
            this.Parent = options.Parent || null;
            this.Comment = options.Comment || null;
            this.OnClick = null;
            this.Event = options.Event || null;
            this.Events = options.Events || [];
            this.Class = options.Class || null;

            switch (typeof options.OnClick) {
                case 'function':
                    this.Events.push(options.OnClick);
                    break;
                case 'string':
                    this.OnClick = options.OnClick;
                    break;
            }

            // options.Click deprecated
            switch (typeof options.Click) {
                case 'function':
                    this.Events.push(options.Click);
                    break;
                case 'string':
                    this.OnClick = options.Click;
                    break;
            }
        };

        addEvent(handler) {
            this.Events.push(handler);
        };
        removeEvent(handler) {
            const i = this.Events.indexOf(handler);

            if (i != -1)
                this.Events.splice(i, 1);
        };
        preRender() {
            super.preRender();

            if (this.Class)
                this.addClass(this.Class);

            if (!this.getAttribute("href"))
                this.addAttribute('href', '#');

            if (this.Comment)
                this.addAttribute("title", this.Comment);

            if (this.OnClick)
                this.addAttribute("onclick", `${this.OnClick};return false;`);

            this.addAttribute('text', this.Text);
        };
        render() {
            this.preRender();
            return `<a ${this.renderAttributes()}>${this.Text}</a>`;
        };
        initialize() {
            super.initialize();

            const a = this.getElement();
            a.on('click', e => this.onClick(e));
        };
        onClick(e) {
            const a = this.getElement();

            if (this.Event) {
                if (typeof this.Event == "string")
                    a.trigger(this.Event, this.Parent);

                else a.trigger(this.Event);
            }

            for (let i = 0; i < this.Events.length; i++)
                this.Events[i](e, this.Parent);

            e.preventDefault();
        };
    }

    forms.Button = class extends forms.Link {
        constructor(options) {
            super(options);

            this.Type = options.Type || 0;
        }


        preRender() {
            super.preRender();

            this.addAttribute('type', 'button');
            this.addAttribute('data-role', 'button');
            this.addClass("k-button");

            switch (this.Type) {
                case finys.Theme.NEUTRAL: this.addClass('f-neutral');
                    break;
                case finys.Theme.PRIMARY: this.addClass('k-primary f-primary');
                    break;
                case finys.Theme.SECONDARY: this.addClass('f-secondary');
                    break;
                case finys.Theme.SUCCESS: this.addClass('f-success');
                    break;
                case finys.Theme.WARNING: this.addClass('f-warning');
                    break;
                case finys.Theme.INFO: this.addClass('f-info');
                    break;
                case finys.Theme.DANGER: this.addClass('f-danger');
                    break;
            }

            if (typeof this.OnClick == 'string')
                this.addAttribute("onclick", `${this.OnClick};return false;`);
        };
        render() {
            this.preRender();
            return `<button ${this.renderAttributes()}>${this.Text}</button>`;
        }
    }

    forms.LinkItem = class extends finys.ScreenObject {
        constructor(options) {
            this.Link = new forms.Link(options);

            super(this, {
                Uid: this.Link.Uid
            });
        };


        initialize() {
            super.initialize();

            this.Link.appendTo(this.getElement());
        };
        preRender() {
            super.preRender();

            this.addClass("f-link");
        };
        render() {
            this.preRender();

            return `<li ${this.renderAttributes()}></li>`;
        };
        destroy() {
            this.Link.destroy();

            super.destroy();
        }
    }



    forms.InlineText = class extends finys.ScreenObject {
        constructor(options) {
            if (typeof options == 'string')
                options = { Value: options };

            super(options);

            this.Value = options.Value || "";
        };


        render() {
            this.preRender();
            return `<span ${this.renderAttributes()}>${this.Value}</span>`;
        }
    }

}


finys.CheckedMap = class {
    checked = new Map()

    selectedKeys() {
        return [...this.checked.keys()];
    }

    selectedValues() {
        return [...this.checked.values()];
    }

    check(id, item) {
        this.checked.set(id, item);
    }

    uncheck(id) {
        this.checked.delete(id);
    }

    uncheckAll() {
        this.checked.clear();
    }
}

finys.CheckedGridMap = class extends finys.CheckedMap {
    checkRow = e => {
        const row = $(e.target).closest('tr');
        const dataItem = $(`#${this.gridId}`).data('kendoGrid').dataItem(row);
        if (e.target.checked) {
            this.check(dataItem.Id, dataItem);
        } else {
            this.uncheck(dataItem.Id);
        }
    }

    constructor(gridId) {
        super();
        this.gridId = gridId;
    }

}

kendo.ui.Grid.prototype.finysActionPanel = function (options) {
    options ||= {};
    options.Table = this;
    const result = new finys.TableActionPanel(options);
    result.appendTo(result.getTableElement());
    return result;
}

kendo.data.binders.widget.commaseparatedvalue = kendo.data.Binder.extend({
    init: function (widget, bindings, options) {
        kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options);
        this.widget = widget;
        this._change = $.proxy(this.change, this);
        this.widget.bind("change", this._change);
    },
    refresh: function () {
        const value = this.bindings.commaseparatedvalue.get(),
            values = value ? value.split(",") : [];

        this.widget.value(values);
    },
    change: function () {
        const value = this.widget.value();
        this.bindings.commaseparatedvalue.set(value.join(","));
    },
    destroy: function () {
        this.widget.unbind("change", this._change);
    }
});

jQuery.fn.extend({
    finysSmartForm: function (options) {
        options.Element = this;
        return finys.initSmartForm(options);
    }
});
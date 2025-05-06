// finys namespace
var finys = window.finys ||= {};

{
    // http namespace
    const http = finys.http ||= {};


    http.ParameterCollection = class extends finys.Collection {
        constructor(values) {
            values ||= [];
            super(values);
        };


        spread(value) {
            for (const i in value) {
                const v = value[i];
                if (v) this.add(i, v);
            }
        };
        add(key, value) {
            super.add(new http.Parameter(key, value));
        };
        toString() {
            return finys.format.smartJoin("&", ...this.Values);
        };
    }

    http.Parameter = class {
        constructor(key, value) {
            this.Key = key;
            this.Value = value;
        };
        toString() {
            return `${this.Key}=${encodeURIComponent(this.Value)}`;
        };
    }

    http.Url = class {
        constructor(options) {
            options ||= {};

            this.Route = options.Route;
            this.Parameters = new http.ParameterCollection(options.Parameters);
            this.Type = options.Type;
            this.Async = options.Async;
            this.Container = options.Container;
            this.Data = options.Data;
            this.DataType = options.DataType;
            this.Success = options.Success;
            this.Error = options.Error;
            this.ContentType = options.ContentType;
            this.IsPassive = options.IsPassive;
            this.Shield = options.Shield;
            this.Headers = options.Headers;
        };

        toString() {
            if (this.Parameters.count() > 0)
                return `${this.Route}?${this.Parameters}`;
            return this.Route;
        };
        addParams(value) {
            this.Parameters.spread(value);
        };
        addParam(key, value) {
            this.Parameters.add(key, value);
        };
        getOptions(options) {
            const a = finys.concat(this, options);
            a.Url = this.toString();
            return a;
        };
        execute(options) {
            return finys.ajax(
                this.getOptions(options));
        };
        ajax(options) {
            return finys.ajax(
                this.getOptions(options));
        };
        post(options) {
            const a = this.getOptions(options);
            a.Type = 'POST';
            return finys.ajax(a);
        };
        get(options) {
            const a = this.getOptions(options);
            a.Type = 'GET';
            return finys.ajax(a);
        };
        put(options) {
            const a = this.getOptions(options);
            a.Type = 'PUT';
            return finys.ajax(a);
        };
        patch(options) {
            const a = this.getOptions(options);
            a.Type = 'PATCH';
            return finys.ajax(a);
        };
        delete(options) {
            const a = this.getOptions(options);
            a.Type = 'DELETE';
            return finys.ajax(a);
        };
    }
}
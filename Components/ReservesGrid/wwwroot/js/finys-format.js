/**
    * Fast UUID generator, RFC4122 version 4 compliant.
    * @author Jeff Ward (jcward.com).
    * @license MIT license
    * @link http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
**/
var UUID = (function () {
    const self = {};
    const lut = []; for (let i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
    self.generate = function () {
        const d0 = Math.random() * 0xffffffff | 0,
            d1 = Math.random() * 0xffffffff | 0,
            d2 = Math.random() * 0xffffffff | 0,
            d3 = Math.random() * 0xffffffff | 0;
        return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
            lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
            lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
            lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
    }
    return self;
})();

// finys namespace
var finys = window.finys ||= {};

finys.inherits = function (child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
};

{
    // format namespace
    const format = finys.format ||= {};

    // constants //

    format.NOT_ON_FILE = "Not on file";

    format.DescriptionType = {
        PLURAL: 1,
        CAPITALIZED: 2
    };

    format.TimeUnit = {
        SECOND: 1,
        MINUTE: 2,
        HOUR: 3,
        DAY: 4,
        MONTH: 5,
        YEAR: 6
    };

    ///////////////

    
    format.smartJoin = function (separator, ...items) {
        let r = "";

        for (const i of items) {
            if (i === null
                || i === undefined)
                continue;
            if (r.length)
                r += separator;
            r += i.toString();
        }

        return r;
    };

    format.stringify = function (obj) {
        return JSON.stringify(obj)
            .replace(/\/(Date\(\-?\d+\))\//g, "\\\/$1\\\/");
    }

    format.concealEmail = function (value) {
        if (!value)
            return value;

        let seed = value[0],
            conceal = true;

        for (let i = 1; i < value.length; i++) {
            if (value[i] == '@')
                conceal = false;

            if (conceal)
                seed += '●';
            else seed += value[i];
        }

        return seed;
    };

    format.concealPhone = function (value) {
        const v = value.replace(/\D/g, "");

        switch (v.length) {
            case 10:
                return `(${v[0]}●●) ●●●-${v.substring(6)}`;
            case 11:
                return `(${v[1]}●●) ●●●-${v.substring(7)}`;
            default:
                return null;
        }
    };

    format.phone = function (value) {
        const v = value.replace(/\D/g, "");

        switch (v.length) {
            case 10:
                return `(${v[0]}${v[1]}${v[2]}) ${v[3]}${v[4]}${v[5]}-${v[6]}${v[7]}${v[8]}${v[9]}`;
            case 11:
                return `(${v[1]}${v[2]}${v[3]}) ${v[4]}${v[5]}${v[6]}-${v[7]}${v[8]}${v[9]}${v[10]}`;
            default:
                return value;
        }
    };

    format.address = function (address, separator) {
        const i = {
            Separator: separator || " "
        };
        Object.assign(i, address);

        let seed = format.interpolate("${LineOne}${Separator}", i);
        if (address.LineTwo)
            seed += format.interpolate("${LineTwo}${Separator}", i);
        seed += format.interpolate("${City}, ${State} ${ZipCode}", i);
        return seed;
    };

    // string interpolation
    format.interpolate = function (value, dict, table) {
        const i1 = function (match, keys) {
            let hit = false;

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i],
                    c = key.split(".");

                if (c.length < 2
                    || c[0] != table)
                    continue;

                hit = true;
                const check = dict[key.substring(table.length + 1)];

                if (check !== undefined)
                    return check;

                let cur = dict[c[1]];

                for (let j = 2; j < c.length; j++) {
                    if (cur === undefined
                        || cur === null)
                        return "";

                    cur = cur[c[j]];
                }

                if (cur !== undefined)
                    return cur;
            }

            if (hit)
                return "";
            return match;
        },
            i2 = function (match, keys) {
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i],
                        check = dict[key];

                    if (check !== undefined)
                        return check;

                    const c = key.split(".");
                    let cur = dict[c[0]];

                    for (let j = 1; j < c.length; j++) {
                        if (cur === undefined
                            || cur === null)
                            return "";

                        cur = cur[c[j]];
                    }

                    if (cur !== undefined)
                        return cur;
                }

                return "";
            };

        return value.replace(/\$\{([\d\w\|\.]+)\}/g, function (match, keys) {
            const k = keys.split("|");

            if (table)
                return i1(match, k);
            return i2(match, k);
        });
    };


    format.DescriptionMap = class {
        constructor(options) {
            options ||= {};

            if (typeof options === 'string')
                options = {
                    SingularLower: options,
                    PluralLower: options,
                    SingularCapitalized: options,
                    PluralCapitalized: options,
                };

            this.Values = options.Values ?? {};

            if (options.SingularLower)
                this.set(0, options.SingularLower);
            if (options.PluralLower)
                this.set(format.DescriptionType.PLURAL, options.PluralLower);
            if (options.SingularCapitalized)
                this.set(format.DescriptionType.CAPITALIZED, options.SingularCapitalized);
            if (options.PluralCapitalized)
                this.set(format.DescriptionType.PLURAL | format.DescriptionType.CAPITALIZED, options.PluralCapitalized);
        }
    
        set(type, value) {
            return this.Values[type] = value;
        }
        get(type) {
            return this.Values[type];
        }
    }
    // print human legible count i.e. 2.5M, 3.6K
    format.count = function (value) {
        const count = value + Number.EPSILON;

        if (value >= 900000000
            || value <= -900000000)
            return `${Math.round(count / 100000000) / 10}B`;
        if (value >= 900000
            || value <= -900000)
            return `${Math.round(count / 100000) / 10}M`;
        if (value >= 1000
            || value <= -1000)
            return `${Math.round(count / 100) / 10}K`;
        return value.toString();
    }

    const yearMap = new format.DescriptionMap({
        SingularLower: "year",
        PluralLower: "years",
        SingularCapitalized: "Year",
        PluralCapitalized: "Years"
    }),
        monthMap = new format.DescriptionMap({
            SingularLower: "month",
            PluralLower: "months",
            SingularCapitalized: "Month",
            PluralCapitalized: "Months"
        }),
        dayMap = new format.DescriptionMap({
            SingularLower: "day",
            PluralLower: "days",
            SingularCapitalized: "Day",
            PluralCapitalized: "Days"
        }),
        hourMap = new format.DescriptionMap({
            SingularLower: "hour",
            PluralLower: "hours",
            SingularCapitalized: "Hour",
            PluralCapitalized: "Hours"
        }),
        minuteMap = new format.DescriptionMap({
            SingularLower: "minute",
            PluralLower: "minutes",
            SingularCapitalized: "Minute",
            PluralCapitalized: "Minutes"
        }),
        secondMap = new format.DescriptionMap({
            SingularLower: "second",
            PluralLower: "seconds",
            SingularCapitalized: "Second",
            PluralCapitalized: "Seconds"
        }),
        nowMap = new format.DescriptionMap("Just now");

    format.TimeUnitMap = class {
        constructor(options) {
            options ??= {};

            this.Values = options.Values ?? {};

            if (this.Year)
                this.Values[format.TimeUnit.YEAR] = new format.DescriptionMap(this.Year);
            if (this.Month)
                this.Values[format.TimeUnit.MONTH] = new format.DescriptionMap(this.Month);
            if (this.Day)
                this.Values[format.TimeUnit.DAY] = new format.DescriptionMap(this.Day);
            if (this.Hour)
                this.Values[format.TimeUnit.HOUR] = new format.DescriptionMap(this.Hour);
            if (this.Minute)
                this.Values[format.TimeUnit.MINUTE] = new format.DescriptionMap(this.Minute);
            if (this.Second)
                this.Values[format.TimeUnit.SECOND] = new format.DescriptionMap(this.Second);

            this.Values[format.TimeUnit.YEAR] ??= yearMap;
            this.Values[format.TimeUnit.MONTH] ??= monthMap;
            this.Values[format.TimeUnit.DAY] ??= dayMap;
            this.Values[format.TimeUnit.HOUR] ??= hourMap;
            this.Values[format.TimeUnit.MINUTE] ??= minuteMap;
            this.Values[format.TimeUnit.SECOND] ??= secondMap;
        };
    getUnit(unit, type) {
            const m = this.Values[unit];
            if (!m) return null;
            type ??= 0;
            return m.get(type);
        }
    }

    format.Duration = class {
        constructor(options) {
            options ??= {};

            this.Since = finys.toDateOrDefault(options.Since)?.getTime();
            this.Value = finys.toDateOrDefault(options.Value)?.getTime();
            this.Threshold = options.Threshold ?? 0;
            this.DescriptionType = options.DescriptionType ?? format.DescriptionType.CAPITALIZED;
            this.UnitMap = new format.TimeUnitMap(options.UnitMap ?? {});
            this.AgoText = options.AgoText ?? null;
            this.NowText = options.NowText ?? nowMap;

            if (this.AgoText)
                this.AgoText = new format.DescriptionMap(this.AgoText);
            if (this.NowText)
                this.NowText = new format.DescriptionMap(this.NowText);
        }
    getValue() {
            if (this.Value)
                return this.Value;
            return Date.now() - this.Since;
        }
    printUnit(unit, type) {
            type ??= 0;
            const m = this.UnitMap.getUnit(unit, this.DescriptionType | type);
            if (!m) return "";
            return ` ${m}`;
        }
    printAgo() {
            if (!this.AgoText)
                return "";
            return ` ${this.AgoText.get(this.DescriptionType)}`;
        }
    printNow(type) {
            if (!this.NowText)
                return "";
            type ??= 0;
            return this.NowText.get(this.DescriptionType | type);
        }
    print() {
            let val = this.getValue(),
                rounded = 0;
            const seed = [];

            if (val < 0)
                seed.push("-");

            val = Math.abs(val);
            const d = val / 86400000,
                days = Math.round(d);

            if (days >= 364) {
                val = Math.round(days / 364);
                rounded = val.toFixed(0);
                seed.push(rounded);
                if (rounded == 1)
                    seed.push(this.printUnit(format.TimeUnit.YEAR));
                else seed.push(this.printUnit(format.TimeUnit.YEAR, format.DescriptionType.PLURAL));
                seed.push(this.printAgo());

                return seed.join('');
            }

            if (this.Threshold >= format.TimeUnit.YEAR) {
                val = days / (86400000 * 364);
                if (val < 0.5)
                    return this.printNow();
                return `1${this.printUnit(format.TimeUnit.YEAR)}${this.printAgo()}`;
            }

            if (days >= 30) {
                val = Math.round(days / 30);
                rounded = val.toFixed(0);
                seed.push(rounded);
                if (rounded == 1)
                    seed.push(this.printUnit(format.TimeUnit.MONTH));
                else seed.push(this.printUnit(format.TimeUnit.MONTH, format.DescriptionType.PLURAL));
                seed.push(this.printAgo());

                return seed.join('');
            }

            if (this.Threshold >= format.TimeUnit.MONTH) {
                val = (86400000 * 30);
                if (val < 0.5)
                    return this.printNow();
                return `1${this.printUnit(format.TimeUnit.MONTH)}${this.printAgo()}`;
            }

            if (days >= 1) {
                val = Math.round(days);
                rounded = val.toFixed(0);
                seed.push(rounded);
                if (rounded == 1)
                    seed.push(this.printUnit(format.TimeUnit.DAY));
                else seed.push(this.printUnit(format.TimeUnit.DAY, format.DescriptionType.PLURAL));
                seed.push(this.printAgo());

                return seed.join('');
            }

            if (this.Threshold >= format.TimeUnit.DAY) {
                if (d < 0.5)
                    return this.printNow();
                return `1${this.printUnit(format.TimeUnit.DAY)}${this.printAgo()}`;
            }

            const h = val / 3600000,
                hours = Math.round(h);

            if (hours >= 1) {
                rounded = hours.toFixed(0);
                seed.push(rounded);
                if (rounded == 1)
                    seed.push(this.printUnit(format.TimeUnit.HOUR));
                else seed.push(this.printUnit(format.TimeUnit.HOUR, format.DescriptionType.PLURAL));
                seed.push(this.printAgo());

                return seed.join('');
            }

            if (this.Threshold >= format.TimeUnit.HOUR) {
                if (h < 0.5)
                    return this.printNow();
                return `1${this.printUnit(format.TimeUnit.HOUR)}${this.printAgo()}`;
            }

            const m = val / 60000,
                mins = Math.round(m);

            if (mins >= 1) {
                rounded = mins.toFixed(0);
                seed.push(rounded);
                if (rounded == 1)
                    seed.push(this.printUnit(format.TimeUnit.MINUTE));
                else seed.push(this.printUnit(format.TimeUnit.MINUTE, format.DescriptionType.PLURAL));
                seed.push(this.printAgo());

                return seed.join('');
            }

            if (this.Threshold >= format.TimeUnit.MINUTE) {
                if (m < 0.5)
                    return this.printNow();
                return `1${this.printUnit(format.TimeUnit.MINUTE)}${this.printAgo()}`;
            }

            const s = val / 1000,
                secs = Math.round(s);

            if (secs >= 1) {
                rounded = secs.toFixed(0);
                seed.push(rounded);
                if (rounded == 1)
                    seed.push(this.printUnit(format.TimeUnit.SECOND));
                else seed.push(this.printUnit(format.TimeUnit.SECOND, format.DescriptionType.PLURAL));
                seed.push(this.printAgo());

                return seed.join('');
            }
            return this.printNow();
        };
    }

    // print human legible time elapsed since date or time i.e. 23 Minutes
    format.elapsed = function (options) {
        if (typeof options === 'number'
            || typeof options === 'string'
            || options instanceof Date)
            options = {
                Since: options,
                Threshold: arguments[1] ?? 0
            };
        const d = new format.Duration(options);
        return d.print();
    };


    // print human legible duration i.e. 23 Minutes
    format.duration = function (options) {
        if (typeof options === 'number')
            options = {
                Value: options,
                Threshold: arguments[1] ?? 0
            };
        const d = new format.Duration(options);
        return d.print();
    };



}
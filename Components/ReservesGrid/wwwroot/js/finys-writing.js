// finys namespace
var finys = window.finys ||= {};

{
    // writing namespace
    const writing = finys.writing ||= {};


    writing.frac = function (num, den) {
        return `<sup>${num}</sup>&frasl;<sub>${den}</sub>`;
    };


    writing.Number = function (article, ...vals) {
        this.Article = article;
        this.Values = vals;
    };

    writing.Number.prototype.increment = function (position, value) {
        while (position >= this.Values.length)
            this.Values.push(0);

        this.Values[position] += value;
    };
    writing.Number.prototype.set = function (position, value) {
        while (position >= this.Values.length)
            this.Values.push(0);

        this.Values[position] = value;
    };
    writing.Number.prototype.push = function (value) {
        this.Values.push(value);
    };
    writing.Number.prototype.toString = function () {
        const r = [...this.Values];
        while (r.length < this.Article.MinNumberLength)
            r.push(0);

        return r.join(".");
    };


    writing.ItemCollection = class extends finys.Collection {
        constructor(values) {
            super(values);

            this.sortedBy(i => i.Order);
        };
    

    appendTo(container) {
            for (const i of this.Values)
                i.appendTo(container);
        };
    prependTo(container) {
            for (const i of this.Values)
                i.prependTo(container);
        };
    }

    writing.SectionItem = class extends finys.ScreenObject {
        constructor(options) {
            options ||= {};
            super(options);

            this.Order = options.Order || 0;
            this.Parent = null;
        };
  

    getNumber() {
            return null;
        };
    setSection(section) {
            this.Parent = section;
        };
    getArticle() {
            return this.Parent.Article;
        };
    getLevel() {
            if (this.Parent)
                return this.Parent.getLevel() + 1;
            return 0;
        };
    }

    writing.Figure = class extends writing.SectionItem {
        constructor(options) {
            options ||= {};
            super(options);

            this.Url = options.Url;
            this.Text = options.Text;
        };
    

    initialize() {
            super.initialize();

            const e = this.getElement(),
                exp = e.find("button.f-figure-expand");
            exp.on("click", () => this.expand());
        };
    expand() {
            const a = this.getArticle();

            a.FigureStage.show();
            a.FigureStage.select(this.Uid);
        };
    getNumber() {
            return this.Parent.getFigureNumber(this.Uid);
        };
    preRender() {
            super.preRender();

            this.addClass("f-figure");
            this.addAttribute("id", this.Parent.getFigureId(this.Uid));
        };
    render() {
            this.preRender();

            return `<figure ${this.renderAttributes()}>
                <button type="button" title="Expand" class="f-figure-expand f-stealthy">
                    ${finys.vector.EXPAND}
                </button>
                <img src="${this.Url}" title="Figure ${this.getNumber()}">
                <figcaption class="f-figure-caption">
                    <span class="f-figure-name">Figure ${this.getNumber()}</span> ${this.Text}
                </figcaption>
            </figure>`;
        };
    }

    writing.ReferenceSource = function (options) {
        options ||= {};

        this.Url = options.Url;
        this.Name = options.Name;
    };
    writing.ReferenceSource.prototype.render = function () {
        return `<li><a href="${this.Url}" target="_blank"><i>${this.Name}</i></a></li>`;
    };


    writing.Reference = class extends writing.SectionItem {
        constructor(options) {
            options ||= {};
            super(options);

            this.Url = options.Url;
            this.Text = options.Text;
            this.Source = new writing.ReferenceSource(options.Source);
        };
    

    getNumber() {
            return this.Parent.getReferenceNumber(this.Uid);
        };
    preRender() {
            super.preRender();

            this.addClass("f-reference");
            this.addAttribute("id", this.Parent.getReferenceId(this.Uid));
        };
    render() {
            this.preRender();

            return `<li ${this.renderAttributes()}>
                ${this.Text}
                <div class="f-reference-print">${this.Url}</div>
                <ul class="f-reference-screen">
                    <li><a href="${this.Url}" target="_blank">View Article</a></li>
                    ${this.Source.render()}
                </ul>
            </li>`;
        };
    }

    writing.Aside = class extends writing.SectionItem {
        constructor(options) {
            options ||= {};
            if (typeof options == 'function')
                options = { Value: options };

            super(options);

            this.Value = options.Value;
        };
    

    preRender() {
            super.preRender();

            this.addClass("f-aside");
        };
    print() {
            return this.Value(this.Parent.MarkupHelper);
        };
    render() {
            this.preRender();

            return `<aside ${this.renderAttributes()}>
                <p>
                    ${this.print()}
                </p>
            <aside>`;
        };
    }

    writing.Html = class extends writing.SectionItem {
        constructor(options) {
            options ||= {};
            switch (typeof options) {
                case 'function':
                case 'string':
                    options = { Value: options };
                    break;
            }
            super(options);

            this.Value = options.Value;
            this.IsConstant = typeof this.Value == 'string';
        };
    

    print() {
            if (this.IsConstant)
                return this.Value;
            return this.Value(this.Parent.MarkupHelper);
        };
    render() {
            this.preRender();
            return this.print();
        };
    }

    writing.List = class extends writing.SectionItem {
        constructor(options) {
            options ||= {};
            switch (typeof options) {
                case 'function':
                case 'string':
                    options = { Value: options };
                    break;
            }
            super(options);

            this.Items = new writing.ItemCollection();
        };
    

    addItem(value, order) {
            if (!(value instanceof writing.ListItem))
                value = new writing.ListItem(value);
            if (typeof order == 'number')
                value.Order = order;

            this.Items.add(value);
            value.setList(this);
            return value;
        };
    initialize() {
            super.initialize();

            const e = this.getElement();
            this.Items.appendTo(e);
        };
    }

    writing.UnorderedList = class extends writing.List {
        constructor(options) {
            super(options);
        };
    

        render() {
                this.preRender();

                return `<ul ${this.renderAttributes()}></ul>`;
            };
        }
    
writing.OrderedList = class extends writing.List {
    constructor(options) {
        super(options);
    };
    

    render() {
        this.preRender();

        return `<ol ${this.renderAttributes()}></ol>`;
    };
}

writing.ListItem = class extends finys.ScreenObject {
    constructor(options) {
        options ||= {};
        switch (typeof options) {
            case 'function':
            case 'string':
                options = { Value: options };
                break;
        }
        super(options);

        this.Value = options.Value;
        this.IsConstant = typeof this.Value == 'string';
        this.List = null;
    };
    

    setList(list) {
        this.List = list;
    };
    print() {
        if (this.IsConstant)
            return this.Value;
        return this.Value(this.List.Parent.MarkupHelper);
    };
    render() {
        this.preRender();

        return `<li ${this.renderAttributes()}>
                ${this.print()}
            </li>`;
    };
}

writing.Paragraph = class extends writing.SectionItem {
    constructor(options) {
        options ||= {};
        switch (typeof options) {
            case 'function':
            case 'string':
                options = { Value: options };
                break;
        }
        super(options);

        this.Value = options.Value;
        this.IsConstant = typeof this.Value == 'string';
    };
    

    print() {
        if (this.IsConstant)
            return this.Value;
        return this.Value(this.Parent.MarkupHelper);
    };
    render() {
        this.preRender();

        return `<p ${this.renderAttributes()}>
                ${this.print()}
            </p>`;
    };
}

    writing.MarkupHelper = function (section) {
        this.Section = section;
    };

    writing.MarkupHelper.prototype.reference = function (...value) {
        const refs = [];
        for (const r of value) {
            const ref = this.Section.Article.getReference(r);
            refs.push(`<sup class="f-reference-link">
                    <a href="#${this.Section.Article.getReferenceId(r)}" title="${ref.Text}">
                        ${this.Section.Article.getReferenceNumber(r)}
                    </a>
                </sup>`);
        }
        return refs.join(",");
    };
    writing.MarkupHelper.prototype.literal = function (text, lang) {
        if (lang)
            return `<code class="f-literal" language="${lang}">${text}</code>`;
        return `<code class="f-literal">${text}</code>`;
    };
    writing.MarkupHelper.prototype.figure = function (value, capitalize) {
        const f = function (c) {
            if (c) return "Figure";
            return "figure";
        };
        return `<a href="#${this.Section.Article.getFigureId(value)}" class="f-figure-link"><i>${f(capitalize)} ${this.Section.Article.getFigureNumber(value)}</i></a>`;
    };
    writing.MarkupHelper.prototype.section = function (value) {
        return `<a href="#${this.Section.Article.getSectionId(value)}" class="f-section-link"><strong>Section ${this.Section.Article.getSectionNumber(value)}</strong></a>`
    };
    writing.MarkupHelper.prototype.link = function (url, text) {
        return `<a href="${url}" target="_blank" class="f-link"><i>${text}</i></a>`
    };


writing.Section = class extends writing.SectionItem {
    constructor(options) {
        options ||= {};
        if (typeof options == 'string')
            options = { Title: options };

        super(options);

        this.Title = options.Title;
        this.Items = new writing.ItemCollection();
        this.Sections = {};
        this.Figures = {};
        this.Article = null;
        this.MarkupHelper = new writing.MarkupHelper(this);
    };
    

    getNumber() {
        return this.getSectionNumber();
    };
    setArticle(article) {
        this.Article = article;
    };
    addSection(section, order) {
        if (!(section instanceof writing.Section))
            section = new writing.Section(section);

        section.setArticle(this.Article);
        this.add(section, order);
        return section;
    };
    addFigure(figure, order) {
        if (!(figure instanceof writing.Figure))
            figure = new writing.Figure(figure);

        this.add(figure, order);
        return figure;
    };
    addParagraph(paragraph, order) {
        if (!(paragraph instanceof writing.Paragraph))
            paragraph = new writing.Paragraph(paragraph);

        this.add(paragraph, order);
        return paragraph;
    };
    addAside(aside, order) {
        if (!(aside instanceof writing.Aside))
            aside = new writing.Aside(aside);

        this.add(aside, order);
        return aside;
    };
    addOrderedList(order) {
        const list = new writing.OrderedList();
        this.add(list, order);
        return list;
    };
    addUnorderedList(order) {
        const list = new writing.UnorderedList();
        this.add(list, order);
        return list;
    };
    addHtml(html, order) {
        if (!(html instanceof writing.Html))
            html = new writing.Html(html);

        this.add(html, order);
        return html;
    };
    add(item, order) {
        if (typeof order == 'number')
            item.Order = order;

        this.Items.add(item);
        this.watch(item);
        item.setSection(this);
    };
    watch(item) {
        this.Article.watch(item);

        if (item instanceof writing.Section)
            this.Sections[item.Uid] = item;
        else if (item instanceof writing.Figure)
            this.watchFigure(item);
    };
    watchFigure(figure) {
        if (this.Parent) {
            this.Parent.watchFigure(figure);
            return;
        }
        this.Figures[figure.Uid] = figure;
    };
    getSectionId(uid) {
        return this.Article.getSectionId(uid || this.Uid);
    };
    getSectionNumber(uid) {
        let num = null;

        if (this.Parent)
            num = this.Parent.getSectionNumber(this.Uid);
        else num = this.Article.getRootSectionNumber(this.Uid);

        if (uid) {
            let i = 0;
            for (const u in this.Sections) {
                i++;
                if (u == uid) break;
            }
            num.push(i);
        }
        return num;
    };
    getFigureId(uid) {
        return this.Article.getFigureId(uid);
    };
    getFigureNumber(uid) {
        if (this.Parent)
            return this.Parent.getFigureNumber(uid);

        const num = this.getSectionNumber();

        let i = 0;
        for (const u in this.Figures) {
            i++;
            if (u == uid) break;
        }
        num.set(1, i);
        return num;
    };
    getReferenceId(uid) {
        return this.Article.getReferenceId(uid);
    };
    getReferenceNumber(uid) {
        return this.Article.getReferenceNumber(uid);
    };
    initialize() {
        super.initialize();

        const e = this.getElement();
        this.Items.appendTo(e);
    };
    preRender() {
        super.preRender();

        this.addClass("f-section");
        this.addAttribute("id", this.getSectionId(this.Uid));
    };
    getHeadingSize() {
        return this.getLevel() + 2;
    };
    render() {
        this.preRender();

        return `<section ${this.renderAttributes()}>
                <h${this.getHeadingSize()}><span class="f-section-num">${this.getNumber()}</span>${this.Title}</h3>
            </section>`;
    };
}

writing.ReferenceSection = class extends writing.Section {
    constructor(article) {
        super("References");
        this.setArticle(article);

        this.References = [];
    };
  

    shouldRender() {
        return !!this.References.length;
    };
    addReference(reference) {
        this.References.push(reference);
        reference.setSection(this);
    };
    initialize() {
        super.initialize();

        const e = this.getElement(),
            r = $("<ol class=\"f-references\"></ol>").appendTo(e);

        for (const ref of this.References)
            ref.appendTo(r);
    };
}

writing.FigureItem = class extends finys.CarouselItem {
    constructor(figure) {
        super({
            Uid: figure.Uid,
            Title: `Figure ${figure.getNumber()}`
        });

        this.Figure = figure;
    };
  

    preRender() {
        super.preRender();

        this.addAttribute("src", this.Figure.Url);
        this.addAttribute("title", this.Title);
    };
    render() {
        this.preRender();

        return `<img ${this.renderAttributes()}>`;
    };
}

writing.FigureStage = class extends finys.ScreenObject {
    constructor() {
        super();

        this.Carousel = new finys.Carousel();
        this.Carousel.on("goto", (i, v) => this.onGoto(i, v));
        this.Carousel.on("panel-click", () => this.hide());
    };
  

    add(figure) {
        this.Carousel.add(new writing.FigureItem(figure));
    };
    preRender() {
        super.preRender();

        this.addClass("f-figure-stage");
    };
    fill(figure) {
        const e = this.getElement(),
            n = e.find(".f-figure-name"),
            c = e.find(".f-figure-caption");

        n.html(`Figure ${figure.getNumber()}`);
        c.html(figure.Text);
    };
    select(uid) {
        this.Carousel.select(uid);
    };
    show() {
        const e = this.getElement();
        e.addClass("f-active");
    };
    hide() {
        const e = this.getElement();
        e.removeClass("f-active");

        this.Carousel.deactivate();
    };
    onGoto(index, item) {
        this.fill(item.Figure);
    };
    initialize() {
        super.initialize();

        const e = this.getElement(),
            c = e.find("button.f-figure-stage-close");

        this.Carousel.appendTo(e);

        c.on("click", () => this.hide());
    };
    appendToOverlay() {
        const o = $("#f-overlay");
        this.appendTo(o);
    };
    render() {
        this.preRender();

        return `<div ${this.renderAttributes()}>
                <header class="f-figure-header">
                    <button type="button" title="Close" class="f-figure-stage-close">
                        ${finys.vector.CLOSE}
                    </button>
                    <h1 class="f-figure-name"></h1>
                </header>
                <footer class="f-figure-footer">
                    <div class="f-figure-caption"></div>
                </footer>
            </div>`;
    };
}

writing.ArticleNavigation = class extends finys.ScreenObject {
    constructor(article) {
        super();

        this.Article = article;
    };
    

    preRender() {
        super.preRender();

        this.addClass("f-article-navigation");
    };
    renderSectionLink(section) {
        return `<li class="f-navigation-link f-navigation-h${section.getHeadingSize()}" data-uid="${section.Uid}"><a href="#${section.getSectionId()}"><span>${section.getSectionNumber()}</span>${section.Title}</a></li>`;
    };
    renderLinks() {
        let result = [];
        for (const i of this.Article.Items.Values)
            result.push(...this.renderSection(i));
        if (this.Article.ReferenceSection.shouldRender())
            result.push(this.renderSectionLink(this.Article.ReferenceSection));
        return result.join('');
    };
    * renderSection(section) {
        yield this.renderSectionLink(section);
        for (const u in section.Sections)
            yield* this.renderSection(section.Sections[u]);
    };
    render() {
        this.preRender();

        return `<nav ${this.renderAttributes()}>
                <ul>
                    ${this.renderLinks()}
                </ul>
            </nav>`;
    };
}

writing.Article = class extends finys.ScreenObject {
    constructor(options) {
        options ||= {};
        if (typeof options == 'string')
            options = { Title: options };

        super(options);

        this.Title = options.Title;
        this.SectionStart = options.SectionStart || 0;
        this.MinNumberLength = options.MinNumberLength || 2;
        this.Items = new writing.ItemCollection();
        this.Sections = {};
        this.Figures = {};
        this.References = {};
        this.Offset = 0;
        this.Navigation = new writing.ArticleNavigation(this);
        this.FigureStage = new writing.FigureStage();
        this.ReferenceSection = new writing.ReferenceSection(this);
    };
    watch(item) {
        if (item instanceof writing.Section)
            this.Sections[item.Uid] = item;
        else if (item instanceof writing.Figure)
            this.Figures[item.Uid] = item;
        else if (item instanceof writing.Reference) {
            this.References[item.Uid] = item;
            this.ReferenceSection.addReference(item);
        }
    };
    addSection(section, order) {
        if (!(section instanceof writing.Section))
            section = new writing.Section(section);

        if (typeof order == 'number')
            section.Order = order;

        section.setArticle(this);
        this.watch(section);

        this.Items.add(section);
        return section;
    };
    addReference(reference, order) {
        if (!(reference instanceof writing.Reference))
            reference = new writing.Reference(reference);

        if (typeof order == 'number')
            reference.Order = order;

        this.watch(reference);
        return reference;
    };
    getSection(uid) {
        if (uid instanceof writing.Section)
            return uid;

        if (this.ReferenceSection.Uid == uid)
            return this.ReferenceSection;

        return this.Sections[uid];
    };
    getSectionId(uid) {
        if (uid instanceof writing.Section)
            return this.getSectionId(uid.Uid);

        if (this.ReferenceSection.Uid == uid)
            return `f-sec-${String(this.Sections.length).padStart(4, '0')}`;

        let i = 0;
        for (const u in this.Sections) {
            i++;
            if (u == uid)
                return `f-sec-${String(i).padStart(4, '0')}`;
        }
        return null;
    };
    getSectionNumber(uid) {
        if (uid instanceof writing.Section)
            return this.getSectionNumber(uid.Uid);

        return this.getSection(uid)
            .getNumber();
    };
    getRootSectionNumber(uid) {
        if (this.ReferenceSection.Uid == uid)
            return new writing.Number(this, this.Items.Values.length + this.SectionStart);

        let i = 0;
        while (this.Items.Values[i].Uid != uid) i++;
        return new writing.Number(this, i + this.SectionStart);
    };
    getFigure(uid) {
        if (uid instanceof writing.Figure)
            return uid;

        return this.Figures[uid];
    };
    getFigureId(uid) {
        if (uid instanceof writing.Figure)
            return this.getFigureId(uid.Uid);

        let i = 0;
        for (const u in this.Figures) {
            if (u == uid)
                return `f-fig-${String(i).padStart(4, '0')}`;
            i++;
        }
        return null;
    };
    getFigureNumber(uid) {
        if (uid instanceof writing.Figure)
            return uid.getNumber();

        return this.getFigure(uid)
            .getNumber();
    };
    getReference(uid) {
        if (uid instanceof writing.Reference)
            return uid;

        return this.References[uid];
    };
    getReferenceId(uid) {
        if (uid instanceof writing.Reference)
            return this.getReferenceId(uid.Uid);

        let i = 0;
        for (const u in this.References) {
            if (u == uid)
                return `f-ref-${String(i).padStart(4, '0')}`;
            i++;
        }
        return null;
    };
    getReferenceNumber(uid) {
        if (uid instanceof writing.Reference)
            return this.getReferenceNumber(uid.Uid);

        let i = 0;
        for (const u in this.References) {
            i++;
            if (u == uid) return i;
        }
        return null;
    };
    initialize() {
        super.initialize();

        const e = this.getElement(),
            content = e.find(".f-article-content"),
            p = content.find("button.f-article-print"),
            body = $("body"),
            app = $("#appContentContainer"),
            appRect = app[0].getBoundingClientRect(),
            pos = app.position();

        for (const s of this.Items.Values)
            for (const f in s.Figures)
                this.FigureStage.add(s.Figures[f]);

        body.addClass("f-writing");

        this.Items.appendTo(content);

        if (this.ReferenceSection.shouldRender())
            this.ReferenceSection.appendTo(content);

        this.Navigation.appendTo(e);
        this.FigureStage.appendToOverlay();

        p.on("click", () => print());

        this.Offset = appRect.top + 1; // pos.top + 1;
        app.on("scroll", () => this.onScroll());
        this.onScroll();
    };
    onScroll() {
        const e = this.getElement(),
            sections = e.find(".f-section"),
            navs = e.find(".f-navigation-link");

        let cur, rect;

        for (let i = sections.length; i-- > 0;) {
            cur = sections[i];
            rect = cur.getBoundingClientRect();

            if (rect.top < this.Offset)
                break;
        }

        const m = $(cur);
        if (!m.hasClass("f-focused")) {
            const uid = m.attr("data-uid"),
                nav = navs.closest(`[data-uid='${uid}']`);

            sections.removeClass("f-focused");
            navs.removeClass("f-focused");

            m.addClass("f-focused");
            nav.addClass("f-focused");
        }
    };
    preRender() {
        super.preRender();

        this.addClass("f-article");
    };
    render() {
        this.preRender();

        return `<div ${this.renderAttributes()}>
                <article class="f-article-content">
                    <header class="f-article-header">
                        <h1>${this.Title}</h1>
                        <button type="button" title="Print this page" class="f-article-print">
                            ${finys.vector.PRINT}
                        </button>
                    </header>
                </article>
            </div>`;
    };
}

}
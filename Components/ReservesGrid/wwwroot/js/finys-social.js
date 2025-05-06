// finys namespace
var finys = window.finys ||= {};

{
    // social namespace
    const social = finys.social ||= {};

    // constants //

    const _cardGradient = `<svg
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 580 300"
                width="580"
                height="300"
                version="1.1" style="
                    position: absolute;
                    z-index: 1;
                    pointer-events: none;">
                <defs>
                    <linearGradient
                        gradientTransform="rotate(206, 0.5, 0.5)"
                        x1="50%"
                        y1="0%"
                        x2="50%"
                        y2="100%"
                        id="contact-card-gradient">
                        <stop stop-color="var(--color-008-008)" stop-opacity="1" offset="0%"></stop>
                        <stop stop-color="var(--color-002-001)" stop-opacity="1" offset="100%"></stop>
                    </linearGradient>
                </defs>
                <path xmlns="http://www.w3.org/2000/svg" d="M 0,100.32676 C 64.528009,79.268672 135.82469,45.425311 276.61307,171.32262 397.09543,279.17014 475.91286,163.50104 580,130.40975 V 0 H 0 Z" fill="url(#contact-card-gradient)""></path>
            </svg>`,
        _verified = `<svg
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                version="1.1"
                x="0px"
                y="0px"
                viewBox="0 0 3868.4 2752"
                style="transform: scale(1.2)"
                xml:space="preserve">
                <style type="text/css">
	                .f-st0{fill:#1DA1F2;}
                </style>
                <path class="f-st0" d="M3184.2,1434.6c0,87.4-21,168.5-63,242.7c-42,74.2-98.1,132.3-168.9,172.9c2,13.2,2.9,33.7,2.9,61.5  c0,132.3-44.4,244.6-132.3,337.4c-88.4,93.3-194.8,139.6-319.3,139.6c-55.7,0-108.9-10.3-159.2-30.8  c-39.1,80.1-95.2,144.5-168.9,193.8c-73.2,49.8-153.8,74.2-241.2,74.2c-89.4,0-170.4-23.9-242.7-72.8  c-72.8-48.3-128.4-113.3-167.5-195.3c-50.3,20.5-103,30.8-159.2,30.8c-124.5,0-231.4-46.4-320.8-139.6  c-89.4-92.8-133.8-205.6-133.8-337.4c0-14.6,2-35.2,5.4-61.5c-70.8-41-127-98.6-168.9-172.9c-41.5-74.2-62.5-155.3-62.5-242.7  c0-92.8,23.4-178.2,69.8-255.4s108.9-134.3,187-171.4c-20.5-55.7-30.8-111.8-30.8-167.5c0-131.8,44.4-244.6,133.8-337.4  s196.3-139.6,320.8-139.6c55.7,0,108.9,10.3,159.2,30.8c39.1-80.1,95.2-144.5,168.9-193.8c73.2-49.3,153.8-74.2,241.2-74.2  c87.4,0,168,24.9,241.2,73.7c73.2,49.3,129.9,113.8,168.9,193.8c50.3-20.5,103-30.8,159.2-30.8c124.5,0,231,46.4,319.3,139.6  s132.3,205.6,132.3,337.4c0,61.5-9.3,117.2-27.8,167.5c78.1,37.1,140.6,94.2,187,171.4C3160.8,1256.4,3184.2,1341.8,3184.2,1434.6  L3184.2,1434.6z M1881,1811.1l516.1-772.9c13.2-20.5,17.1-43,12.7-66.9c-4.9-23.9-17.1-43-37.6-55.7c-20.5-13.2-43-17.6-66.9-14.2  c-24.4,3.9-43.9,15.6-58.6,36.1l-454.6,683.6l-209.5-209c-18.6-18.6-40-27.3-64-26.4c-24.4,1-45.4,9.8-64,26.4  c-16.6,16.6-24.9,37.6-24.9,63c0,24.9,8.3,45.9,24.9,63l287.6,287.6l14.2,11.2c16.6,11.2,33.7,16.6,50.3,16.6  C1839.5,1853.1,1864.4,1839.4,1881,1811.1L1881,1811.1z"></path>
            </svg>`;

    social.UserStatus = {
        UNKNOWN: 0,
        AVAILABLE: 1,
        IDLE: 2,
        AWAY: 3,
        BUSY: 4,
        DO_NOT_DISTURB: 5,
        INACTIVE: 6,
    };

    social.OrganizationRole = {
        Member: 0,
        Principal: 1 << 30,
        Administrator: 1 << 24,
        Agent: 1 << 18,
        CustomerService: 1 << 10
    };

    social.LockType = {
        AdminLock: 0,
        MaxLoginAttempts: 1,
        PasswordReset: 2,
        PasswordExpired: 3,
        ForgotPassword: 4
    };

    ///////////////

    social.lockUserWindow = null;
    social.editRolesWindow = null;

    let _cardOverlay = null;

    jQuery.fn.extend({
        renderSelectionPreview: function (selection) {
            if (selection.Count == 1
                && selection.count() == 1) {
                const user = selection.first();
                return this.renderUserPreview(user);
            }
            const result = new social.UserArray({
                Selection: selection
            });
            result.appendTo(this);
            return result;
        },
        renderUserPreview: function (user) {
            const result = new social.UserPreview({
                User: user
            });
            result.appendTo(this);
            return result;
        },
        loadUserPreviewAsync: async function (id) {
            const r = await social.loadUserAsync(id);
            return this.renderUserPreview(r.User);
        }
    });

    social.getCardOverlay = function () {
        if (!_cardOverlay) {
            _cardOverlay = $("#f-overlay > #f-contact-cards");
            if (!_cardOverlay.length)
                _cardOverlay = $(`<div id="f-contact-cards"></div>`)
                    .appendTo($("#f-overlay"));
        }
        return _cardOverlay;
    };


    social.forOrganizationRole = function (handler, mask) {
        if (mask === undefined)
            mask = ~0;
        let result = false;
        for (const i in social.OrganizationRole) {
            const v = social.OrganizationRole[i];
            if (!v) continue;
            if (finys.hasFlag(mask, v)) {
                if (handler(v, i) === false) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    };


    social.actionCompleteEvent = class extends finys.Event {
        constructor(selection) {
            const options = {
                Users: null
            };
            if (!selection)
                options.Users = new social.UserSelection();
            else if (selection instanceof finys.TableSelection)
                options.Users = selection;
            else options.Users = selection.toSelection();

            finys.Event.call(this, "contact-action-complete", options);
        };
    }


    social.avatarChangeEvent = class extends finys.Event {
        constructor(user) {
            finys.Event.call(this, "contact-avatar-change", {
                User: user
            });
        };
    }


    social.closeCards = function () {
        $("#f-overlay > #f-contact-cards > .f-contact-card")
            .each((i, v) => $(v)
                .data("finysContactCard")
                .destroy())
    };


    social.printLockType = function (value) {
        switch (value) {
            case social.LockType.AdminLock:
                return "Locked by user";
            case social.LockType.MaxLoginAttempts:
                return "Exceeded maximum login attempts";
            case social.LockType.PasswordReset:
                return "Password was reset";
            case social.LockType.PasswordExpired:
                return "Password is expired";
            case social.LockType.ForgotPassword:
                return "User forgot password";
            default:
                return null;
        }
    };


    social.getLockTypeOptions = function () {
        const result = [];
        for (const t in social.LockType) {
            const v = social.LockType[t];
            result.push(finys.forms.SelectOption({
                Value: v,
                Text: social.printLockType(v)
            }));
        }
        return result;
    };


    social.UserQueryOptions = class extends finys.QueryOptions {
        constructor(options) {
            options ??= {};

            finys.QueryOptions.call(this, options);

            this.Keyword = options.Keyword ?? null;
            this.Roles = options.Roles ?? 0;

            switch (typeof options.Agencies) {
                case 'string':
                    this.Agencies = [];
                    for (const v of options.Agencies.split(","))
                        this.Agencies.push(parseInt(v));
                    break;
                default:
                    this.Agencies = options.Agencies ?? [];
                    break;
            }
        };
    }




    social.UserCollection = class extends finys.TablePage {
        constructor(options) {
            options ??= {};

            this.Context = new social.OrganizationContext(options.Context);

            finys.TablePage.call(this, {
                Filters: new social.UserQueryOptions(options.Filters)
            });

            if (options.Values)
                for (const value of options.Values)
                    this.add(value);
        };
    

    add(value) {
            super.add(new social.OrganizationUser(value));
            this.Total++;
        };
    clear() {
            super.clear();
            this.Total = 0;
        };
    convertRow(value) {
            const name = value.Contact.getDisplayName();
            return {
                Id: value.Id,
                Name: name,
                Role: value.getAllRoles(),
                SearchText: `${name} ${value.Contact.EmailAddress} ${value.Alias}`
            };
        };
    toRows() {
            const result = [];
            this.forEach(i => result.push(this.convertRow(i)));
            return result;
        };
    }



    social.RoleInfo = function (options) {
        options ??= {};

        this.Name = options.Name;
        this.Code = options.Code;
        this.Value = options.Value;
        this.IsReadonly = options.IsReadonly === true;
    };




    social.UserRole = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};

            finys.ObservableObject.call(this, options);

            this.Info = options.Info;
            this.IsReadonly = options.IsReadonly === true;
        };
    

    readonly(value) {
            this.IsReadonly = value !== false;

            if (this.Info.IsReadonly || this.IsReadonly)
                this.addClass("f-readonly");
            else this.removeClass("f-readonly");
        };
    initialize() {
            super.initialize();

            const e = this.getElement(),
                r = e.find("button.f-user-role-remove");

            r.on("click", i => this.remove());
        };
    getValue() {
            return this.Info.Value;
        };
    remove() {
            this.trigger("remove");
        };
    preRender() {
            super.preRender();

            this.addClass("f-user-role");
            this.addClass(`f-user-role-${this.Info.Code}`);

            if (this.Info.IsReadonly || this.IsReadonly)
                this.addClass("f-readonly");
        };
    render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
                ${this.Info.Name}
                <button type="button" class="f-user-role-remove" title="Remove this role">×</button>
            </div>`;
        };
    }


    social.AssignRole = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};

            finys.ObservableObject.call(this, options);

            this.User = options.User;
            this.Member = options.Member;
            this.IsReadonly = options.IsReadonly === true;
        };
    

    onClick(e) {
            this.trigger("click");
        };
    initialize() {
            super.initialize();

            const e = this.getElement();

            e.on("click", i => this.onClick(i));
        };
    readonly(value) {
            this.IsReadonly = value !== false;

            if (this.IsReadonly)
                this.addClass("f-readonly");
            else this.removeClass("f-readonly");
        };
    preRender() {
            super.preRender();

            this.addClass("f-user-role");
            this.addClass(`f-user-role-assign`);
            this.addAttribute("type", "button");
            this.addAttribute("title", "Assign new role");

            if (this.IsReadonly)
                this.addClass("f-readonly");
        };
    render() {
            this.preRender();

            return `<button ${this.renderAttributes()}>
                <span class="f-plus">+</span> Assign Role
            </button>`;
        };
    }


    social.RoleOption = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};

            finys.ObservableObject.call(this, options);

            this.Role = options.Role;
            this.Order = options.Order;
            this.IsActivated = options.IsActivated === true;
            this.IsEnabled = options.IsEnabled !== false;

            if (typeof this.Role === 'number')
                this.Role = social.getRole(this.Role);
        };
    

    enable(value) {
            this.IsEnabled = value !== false;

            if (this.IsEnabled && !this.Role.IsReadonly)
                this.removeClass("f-disabled");
            else this.addClass("f-disabled");
        };
    getValue() {
            if (this.IsActivated)
                return this.Role.Value;
            return 0;
        };
    activate(value) {
            this.IsActivated = value !== false;

            if (this.IsActivated)
                this.addClass("f-role-activated");
            else this.removeClass("f-role-activated");
        };
    onClick(e) {
            this.activate(!this.IsActivated);
            this.trigger("click");
        };
    initialize() {
            super.initialize();
            const e = this.getElement();

            e.on("click", i => this.onClick(i));
        };
    preRender() {
            super.preRender();

            this.addClass("f-role-option");
            this.addAttribute("type", "button");

            if (this.IsActivated)
                this.addClass("f-role-activated");
            if (!this.IsEnabled)
                this.addClass("f-disabled");
        };
    render() {
            this.preRender();
            return `<button ${this.renderAttributes()}>${this.Role.Name}</button>`;
        };
    }


    social.RoleSelectControl = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};

            finys.ObservableObject.call(this, options);

            this.Value = options.Value ?? 0;
            this.Options = new finys.Collection();
            this.IsEnabled = options.IsEnabled !== false;

            this.Options.sortedBy(i => i.Order);

            if (options.Options) {
                const items = options.Options.Values ?? options.Options;
                for (const item of items)
                    this.add(item);
            }
        };
    

    add(option) {
            option.IsEnabled = this.IsEnabled;
            const item = new social.RoleOption(option);
            item.on("click", () => this.onChange(item));
            this.Options.add(item);

            const e = this.getElement();
            if (e) item.appendTo(e);
        };
    enable(value, mask) {
            const v = value !== false;

            if (mask === undefined) {
                mask = ~0;
                this.IsEnabled = v;
                if (!v) this.addClass("f-disabled");
                else this.removeClass("f-disabled");
            }

            this.Options.forEach(i => {
                if (finys.hasFlag(mask, i.Role.Value))
                    i.enable(v);
            });
        };
    setValue(value) {
            this.Value = value;
            this.Options.forEach(i => i.activate((this.Value & i.Role.Value) == i.Role.Value));
        };
    getValue() {
            return this.Value;
        };
    onChange() {
            this.Value = 0;
            this.Options.forEach(i => this.Value |= i.getValue());

            this.trigger("change");
        };
    initialize() {
            super.initialize();
            const e = this.getElement();

            this.Options.forEach(i => i.appendTo(e));
        };
    preRender() {
            super.preRender();

            this.addClass("f-role-select");

            if (!this.IsEnabled)
                this.addClass("f-disabled");
        };
    destroy() {
            this.Options.forEach(i => i.destroy());

            super.destroy();
        };
    }


    social.RolesMenuToggle = class extends finys.ScreenObject {
        constructor(options) {
            options ??= {};

            finys.ScreenObject.call(this, options);

            this.Context = options.Context;
            this.User = options.User;
            this.Member = options.Member;
            this.Selection = options.Selection;
            this.Total = options.Total;
            this.IsReadonly = options.IsReadonly === true;
        };


    onClick(e) {
            const menu = new social.RolesMenu({
                Context: this.Context,
                User: this.User,
                Member: this.Member,
                Selection: this.Selection,
                Total: this.Total,
                IsReadonly: this.IsReadonly
            });

            menu.on('open', () => this.addClass('f-open'));
            menu.on('close', () => this.removeClass('f-open'));

            menu.open();
        };
    readonly(value) {
            this.IsReadonly = value !== false;

            if (this.IsReadonly)
                this.addClass("f-readonly");
            else this.removeClass("f-readonly");
        };
    initialize() {
            super.initialize();

            const e = this.getElement();
            e.on("click", i => this.onClick(i));
        };
    preRender() {
            super.preRender();

            this.addClass("f-user-role");
            this.addClass("f-user-role-more");
            this.addAttribute("type", "button");
            this.addAttribute("title", "Show more roles");

            if (this.IsReadonly)
                this.addClass("f-readonly");
        };
    render() {
            this.preRender();

            return `<button ${this.renderAttributes()}>
                <span class="f-plus">+</span> ${this.Total - this.Selection}
            </button>`;
        };
    }


    social.RolesMenu = class extends finys.Menu {
        constructor(options) {
            options ??= {};

            finys.Menu.call(this, options);

            this.Context = options.Context;
            this.User = options.User;
            this.Member = options.Member;
            this.Selection = options.Selection ?? 3;
            this.IsReadonly = options.IsReadonly === true;
            this.Listing = null;
        };
    

    readonly(value) {
            this.IsReadonly = value !== false;

            if (this.IsReadonly)
                this.addClass("f-readonly");
            else this.removeClass("f-readonly");

            this.Listing?.readonly(this.IsReadonly);
        };
    renderContent() {
            return "<div class='f-user-roles-content'></div>";
        };
    preRender() {
            super.preRender();

            this.addClass("f-user-roles-menu");
        };
    initialize() {
            super.initialize();

            const e = this.getElement(),
                c = e.find(".f-user-roles-content");

            this.Listing = new social.UserRoleListing({
                Context: this.Context,
                User: this.User,
                Member: this.Member,
                Selection: Number.MAX_SAFE_INTEGER,
                Skip: this.Selection,
                Container: c,
                IsReadonly: this.IsReadonly
            });

            this.Listing.appendRoles();
        };
    destroy() {
            this.Listing.destroy();

            super.destroy();
        };
    }


    social.roles = {};
    social.roles[social.OrganizationRole.Member] = new social.RoleInfo({
        Name: "Member",
        Code: "member",
        Value: social.OrganizationRole.Member,
        IsReadonly: true
    });
    social.roles[social.OrganizationRole.Principal] = new social.RoleInfo({
        Name: "Principal",
        Code: "principal",
        Value: social.OrganizationRole.Principal,
        IsReadonly: true
    });
    social.roles[social.OrganizationRole.Administrator] = new social.RoleInfo({
        Name: "Admin",
        Code: "admin",
        Value: social.OrganizationRole.Administrator
    });
    social.roles[social.OrganizationRole.Agent] = new social.RoleInfo({
        Name: "Agent",
        Code: "agent",
        Value: social.OrganizationRole.Agent,
        IsReadonly: true
    });
    social.roles[social.OrganizationRole.CustomerService] = new social.RoleInfo({
        Name: "Customer Service",
        Code: "csr",
        Value: social.OrganizationRole.CustomerService
    });

    social.getRole = function (value) {
        return social.roles[value];
    };



    social.MemberOption = function (options) {
        options ??= {};

        this.UserId = options.UserId;
        this.OrganizationId = options.OrganizationId;
        this.Name = options.Name;
        this.Role = options.Role;
    };



    social.Organization = function (options) {
        options ??= {};

        this.Id = options.Id;
        this.Code = options.Code;
        this.Contact = new finys.Contact(options.Contact);
    };



    social.OrganizationMember = function (options) {
        options ??= {};

        this.UserId = options.UserId;
        this.Organization = new social.Organization(options.Organization);
        this.Role = options.Role ?? 0;
    };
    social.OrganizationMember.prototype.toOption = function() {
        return new social.MemberOption({
            UserId: this.UserId,
            OrganizationId: this.Organization.Id,
            Name: this.Organization.Contact.getShortName(),
            Role: this.Role
        });
    };



    social.MemberContext = class extends social.OrganizationMember {
        constructor(options) {
            options ??= {};

            social.OrganizationMember.call(this, options);

            this.CanCreateUsers = options.CanCreateUsers === true;
            this.CanModifyRoles = options.CanModifyRoles === true;
            this.CanUpdateInfo = options.CanUpdateInfo === true;
            this.CanResetPassword = options.CanResetPassword === true;
            this.CanResetMFA = options.CanResetMFA === true;
            this.CanLockUsers = options.CanLockUsers === true;
            this.CanDeactivateUsers = options.CanDeactivateUsers === true;
            this.CanViewUsers = options.CanViewUsers === true;
        };
    

    isSelf(member) {
            return member.UserId == this.UserId;
        };
    outranks(member) {
            return member.Organization.Id == this.Organization.Id
                && finys.math.msbLessThan(member.Role, this.Role);
        };
    actionable(member) {
            return this.isSelf(member) || this.outranks(member);
        };
    canModifyRoles(member) {
            return this.CanModifyRoles
                && this.actionable(member);
        };
    canUpdateInfo(member) {
            return this.CanUpdateInfo
                && this.actionable(member);
        };
    canResetPassword(member) {
            return this.CanResetPassword
                && this.actionable(member);
        };
    canResetMFA(member) {
            return this.CanResetMFA
                && this.actionable(member);
        };
    canLockUser(member) {
            return this.CanLockUsers
                && this.actionable(member);
        };
    canDeactivateUser(member) {
            return this.CanDeactivateUsers
                && this.actionable(member);
        };
    }


    social.OrganizationContext = function (options) {
        options ??= {};

        this.Id = options.Id;
        this.Membership = {};

        for (const m in options.Membership)
            this.Membership[m] = new social.MemberContext(options.Membership[m]);
    };
    social.OrganizationContext.prototype.isSelf = function (user) {
        return user.Id == this.Id;
    };
    social.OrganizationContext.prototype.anyMember = function (predicate) {
        for (const m in this.Membership)
            if (predicate(this.Membership[m]))
                return true;
        return false;
    };
    social.OrganizationContext.prototype.anyTarget = function (user, predicate) {
        return user.Membership.any(target => {
            const source = this.Membership[target.Organization.Id];
            return source && predicate(source, target);
        });
    };
    social.OrganizationContext.prototype.canCreateUsers = function (org) {
        if (!org)
            return this.anyMember(i => i.CanCreateUsers);
        const source = this.Membership[org];
        return source && source.CanCreateUsers;
    };
    social.OrganizationContext.prototype.canViewUsers = function (org) {
        if (!org)
            return this.anyMember(i => i.CanViewUsers);
        const source = this.Membership[org];
        return source && source.CanViewUsers;
    };
    social.OrganizationContext.prototype.canModifyRoles = function (member) {
        if (!member)
            return this.anyMember(i => i.CanModifyRoles);
        const source = this.Membership[member.Organization.Id];
        return source && source.canModifyRoles(member);
    };
    social.OrganizationContext.prototype.canUpdateInfo = function (user) {
        if (!user)
            return this.anyMember(i => i.CanUpdateInfo);
        return this.anyTarget(user, (s, t) => s.canUpdateInfo(t));
    };
    social.OrganizationContext.prototype.canResetPassword = function (user) {
        if (!user)
            return this.anyMember(i => i.CanResetPassword);
        return this.anyTarget(user, (s, t) => s.canResetPassword(t));
    };
    social.OrganizationContext.prototype.canResetMFA = function (user) {
        if (!user)
            return this.anyMember(i => i.CanResetMFA);
        return this.anyTarget(user, (s, t) => s.canResetMFA(t));
    };
    social.OrganizationContext.prototype.canLockUser = function (user) {
        if (!user)
            return this.anyMember(i => i.CanLockUser);
        return this.anyTarget(user, (s, t) => s.canLockUser(t));
    };
    social.OrganizationContext.prototype.canDeactivateUser = function (user) {
        if (!user)
            return this.anyMember(i => i.CanDeactivateUser);
        return user.IsRemovable
            && this.anyTarget(user, (s, t) => s.canDeactivateUser(t));
    };



    social.UserResult = function (options) {
        options ??= {};

        this.IsSuccess = options.IsSuccess === true;
        this.User = null;
        this.Context = null;

        if (options.User)
            this.User = new social.User(options.User);
        if (options.Context)
            this.Context = new social.OrganizationContext(options.Context);
    };



    social.OrganizationUserResult = class extends social.UserResult {
        constructor(options) {
            options ??= {};

            social.UserResult.call(this, {
                IsSuccess: options.IsSuccess,
                Context: options.Context,
            });

            if (options.User)
                this.User = new social.OrganizationUser(options.User);
        };
    }



    social.LockInfo = function (options) {
        options ??= {};

        this.Type = options.Type ?? social.LockType.AdminLock;
        this.Reason = options.Reason ?? null;
    };



    social.MemberRole = function (options) {
        options ??= {};

        this.UserId = options.UserId;
        this.OrganizationId = options.OrganizationId;
        this.Role = options.Role ?? 0;
    };



    social.UserInfo = function (options) {
        options ??= {};

        if (typeof options.Organizations === 'string') {
            const orgs = [];
            for (const v of options.Organizations.split(','))
                orgs.push(parseInt(v));
            options.Organizations = orgs;
        }

        this.Organizations = options.Organizations ?? [];
        this.Role = options.Role ?? 0;
        this.NameFirst = options.NameFirst ?? null;
        this.NameLast = options.NameLast ?? null;
        this.EmailAddress = options.EmailAddress ?? null;
        this.PhoneBusiness = options.PhoneBusiness ?? null;
    };



    social.User = function (options) {
        options ??= {};

        this.Id = options.Id;
        this.Contact = new finys.Contact(options.Contact);
        this.Avatar = null;
        this.Alias = options.Alias;
        this.Location = options.Location ?? null;
        this.IsRemovable = options.IsRemovable === true;
        this.LastLogin = options.LastLogin ?? null;
        this.CreatedDate = options.CreatedDate ?? null;
        this.Lock = options.Lock ?? null;
        this.Status = options.Status ?? social.UserStatus.UNKNOWN;

        if (options.Avatar)
            this.Avatar = new finys.File(options.Avatar);

        if (this.Lock)
            this.Lock = new social.LockInfo(this.Lock);

        if (typeof this.LastLogin === 'string')
            this.LastLogin = kendo.parseDate(this.LastLogin);

        if (typeof this.CreatedDate === 'string')
            this.CreatedDate = kendo.parseDate(this.CreatedDate);
    };
    social.User.prototype.isLocked = function () {
        return !!this.Lock;
    };
    social.User.prototype.toSelection = function () {
        return new social.UserSelection({
            Count: 1,
            Values: [this]
        });
    };
    social.User.prototype.getAllRoles = function () {
        let result = 0;
        this.Membership.forEach(i => result |= i.Role);
        return result;
    };
    social.User.descriptionDelegate = (i, t) => i.Contact.getDisplayName();
    social.User.valueName = new finys.format.DescriptionMap({
        SingularLower: "user",
        PluralLower: "users",
        SingularCapitalized: "User",
        PluralCapitalized: "Users"
    });



    social.OrganizationUser = class extends social.User {
        constructor(options) {
            options ??= {};

            social.User.call(this, options);

            this.Membership = new finys.Collection();

            for (const org of options.Membership.Values ?? options.Membership)
                this.Membership.add(new social.OrganizationMember(org));
        };
    

    getMember(org) {
            for (const member of this.Membership.Values)
                if (member.Organization.Id == org)
                    return member;
            return null;
        };

    }

    social.OrganizationsMenuToggle = class extends finys.ObservableObject {
        constructor(parent) {
            finys.ObservableObject.call(this);
            this.Parent = parent;
        };
    

    onClick(e) {
            const menu = new finys.ContextMenu();

            this.Parent.User.Membership.forEach(i => menu.add({
                Text: i.Organization.Contact.getShortName(),
                IsVisible: () => this.Parent.OrganizationId !== i.Organization.Id,
                OnClick: () => this.Parent.setOrganization(i.Organization.Id)
            }));

            menu.on('open', () => this.addClass('f-open'));
            menu.on('close', () => this.removeClass('f-open'));

            menu.open();
        };
    preRender() {
            super.preRender();

            this.addClass("f-profile-org-more");
            this.addAttribute("type", "button");
            this.addAttribute("title", "See more organizations");
        };
    render() {
            this.preRender();

            return `<button ${this.renderAttributes()}>
                    +${this.Parent.User.Membership.count() - 1}
                </button>`;
        };
    initialize() {
            super.initialize();

            const e = this.getElement();
            e.on("click", i => this.onClick(i));

            if (!this.Parent.User.Membership
                .any(i => this.Parent.OrganizationId !== i.Id))
                e.css("display", "none");
        };
    }


    social.UserSelection = class extends finys.TableSelection {
        constructor(options) {
            options ??= {};

            finys.TableSelection.call(this, {
                Count: options.Count,
                Values: options.Values,
                IdSelector: i => i.Id,
                DescriptionDelegate: social.User.descriptionDelegate,
                ValueName: social.User.valueName
            });
        };
    }




    social.UserArray = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};

            finys.ObservableObject.call(this, options);

            this.Selection = new social.UserSelection(options.Selection);
            this.MoreAmount = this.getMoreAmount();
            this.Avatars = [];

            for (let i = 0; i < 4; i++) {
                const cur = this.Selection.Values[i];
                if (!cur
                    || i == 3 && this.MoreAmount)
                    break;

                this.Avatars.push(new social.Avatar({
                    UserId: cur.Id,
                    File: cur.Avatar
                }));
            }
        };
 

    initialize() {
            super.initialize();
            const e = this.getElement();

            for (const a of this.Avatars)
                a.appendTo(e);

            if (this.MoreAmount)
                this.appendMore();
        };
    onMoreClick(e) {

        };
    getMoreAmount() {
            if (this.Selection.Count == 4
                && this.Selection.count() == 4)
                return 0;
            return Math.max(this.Selection.Count - Math.min(this.Selection.count(), 3), 0);
        };
    preRender() {
            super.preRender();

            this.addClass("f-user-array");
        };
    appendMore() {
            const e = this.getElement(),
                text = finys.format.count(this.MoreAmount),
                m = $(`<button class="f-more-users" type="button">
                    <span class="f-plus">+</span>${text}
                </button>`);
            m.appendTo(e)
                .on("click", i => this.onMoreClick(i));
        };
    destroy() {
            for (const a of this.Avatars)
                a.destroy();

            super.destroy();
        };
    }


    social.UserRoleListing = class extends finys.ObservableCollection {
        constructor(options) {
            options ??= {};

            if (options.Container instanceof jQuery)
                options.Container = options.Container[0];

            finys.ObservableCollection.call(this);

            this.Context = options.Context;
            this.User = options.User;
            this.Member = options.Member ?? null;
            this.Container = options.Container;
            this.Selection = options.Selection ?? 3;
            this.Skip = options.Skip ?? 0;
            this.IsReadonly = options.IsReadonly === true;
            this.Total = 0;
        };


    readonly(value) {
            this.IsReadonly = value !== false;
            this.forEach(i => i.readonly(this.IsReadonly));
        };
    getContainer() {
            if (this.Container)
                return $(this.Container);
            return null;
        };
    onRemove(role) {
            this.trigger("remove", role);
            social.tryRemoveRole({
                Context: this.Context,
                User: this.User,
                Member: this.Member,
                Role: role.Info,
                OnActionComplete: () => this.onChange()
            });
        };
    onChange() {
            this.trigger("change");
        };
    onAssign() {
            this.trigger("assign");
            const w = social.openEditRolesWindow({
                Context: this.Context,
                User: this.User,
                Member: this.Member
            });
            w.on("contact-action-complete", () => this.onChange());
        };
    appendRoles(member) {
            const c = this.getContainer();

            this.clear();
            this.Member = member ?? this.Member;

            let roles = 0,
                readonly = true,
                skip = this.Skip;
            if (this.Member) // If member is set, use roles for member only
            {
                roles |= this.Member.Role;
                readonly = !this.Context.canModifyRoles(this.Member);
            }
            else // If no member set, take all roles for user
            {
                this.User.Membership.forEach(i => {
                    roles |= i.Role;
                    if (readonly && this.Context.canModifyRoles(i))
                        readonly = false;
                });
            }

            social.forOrganizationRole(i => {
                this.Total++;

                if (skip-- > 0
                    || this.count() >= this.Selection)
                    return true;

                const r = new social.UserRole({
                    Info: social.getRole(i)
                });
                r.readonly(this.IsReadonly);
                r.on("remove", () => this.onRemove(r));
                this.add(r);
            }, roles);

            if (!this.count()) {
                const r = new social.UserRole({
                    Info: social.getRole(social.OrganizationRole.Member)
                });
                r.readonly(this.IsReadonly);
                r.on("remove", () => this.onRemove(r));
                this.add(r);
            }

            if (this.Total > this.Selection) {
                this.add(new social.RolesMenuToggle({
                    Context: this.Context,
                    User: this.User,
                    Member: this.Member,
                    Selection: this.Selection,
                    Total: this.Total,
                    IsReadonly: this.IsReadonly
                }));
            }
            else {
                const a = new social.AssignRole({
                    User: this.User,
                    Member: this.Member,
                    IsReadonly: this.IsReadonly
                });
                a.on("click", () => this.onAssign())
                this.add(a);
            }

            this.forEach(i => i.appendTo(c));
            this.readonly(readonly);
        };
    clear() {
            this.forEach(i => i.destroy());
            super.clear();
            this.Total = 0;
        };
    destroy() {
            this.clear();
        };
    }


    social.openLockUserWindow = function (options) {
        if (social.lockUserWindow) {
            if (social.lockUserWindow.isVisible())
                return;
            social.lockUserWindow.destroy();
        }

        social.lockUserWindow = new social.LockUserWindow(options);
        social.lockUserWindow.on("close",
            () => {
                social.lockUserWindow.destroy();
                social.lockUserWindow = null;
            });

        social.lockUserWindow.open();
        return social.lockUserWindow;
    };



    social.openUnlockUserWindow = function (options) {
        if (social.lockUserWindow) {
            if (social.lockUserWindow.isVisible())
                return;
            social.lockUserWindow.destroy();
        }

        social.lockUserWindow = new social.UnlockUserWindow(options);
        social.lockUserWindow.on("close",
            () => {
                social.lockUserWindow.destroy();
                social.lockUserWindow = null;
            });

        social.lockUserWindow.open();
        return social.lockUserWindow;
    };




    social.LockUserWindow = class extends finys.Window {
        constructor(options) {
            options ??= {};

            this.Selection = options.Selection;

            finys.Window.call(this, {
                Title: options.Title || "Lock User(s)",
                Width: options.Width || "340px",
                Height: options.Height,
                Load: {
                    Url: "/AgencySelfMaintenance/AgencySelfMaintenance/LockView",
                    IsPassive: false
                }
            });
        };
    

    actionComplete() {
            const e = new finys.social.actionCompleteEvent(this.Selection);
            this.trigger(e);
        };
    show() {
            const vm = this.getViewModel();
            vm.init(this.Selection, this);
            super.show();
        };
    destroy() {
            const vm = this.getViewModel();
            if (vm) vm.onDestroy();
            super.destroy();
        };
    }



    social.UnlockUserWindow = class extends social.LockUserWindow {
        constructor(options) {
            options ??= {};
            options.Title ??= "Unlock User(s)";

            social.LockUserWindow.call(this, options);
        };


    show() {
            const vm = this.getViewModel();
            vm.initUnlock(this.Selection, this);
            super.show();
        };
    }


    social.StatusIndicator = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};

            finys.ObservableObject.call(this, options);

            this.User = options.User;
            this.IsReadonly = options.IsReadonly === true;
        }


    readonly(value) {
            this.IsReadonly = value !== false;

            if (this.IsReadonly)
                this.addClass("f-readonly");
            else this.removeClass("f-readonly");
        };
    set(value) {
            const e = this.getElement();

            this.User.Status = value ?? this.User.Status;

            switch (this.User.Status) {
                case social.UserStatus.AVAILABLE:
                    e.attr("class", "f-status-indicator f-status-available");
                    e.attr("title", "User is active");
                    break;
                case social.UserStatus.IDLE:
                    e.attr("class", "f-status-indicator f-status-idle");
                    e.attr("title", "User is idle");
                    break;
                case social.UserStatus.AWAY:
                    e.attr("class", "f-status-indicator f-status-away");
                    e.attr("title", "User is away");
                    break;
                case social.UserStatus.BUSY:
                    e.attr("class", "f-status-indicator f-status-busy");
                    e.attr("title", "User is busy");
                    break;
                case social.UserStatus.DO_NOT_DISTURB:
                    e.attr("class", "f-status-indicator f-status-no-disturb");
                    e.attr("title", "Do not disturb");
                    break;
                case social.UserStatus.INACTIVE:
                    e.attr("class", "f-status-indicator f-status-inactive");
                    e.attr("title", "User is inactive");
                    break;
                default:
                    e.attr("class", "f-status-indicator f-status-unknown");
                    e.attr("title", "Unknown Status");
                    break;
            }
        };
    preRender() {
            super.preRender();

            this.addClass("f-status-indicator");
            this.addAttribute("type", "button");

            if (this.IsReadonly)
                this.addClass("f-readonly");

            switch (this.User.Status) {
                case social.UserStatus.AVAILABLE:
                    this.addClass("f-status-available");
                    this.addAttribute("title", "User is active");
                    break;
                case social.UserStatus.IDLE:
                    this.addClass("f-status-idle");
                    this.addAttribute("title", "User is idle");
                    break;
                case social.UserStatus.AWAY:
                    this.addClass("f-status-away");
                    this.addAttribute("title", "User is away");
                    break;
                case social.UserStatus.BUSY:
                    this.addClass("f-status-busy");
                    this.addAttribute("title", "User is busy");
                    break;
                case social.UserStatus.DO_NOT_DISTURB:
                    this.addClass("f-status-no-disturb");
                    this.addAttribute("title", "Do not disturb");
                    break;
                case social.UserStatus.INACTIVE:
                    this.addClass("f-status-inactive");
                    this.addAttribute("title", "User is inactive");
                    break;
                default:
                    this.addClass("f-status-unknown");
                    this.addAttribute("title", "Unknown Status");
                    break;
            }
        };
    render() {
            this.preRender();
            return `<button ${this.renderAttributes()}></button>`;
        };
    }


    social.resetPasswordAsync = function (selection) {
        return finys.ajax({
            Url: "/AgencySelfMaintenance/Security/ResetPassword",
            Data: kendo.stringify(selection.getIds())
        });
    };
    social.resetMFAAsync = function (selection) {
        return finys.ajax({
            Url: "/AgencySelfMaintenance/Security/ResetMFA",
            Data: kendo.stringify(selection.getIds())
        });
    };
    social.deleteUsersAsync = function (selection) {
        return finys.ajax({
            Url: "/AgencySelfMaintenance/Security/DeleteUsers",
            Data: kendo.stringify(selection.getIds())
        });
    };
    social.lockUsersAsync = function (selection, lock) {
        return finys.ajax({
            Url: "/AgencySelfMaintenance/Security/LockUsers",
            Data: kendo.stringify({
                selection: selection.getIds(),
                lock: lock
            })
        });
    };
    social.unlockUsersAsync = function (selection) {
        return finys.ajax({
            Url: "/AgencySelfMaintenance/Security/UnlockUsers",
            Data: kendo.stringify(selection.getIds())
        });
    };
    social.addUserAsync = function (user) {
        const u = new social.UserInfo(user);
        return finys.ajax({
            Url: "/AgencySelfMaintenance/Security/AddUser",
            Data: kendo.stringify(u)
        });
    };
    social.updateInfoAsync = function (user, info) {
        const i = new finys.Contact(info);
        return finys.ajax({
            Url: "/AgencySelfMaintenance/Security/UpdateInfo",
            Data: kendo.stringify({
                user: user,
                info: i
            })
        });
    };
    social.modifyRolesAsync = function (member, role) {
        const i = new social.MemberRole({
            UserId: member.UserId,
            OrganizationId: member.Organization.Id,
            Role: role
        });
        return finys.ajax({
            Url: "/AgencySelfMaintenance/Security/ModifyRoles",
            Data: kendo.stringify({ role: i })
        });
    };
    social.removeRoleAsync = function (member, role) {
        return social.modifyRolesAsync(member, member.Role & ~role);
    };



    social.loadContextAsync = async function () {
        const r = await finys.ajax({
            Url: "/AgencySelfMaintenance/AgencySelfMaintenance/GetContext"
        });
        return new social.OrganizationContext(r);
    };



    social.openContactCard = function (options) {
        const result = new social.ContactCard(options);
        result.open();
        return result;
    };



    social.loadUserAsync = async function (id) {
        const r = await finys.ajax({
            Url: "/AgencySelfMaintenance/AgencySelfMaintenance/GetUser",
            Data: kendo.stringify({
                id: id
            })
        });
        return new social.UserResult(r);
    };



    social.loadOrganizationUserAsync = async function (id) {
        const r = await finys.ajax({
            Url: "/AgencySelfMaintenance/AgencySelfMaintenance/GetOrganizationUser",
            Data: kendo.stringify({
                id: id
            })
        });
        return new social.OrganizationUserResult(r);
    };



    social.loadContactCardAsync = async function (id) {
        const r = await social.loadOrganizationUserAsync(id);
        if (r.IsSuccess)
            social.openContactCard({
                User: r.User,
                Context: r.Context
            });
    };



    social.ContactCard = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};
            options.Identity = "finysContactCard";

            finys.ObservableObject.call(this, options);

            this.Context = new social.OrganizationContext(options.Context);
            this.User = new social.OrganizationUser(options.User);
            this.IsEditing = options.IsEditing === true;
            this.Observable = null;
            this.Avatar = null;
            this.OrganizationId = options.OrganizationId ?? null;
            this.Position = null;
            this.IsOpen = false;
            this.Overlay = null;
            this.Status = null;
            this.RoleListing = null;
            this.OrganizationsMenuToggle = null;
            this.LockingModule = null;
            this.MenuToggle = null;
            this.HeaderDOM = null;
            this.ContentDOM = null;
            this.FooterDOM = null;
            this.DragController = new finys.DragController();
            this.DragController.on("drag", i => this.onDrag(i));
        };


    openLockWindow() {
            const w = social.openLockUserWindow({
                Selection: this.User.toSelection()
            });
            w.on("action-complete", () => this.reloadAsync());
            return w;
        };
    openUnlockWindow() {
            const w = social.openUnlockUserWindow({
                Selection: this.User.toSelection()
            });
            w.on("action-complete", () => this.reloadAsync());
            return w;
        };
    gotoProfile() {

        };
    uploadPhoto() {
            this.Avatar.open();
        };
    resetPassword() {
            const s = this.User.toSelection();
            social.confirm({
                Selection: s,
                Message: `Reset password for ${s.getDescription()}?`,
                OnConfirm: () => social.resetPasswordAsync(s)
                    .then(() => this.actionComplete())
            });
        };
    resetMFA() {
            const s = this.User.toSelection();
            social.confirm({
                Selection: s,
                Message: `Reset Multi-Factor Authentication for ${s.getDescription()}?`,
                OnConfirm: () => social.resetMFAAsync(s)
                    .then(() => this.actionComplete())
            });
        };
    deleteUser() {
            const s = this.User.toSelection();
            social.confirm({
                Selection: s,
                Message: `Are you sure you want to delete ${s.getDescription()}?`,
                OnConfirm: () => social.deleteUsersAsync(s)
                    .then(() => this.actionComplete())
            });
        };
    onActionComplete(e) {
            if (e.Users.containsId(this.User.Id))
                this.reloadAsync();
        };
    actionComplete() {
            const e = new finys.social.actionCompleteEvent(this.User);
            this.trigger(e);
        };
    changeAvatar(value) {
            this.User.Avatar = value;
            const e = new social.avatarChangeEvent(this.User);
            this.trigger(e);
        };
    onAvatarChange(e) {
            if (e.User.Id != this.User.Id)
                return;

            this.User.Avatar = e.User.Avatar;
            this.Avatar.reloadAsync();
        };
    onDrag(offset) {
            const coords = finys.Vector2.sum(this.Position, offset);
            this.move(coords);
        };
    move(position) {
            const e = this.getElement();

            e.css("top", `${position.y}px`);
            e.css("left", `${position.x}px`);
        };
    setOrganization(id) {
            this.OrganizationId = id;
            this.updateOrganization();
        };
    updateOrganization() {
            const e = this.getElement(),
                member = this.getMember(),
                name = e.find(".f-contact-card-module.f-contact-card-module-profile > .f-profile-content > .f-profile-orgs > span.f-profile-org-name");
            name.text(member.Organization.Contact.getShortName());

            this.RoleListing.appendRoles(member);
        };
    getMember(org) {
            org ??= this.OrganizationId;
            return this.User.getMember(this.OrganizationId);
        };
    appendEditButton(container) {
            if (this.Context.canUpdateInfo(this.User)) {
                const edit = $(`<button class="f-header-action f-user-edit" title="Edit information" type="button">${finys.vector.PENCIL}</button>`)
                    .appendTo(container);
                edit.on("click", () => this.toggleEditing());
            }
        };
    appendLockButton(container) {
            if (this.Context.canLockUser(this.User)) {
                let lock = null;
                if (this.User.isLocked())
                    lock = $(`<button class="f-header-action f-user-unlock" title="User is locked" type="button">${finys.vector.LOCK}</button>`)
                        .appendTo(container);
                else
                    lock = $(`<button class="f-header-action f-user-lock" title="User is not locked" type="button">${finys.vector.LOCK_STRIKE}</button>`)
                        .appendTo(container);
                lock.on("click", () => this.showLocking());
            }
        };
    onRoleChange() {
            this.actionComplete();
        };
    setUser(user, context) {
            this.User = user;
            this.Context = context ?? r.Context;
            this.clear();
            this.appendUser();
            this.showProfile();
        };
    async loadAsync(id) {
            const r = await social.loadOrganizationUserAsync(id);
            this.setUser(r.User, r.Context);
        };
    reloadAsync() {
            return this.loadAsync(this.User.Id);
        };
    initialize() {
            super.initialize();

            const e = this.getElement(),
                head = e.find(".f-contact-card-module.f-contact-card-module-profile > header.f-profile-header"),
                content = e.find(".f-contact-card-module.f-contact-card-module-profile > .f-profile-content"),
                footer = e.find(".f-contact-card-module.f-contact-card-module-profile > footer.f-profile-footer"),
                exit = head.find("button.f-profile-exit"),
                save = footer.find("button.f-profile-save"),
                b = $("body");

            this.HeaderDOM = head[0];
            this.ContentDOM = content[0];
            this.FooterDOM = footer[0];

            this.appendUser();

            exit.on("click", () => this.destroy());
            save.on("click", () => this.saveAsync());

            this._onActionComplete = e => this.onActionComplete(e);
            this._onAvatarChange = e => this.onAvatarChange(e);

            b.on("contact-action-complete", this._onActionComplete);
            b.on("contact-avatar-change", this._onAvatarChange);

            this.Position = new finys.Vector2({
                x: (window.innerWidth - this.DOM.offsetWidth) / 2.0,
                y: (window.innerHeight - this.DOM.scrollHeight) / 2.0
            });
            e.css("top", `${this.Position.y}px`);
            e.css("left", `${this.Position.x}px`);
        };
    appendUser() {
            const e = this.getElement(),
                panel = e.find(".f-contact-card-panel"),
                head = this.getHeaderElement(),
                content = this.getContentElement(),
                orgs = content.find(".f-profile-orgs"),
                r = content.find(".f-user-roles");

            this.Observable = kendo.observable({
                dc: {
                    Contact: new finys.Contact(this.User.Contact)
                }
            });
            this.Avatar = new social.Avatar({
                UserId: this.User.Id,
                File: this.User.Avatar,
                IsReadonly: !this.Context.canUpdateInfo(this.User)
            });
            this.OrganizationId ??= this.User.Membership.first().Organization.Id;
            this.Status = new social.StatusIndicator({
                User: this.User,
                IsReadonly: true
            });
            this.RoleListing = new social.UserRoleListing({
                Context: this.Context,
                User: this.User,
                Container: r
            });
            this.OrganizationsMenuToggle = new social.OrganizationsMenuToggle(this);
            this.LockingModule = new social.LockingModule({
                User: this.User
            });
            this.MenuToggle = new finys.MenuToggle({
                Parent: this,
                IsVertical: true
            });

            this.Avatar.on("change", i => this.changeAvatar(i));
            this.RoleListing.on("change", () => this.onRoleChange());

            this.LockingModule.on("submit-unlock", () =>
                social.unlockUsersAsync(this.User.toSelection())
                    .then(() => this.actionComplete()));
            this.LockingModule.on("submit-lock", i =>
                social.lockUsersAsync(this.User.toSelection(), i)
                    .then(() => this.actionComplete()));

            //this.MenuToggle.MenuItems.push({
            //    Order: 10,
            //    Text: "View profile",
            //    Comment: "Navigate to the profile page for this user",
            //    OnClick: () => this.gotoProfile()
            //});

            if (this.Context.canUpdateInfo(this.User)) {
                this.MenuToggle.MenuItems.push({
                    Order: 20,
                    Text: "Edit information",
                    Comment: "Edit contact information for this user",
                    OnClick: () => this.editing()
                });
                this.MenuToggle.MenuItems.push({
                    Order: 30,
                    Text: "Change photo",
                    Comment: "Upload a new photo for this user",
                    OnClick: () => this.uploadPhoto()
                });
            }

            if (this.Context.canResetPassword(this.User))
                this.MenuToggle.MenuItems.push({
                    Order: 40,
                    Text: "Reset password",
                    Comment: "Reset this user's password",
                    OnClick: () => this.resetPassword()
                });

            if (this.Context.canResetMFA(this.User))
                this.MenuToggle.MenuItems.push({
                    Order: 50,
                    Text: "Reset MFA",
                    Comment: "Reset Multi-Factor Authentication for this user",
                    OnClick: () => this.resetMFA()
                });

            if (this.Context.canLockUser(this.User)) {
                if (this.User.isLocked())
                    this.MenuToggle.MenuItems.push({
                        Order: 60,
                        Text: "Unlock user",
                        Comment: "Unlock this user's account",
                        OnClick: () => this.showLocking()
                    });
                else {
                    this.MenuToggle.MenuItems.push({
                        Order: 60,
                        Text: "Lock user",
                        Comment: "Lock this user's account",
                        OnClick: () => this.showLocking()
                    });
                }
            }

            if (this.Context.canDeactivateUser(this.User))
                this.MenuToggle.MenuItems.push({
                    Order: 70,
                    Text: "Delete user",
                    Comment: "Delete this user's account",
                    OnClick: () => this.deleteUser()
                });

            this.Avatar.appendTo(head);
            this.Status.appendTo(head);
            this.updateOrganization();
            this.appendDetails();
            this.appendLockButton(head);
            this.appendEditButton(head);
            this.MenuToggle.appendTo(head);
            this.LockingModule.appendTo(panel);

            if (this.User.Membership.count() > 1)
                this.OrganizationsMenuToggle.appendTo(orgs);

            this.LockingModule.on("exit", () => this.showProfile());

            this.DragController.bind(head);
            this.DragController.bind(this.LockingModule.getHeaderElement());
        };
    getHeaderElement() {
            if (this.HeaderDOM)
                return $(this.HeaderDOM);
            return null;
        };
    getContentElement() {
            if (this.ContentDOM)
                return $(this.ContentDOM);
            return null;
        };
    getFooterElement() {
            if (this.FooterDOM)
                return $(this.FooterDOM);
            return null;
        };
    showProfile() {
            const e = this.getElement();
            e.removeClass("f-show-locking");
        };
    showLocking() {
            const e = this.getElement();
            e.addClass("f-show-locking");
        };
    toggleEditing() {
            this.editing(!this.IsEditing);
        };
    editing(value) {
            this.IsEditing = value !== false;

            if (this.IsEditing)
                this.addClass("f-editing");
            else {
                this.removeClass("f-editing");
                this.Observable.set("dc.Contact", this.User.Contact);
            }
        };
     async saveAsync() {
            if (!this.IsEditing)
                return;
            const r = await social.updateInfoAsync(this.User.Id, this.Observable.dc.Contact);
            if (r.IsSuccess)
                this.actionComplete();
        };
    appendDetails() {
            const content = this.getContentElement(),
                id = content.find(".f-profile-id"),
                d = content.find("ul.f-profile-details");

            id.append(`<span class="f-profile-name f-editable">${this.User.Contact.getDisplayName()}</span>
            <button class="f-profile-badge f-editable" title="Verified" type="button">${_verified}</button>
            <input class="k-textbox kendoText fb-input f-editor" placeholder="First name" maxlength="50" data-bind="value: dc.Contact.NameFirst">
            <input class="k-textbox kendoText fb-input f-editor" placeholder="Last name" maxlength="50" data-bind="value: dc.Contact.NameLast">`);

            switch (this.User.Status) {
                case social.UserStatus.UNKNOWN:
                    $(`<li>${finys.vector.USER_STRIKE}<span class="f-profile-detail">Status unknown</span></li>`)
                        .appendTo(d);
                    break;
                case social.UserStatus.INACTIVE:
                    if (this.User.LastLogin) {
                        const l = new finys.format.Duration({
                            Since: this.User.LastLogin,
                            Threshold: finys.format.TimeUnit.DAY,
                            DescriptionType: 0,
                            NowText: "less than a day"
                        });
                        $(`<li>${finys.vector.USER_STRIKE}<span class="f-profile-detail">Inactive for ${l.print()}</span></li>`)
                            .appendTo(d);
                    }
                    else $(`<li>${finys.vector.USER_STRIKE}<span class="f-profile-detail">Inactive</span></li>`)
                        .appendTo(d);
                    break;
                default:
                    if (this.User.LastLogin) {
                        const l = new finys.format.Duration({
                            Since: this.User.LastLogin,
                            Threshold: finys.format.TimeUnit.DAY,
                            DescriptionType: 0,
                            AgoText: "ago",
                            NowText: "today"
                        });
                        $(`<li>${finys.vector.USER}<span class="f-profile-detail">Last seen ${l.print()}</span></li>`)
                            .appendTo(d);
                    }
                    else $(`<li>${finys.vector.USER}<span class="f-profile-detail">Online now</span></li>`)
                        .appendTo(d);
                    break;
            }

            if (this.User.Contact.EmailAddress)
                $(`<li>
                    ${finys.vector.ENVELOPE}
                    <span class="f-profile-detail f-editable">
                        <a href="mailto:${this.User.Contact.EmailAddress}">${this.User.Contact.EmailAddress}</a>
                    </span>
                    <input class="k-textbox kendoText fb-input f-editor" placeholder="Email address" maxlength="50" data-bind="value: dc.Contact.EmailAddress">
                </li>`)
                    .appendTo(d);
            else
                $(`<li>
                    ${finys.vector.ENVELOPE_STRIKE}
                    <span class="f-profile-detail f-editable">${finys.format.NOT_ON_FILE}</span>
                    <input class="k-textbox kendoText fb-input f-editor" placeholder="Email address" maxlength="50" data-bind="value: dc.Contact.EmailAddress">
                </li>`)
                    .appendTo(d);

            if (this.User.Contact.PhoneBusiness)
                $(`<li>
                    ${finys.vector.PHONE}
                    <span class="f-profile-detail f-editable">
                        <a href="tel:${this.User.Contact.PhoneBusiness}">${this.User.Contact.getDisplayPhoneBusiness()}</a>
                    </span>
                    <input class="k-textbox kendoText fb-input f-editor" data-role="maskedtextbox" data-mask="(000) 000-0000 x0000" data-unmask-on-post="true" data-clear-prompt-char="true" placeholder="Phone number" maxlength="14" data-bind="value: dc.Contact.PhoneBusiness">
                </li>`)
                    .appendTo(d);
            else
                $(`<li>
                    ${finys.vector.PHONE_STRIKE}
                    <span class="f-profile-detail f-editable">${finys.format.NOT_ON_FILE}</span>
                    <input class="k-textbox kendoText fb-input f-editor" data-role="maskedtextbox" data-mask="(000) 000-0000 x0000" data-unmask-on-post="true" data-clear-prompt-char="true" placeholder="Phone number" maxlength="14" data-bind="value: dc.Contact.PhoneBusiness">
                </li>`)
                    .appendTo(d);

            if (this.User.Location)
                $(`<li>${finys.vector.PIN}<span class="f-profile-detail">${this.User.Location}</span></li>`)
                    .appendTo(d);
            else
                $(`<li>${finys.vector.PIN_STRIKE}<span class="f-profile-detail">${finys.format.NOT_ON_FILE}</span></li>`)
                    .appendTo(d);

            kendo.bind(content, this.Observable);
        };
    preRender() {
            super.preRender();

            this.addClass("f-contact-card");
            this.addClass("f-kendo-refresh");

            if (this.IsEditing)
                this.addClass("f-editing");
        };
    render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
                <div class="f-contact-card-panel">
                    ${_cardGradient}
                    <div class="f-contact-card-module f-contact-card-module-profile">
                        <header class="f-profile-header">
                            <button type="button" class="f-header-action f-profile-exit" title="Go back">${finys.vector.ARROW_W}</button>
                        </header>
                        <div class="f-module-content f-profile-content">
                            <div class="f-profile-id"></div>
                            <div class="f-profile-orgs">
                                <span class="f-profile-org-name"></span>
                            </div>
                            <div class="f-user-roles"></div>
                            <ul class="f-profile-details"></ul>
                        </div>
                        <footer class="f-profile-footer">
                            <button type="button" class="f-profile-link">Profile</button>
                            <button type="button" class="f-profile-save">Save</button>
                        </footer>
                    </div>
                </div>
            </div>`;
        };
    getOverlay() {
            if (this.Overlay)
                return $(this.Overlay);
            return null;
        };
    open() {
            let result = this.getElement();

            if (!result) {
                const o = social.getCardOverlay();
                social.closeCards();
                this.appendTo(o);
                this.Overlay = o[0];
            }

            setTimeout(() => {
                this.IsOpen = true;
                this.getOverlay()?.addClass("f-open");
                this.trigger('open');
            }, 10);

            return result;
        };
    close() {
            this.getOverlay()?.removeClass("f-open");
            this.IsOpen = false;
            this.trigger('close');
        };
    clear() {
            const e = this.getElement(),
                content = this.getContentElement(),
                l = e.find("button.f-header-action.f-user-lock,button.f-header-action.f-user-unlock"),
                id = content.find(".f-profile-id"),
                d = content.find("ul.f-profile-details");

            l.remove();
            this.DragController.unbindAll();
            this.Avatar.destroy();
            this.Status.destroy();
            this.OrganizationsMenuToggle.destroy();
            this.MenuToggle.destroy();
            this.RoleListing.destroy();
            this.LockingModule.destroy();

            kendo.destroy(content);
            id.empty();
            d.empty();

            this.editing(false);
        };
    destroy() {
            const b = $("body");

            this.close();
            this.clear();
            this.DragController.destroy();

            if (this._onActionComplete)
                b.off("contact-action-complete", this._onActionComplete);
            if (this._onAvatarChange)
                b.off("contact-avatar-change", this._onAvatarChange);

            super.destroy();
        };
    }


    social.LockingModule = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};

            finys.ObservableObject.call(this, options);

            this.Context = options.Context;
            this.User = options.User;
            this.Fields = new social.LockingFields({
                User: this.User
            });
            this.HeaderDOM = null;
            this.ContentDOM = null;
            this.FooterDOM = null;
        };


    initialize() {
            super.initialize();

            const e = this.getElement(),
                head = e.find("header.f-locking-header"),
                content = e.find(".f-locking-content"),
                footer = e.find("footer.f-locking-footer"),
                exit = head.find("button.f-locking-exit"),
                submit = footer.find("button.f-locking-submit");

            this.HeaderDOM = head[0];
            this.ContentDOM = content[0];
            this.FooterDOM = footer[0];
            this.Fields.appendTo(content);

            exit.on("click", () => this.exit());
            submit.on("click", () => this.submit());
        };
    getHeaderElement() {
            if (this.HeaderDOM)
                return $(this.HeaderDOM);
            return null;
        };
    getContentElement() {
            if (this.ContentDOM)
                return $(this.ContentDOM);
            return null;
        };
    getFooterElement() {
            if (this.FooterDOM)
                return $(this.FooterDOM);
            return null;
        };
    submit() {
            if (this.User.isLocked()) {
                this.trigger("submit-unlock");
                return;
            }
            if (this.validate())
                this.trigger("submit-lock", this.Fields.getValue());
        };
    validate() {
            if (this.Fields.validate()) {
                this.markValid();
                return true;
            }
            this.markInvalid();
            return false;
        };
    markValid() {
            this.removeClass("f-form-invalid");
        };
    markInvalid() {
            this.addClass("f-form-invalid");
        };
    exit() {
            this.trigger("exit");
        };
    preRender() {
            super.preRender();

            this.addClass("f-contact-card-module f-contact-card-module-locking");
        };
    render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
                <header class="f-locking-header">
                    <button type="button" class="f-header-action f-locking-exit" title="Go back" type="button">${finys.vector.ARROW_W}</button>
                    <h1 class="f-locking-title">${this.getTitle()}</h1>
                </header>
                <div class="f-module-content f-locking-content fb-group">
                </div>
                <footer class="f-locking-footer">
                    <div class="f-error-message">Please complete all required fields</div>
                    <button type="button" class="f-locking-submit">${this.getSubmitText()}</button>
                </footer>
            </div>`;
        };
    getTitle() {
            if (this.User.isLocked())
                return "Unlock this user?";
            return "Lock this user?";
        };
    getSubmitText() {
            if (this.User.isLocked())
                return "Unlock";
            return "Lock";
        };
    destroy() {
            this.Fields.destroy();

            super.destroy();
        };
    }


    social.LockingFields = class extends finys.Collection {
        constructor(options) {
            options ??= {};

            finys.Collection.call(this);
            this.sortedBy(i => i.Sequence);

            const l = new social.LockInfo(options.User.Lock);

            this.User = options.User;
            this.IsEnabled = options.IsEnabled !== false;
            this.Container = null;
            this.Observable = kendo.observable({
                dc: {
                    Lock: l
                }
            });
            this.LockType = finys.forms.DropDownControl({
                Label: "Lock Type",
                IsEnabled: false,
                IsRequired: true,
                Value: l.Type,
                Options: social.getLockTypeOptions(),
                SourceBind: finys.forms.SourceBind({
                    Table: "Lock",
                    Field: "Type"
                })
            });
            this.LockReason = finys.forms.TextAreaControl({
                Label: "Lock Reason",
                Rows: 5,
                IsEnabled: this.IsEnabled && !this.User.isLocked(),
                IsRequired: true,
                MaxLength: 255,
                Value: l.Reason,
                SourceBind: finys.forms.SourceBind({
                    Table: "Lock",
                    Field: "Reason"
                })
            });
        };
 

    reset() {
            this.setValue(new social.LockInfo(this.User.Lock));
        };
    validate() {
            if (this.LockReason.getValue()) {
                this.LockReason.markValid();
                return true;
            }
            this.LockReason.markInvalid();
            return false;
        };
    setValue(value) {
            this.Observable?.set("dc.Lock", value);
        };
    getValue() {
            return new social.LockInfo(this.Observable?.get("dc.Lock"));
        };
    enable(value) {
            this.IsEnabled = value !== false;
            this.LockReason.enable(this.IsEnabled && !this.User.isLocked());
        };
    appendTo(container) {
            this.Container = container;
            this.LockType.appendTo(this.Container);
            this.LockReason.appendTo(this.Container);
            kendo.bind(this.Container, this.Observable);
        };
    destroy() {
            this.LockType.destroy();
            this.LockReason.destroy();
            kendo.destroy(this.Container);
        };
    }


    social.UserPreview = class extends finys.ScreenObject {
        constructor(options) {
            options ??= {};
            options.Identity = "finysUserPreview";

            finys.ScreenObject.call(this, options);

            this.Context = null;
            if (options.Context)
                this.Context = new social.OrganizationContext(options.Context);

            this.User = new social.User(options.User);
            this.IsInteractive = options.IsInteractive === true;
            this.Avatar = new social.Avatar({
                UserId: this.User.Id,
                File: this.User.Avatar,
                IsReadonly: !this.IsInteractive
                    || !this.Context?.canUpdateInfo(this.User)
            });
            this.Status = new social.StatusIndicator({
                User: this.User
            });
        };
 

    uploadPhoto() {
            this.Avatar.open();
        };
    openContactCard() {
            social.loadContactCardAsync(this.User.Id)
        };
    initialize() {
            super.initialize();

            const e = this.getElement(),
                a = e.find(".f-user-preview-avatar"),
                n = e.find("a[href].f-user-name");

            this.Avatar.appendTo(a);
            this.Status.appendTo(a);

            if (n.length)
                n.on("click", () => this.openContactCard());
        };
    preRender() {
            super.preRender();

            this.addClass("f-user-preview");
        };
    renderName() {
            if (this.IsInteractive)
                return `<a href="#" class="f-user-name">${this.User.Contact.getDisplayName()}</a>`;
            return `<span class="f-user-name">${this.User.Contact.getDisplayName()}</span>`;
        };
    render() {
            this.preRender();

            return `<div ${this.renderAttributes()}>
                <div class="f-user-preview-avatar"></div>
                <div class="f-user-preview-name">
                    ${this.renderName()}
                    <span class="f-user-alias">${this.User.Alias}</span>
                </div>
            </div>`;
        };
    destroy() {
            this.Avatar.destroy();
            this.Status.destroy();

            super.destroy();
        };
    }

    social.Avatar = class extends finys.ObservableObject {
        constructor(options) {
            options ??= {};
            if (typeof options === 'number')
                options = { UserId: options };

            options.Identity = "finysAvatar";

            finys.ObservableObject.call(this, options);

            this.UserId = options.UserId;
            this.File = null;
            this.UploadUrl = options.UploadUrl ?? '/AgencySelfMaintenance/Security/UploadAvatar';
            this.UploadMethod = options.UploadMethod ?? 'POST';
            this.DownloadUrl = options.DownloadUrl ?? '/AgencySelfMaintenance/AgencySelfMaintenance/DownloadAvatar';
            this.DownloadMethod = options.DownloadMethod ?? 'GET';
            this.SourceUrl = options.SourceUrl ?? '/AgencySelfMaintenance/AgencySelfMaintenance/GetAvatar';
            this.DroppedFiles = [];
            this.IsAdvanced = false;
            this.IsReadonly = options.IsReadonly !== false;

            if (options.File)
                this.File = new finys.File(options.File);
        };
   

    getRoute() {
            if (!this.File)
                return "";
            return `${this.SourceUrl}/${this.File.FileName}?ft=${encodeURIComponent(this.File.FileToken)}`;
        };
    initialize() {
            super.initialize();
            const e = this.getElement();

            this.IsAdvanced = finys.isFileDragSupported(this.DOM);

            this.getInput()
                .on('change submit', i => this.onSubmit(i));

            if (this.IsAdvanced) {
                e.addClass('f-advanced');

                e.on('dragover dragenter', i => this.dragEnter(i));
                e.on('dragleave dragend drop', i => this.dragExit(i));
                e.on('drop', i => this.drop(i));
            }
        };
    readonly(value) {
            this.IsReadonly = value !== false;

            if (this.IsReadonly)
                this.addClass("f-readonly");
            else this.removeClass("f-readonly");
        };
    dragEnter(e) {
            if (this.IsReadonly)
                return;

            e.preventDefault();
            e.stopPropagation();

            this.getElement()
                .addClass('f-is-dragover');
        };
    dragExit(e) {
            if (this.IsReadonly)
                return;

            e.preventDefault();
            e.stopPropagation();

            this.getElement()
                .removeClass('f-is-dragover');
        };
    drop(e) {
            if (this.IsReadonly)
                return;

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
    reloadAsync() {
            finys.ajax({
                Url: this.DownloadUrl,
                Type: this.DownloadMethod,
                Data: $.param({ id: this.UserId }),
                Success: r => {
                    if (r.IsSuccess) {
                        this.File = new finys.File(r.Avatar);
                        this.getImage()
                            .attr("src", this.getRoute());
                        this.trigger('load', this.File);
                    }
                }
            });
        };
    onSubmit(e) {
            const drop = this.getElement(),
                $input = this.getInput(),
                name = $input.attr('name'),
                input = $input.get(0);

            e.preventDefault();

            if (drop.hasClass('f-is-uploading'))
                return false;

            if (this.IsAdvanced) {
                const data = new FormData();

                if (this.DroppedFiles.length)
                    data.append(name, this.DroppedFiles[0]);
                else if (input.files?.length)
                    data.append(name, input.files[0]);

                this.DroppedFiles = [];
                $input.val(null);

                data.append('user', this.UserId);
                this.trigger('upload', data);

                finys.ajax({
                    Url: this.UploadUrl,
                    Type: this.UploadMethod,
                    Data: data,
                    ContentType: false,
                    Success: r => {
                        if (r.IsSuccess) {
                            this.File = new finys.File(r.Avatar);
                            this.getImage()
                                .attr("src", this.getRoute());
                            this.trigger('change', this.File);
                        }
                    }
                });
            }
            else {
                const name = `uploadiframe${new Date().getTime()}`,
                    frame = $(`<iframe name='${name}' style='display: none;'></iframe>`);

                $('body').append(frame);
                drop.attr('target', name);

                frame.one('load', function () {
                    const r = JSON.parse(frame.contents().find('body').text());

                    if (r.IsSuccess) {
                        this.File = new finys.File(r.Avatar);
                        this.getImage()
                            .attr("src", this.getRoute());
                        this.trigger('change', r.Avatar);
                    }

                    drop.removeAttr('target');
                    frame.remove();
                });
            }
        };
    getImage() {
            return this.getElement()
                .find("img");
        };
    preRender() {
            super.preRender();

            this.addClass("f-avatar");
            this.addAttribute("enctype", "multipart/form-data");

            if (this.IsReadonly)
                this.addClass("f-readonly");

            this.addAttribute("method", this.UploadMethod);
            this.addAttribute("action", this.UploadUrl);
        };
    render() {
            this.preRender();

            return `<form ${this.renderAttributes()}>
            <label for='file-${this.Uid}'>
                ${finys.vector.CAMERA}
                <span>Change Photo</span>
            </label>
            <input type='file' id='file-${this.Uid}' name='photo' accept='image/*' />
            <img src="${this.getRoute()}">
        </form>`;
        };
    }


    const _getModifyRolesMember = function (options) {
        if (options.Member)
            return options.Member;

        let member = null;
        options.User.Membership.forEach(i => {
            if (!options.Context.canModifyRoles(i))
                return true;
            if (member === null)
                member = i;
            else if (member.Organization.Id != i.Organization.Id) {
                member = null;
                return false;
            }
        });
        return member;
    };

    social.tryRemoveRole = function (options) {
        const member = _getModifyRolesMember(options);
        if (member) {
            const s = options.User.toSelection();
            social.confirm({
                Selection: s,
                Message: `Remove '${options.Role.Name}' role from ${s.getDescription()}?`,
                OnConfirm: () => social.removeRoleAsync(member, options.Role.Value)
                    .then(() => {
                        if (options.OnActionComplete)
                            options.OnActionComplete();
                    })
            });
            return true;
        }

        const w = social.openEditRolesWindow(options);
        if (options.OnActionComplete)
            w.on("contact-action-complete", options.OnActionComplete);
        return w;
    };



    social.openEditRolesWindow = function (options) {
        if (social.editRolesWindow) {
            if (social.editRolesWindow.isVisible())
                return;
            social.editRolesWindow.destroy();
        }

        social.editRolesWindow = new social.EditRolesWindow(options);
        social.editRolesWindow.on("close",
            () => {
                social.editRolesWindow.destroy();
                social.editRolesWindow = null;
            });

        social.editRolesWindow.open();
        return social.editRolesWindow;
    };



    social.EditRolesWindow = class extends finys.Window {
        constructor(options) {
            options ||= {};

            finys.Window.call(this, {
                Title: options.Title ?? "Modify roles",
                Depth: options.Depth ?? 14000,
                Width: options.Width ?? "340px",
                Height: options.Height,
                Load: {
                    Url: "/AgencySelfMaintenance/AgencySelfMaintenance/EditRolesForm",
                    IsPassive: false
                }
            });

            this.User = options.User;
            this.Context = options.Context;
            this.Member = options.Member ?? null;
        };
    

    actionComplete() {
            const e = new finys.social.actionCompleteEvent(this.User);
            this.trigger(e);
        };
    show() {
            const vm = this.getViewModel();
            vm.init(this.User, this.Context, this, this.Member);
            super.show();
        };
    }


    social.confirm = function (options) {
        const w = new social.UserConfirm(options);
        w.open();
        return w;
    };



    social.UserConfirm = class extends finys.Confirm {
        constructor(options) {
            options.Depth ??= 14000;
            options.Width ??= "340px";
            finys.Confirm.call(this, options);

            this.Selection = new social.UserSelection(options.Selection);
            this.addClass("f-user-confirm-window");
        };
    

    initialize() {
            const e = this.getElement(),
                s = e.find(".f-content > .f-content-selection");

            const prev = s.renderSelectionPreview(this.Selection);
            this.track(prev);

            super.initialize();
        };
    renderContent() {
            return `<div class="f-content" style='max-height:${this.MaxContentHeight}'>
                <div class="f-content-selection"></div>
                <p class="f-message">${this.Message}</p>
            </div>`;
        };
    }
}
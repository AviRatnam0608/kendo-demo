class FNavBar extends HTMLElement {
  static navItems = [
    {
      "label":"Accounts",
      "subitems":[
        {
          "label":"Furniture",
          "subitems":[
            {
              "label":"Tables & Chairs",
              "route": "www.youtube.com"
            },
            {"label":"Sofas"},
            {"label":"Occasional Furniture"},
            {"label":"Childrens Furniture"},
            {"label":"Beds"}
          ]
        }
      ]
    },
    {
      "label":"Reports",
      "subitems":[
        {"label":"Daily"},
        {"label":"Monthly"},
        {"label":"Annual"}
      ]
    }
  ];

  static logoUrl = "https://289umysog9.ufs.sh/f/k8fEief3SftoJw81KumkcXjto4vAEwiRkseDlPd29gSL81p5"

  static iconList = ["clock-counter-clockwise", "star", "f-divider", "bell", "gear"];

  constructor() {
    super();
    this.vm = kendo.observable({
      selectedName: 1,
      isVisible: true,
      textboxValue: "",
      onSelect: function (e) {
          var text = $(e.item).children(".k-link").text();
          console.log("event :: select(" + text + ")");
      },
      dummyDropdownData: new kendo.data.DataSource({
          data: [
              {
                  Id: 1,
                  Name: "All"
              },
              {
                  Id: 2,
                  Name: "Claims"
              },
              {
                  Id: 3,
                  Name: "Policy"
              },
              {
                  Id: 4,
                  Name: "Billing"
              }
          ]
      })
    })
  }

  connectedCallback() {
    // initial render
    this.render();
    const searchSection = this.querySelector("#nav-header")
    if (searchSection) {
      kendo.bind(searchSection, this.vm);
    }
  }

  //make all of these methods on the class not comments
  renderNavWrapper() {
    this.navigationMainWrapper = document.createElement('div');
    this.navigationMainWrapper.classList.add('f-navigation-header-main');
    this.navigationMainWrapper.setAttribute('data-role', 'view');
    this.navigationMainWrapper.setAttribute('id', 'nav-header');
  }

  render() {
    // clear out any previous content
    this.innerHTML = '';

    // LHS of the NavBar
    const navigationOptions = document.createElement('div');
    navigationOptions.classList.add('f-navigation-options');

    // Company Logo
    const img = document.createElement('img');
    img.classList.add('f-company-logo');
    img.src = logoUrl;
    img.alt = 'Company Logo';

    const navigationOptionWrapper = document.createElement('div');
    navigationOptionWrapper.classList.add('f-navigation', 'f-desktop-nav');

    // build the <ul id="nav-bar" ...>
    const ul = document.createElement('ul');
    ul.id = this.getAttribute('menu-id') || 'nav-bar';
    ul.setAttribute('data-role', 'menu');
    ul.style.width = '100%';

    // Start of the RHS side of the nav bar
    const navigationIconsWrapperSection = document.createElement('div');
    navigationIconsWrapperSection.classList.add('f-avatar-section');
    
    let items = navItems; // remove this
    // Don't define functions in your render method
    // make a method on the class for this.
    const buildList = (arr, parentUl) => {
      arr.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('f-navigation-item');

        let linkEl;
        if (item.route) {
          linkEl = document.createElement('a');
          linkEl.href = item.route;
          
          // Intercept clicks for client-side routing:
          linkEl.addEventListener('click', e => {
            e.preventDefault();
            console.log("click evbent", item.route)
          });
        } else {
          linkEl = document.createElement('span');
        }

        linkEl.classList.add('f-navigation-link');
        linkEl.textContent = item.label;
        li.appendChild(linkEl);

        if (item.subitems && item.subitems.length) {
          const subUl = document.createElement('ul');
          buildList(item.subitems, subUl);
          li.appendChild(subUl);
        }

        parentUl.appendChild(li);
      });
    };

    buildList(items, ul);
    navigationOptionWrapper.appendChild(ul);
    
    this.navigationMainWrapper.appendChild(navigationOptions);
    navigationOptions.appendChild(img);
    navigationOptions.appendChild(navigationOptionWrapper);

    const searchAndProfile = document.createElement("div");
    searchAndProfile.classList.add("f-nav-bar-rhs-group");

    const headerSearchAndShortcutsContainer = document.createElement("div");
    headerSearchAndShortcutsContainer.classList.add("f-avatar-section");

    // Search item
    const headerSearchContainer = new FHeaderSearchElementContainer();
    const headerSearchDropdown = new FHeaderSearchElementDropdown();
    const headerSearchInput = new FHeaderSearchElementInput();
    headerSearchAndShortcutsContainer.appendChild(headerSearchContainer);
    headerSearchContainer.appendChild(headerSearchDropdown);

    const searchBarSection = document.createElement("div");
    searchBarSection.classList.add("f-search-input");

    const searchIcon = document.createElement("i");
    searchIcon.classList.add("ph-light", "ph-magnifying-glass", "f-search-icon");

    // Icons Buttons
    const actionIconsContainer = document.createElement("div");
    actionIconsContainer.classList.add("f-action-icons-container")

    this.appendChild(this.navigationMainWrapper);

    // it's javascript convention to use the array methods (.map, .forEach, .filter, .reduce, etc.)
    // rather than for loops. Try using forEach here.
    for(let icon of this.constructor.iconsList)
    {
      if(icon === "f-divider"){
        const divider = document.createElement("hr");
        divider.classList.add("f-divider")
        actionIconsContainer.appendChild(divider);
        continue;
      }

      const iconButton = document.createElement("button");
      iconButton.classList.add("f-icon-btn")
      const iconElement = document.createElement("i");
      iconElement.classList.add("ph-light", `ph-${icon}`);
      iconButton.appendChild(iconElement);

      actionIconsContainer.appendChild(iconButton);        
    }

    // Profile and User Section
    // Make this a method
    const avatarContainer = document.createElement("div");
    avatarContainer.classList.add("f-avatar-container");

    const userImg = document.createElement("img");
    userImg.classList.add("f-avatar", "f-avatar-no-margin");
    userImg.setAttribute("src", this.getAttribute("user-img"))
    userImg.alt = 'User Avatar';

    const userNameSpan = document.createElement("span");
    userNameSpan.classList.add("f-text-tiny", "f-weight-medium");
    userNameSpan.innerText = this.getAttribute("user-name");

    const userIconElement = document.createElement("i");
    userIconElement.classList.add("ph-light", `ph-caret-down`);

    avatarContainer.appendChild(userImg);
    avatarContainer.appendChild(userNameSpan);
    avatarContainer.appendChild(userIconElement);

    headerSearchAndShortcutsContainer.appendChild(actionIconsContainer);
    searchBarSection.appendChild(searchIcon);
    searchBarSection.appendChild(headerSearchInput);
    headerSearchContainer.appendChild(searchBarSection);
    
    searchAndProfile.appendChild(headerSearchAndShortcutsContainer);
    searchAndProfile.appendChild(avatarContainer);

    this.navigationMainWrapper.appendChild(searchAndProfile);
  }
}

class FHeaderSearchElementContainer extends HTMLElement {
  
  static get observedAttributes() {
    return ['dropdownItems'];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    // initial render
    this.classList.add("f-search-element-container");
    this.setAttribute("id", "f-search-container")
    this.render();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'dropdownItems' && oldVal !== newVal) {
      this.render();
    }
  }

  render(){
  }
}

class FHeaderSearchElementDropdown extends HTMLInputElement {
  constructor(){
    super();
  }

  connectedCallback(){
    this.render();
  }

  render(){
    this.setAttribute('data-role', 'dropdownlist');
    this.setAttribute('data-auto-bind', 'false');
    this.setAttribute('data-value-primitive', 'true');
    // this.setAttribute('data-text-field', this.getAttribute('data-text-field') || "Name");
    // this.setAttribute('data-value-field', this.getAttribute('data-value-field') || "Id");
    // this.setAttribute('data-bind', this.getAttribute('data-bind') || "value: selectedName, source: dummyDropdownData" );

    this.setAttribute('data-text-field', "Name");
    this.setAttribute('data-value-field', "Id");
    this.setAttribute('data-bind', "value: selectedName, source: dummyDropdownData" );

    this.classList.add('f-dropdown-styles', 'f-border-rounded-left', 'f-text-small', 'f-weight-semi-bold');
  }
}

class FHeaderSearchElementInput extends HTMLInputElement {
  constructor(){
    super();
  }

  connectedCallback(){
    this.render();
  }

  render(){
    this.setAttribute('data-role', 'textbox');
    this.setAttribute('data-format', 'c');
    this.setAttribute('data-min', '0');
    this.setAttribute('data-max', '100');
    this.setAttribute('placeholder', 'Search');
    this.setAttribute('data-bind', "value: textboxValue");

    this.classList.add('f-header-search-input-textbox')
  }
}

customElements.define('f-nav-bar', FNavBar);
customElements.define('f-header-search-container', FHeaderSearchElementContainer);
customElements.define('f-header-search-dropdown', FHeaderSearchElementDropdown, {extends: 'input'});
customElements.define('f-header-search-input', FHeaderSearchElementInput, {extends: 'input'});
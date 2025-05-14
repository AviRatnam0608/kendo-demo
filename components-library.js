class FinysTimePicker extends HTMLInputElement {
    constructor() {
      super();
      this.setAttribute('data-role', 'timepicker');
      this.setAttribute('data-component-type', 'modern');
    }
  }

class FinysDropDownList extends HTMLInputElement {
    static observedAttributes = ["value"]

    constructor(props) {
        super();
        console.log(props)
        this.classList.add('f-dropdown');
        this.setAttribute('data-role', this.getAttribute('data-role') || 'dropdownlist');
        this.setAttribute('data-text-field', 'name');
        this.setAttribute('data-value-field', 'id');
        this.setAttribute('data-height', '300');
        this.setAttribute('data-option-label', 'Select an option');
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(
          `Attribute ${name} has changed from ${oldValue} to ${newValue}.`,
        );
      }
}

  class MyCard extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <div class="card">
          <h2>${this.getAttribute('title')}</h2>
          <p>${this.getAttribute('content')}</p>
        </div>
      `;
    }
  }

  customElements.define('my-card', MyCard);








customElements.define('finys-time-picker', FinysTimePicker, {extends: 'input'})
customElements.define('finys-dropdownlist', FinysDropDownList, {extends: 'input'})
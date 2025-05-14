class FinysTimePicker extends HTMLInputElement {
    constructor() {
      super();
      this.setAttribute('data-role', 'timepicker');
      this.setAttribute('data-component-type', 'modern');
    }
  }

class FinysDropDownList extends HTMLInputElement {
    connectedCallback() {
        this.classList.add('f-dropdown');
        this.setAttribute('data-role', this.getAttribute('data-role') || 'dropdownlist');
        this.setAttribute('data-text-field', this.getAttribute('data-text-field') || 'name');
        this.setAttribute('data-value-field', this.getAttribute('data-value-field') || 'id');
        this.setAttribute('data-height', this.getAttribute('data-height') || '300');
        this.setAttribute('data-option-label', this.getAttribute('data-option-label') || 'Select an option');
    }
}

class FinysDetailedDropDownList extends HTMLInputElement {
    connectedCallback() {
        this.classList.add('f-dropdown');
        this.classList.add('f-templated-dropdown');
        this.setAttribute('data-role', this.getAttribute('data-role') || 'dropdownlist');
        this.setAttribute('data-text-field', this.getAttribute('data-text-field') || 'name');
        this.setAttribute('data-value-field', this.getAttribute('data-value-field') || 'id');
        this.setAttribute('data-height', this.getAttribute('data-height') || '300');
        this.setAttribute('data-option-label', this.getAttribute('data-option-label') || "{AgentId: null, DisplayValue: 'Select Agent...', SearchText:'Select Agent...',AgentName: null, AgentCode: null, AgencyName: null, AgencyCode: null, Address:null }");
    }
}

class MyCard extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <div class="card">
            <h2>${this.getAttribute('title')}</h2>
            <p>${this.getAttribute('content')}</p>
            ${this.innerHTML}
        </div>
        `;
    }
}

customElements.define('my-card', MyCard);
customElements.define('finys-time-picker', FinysTimePicker, {extends: 'input'})
customElements.define('finys-dropdownlist', FinysDropDownList, {extends: 'input'})
customElements.define('finys-detailed-dropdownlist', FinysDetailedDropDownList, {extends: 'input'})
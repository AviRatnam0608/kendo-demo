class FinysTimePicker extends HTMLInputElement {
    connectedCallback() {
      this.setAttribute('data-role', 'timepicker');
      this.setAttribute('data-component-type', 'modern');
      this.setAttribute('data-messages', `{set: 'Apply'}`)
    }
  }

class FinysDropDownList extends HTMLInputElement {
    connectedCallback() {
        this.classList.add('f-dropdown');
        this.setAttribute('data-role', 'dropdownlist');
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
        this.setAttribute('data-role', 'dropdownlist');
        this.setAttribute('data-text-field', this.getAttribute('data-text-field') || 'name');
        this.setAttribute('data-value-field', this.getAttribute('data-value-field') || 'id');
        this.setAttribute('data-height', this.getAttribute('data-height') || '300');
        this.setAttribute('data-text-field', this.getAttribute('data-text-field') || "textField");
        this.setAttribute('data-value-field', this.getAttribute('data-value-field') || "valueField");
        this.setAttribute('data-detail-left', this.getAttribute('data-detail-left') || "detailLeft");
        this.setAttribute('data-detail-right', this.getAttribute('data-detail-right') || "detailRight");
        this.setAttribute('data-detail-bottom', this.getAttribute('data-detail-bottom') || "detailBottom");
        this.setAttribute('data-option-label', this.getAttribute('data-option-label') || this.getOptionLabel());
        this.setAttribute('data-option-label-template', this.getAttribute('data-option-label-template') || "option-template");
        this.setAttribute('data-template', this.getAttribute('data-template') || "item-template");
        this.setAttribute('data-value-template', this.getAttribute('data-value-template') || "value-template");
        if(!document.getElementById(this.getAttribute('data-template'))) {
            document.querySelector('body').appendChild(this.getItemTemplate())
        }
        if(!document.getElementById(this.getAttribute('data-value-template'))) {
            document.querySelector('body').appendChild(this.getValueTemplate())
        }
        if(!document.getElementById(this.getAttribute('data-option-label-template'))) {
            document.querySelector('body').appendChild(this.getOptionTemplate())
        }
    }

    getOptionLabel() {
        `{ 
            ${this.getAttribute('data-text-field')}: null, 
            ${this.getAttribute('data-value-field')}: null, 
            ${this.getAttribute('data-detail-right')}: null, 
            ${this.getAttribute('data-detail-left')}: null, 
            ${this.getAttribute('data-detail-bottom')}: null 
        }`;
    }

    getValueTemplate() {
        const script = document.createElement('script');
        script.setAttribute('id', this.getAttribute('data-value-template'));
        script.setAttribute('type', 'text/x-kendo-template');
        script.innerHTML = `
            <div class="f-templated-item-dropdown-container">
                <div>#: ${this.getAttribute('data-value-field')} # - #: ${this.getAttribute('data-text-field')} #</div>
                <div>#: ${this.getAttribute('data-detail-left')} # - #: ${this.getAttribute('data-detail-right')} #</div>
                <div>#: ${this.getAttribute('data-detail-bottom')} #</div>
            </div>
        `
        return script
    }

    getOptionTemplate() {
        const script = document.createElement('script');
        script.setAttribute('id', this.getAttribute('data-option-label-template'));
        script.setAttribute('type', 'text/x-kendo-template');
        script.innerHTML = `
            <div class="f-templated-item-dropdown-container">
                <div style="font-size: 0.656rem">&nbsp;</div>
                <div style="font-size: 1em">Select an option...</div>
                <div>&nbsp;</div>
            </div>
        `
        return script;
    }

    getItemTemplate() {
        const script = document.createElement('script');
        script.setAttribute('id', this.getAttribute('data-template'));
        script.setAttribute('type', 'text/x-kendo-template');
        script.innerHTML = `
            <div class="f-templated-item-dropdown-container">
                <div>#: ${this.getAttribute('data-value-field')} # - #: ${this.getAttribute('data-text-field')} #</div>
                <div>#: ${this.getAttribute('data-detail-left')} # - #: ${this.getAttribute('data-detail-right')} #</div>
                <div>#: ${this.getAttribute('data-detail-bottom')} #</div>
            </div>
        `
        return script;
    }
} 

class FinysGrid extends HTMLDivElement {
    // do not include events: {detailInit}, this causes misalignment of columns
    connectedCallback() {
        this.setAttribute('data-role', 'grid');
        this.setAttribute('data-toolbar', this.getAttribute('data-toolbar') || "[{template: kendo.template($('#table-header').html())}]")
        this.setAttribute('data-scrollable', this.getAttribute('data-scrollable') || 'false');
        if(!document.getElementById('table-header')) {
            document.querySelector('body').appendChild(this.getHeaderTemplate())
        }
    }

    getHeaderTemplate() {
        const script = document.createElement('script');
        script.setAttribute('id', 'table-header');
        script.setAttribute('type', 'text/x-kendo-template');
        script.innerHTML = `
            <header class="f-table-header f-generated-template">
                <div class="f-table-header-group">
                    <span class='f-table-label'>${this.getAttribute('data-finys-label')}</span>
                    <span class="f-tag" data-bind="text: ${this.getAttribute('data-finys-tag')}"></span>
                </div>
                <div class="f-table-header-group">
                    ${this.getAttribute('data-finys-header-buttons') || ''}
                    <button class='f-button f-clickable'><div class='f-button-content'><i class="ph ph-plus"></i><span>Add Reserve</span></div></button>
                    <button class='f-button f-clickable'><div class='f-button-content'><i class="ph ph-pencil-simple-line"></i><span>Edit Reserve</span></div></button>
                </div>
            </header>
        `
        return script;
    }
}

class FinysNestedGrid extends FinysGrid {
    // nested grids inside of nested grids must have a different dataSources
    // they must also define events: { detailInit: someInitFunc }
    connectedCallback() {
        if(!this._dataDetailTemplateId) {
            this._dataDetailTemplateId = `${crypto.randomUUID()}-detail-template`
        }
        this.setAttribute('data-role', 'grid');
        this.setAttribute('data-toolbar', this.getAttribute('data-toolbar') || "[{template: kendo.template($('#table-header').html())}]")
        this.setAttribute('data-scrollable', this.getAttribute('data-scrollable') || 'false');
        this.setAttribute('data-detail-template', this.getAttribute('data-detail-template') || this._dataDetailTemplateId);
        this.templateHTML = this.innerHTML;
        this.innerHTML = '';
        if(!document.getElementById(this.getAttribute('data-detail-template'))) {
            document.querySelector('body').appendChild(this.getDetailTemplate())
        }
        if(!document.getElementById('table-header')) {
            document.querySelector('body').appendChild(this.getHeaderTemplate())
        }
    }

    getDetailTemplate() {
        const script = document.createElement('script');
        script.setAttribute('id', this.getAttribute('data-detail-template'));
        script.setAttribute('type', 'text/x-kendo-template');
        script.innerHTML = `
            <div class="f-inner-table-container f-generated-template">
                ${this.templateHTML}
            </div>
        `
        return script;
    }
}

customElements.define('finys-timepicker', FinysTimePicker, {extends: 'input'})
customElements.define('finys-dropdownlist', FinysDropDownList, {extends: 'input'})
customElements.define('finys-detailed-dropdownlist', FinysDetailedDropDownList, {extends: 'input'})
customElements.define('finys-nested-grid', FinysNestedGrid, {extends:  'div'})
customElements.define('finys-grid', FinysGrid, {extends:  'div'})
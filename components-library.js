function finysInput({value, source, target}) {
    const element = document.createElement('input');
    element.setAttribute('data-role', 'dropdownlist');
    element.setAttribute('data-text-field', "name");
    element.setAttribute('data-value-field', 'id');
    element.setAttribute('data-bind', `
            value: ${value},
            source: ${source},
            isSelected: ${value},
        `)
    element.setAttribute('data-option-label', "Select an option");
    document.querySelector(target).appendChild(element);
    return element;
}

class FinysDropDownList extends HTMLElement {
    constructor(props) {
        super();
        this.setAttribute('data-role', 'dropdownlist');
        this.setAttribute('data-text-field', "name");
        this.setAttribute('data-value-field', 'id');
        this.setAttribute('data-bind', `
                value: ${value},
                source: ${source},
                isSelected: ${value},
            `)
        this.setAttribute('data-option-label', "Select an option");
        this.classList.add('f-dropdown my-dropdown')
    }
}
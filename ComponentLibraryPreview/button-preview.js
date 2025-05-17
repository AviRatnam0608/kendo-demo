

class FinysButtonPreview extends HTMLElement {
    connectedCallback() {
        this.init();
    }

    setButtonSize(state) {
        ['f-button-large', 'f-button-medium', 'f-button-small'].forEach((item) => {
            this.button.classList.remove(item);

        })
        this.button.classList.add(`f-button-${state}`);
    }

    init() {
        this.button = document.createElement('button', { is: 'finys-button' });
        this.button.setAttribute('id', 'feature-button');
        this.button.classList.add('f-button');
        this.button.classList.add('f-button-primary')
        this.button.textContent = 'Action';
        this.appendChild(this.button);
        this.setButtonSize('large')
    }


}

class FinysButtonControls extends HTMLElement {
    registeredListeners = [];

    connectedCallback() {
        this.createResizeSmallButton();
        this.createResizeMediumButton();
        this.createResizeLargeButton();
    }

    disconnectedCallback() {
        this.destroy();
    }

    setButtonSize = (size) => () => {
        const buttonPreview = document.querySelector('finys-button-preview');
        buttonPreview.setButtonSize(size);
        document.querySelector('finys-code-viewer').render();
    }

    createResizeSmallButton() {
        this.makeSmallButton = document.createElement('button', { is: 'finys-button' });
        this.makeSmallButton.setAttribute('id', 'make-small-button');
        this.makeSmallButton.classList.add('f-button-small')
        this.makeSmallButton.textContent = 'Small';
        const setSize = this.setButtonSize('small');
        const destroyFunc = () => this.makeSmallButton.removeEventListener('click', setSize)
        this.registeredListeners.push(destroyFunc);
        this.makeSmallButton.addEventListener('click', setSize);

        this.appendChild(this.makeSmallButton);
    }

    createResizeMediumButton() {
        this.makeMediumButton = document.createElement('button', { is: 'finys-button' });
        this.makeMediumButton.setAttribute('id', 'make-medium-button');
        this.makeMediumButton.classList.add('f-button-medium')
        this.makeMediumButton.textContent = 'Medium';
        const setSize = this.setButtonSize('medium');
        const destroyFunc = () => this.makeMediumButton.removeEventListener('click', setSize)
        this.registeredListeners.push(destroyFunc);
        this.makeMediumButton.addEventListener('click', setSize);
        this.appendChild(this.makeMediumButton);
    }

    createResizeLargeButton() {
        this.makeLargeButton = document.createElement('button', { is: 'finys-button' });
        this.makeLargeButton.setAttribute('id', 'make-large-button');
        this.makeLargeButton.classList.add('f-button-large')
        this.makeLargeButton.textContent = 'Large';
        const setSize = this.setButtonSize('large');
        const destroyFunc = () => this.makeLargeButton.removeEventListener('click', setSize)
        this.registeredListeners.push(destroyFunc);
        this.makeLargeButton.addEventListener('click', setSize);
        this.appendChild(this.makeLargeButton);
    }

    destroy() {
        this.registeredListeners.forEach((func) => {
            func();
        })

    }
}

class FinysCodeViewer extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    getButtonImplementation() {
        return document.querySelector('#feature-button').outerHTML;
    }

    render() {
        const code = Prism.highlight(this.getButtonImplementation(), Prism.languages.html, 'html')
        this.innerHTML = `
            <div class="code-container">
                <div class="code-toolbar">
                    <span>HTML</span>
                    <button class="copy-button">Copy</button>
                </div>
                <pre><code class="language-html">${code}</code></pre>
            </div>
        `;
    }

}

customElements.define('finys-button-controls', FinysButtonControls);
customElements.define('finys-button-preview', FinysButtonPreview);
customElements.define('finys-code-viewer', FinysCodeViewer)
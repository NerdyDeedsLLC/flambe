export default class ProgressBar extends HTMLElement {
    render() {
        this.style.setProperty("--all-stories",      (this.getAttribute('all-stories')      || '0'));
        this.style.setProperty("--stories-in-state", (this.getAttribute('stories-in-state') || '0'));
        this.style.setProperty("--state",      "'" + (this.getAttribute('state')            || '') + "'");
        this.className = 'progress-bar ' + this.getAttribute('state').toLowerCase().replace(/[^a-z]/gi, '-')
    }
    
    connectedCallback() { // (2)
        if (!this.rendered) {
            this.render();
            this.rendered = true;
        }
    }
    
    static get observedAttributes() { // (3)
        return ['all-stories', 'stories-in-state', 'state'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) { // (4)
        this.render();
    }
}
customElements.define('progress-bar', ProgressBar);

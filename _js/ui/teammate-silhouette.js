export default class UpsyDownsy extends HTMLElement {
    render() {
        this.style.setProperty("--delta", "'" + (this.getAttribute('delta') || 'unchanged') + "'");
        this.style.setProperty("--value", '"' + (this.getAttribute('value') || '--') + '"');
        this.style.setProperty("--size", (this.getAttribute('size') || '100'));
    }
    
    connectedCallback() { // (2)
        if (!this.rendered) {
            this.render();
            this.rendered = true;
        }
    }
    
    static get observedAttributes() { // (3)
        return ['value', 'delta', 'size'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) { // (4)
        this.render();
    }
}
/* let the browser know that <my-element> is served by our new class */
customElements.define('upsy-downsy', UpsyDownsy);

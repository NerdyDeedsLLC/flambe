export default class MicroMeter extends HTMLElement {
    render() {
        this.style.setProperty("--value",        (this.getAttribute('value')  || '0'));
        this.style.setProperty("--max",          (this.getAttribute('max')    || '100'));
        this.style.setProperty("--label",  "'" + (this.getAttribute('label')  || '')      + "'");
        
        
        this.className = (this.getAttribute('active') == 'false') ? 'inert' : '';
         
    }
    
    connectedCallback() { // (2)
        if (!this.rendered) {
            this.render();
            this.rendered = true;
        }
    }
    
    static get observedAttributes() { // (3)
        return ['value', 'max', 'label', 'active'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) { // (4)
        this.render();
    }
}
/* let the browser know that <my-element> is served by our new class */
customElements.define('micro-meter', MicroMeter);

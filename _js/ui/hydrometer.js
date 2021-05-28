    export default class HydroMeter extends HTMLElement {
        render() {
            this.style=`--value:${this.getAttribute('value') || 0}; --max:${this.getAttribute('max') || 100}; --size:${this.getAttribute('size') || 150};`;
        }
        
        connectedCallback() { // (2)
            if (!this.rendered) {
              this.render();
              this.rendered = true;
            }
        }
        
        static get observedAttributes() { // (3)
            return ['value', 'max', 'size'];
        }
        
        attributeChangedCallback(name, oldValue, newValue) { // (4)
            this.render();
        }
    }
    /* let the browser know that <my-element> is served by our new class */
    customElements.define('hydro-meter', HydroMeter);

export default class TeammateSilhouette extends HTMLElement {
    render() {
        let yestBurn  = this.getAttribute('previousburn'),
            totalBurn = this.getAttribute('burntotal'),
            hoursPoss = this.getAttribute('hourstodate'),
            wasAbsent = this.getAttribute('ooo') === 'true',
            compStyle = getComputedStyle(this);
        
        if(!totalBurn || totalBurn < 1) totalBurn = 0;
        if(!hoursPoss || hoursPoss < 1) hoursPoss = 0;
        if(!yestBurn  || yestBurn < 1)  yestBurn = 0;
        else if(yestBurn > 6) yestBurn = 6;
        else yestBurn = +yestBurn;
        wasAbsent = (wasAbsent == null) ? !wasAbsent : !!wasAbsent;

        if (  this.getAttribute('previousburn') != compStyle.getPropertyValue("--previousburn")
        || this.getAttribute('burntotal') != compStyle.getPropertyValue("--burntotal")
        || this.getAttribute('hourstodate') != compStyle.getPropertyValue("--hourstodate") ){
               let hoursDataAnalysis = this.determineIconStyle(yestBurn, totalBurn, hoursPoss, wasAbsent);
               this.setAttribute('prctTotal', hoursDataAnalysis['prctTotal'])
               this.setAttribute('prctYest',  hoursDataAnalysis['prctYest'])
               this.setAttribute('iconStyle', hoursDataAnalysis['iconStyle'])
           }
        // Object.assign(this.style, hoursDataAnalysis);
        
        this.style.setProperty("--name",         '"' + (this.getAttribute('name')         || '') + '"');
        this.style.setProperty("--email",        '"' + (this.getAttribute('email')        || '') + '"');
        this.style.setProperty("--burntotal",          (this.getAttribute('burntotal')    || 0));
        this.style.setProperty("--previousburn",       (this.getAttribute('previousburn') || 0));
        this.style.setProperty("--hourstodate",        (this.getAttribute('hourstodate')  || 0));
        this.style.setProperty("--ooo",          '"' + (this.getAttribute('ooo')          || '') + '"');
        this.style.setProperty("--prctTotal",          '"' + (parseInt(this.getAttribute('prctTotal') * 100)          || '0') + '"');
        this.style.setProperty("--prctYest",          '"' + (parseInt(this.getAttribute('prctYest') * 100)          || '0') + '"');
        // this.style.setProperty("--prctTotal",          (this.getAttribute('prctTotal')    || 0));
        // this.style.setProperty("--prctYest",           (this.getAttribute('prctYest')     || 0));
        
        this.className = this.getAttribute('iconStyle');
    }
    
    connectedCallback() { // (2)
        if (!this.rendered) {
            this.render();
            this.rendered = true;
        }
    }
    
    static get observedAttributes() { // (3)
        return ['name','email','burntotal','previousburn','hourstodate','ooo', 'prctTotal','prctYest','iconStyle'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) { // (4)
        this.render();
    }

    determineIconStyle(yestBurn, totalBurn, hoursPoss, wasAbsent){
    console.log('yestBurn, totalBurn, hoursPoss, wasAbsent :', yestBurn, totalBurn, hoursPoss, wasAbsent);
        let prctYest, prctTotal, iconStyle;
        prctYest = yestBurn / 6;                                                                                // ... work out their ratio yesterday, and then use their comparitive totals to ascertain their icon:

        if(!hoursPoss) {                                                                                                    // Start of sprint. Everyone's green (ok). Not enough data to determine otherwise.
            return {"prctTotal":0, "prctYest":0, "iconStyle":'ok'};
        }else{                                                                                                              // Sprint already underway
            prctTotal = totalBurn / hoursPoss;
            if(prctTotal === 1){                                                                                            // IF the user has burned the same number of hours as the sprint has contained...
                iconStyle = 'wow';                                                                                          // ...mark them a rockstar.
                return {"prctTotal":1, "prctYest":1, "iconStyle":'wow'}
            }else{                                                                                                          // OTHERWISE...
                if(!!wasAbsent) {                                                                                             // ... IF the user was OoO yesterday...
                    prctYest = 0;                                                                                           // ... zero out their hours for yesterday...
                    iconStyle = 'inert';                                                                                    // ... and set their icon to the grayed out one.
                    return {"prctTotal":prctTotal, "prctYest":0, "iconStyle":'inert'};
                }else{                                                                                                      // INSTEAD (the user WAS working yesterday... did they burn?)...
                    if(totalBurn === 0) return {prctTotal, prctYest, "iconStyle":'never'};
                    if(yestBurn === 0)  return {prctTotal, prctYest, "iconStyle":'miss'};
                    if(yestBurn === 6)  return {prctTotal, prctYest, "iconStyle":'ok'};
                    if(yestBurn < 6)    return {prctTotal, prctYest, "iconStyle":'low'};
                }

            }
        }
    }
}
/* let the browser know that <my-element> is served by our new class */
customElements.define('teammate-silhouette', TeammateSilhouette);

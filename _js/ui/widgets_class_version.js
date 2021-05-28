
export default class Widget {
    constructor(widgetType, renderTo, ...props) {
        this.type  = widgetType;
        this.dest  = renderTo;
        this.props = props;
    }

    /**
     * @name                        create(widgetType, [targetContainer, [properties]])
     * @description                 Renders the widget summarizing the data related to the burning of hours for the preceding 24 hours.
     * 
     * @param   {STRING}            widgetType          String dictating which sort of widget is to be created and rendered.
     *          {STRING/OBJECT}     targetContainer     Either a HTML Node or a CSS Selector String dictating where the widget is to be rendered. If none is specified, returns the markup code instead.
     *          {OBJECT}            properties          JSON Object containing the individual properties for the widget in question
     */
    create(widgetType, targetContainer=null, properties={}) {
        let codeOP = this[widgetType](properties);
        if(targetContainer == null){
            return codeOP;
        }else{  
            targetContainer = (typeof(targetContainer) === 'string') ? document.querySelector(targetContainer) : targetContainer;
            targetContainer.insertAdjacentHTML('beforeEnd', codeOP);
            return true;
        }
    }

    /**
     * @name                yesterday(properties)
     * @description         Renders the widget summarizing the data related to the burning of hours for the preceding 24 hours.
     * 
     * @param   {OBJECT}     properties     Data object containing the data required to render the widget. fullSprint expects:
     *          {NUMBER}      burned        The total number of hours burned this sprint
     *          {NUMBER}        max         The total number of burnable hours that exist to date in the current sprint
     *          {STRING}       delta        String representing if there were more or less hours burned this day than the previous. Possible values: 'up'/'down'
     *          {NUMBER}     deltaValue     Number representing the Percentage difference between number of hours burned today vs. the previous.
     */
     yesterday(properties) {
        let {burned, max, delta, deltaValue} = properties;

        let codeOP = `<div class="widget" data-title="Last 24 Hours">
                        <hydro-meter value="${burned}" max="${max}"></hydro-meter>
                        <upsy-downsy delta='${delta}' value='${deltaValue}'></upsy-downsy>
                      </div>`;
    }

    /**
     * @name                fullSprint(properties)properties
     * @description         Renders the widget summarizing the data related to the burning of hours each day throughout the sprint.
     * 
     * @param   {OBJECT}     properties     Data object containing the data required to render the widget. fullSprint expects:
     *          {NUMBER}       burned       The total number of hours burned this sprint
     *          {NUMBER}        max         The total number of burnable hours that exist to date in the current sprint
     *          {NUMBER}    daysInSprint    The planned number of workable days within the sprint
     *          {ARRAY}     burnedPerDay    Array of {NUMBER} values whose indices correspond to the day number and represent the number of hours burned that day.
     */
    fullSprint(properties) {
        let {burned, max, daysInSprint, burnedPerDay} = properties;
        daysInSprint = daysInSprint == null ? 10 : daysInSprint;
        let codeOP = `  <hydro-meter value="${burned}" max="${max}"></hydro-meter>
                        <div class="meter-block">`;
        for(var i=1; i<=daysInSprint; i++){ 
            codeOp += `     <micro-meter id="Day-${i}" label="Day ${i}" value="${burnedPerDay[i]}" max="${max}" active="false"></micro-meter>`
        }
        codeOp += `     </div>`;
    }

    render(renderTo) {
        let opMarkup;
        switch(this.type){
            case "yesterday":
                opMarkup = this.renderLast24();
                break;
        }

        document.querySelector(this.dest).insertAdjacentHTML('beforeEnd', opMarkup);
    }
}
const widgets = new Widget();

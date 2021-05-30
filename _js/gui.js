
export default class GUI {
    constructor() {
        console.log('GUI has initialized!');
        document.head.insertAdjacentHTML('beforeEnd', `<link rel="stylesheet" type="text/css" href="./lib/css/gui.css">`);

        this.daysInSprint = 10;
        this.filledSlots  = 0;
        this.seeded       = false;
        this.renderCoreGUI()
    }

    fillDataSlot() {
    }

    renderCoreGUI(){
        console.log('renderCoreGUI : Rendering...');
        return new Promise((resolve, reject) => {
            const generateDataSlots = (numberOfSlots=this.daysInSprint) =>{
                let dataSlotMarkup = ``;
                for(var i=1; i<=numberOfSlots; i++){
                    dataSlotMarkup +=  `<li class="data-file day-${i}" data-sequence="${i * 10}" data-slot="${i}">
                                        <input type="button" id="day-${i}-file" class="dayta"  value="&lt; Empty &gt;" required><button class="trash-data" data-slot="${i}"></button>
                                        <li class="insert-between" data-sequence="${(i * 10) + 5}" data-slot="-${i}-"><button>Insert Data Slot</button></li>`;
                }   
                return dataSlotMarkup;
            }

            let performLeftColumnBindings = () => {

            }

            let leftColumn = (panelNumber) => {
                let LColPanels = [  // PANEL 0 - Radio button hack for toggling panels
                                `<input type="radio" name="radioGroupSteps" id="Step1Toggler" class="radio-togglers" checked>
                                    <input type="radio" name="radioGroupSteps" id="Step2Toggler" class="radio-togglers">
                                    <input type="radio" name="radioGroupSteps" id="Step3Toggler" class="radio-togglers">`

                                    // PANEL 1 - Select/Create Sprint
                                    ,`<form id="paramPanel1-form" action="" onsubmit="return false;" novalidate="true">
                                            <label id="paramPanel1" class="param-accordion" for="Step1Toggler" data-step="I" data-label="Select/Create Sprint">
                                            <span class="panel-instructions">Select an existing Sprint from the dropdown below, or enter the name of a new one to create.</span>
                                            <div class="param-form select-sprint">
                                                <label for="sprint" class="actual-label">
                                                    Sprint:
                                                    <select name="sprint" id="sprint" aria-placeholder="Select Sprint">
                                                        <option value="">Select the desired sprint...</option>
                                                        <option value="">Creating a new sprint:</option>
                                                        <option>Some Old Sprint</option>
                                                    </select>
                                                    <input type="text" name="sprint-new" id="sprint-new" placeholder="...or enter a name to create one." value="" required>
                                                </label>
                                                <label for="sprint-start-date" class="date-field">
                                                    Start Date: <input type="date" name="sprint-start-date" id="sprint-start-date">
                                                </label>
                                                <label for="sprint-end-date" class="date-field">
                                                    End Date: <input type="date" name="sprint-end-date" id="sprint-end-date" required>
                                                </label>
                                                <div class="button-panel">
                                                    <label class="disabled step-buttons">⬆︎</label>
                                                    <label class="step-buttons" for="Step2Toggler">⬇︎</label>
                                                </div>
                                            </div>
                                        </label>
                                    </form>`

                                    // PANEL 2 - 
                                    ,`<form id="paramPanel2-form" action="" onsubmit="return false;" novalidate="true">
                                        <label id="paramPanel2" class="param-accordion" data-step="II" data-label="Manage Data Files" for="Step2Toggler">
                                            <span class="panel-instructions">Select an existing Sprint from the dropdown below, or enter the name of a new one to create.</span>
                                            <div class="param-form data-files">
                                                <ul>
                                                ${ generateDataSlots() }
                                                </ul>
                                                
                                                <div class="button-panel">
                                                    <label  class="previous step-buttons" for="Step1Toggler">⬆︎</label>
                                                    <label  class="step-buttons" for="Step3Toggler">⬇︎</label>
                                                </div>
                                            </div>
                                        </label>
                                    </form>
                                `];
                return LColPanels[panelNumber];
            }
            let coreMarkup = `<article id="flambe">
                                <input type="checkbox" id="paramsToggle" class="panel-togglers">
                                <input type="checkbox" id="filterToggle" class="panel-togglers" checked>
                                <aside id="paramsAside">
                                    <div id="params">
                                        ${leftColumn(0)}
                                        ${leftColumn(1)}
                                        ${leftColumn(2)}
                                    </div>
                                    <label class="slide-panel aside-expand-collapse-trigger" for="paramsToggle"></label>
                                </aside>
                                <main>
                                    <header></header>
                                    <section>
                                        <div class="graph-output">
                                            <div class="graph-output-widgets">

                                            </div>
                                        </div>
                                    </section>
                                    <footer></footer>
                                </main>
                                <aside id="filterAside"><label for="filterToggle" class="slide-panel"></label></aside>
                            </article>`;
            return resolve(coreMarkup)
            
        })
        // .then(coreMarkup=>_(coreMarkup));
        .then(coreMarkup=>APP.innerHTML = _(coreMarkup));
    }

    initializeCoreGUI() {
        qs('#sprint-new').addEventListener('input', function(){ if(this.value !== ''){ qs('#sprint').selectedIndex = 1; }});
        qs('#sprint').addEventListener('input', function(){ 
            let textField = qs('#sprint-new');
            textField.value = this.value;
            textField.style = (this.selectedIndex > 1) ? "height:0; opacity:0; transition:0.1s all ease-out;" : "transition:0.1s all ease-out;" 
        });
        qs('#sprint-start-date').addEventListener('change', function(){ qs('#sprint-end-date').min = this.value; });
    }

    seedCoreGUIData(){

    }
}

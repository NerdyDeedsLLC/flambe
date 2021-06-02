
export default class GUI {
    constructor() {
        console.log('GUI has initialized!');
        document.head.insertAdjacentHTML('beforeEnd', `<link rel="stylesheet" type="text/css" href="./lib/css/gui.css">`);

        this.daysInSprint = 10;
        this.filledSlots  = 0;
        this.seeded       = false;
        this.daytaRecords = new Array(11).fill(null);
        this.jiraModal = qs('#loading-overlay');
        this.renderCoreGUI()
    }

    daytaClick(daytaDOMObject){
        let whichDaytaBtnGotClicked = daytaDOMObject.id.replace(/[^\d]/g, ''),
            allPreviousDaytaFilled = true;
        for(var i=0; i<whichDaytaBtnGotClicked; i++){
            if(this.daytaRecords[i] === null || allPreviousDaytaFilled === false) allPreviousDaytaFilled = false;
        }

        if(!daytaDOMObject.dataset.hasdata != true) {                     // No data stored for this day yet. Perform retrieval.
            _('Retrieving data to seed Day ' + whichDaytaBtnGotClicked + '...');
            if( !allPreviousDaytaFilled &&                                                                                   // If all days prior to the one clicked don't already have a dayta value...
                !confirm(`Are you sure you wish to add a data pull out of sequence?\n\n`+                                    // ... alert the user and ask them to verify this is intentional.
                         `This can impact the reports generated for the remainder of the sprint.`)){                         // ... If it's NOT...
                               return false;                                                                                 // ... bail out.
            }
            // this.jiraModal.classList.toggle('on');
            this.jiraModal.style="--visible:1;";
            setTimeout(()=>(this.jiraModal.style="--visible:0;"), 21000);
            // Trigger modal overlay
            // Gather Jira Snapshot
            // Parse to JSON
            // Write to database
            // Write to daytaRecords object
            // Update button text
            // Clear modal overlay - this.jiraModal.className.toggle('on');
            return false;
        }
    }

    performLeftColumnBindings(){
        if(this.jiraModal == null) this.jiraModal = qs('#loading-overlay');
        qs('#sprint-new').addEventListener('input', function(){ if(this.value !== ''){ qs('#sprint').selectedIndex = 1; }});
        qs('#sprint').addEventListener('input', function(){ 
            let textField = qs('#sprint-new');
            textField.value = this.value;
            textField.style = (this.selectedIndex > 1) ? "height:0; opacity:0; transition:0.1s all ease-out;" : "transition:0.1s all ease-out;" 
        });
        qs('#sprint-start-date').addEventListener('change', function(){ qs('#sprint-end-date').min = this.value; });

        qsa('.dayta').forEach((dayBtn, dayNum)=> {
            dayBtn.dataset.hasdata=(dayBtn.value==='' || this.daytaRecords[dayNum] !== null);
            dayBtn.addEventListener('click', (e, trg=e.target)=>{
                console.log(trg);
                this.daytaClick(trg);
            })
        });
    }

    seedSprints(){
    }

    renderCoreGUI(){
        console.log('renderCoreGUI : Rendering...');
        return new Promise((resolve, reject) => {
            const generateDataSlots = (numberOfSlots=this.daysInSprint) =>{
                let dataSlotMarkup = ``;
                for(var i=0; i<=numberOfSlots; i++){
                    dataSlotMarkup +=  `<li class="data-file day-${i}" data-sequence="${i * 10}" data-slot="${i}">
                                        <input type="text" id="day-${i}-file" class="dayta"  placeholder="&lt; Empty &gt;" required><button class="trash-data" data-slot="${i}"></button>
                                        <li class="insert-between" data-sequence="${(i * 10) + 5}" data-slot="-${i}-"><button>Insert Data Slot</button></li>`;
                }   
                return dataSlotMarkup;
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
                                                <label for="teams" class="actual-label">
                                                    Applicable to team(s):
                                                    <select name="teams" id="teams" aria-placeholder="Select Team" multiple size="6" required>
                                                        <option value="">Scrum n Coke</option>
                                                        <option value="">Techquila</option>
                                                    </select>
                                                    <em>(Hold the Ctrl/Cmd Key and/or Shift to select multiple teams)</em>
                                                </label>
                                                <label for="sprint-start-date" class="date-field">
                                                    Start Date: <input type="date" name="sprint-start-date" id="sprint-start-date" required>
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
                                    </form>`

                                    // PANEL 3 - 
                                    ,`<form id="paramPanel3-form" class="sprint-options" action="" onsubmit="return false;" novalidate="true">
                                    <label id="paramPanel3" class="param-accordion" data-step="III" data-label="Report Settings" for="Step3Toggler">
                                        <div class="param-form report-options">
                                            <div class="calendarSelector">
                                                <div class="calendar-sel week-hdrs">
                                                    <span class="calendar-sel-col-headers">Sun</span>
                                                    <span class="calendar-sel-col-headers">Mon</span>
                                                    <span class="calendar-sel-col-headers">Tue</span>
                                                    <span class="calendar-sel-col-headers">Wed</span>
                                                    <span class="calendar-sel-col-headers">Thu</span>
                                                    <span class="calendar-sel-col-headers">Fri</span>
                                                    <span class="calendar-sel-col-headers">Sat</span>
                                                </div>
                                                <div id="calSel1" class="calendar-sel week-block" style="--week:1">
                                                    <input type="checkbox" name="calSel1-01" id="calSel1-01"><label for="calSel1-01" class="calendar-sel-toggler">14</label>
                                                    <input type="checkbox" name="calSel1-02" id="calSel1-02" checked><label for="calSel1-02" class="calendar-sel-toggler">15</label>
                                                    <input type="checkbox" name="calSel1-03" id="calSel1-03" checked><label for="calSel1-03" class="calendar-sel-toggler">16</label>
                                                    <input type="checkbox" name="calSel1-04" id="calSel1-04" checked><label for="calSel1-04" class="calendar-sel-toggler">17</label>
                                                    <input type="checkbox" name="calSel1-05" id="calSel1-05" checked><label for="calSel1-05" class="calendar-sel-toggler">18</label>
                                                    <input type="checkbox" name="calSel1-06" id="calSel1-06" checked><label for="calSel1-06" class="calendar-sel-toggler">19</label>
                                                    <input type="checkbox" name="calSel1-07" id="calSel1-07"><label for="calSel1-07" class="calendar-sel-toggler">20</label>
                                                </div>
                                                <div id="calSel2" class="calendar-sel week-block" style="--week:2">
                                                    <input type="checkbox" name="calSel2-01" id="calSel2-01"><label for="calSel2-01" class="calendar-sel-toggler">21</label>
                                                    <input type="checkbox" name="calSel2-02" id="calSel2-02" checked><label for="calSel2-02" class="calendar-sel-toggler">22</label>
                                                    <input type="checkbox" name="calSel2-03" id="calSel2-03" checked><label for="calSel2-03" class="calendar-sel-toggler">23</label>
                                                    <input type="checkbox" name="calSel2-04" id="calSel2-04" checked><label for="calSel2-04" class="calendar-sel-toggler">24</label>
                                                    <input type="checkbox" name="calSel2-05" id="calSel2-05" checked><label for="calSel2-05" class="calendar-sel-toggler">25</label>
                                                    <input type="checkbox" name="calSel2-06" id="calSel2-06" checked><label for="calSel2-06" class="calendar-sel-toggler">26</label>
                                                    <input type="checkbox" name="calSel2-07" id="calSel2-07"><label for="calSel2-07" class="calendar-sel-toggler">27</label>
                                                </div>
                                                <div id="calSel3" class="calendar-sel week-block" style="--week:3">
                                                    <input type="checkbox" name="calSel3-01" id="calSel3-01"><label for="calSel3-01" class="calendar-sel-toggler">28</label>
                                                    <input type="checkbox" name="calSel3-02" id="calSel3-02" checked><label for="calSel3-02" class="calendar-sel-toggler">29</label>
                                                    <input type="checkbox" name="calSel3-03" id="calSel3-03" checked><label for="calSel3-03" class="calendar-sel-toggler">30</label>
                                                    <input type="checkbox" name="calSel3-04" id="calSel3-04" checked><label for="calSel3-04" class="calendar-sel-toggler">1</label>
                                                    <input type="checkbox" name="calSel3-05" id="calSel3-05" checked><label for="calSel3-05" class="calendar-sel-toggler">2</label>
                                                    <input type="checkbox" name="calSel3-06" id="calSel3-06" checked><label for="calSel3-06" class="calendar-sel-toggler">3</label>
                                                    <input type="checkbox" name="calSel3-07" id="calSel3-07"><label for="calSel3-07" class="calendar-sel-toggler">4</label>
                                                </div>
                                            </div>
                                            <div class="button-panel">
                                                <label class="previous step-buttons" for="Step2Toggler">⬆︎</label>
                                                <label class="execute step-buttons"></label>
                                            </div>
                                        </div>
                                    </label>
                                 </form> 
                                `];
                return LColPanels[panelNumber];
            }
            let coreMarkup = `        
                            <div id="loading-overlay"><div class="fail">ERROR!</div></div>
                            <article id="flambe">
                                <input type="checkbox" id="paramsToggle" class="panel-togglers">
                                <input type="checkbox" id="filterToggle" class="panel-togglers" checked>
                                <aside id="paramsAside">
                                    <div id="params">
                                        ${leftColumn(0)}
                                        ${leftColumn(1)}
                                        ${leftColumn(2)}
                                        ${leftColumn(3)}
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
        .then(coreMarkup=>APP.innerHTML = coreMarkup)
        .then(()=>this.performLeftColumnBindings());
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

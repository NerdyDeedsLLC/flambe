import {format, startOfDay, addDays} from 'date-fns'

export default class GUI {
    constructor() {
        console.log('GUI has initialized!');
        document.head.insertAdjacentHTML('beforeEnd', `<link rel="stylesheet" type="text/css" href="./lib/css/gui.css">`);

        this.daysInSprint = (window.fondue) ? fondue.WorkableDaysCount : 0;
        this.daytaRecords = new Array(this.daysInSprint).fill(null);
        this.filledSlots  = 0;
        this.seeded       = false;
        this.jiraModal = qs('#loading-overlay');
        this.leftBindings = false;
        
        window.getSprintDataFromFondutabase = this.getSprintDataFromFondutabase.bind(this);
        window.processReportParameters = this.processReportParameters.bind(this);
        this.renderCoreGUI()

        if(window.fondue && fondue.WorkableDaysCount !== null){
            this.generateCoreUIDataSlots()
        }
    }

    daytaClick(daytaDOMObject){
        console.log('***daytaDOMObject :', daytaDOMObject);
        fondue.TransactionSlot = daytaDOMObject.id.replace(/[^\d]/g, '');
        let allPreviousDaytaFilled = true;
        
        for(var i=0; i<fondue.TransactionSlot; i++){
            if(fondue.SprintDaytaSlotPulls[i] === null || allPreviousDaytaFilled === false) allPreviousDaytaFilled = false;
        }

        // if(daytaDOMObject.dataset.hasdata != true) {                     // No data stored for this day yet. Perform retrieval.
            _('Retrieving data to seed Day ' + fondue.TransactionSlot + '...');
            if(    !allPreviousDaytaFilled 
                && fondue.TransactionSlot > 0                                                                                  // If all days prior to the one clicked don't already have a dayta value...
                && !confirm(`Are you sure you wish to add a data pull out of sequence?\n\n`+                                    // ... alert the user and ask them to verify this is intentional.
                         `This can impact the reports generated for the remainder of the sprint.`)){                         // ... If it's NOT...
                               return false;                                                                                 // ... bail out.
            }
            this.jiraModal.classList.toggle('on');
            daytaDOMObject.classList.toggle('retrieving')
            JSR.retrieve()
            .then(issues=>{
                
            })
            .then(()=>{
                daytaDOMObject.classList.toggle('retrieving')
                this.jiraModal.classList.toggle('on');
            });
            // Trigger modal overlay
            // Gather Jira Snapshot
            // Parse to JSON
            // Write to database
            // Write to daytaRecords object
            // Update button text
            // Clear modal overlay - this.jiraModal.className.toggle('on');
            return false;
        // }
    }

    getSprintDataFromFondutabase(sprintId){
        var fondue = window.fondue;
        return fondutabase.select("SELECT * FROM sprints WHERE sprintId=" + sprintId)
                .then(data=>{
                    data = data[0];
                    console.log('Retrieved data from fondutabase: ', data, 'Attempting to apply to global fondue object...');
                    console.log('Assignation Attempt : ', fondue);
                    fondue.ExtantSprintID       = sprintId
                    fondue.JiraSprintID         = data.jiraId
                    fondue.SprintSlotCount      = (+data.workableDaysCount + 1)
                    fondue.SprintName           = data.name
                    fondue.SprintStartDate      = data.startDate
                    fondue.SprintEndDate        = data.endDate
                    fondue.ActiveSprintObject   = data
                    fondue.WorkableDaysInSprint = data.workableDaysInSprint
                    fondue.WorkableDaysCount    = data.workableDaysCount
                    fondue.TotDaysInSprintCount = data.sprintLengthInDays
                })
                .then(()=>console.log('New fondue object:', fondue))
                .then(()=>fondutabase.select("SELECT * FROM issues WHERE retrievedFor=" + sprintId))
                .then((allIssues)=>fondue.SprintDayta = allIssues)
                .then((allIssues)=>{
                    console.log('fondue.SprintDayta :', fondue.SprintDayta);
                    let uniquePulls = allIssues.reduce((acc, cv)=>{
                        if(!acc[cv.retrievedForSlot]){
                            acc[cv.retrievedForSlot] = format(new Date(cv.retrevalReadable.replace('Z', '')), 'MMM dd, yyyy (HH:mm:ss)');
                            console.log('Unique retrievals:', acc)
                        }
                        return acc;
                    }, []);
                    _('uniquePulls :', uniquePulls);
                    return fondue.SprintDaytaSlotPulls = uniquePulls
                })
                .then(()=>{
                    qs('#sprint-start-date').value = format(new Date(fondue.SprintStartDate), 'yyyy-MM-dd');
                    qs('#sprint-end-date').value   = format(new Date(fondue.SprintEndDate), 'yyyy-MM-dd');
                    return;
                })
                .then(()=>this.processReportParameters())
    }

    processReportParameters() {
        console.log('processReportParameters :', fondue);
        let   existingSprintDD = qs('#sprint') 
            , sprintNameField  = qs('#sprint-new')
            , startDateField   = qs('#sprint-start-date')
            , endDateField     = qs('#sprint-end-date')
            , selectedSprint   = existingSprintDD.selectedIndex > 0 ? existingSprintDD.options[existingSprintDD.selectedIndex].value : null;

            
        Promise.resolve()
        .then(()=>{
            fondue.SprintStartDate = startDateField ? startDateField.value : '';
            fondue.SprintEndDate   = endDateField ? endDateField.value : '';
        })
        .then(()=>{
            console.log('fondue | fondue.SprintStartDate | fondue.SprintEndDate :', fondue, fondue.SprintStartDate, fondue.SprintEndDate);

            if(fondue.SprintStartDate === '' || fondue.SprintEndDate === '') return null;
            console.log('ReportCalendarPicker :', window.ReportCalendarPicker);

            if(!window.ReportCalendarPicker.isInitialized){
                console.log('Initializing ReportCalendarPicker...');

                window.ReportCalendarPicker.initializeCalendarPicker('',fondue.SprintStartDate,fondue.SprintEndDate);
                window.ReportCalendarPicker.generateReportSettingsCalendar()
                console.log('fondue.WorkableDaysCount :', fondue.WorkableDaysCount);
            }

            return fondue.WorkableDaysCount;
        })
        .then(workableDays=>{
            if(fondue.WorkableDaysCount != null){
                _('Adjusting sprint length to ', workableDays);
                let currLength           = this.daytaRecords.length;
                this.daysInSprint        = fondue.WorkableDaysCount;
                this.daytaRecords.length = this.daysInSprint;
                if(currLength < this.daysInSprint) this.daytaRecords.fill(null, currLength);
                this.generateCoreUIDataSlots()
            }
        })

        return;
    }

    performLeftColumnBindings(){
        if(this.leftBindings) return;
        qsa('.data-file').forEach((dayBtn, dayNum)=> {
            dayBtn.dataset.hasdata=(dayBtn.value==='' || this.daytaRecords[dayNum] !== null);
            dayBtn.addEventListener('click', (e, trg=e.target)=>{
                console.log(trg);
                this.daytaClick(trg);
            })
        });

        qsa('.bit-picker').forEach(radio=>{
            radio.addEventListener('input', (e, trg=e.target)=>fondutabase.overwrite('config', {key:trg.name, value:trg.id}))
        })
        this.leftBindings = true;
    }

    renderCoreGUI(){


        
        console.log('renderCoreGUI : Rendering...');
        return new Promise((resolve, reject) => {
            
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
                                                    </select>
                                                    <input type="text" name="sprint-new" id="sprint-new" placeholder="...or enter a name to create one." value="" style="display:none;">
                                                </label>
                                                <!--label for="teams" class="actual-label">
                                                    Applicable to team(s):
                                                    <select name="teams" id="teams" aria-placeholder="Select Team" multiple size="6" required>
                                                        <option value="">Scrum n Coke</option>
                                                        <option value="">Techquila</option>
                                                    </select>
                                                    <em>(Hold the Ctrl/Cmd Key and/or Shift to select multiple teams)</em>
                                                </label-->
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
                                    
                                    ,`<form id="paramPanel2-form" class="sprint-options" action="" onsubmit="return false;" novalidate="true">
                                    <label id="paramPanel2" class="param-accordion" data-step="II" data-label="Report Settings" for="Step2Toggler">

                                        <div class="param-form report-options">
                                            <fieldset>
                                            <input type="checkbox" id="display-weekends" name="display-weekends" class="bit-flipper" checked>
                                            <div class="bit-flipper-panel"><label for="display-weekends" data-off="Hide Weekends" data-on="Show Weekends"></label></div>
                                            <input type="radio" id="we-disp-as-placeholders" name="weekends-display-mode" class="bit-picker"> 
                                            <input type="radio" id="we-disp-as-optional-days" name="weekends-display-mode" class="bit-picker" checked>
                                            <input type="radio" id="we-disp-as-normal-days" name="weekends-display-mode" class="bit-picker">
                                            <ul class="bit-picker-panel">
                                                <li><label for="we-disp-as-placeholders">Show, but don't include in burndown/chart</label></li>
                                                <li><label for="we-disp-as-optional-days">Make available, but show/factor only if hilighted</label></li>
                                                <li><label for="we-disp-as-normal-days">Show & factor in burndown/chart maths</label></li>
                                            </ul>

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
                                                <div id="calSelDays"></div>
                                            </div>
                                            <div id="days-in-sprint-panel" class="plain-text"><span id="days-in-sprint" data-value="10" data-span="10">of</span><i data-tooltip="X of Y days: X (the number of selected days) is the number of datafiles you intend to ingest. Y (the number it's possible to select) how many the Ideal Burn will span."></i></div>
                                            </fieldset>
                                            <fieldset>
                                            <input type="checkbox" id="auto-resume" name="auto-resume" class="bit-flipper" checked>
                                            <div class="bit-flipper-panel"><label for="auto-resume" data-off="Start at Step One" data-on="Auto-Resume this Sprint"></label></div>
                                            <i data-tooltip="Selecting these options will allow you to skip these first two steps, instructing the system to simply pick up where you left off your last visit (of course you can change things after that, should you choose)."></i>
                                                <input type="radio" id="auto-res-from-datafiles" name="auto-resume-mode" class="bit-picker"> 
                                                <input type="radio" id="auto-res-from-output" name="auto-resume-mode" class="bit-picker">
                                                <input type="radio" id="auto-res-until-eos" name="auto-resume-mode" class="bit-picker">
                                                <ul class="bit-picker-panel">
                                                <li><label for="auto-res-until-eos">Resume & auto-run only until final day of sprint</label></li>
                                                <li><label for="auto-res-from-output">Resume session & auto-run most recent report</label></li>
                                                    <li><label for="auto-res-from-datafiles">Resume session at III: Manage Data Files</label></li>
                                                </ul>
                                                </fieldset>

                                            <div class="button-panel">
                                                <label class="previous step-buttons" for="Step1Toggler">⬆︎</label>
                                                <label class="step-buttons" for="Step3Toggler">⬇︎</label>
                                            </div>
                                        </div>
                                    </label>
                                 </form> `
                                 
                                 // PANEL 3 - 
                                 ,`<form id="paramPanel3-form" action="" onsubmit="return false;" novalidate="true">
                                        <label id="paramPanel3" class="param-accordion" data-step="III" data-label="Manage Data Files" for="Step3Toggler">
                                            <span class="panel-instructions">Click on the numbered day of the sprint to pull the current JIRA snapshot and retain its data within that slot.<br>(Note: you cannot add data to a slot other than the seed until a seed has been provided.)</span>
                                            <div class="param-form data-files">
                                                <ul>
                                                
                                                </ul>
                                                
                                                <div class="button-panel">
                                                    <label  class="previous step-buttons" for="Step2Toggler">⬆︎</label>
                                                    <label  class="step-buttons execute" for="Step3Toggler">▶︎</label>
                                                </div>
                                            </div>
                                        </label>
                                    </form>`

                                ];
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
                                        <div id="grid-output-panel" class="grid-output-panel">
                                            <div id="grid-output" class="grid-output"></div>
                                        </div>
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
        .then(coreMarkup=>APP.innerHTML = coreMarkup)
        .then(()=>this.initializeCoreGUI())
        .then(()=>this.performLeftColumnBindings())
    }

    initializeCoreGUI() {
        if(this.initialized) return false;
        if(this.jiraModal == null) this.jiraModal = qs('#loading-overlay');

        // qs('#sprint-new').addEventListener('input', function(){ if(this.value !== ''){ qs('#sprint').selectedIndex = 1; processReportParameters(); }});
        qs('#sprint').addEventListener('input', function(){ 
            let mySelInd = this.selectedIndex,
                myValue  = this.options[mySelInd].value,
                fondueId = (fondue && fondue.ExtantSprintID) ? fondue.ExtantSprintID : null;
            if(mySelInd > 1 && myValue != fondueId) {
                return getSprintDataFromFondutabase(myValue);
            }
            if(fondueId) return (this.value = fondueId);
            
        });
        qs('#sprint-start-date').addEventListener('change', function(){ qs('#sprint-end-date').min = this.value; processReportParameters(); });
        qs('#sprint-end-date').addEventListener('change',   function(){ qs('#sprint-start-date').max = this.value; processReportParameters(); });

        return this.initialized = true;
    }

    generateCoreUIDataSlots() {
        let numberOfSlots = fondue.WorkableDaysCount;
        let firstDateOfSprint = fondue.SprintStartDate;
        let dataSlotDOMTarget = qs('#paramPanel3 .data-files ul');
        return new Promise((resolve, reject) => {
            let dataSlotMarkup = ``;
            if(firstDateOfSprint != null) firstDateOfSprint = new Date(firstDateOfSprint);
            let slotPHText = firstDateOfSprint == null ? 'Day 0' : format(firstDateOfSprint, 'MMM dd');
            for(var i=0; i<=numberOfSlots; i++){
                let textualDisplay = `placeholder="Data Pull for ${slotPHText}: &lt; Empty &gt;"`;
                if(fondue.SprintDaytaSlotPulls && fondue.SprintDaytaSlotPulls[i]) textualDisplay = 'value="Retrieved :: ' + fondue.SprintDaytaSlotPulls[i] + '"';

                dataSlotMarkup +=  `<li id="day-${i}-slot" class="data-file day-${i}" data-sequence="${i * 10}" data-slot="${i}">
                                        <input type="text" id="day-${i}-file" class="dayta" ${textualDisplay} readonly required><button class="trash-data" data-slot="${i}"></button>
                                    </li>
                                    <li class="insert-between" data-sequence="${(i * 10) + 5}" data-slot="-${i}-"><button>Insert Data Slot</button></li>`;
                slotPHText = (/^Day/.test(slotPHText)) ? `Day ${i + 1}` : format(addDays(firstDateOfSprint, i), 'MMM dd');
            }
            return resolve(dataSlotMarkup);
        })
        .then(dataSlotMarkup => dataSlotDOMTarget.innerHTML = dataSlotMarkup)
        .then(()=>this.performLeftColumnBindings());
    }
}

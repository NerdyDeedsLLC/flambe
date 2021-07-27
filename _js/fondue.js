import {global_helper_functions} from './global';
import Credentials   from './Credentials.js'
import DataRetriever from './DataRetriever.js'
import SprintRetriever from './SprintRetriever.js'
import Fondutabase   from './fondutabase.js'
import GUI           from './gui.js'
import ReportCalendarPicker    from './ReportCalendarPicker'
import GridRenderer  from './GridRenderer'
import {toDate, intlFormat, isValid, format, set} from 'date-fns'
import Starport      from './Starport'

W.toDate = toDate;
W.intlFormat = intlFormat; 
W.isValid = isValid;
W.format = format;
class Fondue {
    constructor(...props) {
        this.PREFS = {
            units:{
                showTime:'hours', // also supported: days, minutes
                timezone:'Central',
                tzOffset:'-0500'
            },
            caching:{
                enabled:true,
                ttl:MSTIMES.D,
                exemptDataFiles:true
            }
        }
        this.Config               = null;
        this.ExtantSprintID       = null;                     // The sprintId of the active sprint, as dictated by its value in the fondutabase
        this.TransactionSlot      = null;                     // The number of the dataslot being actively transacted against (e.g. which slot is being actively pulled this moment)
        this.TransactionSlotDate  = null;                     // The date of the dataslot being actively transacted against (e.g. which slot is being actively pulled this moment)
        this.SprintSlotCount      = null;                     // The number of dataslots required for the active sprint. Should be (this.WorkableDaysCount + 1)
        this.SprintName           = null;                     // The name/label given the active sprint (ex. 'DB Techquilla-21S12 06/02')
        this.SprintStartDate      = null;                     // The date object representing the first day of the active sprint
        this.SprintEndDate        = null;                     // The date object representing the last day of the active sprint
        this.ActiveSprintObject   = null;                     // The current sprint object (as retrieved from the fondutabase)
        this.WorkableDaysInSprint = null;                     // Pipe-delimited string containing the dates of all the workable days in the sprint (ex. '2021-06-13|2021-06-16|2021-06-17|...|2021-06-20')
        this.WorkableDaysCount    = null;                     // The number of workable days in the active sprint (excludes weekends and holidays, per user discretion)
        this.TotDaysInSprintCount = null;                     // The number of ALL calendar days the sprint spans.
        this.SprintDayta          = [];
        this.SprintDaytaSlotPulls = [];

        this
        W.fondue = this;
    }

    loadComponents(){
        
        this.credentials           = W.credentials           = new Credentials();
        this.JDR                   = W.JDR                   = new DataRetriever();
        this.JSR                   = W.JSR                   = new SprintRetriever();
        this.fondutabase           = W.fondutabase           = new Fondutabase();
        this.gui                   = W.gui                   = new GUI();
        this.reportCalendarPicker  = W.reportCalendarPicker  = new ReportCalendarPicker();
        this.refreshConfig();
        this.starport = new Starport('export');
        setTimeout(this.starport.hail, 3000);
    }


    status(text, severity=0, duration=5000){
        let statusMsg = D.createElement('div');
        statusMsg.className = 'status-message severity-' + severity;
        statusMsg.style = `animation: ${duration}ms fade forwards;`;
        statusMsg.innerHTML = text;
        document.querySelector("#status-overlay").insertAdjacentElement('beforeEnd', statusMsg);
        setTimeout(()=>statusMsg.remove(), duration);
        
    }
    
    refreshConfig(){
        if(this.Config != null) return this.Config;
        return new Promise(resolve=>{
            this.fondutabase.select('SELECT * FROM config').then((res)=>resolve(this.Config=res));
        });
    }

    loadGrid(){
        W.fondueObj = this;
        // W.addEventListener('load', ()=>{qs('#grid-output').innerHTML = `<iframe src="./grid.html?sprintID=18"></iframe>`;})
        qs('#grid-output').innerHTML = `<iframe src="./grid.html?sprintID=${this.ExtantSprintID}"></iframe>`;
    }

    loadGraph(){
        W.fondueObj = this;
        // W.addEventListener('load', ()=>{qs('#grid-output').innerHTML = `<iframe src="./grid.html?sprintID=18"></iframe>`;})
        qs('#graph-output-panel').innerHTML = `<iframe src="./burndown.html?sprintID=${this.ExtantSprintID}"></iframe>`;
    }

    /**
     * MANdate
     * Insists ANY of the date formats used by this app, its dependencies, its libraries, and Jira itself, is converted
     * into a bog-standard JS Date Object (although, by default, it will also strip the timezone and the timestamp as well,
     * see below). Formats Supported:
     *   - '1635656400000' / 1635656400000 / Date.now()                 [Unix Epoch, in string or numeric format]
     *   - '10-31'/'10.31'/'10/31'                                      [MM-dd (separators supported: '-', '.', '/'). When a year is omitted, it assumes this one]
     *   - 'Oct 31 2021 19:00:00 GMT-0500 (Central Daylight Time)',     [Full Date Long Form (same as new Date().toString())]
     *   - 'Wed Oct 31 2021 19:00:00 GMT-0500',                         [Full Date Medium Form (same as a Date missing human-readable text)]
     *   - 'Oct 31 2021 19:00:00',                                      [Full Date Short Form (same as a Date stripped of all timezone data)]
     *   - 'Oct 31'/'31 OCT'/'31 OCT 2021'/'OCT 31 2021'/'OCT 31, 2021' [MMM dd (yyyy|yy)?, or Abbrev Month, Day, optional Year (if omitted, it assumes this one)]
     *   - 2021-10-31',                                                 [HTML standard (this is the format used by date and time fields in the DOM)]
     *   - '10/31/2021',                                                [US standard: MM/dd/yyyy]
     *   - new Date(),                                                  [JS Date objects (it'll treat them as any other date, and strip their timezone & time data)]
     * 
     * @param  {*}        [dt]                The date object/number/string we need to get normalized. 
     * @param  {function} [formatter=toDate]  The output format of dt. Currently defaulted to a full JS/date-fns object. Also supports Date.prototype._______
     * @param  {boolean}  [clearTimes=true]   Should the hours/minutes/seconds/milliseconds be stripped off? Most of JS's date issues start here
     * @return {object | null | custom}       Returns dt as a date object, but formatted as per the formatter                           
     * @memberof Fondue
     */
    MANdate(dt, formatter=null, clearTimes=true){ 
        if(dt == null || !dt || dt === '') return null;
//  console.log('MANdate(dt, formatter, clearTimes):\n   => dt: ', dt, 
//              '\n   => formatter: ', (formatter == null ? void(0) : formatter.toString().replace(/function (.*?)\([\s\S]*/gim, '$1()')), 
//              '\n   => clearTimes: ', clearTimes);
        let changer = '', auto = null;
        if(!clearTimes){
            try{auto = new Date(dt); }catch{}
            if(auto) dt = auto;
        }
        try{
 if(changer === '' && dt instanceof(Date)) changer = ('started that way: ' + dt);
            if(!(dt instanceof(Date)) && !isNaN(parseInt(dt)) && !/\D/.test(dt)) dt = new Date(+dt);                                                             //# 1624959337613 | '1624959337613'                                              =>  new Date(1624959337613)
 if(changer === '' && dt instanceof(Date)) changer = ('mktime: ' + dt);
            if(!(dt instanceof(Date)) && /^\d{2}[\.\-\/]\d{2}$/.test(dt)) dt = new Date(`2021-${dt} `)                                         //# 10-31 | 10.31 | 10/31                                                        =>  new Date("2021-[{INPUT}] ")¹
 if(changer === '' && dt instanceof(Date)) changer = ('##-##: ' + dt);
            if(!(dt instanceof(Date)) && /^\d{1,2}[ -]\D{3,}$|^\D{3,}[ -]\d{1,2}$/.test(dt)) dt = new Date(`${dt}, 2021`);                     //# 31 Oct | Oct 31                                                              =>  new Date("[{INPUT}], 2021")
 if(changer === '' && dt instanceof(Date)) changer = ('## MMM: ' + dt);
            
            if(!(dt instanceof(Date)) && /^\d{4}[\.\-\/]|[\.\-\/]\d{4}$/.test(dt)){
                if(clearTimes) dt = dt.slice(0,10);
                 dt = new Date(`${dt} `);                                    //# 10/31/2021 | 10-31-2021 | 10.31.2021 | 2021/10/31 | 2021-10-31 | 2021.10.31  =>  new Date("[{INPUT}] ")¹
            }
 if(changer === '' && dt instanceof(Date)) changer = ('####-##-##: ' + dt);
 //(#① - IMPORTANT: There MUST be a trailing space at the end of these strings BEFORE their conversion to a Date!)
            if(!(dt instanceof(Date))) dt = new Date(dt);
        }catch{
// console.log(' --- DT AFTER CATCH', dt);
            dt = new Date(Date.parse(dt));
            if(dt instanceof(Date)) changer = ('Last Resort');
        }
        if(clearTimes) {
            dt = set(dt, {hours:0, minutes:0, seconds:0});
 changer += ' and reset time';
        }
//  _('CHANGED VIA: ', changer);
        switch(typeof(formatter)) {
            case 'function':
                try{
// console.log(' ---> fn1', formatter)
                    dt = formatter(dt);
                }catch{
// console.log(' ---> fn2', formatter)
                    dt = formatter.apply( dt);
                }
                break;

            case 'string':
// console.log(' ---> str', formatter)
                dt = format(dt, formatter);
                break;

            default: break;
        }

        return dt;
           
    }
    
}

W.fondue = new Fondue();
fondue.loadComponents();

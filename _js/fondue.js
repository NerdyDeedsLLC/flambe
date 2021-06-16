import {global_helper_functions} from './global';
import Credentials   from './Credentials.js'
import DataRetriever from './DataRetriever.js'
import SprintRetriever from './SprintRetriever.js'
import Fondutabase   from './fondutabase.js'
import GUI           from './gui.js'
import ReportCalendarPicker    from './ReportCalendarPicker'


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

        this.loadComponents()
    }

    loadComponents(){
        
        this.credentials           = W.credentials           = new Credentials();
        this.JDR                   = W.JDR                   = new DataRetriever();
        this.JSR                   = W.JSR                   = new SprintRetriever();
        this.fondutabase           = W.fondutabase           = new Fondutabase();
        this.gui                   = W.gui                   = new GUI();
        this.ReportCalendarPicker  = W.ReportCalendarPicker  = new ReportCalendarPicker();

    }
}

W.fondue = new Fondue();

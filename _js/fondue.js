import {global_helper_functions} from './global';
import Credentials   from './Credentials.js'
import DataRetriever from './DataRetriever.js'
import SprintRetriever from './SprintRetriever.js'
import Fondutabase   from './fondutabase.js'
import GUI           from './gui.js'
import ReportGrid    from './ReportGrid'


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
        
        this.credentials = window.credentials = new Credentials();
        this.JDR         = window.JDR         = new DataRetriever();
        this.JSR         = window.JSR         = new SprintRetriever();
        this.fondutabase = window.fondutabase = new Fondutabase();
        this.gui         = window.gui         = new GUI();
        this.reportGrid  = window.reportGrid  = new ReportGrid();

        this.ExtantSprintID      = null;
        this.TransactionSlot     = null;
        this.TransactionSlotDate = null;
        this.SprintSlotCount     = null;
        this.SprintName          = null;
        this.SprintStartDate     = null;
        this.SprintEndDate       = null;
        this.ActiveSprintObject  = null;
    }
}

window.fondue = new Fondue();

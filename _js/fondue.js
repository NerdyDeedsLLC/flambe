import {global_helper_functions} from './global';
import Credentials   from './Credentials.js'
import DataRetriever from './DataRetriever.js'
import SprintRetriever from './SprintRetriever.js'
import Fondutabase   from './fondutabase.js'
import GUI           from './gui.js'
import ReportGrid    from './ReportGrid'

window.PREFS = {
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

class Fondue {
    constructor(...props) {
        window.credentials   = new Credentials();
        window.JDR           = new DataRetriever();
        window.JSR           = new SprintRetriever();
        window.fondutabase   = new Fondutabase();
        window.gui           = new GUI();
        window.reportGrid    = new ReportGrid();
    }
}

window.fondue = new Fondue();
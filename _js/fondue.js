import {global_helper_functions} from './global';

import Credentials   from './Credentials.js'
import DataRetriever from './DataRetriever.js'
import Fondutabase   from './fondutabase.js'
import GUI           from './gui.js'
window.credentials   = new Credentials();
window.JDR           = new DataRetriever();
window.fondutabase   = new Fondutabase();
window.gui           = new GUI();
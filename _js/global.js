const d = document                                       // ⥱ Alias - document
    , qs = (s) => d.querySelector(s)                        // ⥱ Alias - querySelector
    , qsa = (s) => [...d.querySelectorAll(s)]                // ⥱ Alias - querySelectorAll
    , _ = (...args) => (DEBUG_MODE) ? console.log.call(this, ...args) : false     // ⥱ Alias - _
    , _I = (...args) => (DEBUG_MODE && INFO_TRACE) ? console.info.call(this, ...args) : false     // ⥱ Alias - _
    , _T = (...args) => (DEBUG_MODE) ? console.table.call(this, ...args) : false     //eslint-disable-line

    // Rote memory's storage 
    /*eslint-disable*/
    , rote = window.localStorage                                                                	       	// Alias to the window's localStorage. Really these are all just helper functions that amuse me.
    , memories = () => rote.length                                                      		// Returns the count of how many memories are being held in rote storage
    , recall = (k, def = null) => { k = rote.getItem(k); return k ? k : (def ? def : null); }            		// Returns a memory value if present. If not, returns def if provided, null if not
    , muse = (k, def = null) => { r = recall(k, def); return r === def ? r : JSON.parse(r); }

    , retain = (k, v) => rote.setItem(k, v) ? v : v                                        		// Creates a new memory for key k with value v, then returns v
    , reflect = (k, def = null) => retain(k, recall(k, def))                                        		// Runs a recall for a memory (value at key or null), then immediately retains it in memories
    , forget = (k) => rote.removeItem(k)                                                  		// Discrads the memories at key k
    , fugue = () => rote.clear()                                                      		// Purges all memories... as though they'd NEVER. BEEN. FORMED. AT. ALL!
    /*eslint-enable*/

    , toHours = (val = null) => {                                                                   		// Converts the asinine JIRA output we're currently getting (seconds, across the board) to hours
        if (val === '---') { return val; }                                                           		//  ... (except in the case of the starting value being '---' whereupon...
        if (val == null) { return '0*'; }                                        		                    //  ... we convert the value to something that still signifies the special case, but can also...
        if (isNaN(val)) { return '0**'; }                                        		                    //  ... we convert the value to something that still signifies the special case, but can also...
        return (val / 1 <= 0) ? 0 : parseFloat((val / 3600).toPrecision(3));                                       		//  ... still be coerced back into a number type by the interpreter)
    }
    , setTargetSlot = (slotIndex) => (targetSlot = slotIndex) // eslint-disable-line

    , findLastIndexOf = (arr = void (0), val = void (0), fromIndex = null) => { // eslint-disable-line no-unused-vars
        for (var i = arr ? arr.length - 1 : 0; arr !== void (0) && val !== void (0) && i >= 0; i--)
            if (((val.constructor + '').match(/RegExp/) && arr[i].match(val)) || (val + '' == arr[i])) return (i);
        return -1;
    };
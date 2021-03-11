var DEBUG_MODE = true, 
    INFO_TRACE=true;

const d = document                                                                                                // ⥱ Alias - document
const qs = (s) => d.querySelector(s)                                                                              // ⥱ Alias - querySelector
const qsa = (s) => [...d.querySelectorAll(s)]                                                                     // ⥱ Alias - querySelectorAll
const _ = (...args) =>  (DEBUG_MODE) ? console.log.call(this, ...args) : false                                     // ⥱ Alias - _
const _I = (...args) => (DEBUG_MODE && INFO_TRACE) ? console.info.call(this, ...args) : false                     // ⥱ Alias - _
const _T = (...args) => (DEBUG_MODE) ? console.table.call(this, ...args) : false                                  // eslint-disable-line

    // Rote memory's storage 
    /*eslint-disable*/
const rote = window.localStorage                                                                                  // Alias to the window's localStorage. Really these are all just helper functions that amuse me.
const memories = () => rote.length                                                                                // Returns the count of how many memories are being held in rote storage
const recall = (k, def = null) => { k = rote.getItem(k); return k ? k : (def ? def : null); }                     // Returns a memory value if present. If not, returns def if provided, null if not
const muse = (k, def = null) => { let r = recall(k, def); return r === def ? r : JSON.parse(r); }

const retain = (k, v) => rote.setItem(k, v) ? v : v                                                               // Creates a new memory for key k with value v, then returns v
const reflect = (k, def = null) => retain(k, recall(k, def))                                                      // Runs a recall for a memory (value at key or null), then immediately retains it in memories
const forget = (k) => rote.removeItem(k)                                                                          // Discrads the memories at key k
const fugue = () => rote.clear()                                                                                  // Purges all memories... as though they'd NEVER. BEEN. FORMED. AT. ALL!
    /*eslint-enable*/

const toHours = (val = null) => {                                                                                 // Converts the asinine JIRA output we're currently getting (seconds, across the board) to hours
        if (val === '---') { console.log('blankday'); return val; }                                               // ... (except in the case of the starting value being '---' whereupon...
        if (val == null) { return '0*'; }                                                                         // ... we convert the value to something that still signifies the special case, but can also...
        if (isNaN(val)) { return '0**'; }                                                                         // ... we convert the value to something that still signifies the special case, but can also...
        return (val / 1 <= 0) ? 0 : parseFloat((val / 3600).toPrecision(3));                                      // ... still be coerced back into a number type by the interpreter)
    }
const setTargetSlot = (slotIndex) => (targetSlot = slotIndex)                                                     // eslint-disable-line

const findLastIndexOf = (arr = void (0), val = void (0), fromIndex = null) => {                                   // eslint-disable-line no-unused-vars
        for (var i = arr ? arr.length - 1 : 0; arr !== void (0) && val !== void (0) && i >= 0; i--)
            if (((val.constructor + '').match(/RegExp/) && arr[i].match(val)) || (val + '' == arr[i])) return (i);
        return -1;
    };

export {d, qs, qsa, _, _I, _T, rote, memories, recall, muse, retain, reflect, forget, fugue, toHours, setTargetSlot, findLastIndexOf}



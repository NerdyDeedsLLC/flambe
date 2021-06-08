const DEBUG_MODE = true;

const noOp = ()=>{};

const global_helper_functions = {
      D  : document                                                                                                   // ⥱ Alias - document
    , W  : window                                                                                                    // ⥱ Alias - window
    , B  : window.HTMLBodyElement                                                                                    // ⥱ Alias - document.body
    , M  : Math                                                                                                      // ⥱ Alias - Math
    , APP: (()=>document.querySelector('main#app'))()                                                                         //⥱ Alias - Root DOM element of the application
    , qs : (q,s=document) => s.querySelector(q)                                                                      // ⥱ Alias - querySelector
    , qsa: (q, s=document) => [...s.querySelectorAll(q)]                                                             // ⥱ Alias - querySelectorAll
    , _  : (DEBUG_MODE) ? (...args) => {console.log.call(this,   ...args); return args;} : noOp                      // ⥱ Alias - console.log
    , _I : (DEBUG_MODE) ? (...args) => {console.info.call(this,  ...args); return args;} : noOp                      // ⥱ Alias - console.info
    , _E : (DEBUG_MODE) ? (...args) => {console.error.call(this, ...args); return args;} : noOp                      // ⥱ Alias - console.error
    , _T : (DEBUG_MODE) ? (...args) => {console.table.call(this, ...args); return args;} : noOp                      // ⥱ Alias - console.table

    , MSTIMES: {
        Y: 31536000000,
        W: 604800000,
        D: 86400000,
        H: 3600000,
        M: 60000,
        S: 1000
    }
    //                                                                                                                // Rote memory's storage 
    // /*eslint-disable*/
    // , rote :  W.localStorage                                                                                       // Alias to the window's localStorage. Really these are all just helper functions that amuse me.
    // , memories :  () => rote.length                                                                                // Returns the count of how many memories are being held in rote storage
    // , recall :  (k, def = null) => { k = rote.getItem(k); return k ? k : (def ? def : null); }                     // Returns a memory value if present. If not, returns def if provided, null if not
    // , muse :  (k, def = null) => { r = recall(k, def); return r === def ? r : JSON.parse(r); }

    // , retain :  (k, v) => rote.setItem(k, v) ? v : v                                                               // Creates a new memory for key k with value v, then returns v
    // , reflect :  (k, def = null) => retain(k, recall(k, def))                                                      // Runs a recall for a memory (value at key or null), then immediately retains it in memories
    // , forget :  (k) => rote.removeItem(k)                                                                          // Discrads the memories at key k
    // , fugue :  () => rote.clear()                                                                                  // Purges all memories... as though they'D NEVER. BEEN. FORMED. AT. ALL!
    // /*eslint-enable*/

    , toHours :  (val = null) => {                                                                                    // Converts the asinine JIRA output we're currently getting (seconds, across the board) to hours
        if (val === '---') { return val; }                                                                            // ... (except in the case of the starting value being '---' whereupon...
        if (val == null) { return '0*'; }                                                                             // ... we convert the value to something that still signifies the special case, but can also...
        if (isNaN(val)) { return '0**'; }                                                                             // ... we convert the value to something that still signifies the special case, but can also...
        return (val / 1 <= 0) ? 0 : parseFloat((val / 3600).toPrecision(3));                                          // ... still be coerced back into a number type by the interpreter)
    }
    , setTargetSlot :  (slotIndex) => (targetSlot = slotIndex)                                                        // eslint-disable-line

    , findLastIndexOf :  (arr = void (0), val = void (0), fromIndex = null) => {                                      // eslint-disable-line no-unused-vars
        for (var i = arr ? arr.length - 1 : 0; arr !== void (0) && val !== void (0) && i >= 0; i--)
            if (((val.constructor + '').match(/RegExp/) && arr[i].match(val)) || (val + '' == arr[i])) return (i);
        return -1;
    }

    , removeTimeFromDate(d){
        d = (isNaN(d*1)) ? Date.parse(d) : new Date(d*1).getTime();
        return isNaN(d) ? null : Date.parse(new Date(d).toISOString().slice(0,11) + '00:00:00.000Z');
    }

    , daysApart(d1, d2) {
        d1 = removeTimeFromDate(d1);
        d2 = removeTimeFromDate(d2);
        if(isNaN(d1) || isNaN(d2)) return null;
        return M.abs((d1 - d2) / MSTIMES.D)
    }

    , calendarDays : {
        'jan':31,
        'feb':28 + ((new Date().getFullYear() % 4) === 0),
        'mar':31,
        'apr':30,
        'may':31,
        'jun':30,
        'jul':31,
        'aug':31,
        'sep':30,
        'oct':31,
        'nov':30,
        'dec':31,
        'year':new Date().getFullYear(),
        'isLeapYear':((new Date().getFullYear() % 4) === 0)
    }
    , daysOfWeek : ['sun','mon','tue','wed','thu','fri','sat']

    , elideObjectKeys(obj, keyList, keyListIsInclusive=false){
        if(obj == null) throw new SyntaxError();
        if(typeof(obj) !== 'object' || (!Array.isArray(keyList) && typeof(keyList) !== 'string')) throw new TypeError();
        keyList = [...[keyList]].flat()
        if(!keyListIsInclusive) keyList = Object.keys(obj).filter(key=>!keyList.includes(key));
        return JSON.parse(JSON.stringify(obj, keyList))
    }
    

    , conditionallyElideObjectKeys(obj, keyList, inclusiveKeyList=true){
        let tests = {
            '===': (f1, f2) => f1 === f2,
            '==' : (f1, f2) => f1 == f2,
            '>=' : (f1, f2) => f1 >= f2,
            '<=' : (f1, f2) => f1 <= f2,
            '>'  : (f1, f2) => f1 > f2,
            '<'  : (f1, f2) => f1 < f2,
            '!'  : exp => !exp
        }
        //'!'  : (exp, inclusiveKeyList) => (inclusiveKeyList && !exp) || (exp && !inclusiveKeyList),
        let simpleKeyList = [], 
            complexKeyList = [];

        keyList.forEach(key=>{
            if(/[!=<>]/.test(key)) complexKeyList.push(key);
            else simpleKeyList.push(key);
        });
        complexKeyList.map(cond => {
            cond ='a<=6'.match(/^(.*?)([=<>!]+)(.*)$/)
            if(cond == null) return null;
            cond = cond.slice(1,4);
            cond[1] = tests[cond[1]];
        });
        
        obj = this.elideObjectKeys(obj, simpleKeyList, inclusiveKeyList);

        inclusiveKeyList = (Array.isArray(inclusiveKeyList)) ? inclusiveKeyList : inclusiveKeyList.split(',')
        return JSON.parse(JSON.stringify(obj, inclusiveKeyList));
    }

    // ,elideObjectKeys(t, ['name','id','projectId'])
};
Object.assign(window, global_helper_functions);

console.log('global functions appended to window!');
export {global_helper_functions};
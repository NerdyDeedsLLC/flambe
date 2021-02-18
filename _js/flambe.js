
//@@ =====================================================================================================================================
//@@ ========================================================= .CSV PARSER ===============================================================
//@@ =====================================================================================================================================
function round_to_precision(x, precision) {
    _I("ES5 FUNCTION: round_to_precision", "x", x, "precision", precision);
    var y = +x + (precision === undefined ? 0.5 : precision / 2);
    return y - (y % (precision === undefined ? 1 : +precision));
}

const readableRound = (val, precision = 0, trimTrailing0s=1) => {
    if (val == null || isNaN(val) || val == Infinity) return false; else val = parseFloat(val);
    if (!isNaN(precision) && precision > 0 && trimTrailing0s === 1) trimTrailing0s = val.toString().indexOf('.') !== -1;
    let moddedPrecision = (isNaN(precision) || precision < 0) ? 1 : precision,
        fltPtAdjustment = (1 + new Array(moddedPrecision).fill(0).join('')) * 1;

    val = Math.round(val * fltPtAdjustment) / fltPtAdjustment;
    let valS = (trimTrailing0s) ? val : val.toPrecision(val.toString().split('.')[0].length + precision);
    return trimTrailing0s ? val : valS;
};

/*eslint-disable*/
var CSV = {};
(function (window, undefined) {
    'use strict';





    // Define local CSV object.

    /**
     * Split CSV text into an array of lines.
     */
    function splitLines(text, lineEnding) {
        _I("ES5 FUNCTION: splitLines", "text", text, "lineEnding", lineEnding);
        var strLineEnding = lineEnding.toString(),
            bareRegExp = strLineEnding.substring(1, strLineEnding.lastIndexOf('/')),
            modifiers = strLineEnding.substring(strLineEnding.lastIndexOf('/') + 1);

        if (modifiers.indexOf('g') === -1) {
            lineEnding = new RegExp(bareRegExp, modifiers + 'g');
        }

        // TODO: fix line splits inside quotes
        return text.split(lineEnding);
    }

    /**
     * If the line is empty (including all-whitespace lines), returns true. Otherwise, returns false.
     */
    function isEmptyLine(line) {
        _I("ES5 FUNCTION: isEmptyLine", "line", line);
        return (line.replace(/^[\s]*|[\s]*$/g, '') === '');
    }

    /**
     * Removes all empty lines from the given array of lines.
     */
    function removeEmptyLines(lines) {
        _I("ES5 FUNCTION: removeEmptyLines", "lines", lines);
        var i;

        for (i = 0; i < lines.length; i++) {
            if (isEmptyLine(lines[i])) {
                lines.splice(i--, 1);
            }
        }
    }

    /**
     * Joins line tokens where the value of a token may include a character that matches the delimiter.
     * For example: "foo, bar", baz
     */
    function defragmentLineTokens(lineTokens, delimiter) {
        _I("ES5 FUNCTION: defragmentLineTokens", "lineTokens", lineTokens, "delimiter", delimiter);
        var i, j,
            token, quote;

        for (i = 0; i < lineTokens.length; i++) {
            token = lineTokens[i].replace(/^[\s]*|[\s]*$/g, '');
            quote = '';

            if (token.charAt(0) === '"' || token.charAt(0) === '\'') {
                quote = token.charAt(0);
            }

            if (quote !== '' && token.slice(-1) !== quote) {
                j = i + 1;

                if (j < lineTokens.length) {
                    token = lineTokens[j].replace(/^[\s]*|[\s]*$/g, '');
                }

                while (j < lineTokens.length && token.slice(-1) !== quote) {
                    lineTokens[i] += delimiter + (lineTokens.splice(j, 1))[0];
                    token = lineTokens[j].replace(/[\s]*$/g, '');
                }

                if (j < lineTokens.length) {
                    lineTokens[i] += delimiter + (lineTokens.splice(j, 1))[0];
                }
            }
        }
    }

    /**
     * Removes leading and trailing whitespace from each token.
     */
    function trimWhitespace(lineTokens) {
        _I("ES5 FUNCTION: trimWhitespace", "lineTokens", lineTokens);
        var i;

        for (i = 0; i < lineTokens.length; i++) {
            lineTokens[i] = lineTokens[i].replace(/^[\s]*|[\s]*$/g, '');
        }
    }

    /**
     * Removes leading and trailing quotes from each token.
     */
    function trimQuotes(lineTokens) {
        _I("ES5 FUNCTION: trimQuotes", "lineTokens", lineTokens);
        var i;

        // TODO: allow for escaped quotes
        for (i = 0; i < lineTokens.length; i++) {
            if (lineTokens[i].charAt(0) === '"') {
                lineTokens[i] = lineTokens[i].replace(/^"|"$/g, '');
            } else if (lineTokens[i].charAt(0) === '\'') {
                lineTokens[i] = lineTokens[i].replace(/^'|'$/g, '');
            }
        }
    }

    /**
     * Converts a single line into a list of tokens, separated by the given delimiter.
     */
    function tokenizeLine(line, delimiter) {
        _I("ES5 FUNCTION: tokenizeLine", "line", line, "delimiter", delimiter);
        var lineTokens = line.split(delimiter);

        defragmentLineTokens(lineTokens, delimiter);
        trimWhitespace(lineTokens);
        trimQuotes(lineTokens);

        return lineTokens;
    }

    /**
     * Converts an array of lines into an array of tokenized lines.
     */
    function tokenizeLines(lines, delimiter) {
        _I("ES5 FUNCTION: tokenizeLines", "lines", lines, "delimiter", delimiter);
        var i,
            tokenizedLines = [];

        for (i = 0; i < lines.length; i++) {
            tokenizedLines[i] = tokenizeLine(lines[i], delimiter);
        }

        return tokenizedLines;
    }

    /**
     * Converts an array of tokenized lines into an array of object literals, using the header's tokens for each object's keys.
     */
    function assembleObjects(tokenizedLines) {
        _I("ES5 FUNCTION: assembleObjects", "tokenizedLines", tokenizedLines);
        var i, j,
            tokenizedLine, obj, key,
            objects = [],
            keys = tokenizedLines[0];

        for (i = 1; i < tokenizedLines.length; i++) {
            tokenizedLine = tokenizedLines[i];

            if (tokenizedLine.length > 0) {
                if (tokenizedLine.length > keys.length) {
                    // throw new SyntaxError('not enough header fields');
                    console.warn("The file you have just loaded contains the wrong number of header fields. This is usually indicative of either a long-running story being deleted mid-iteration, or that Theresa, scrum-master for Victor's teams has some 'splainin' to doooo.");
                }

                obj = {};

                for (j = 0; j < keys.length; j++) {
                    key = keys[j];

                    if (j < tokenizedLine.length) {
                        obj[key] = tokenizedLine[j];
                    } else {
                        obj[key] = '';
                    }
                }

                objects.push(obj);
            }
        }

        return objects;
    }

    /**
     * Parses CSV text and returns an array of objects, using the first CSV row's fields as keys for each object's values.
     */
    CSV.parse = function (text, lineEnding, delimiter, ignoreEmptyLines) {
        _I("ES5 FUNCTION: CSV.parse", "text", text, "lineEnding", lineEnding, "delimiter", delimiter, "ignoreEmptyLines", ignoreEmptyLines);
        var config = {
            lineEnding: /[\r\n]/,
            delimiter: ',',
            ignoreEmptyLines: true
        },

            lines, tokenizedLines, objects;

        // Empty text is a syntax error!
        if (text === '') {
            throw new SyntaxError('empty input');
        }

        if (typeof lineEnding !== 'undefined') {
            if (lineEnding instanceof RegExp) {
                config.lineEnding = lineEnding;
            } else {
                config.lineEnding = new RegExp('[' + String(lineEnding) + ']', 'g');
            }
        }

        if (typeof delimiter !== 'undefined') {
            config.delimiter = String(delimiter);
        }

        if (typeof ignoreEmptyLines !== 'undefined') {
            config.ignoreEmptyLines = !!ignoreEmptyLines;
        }

        // Step 1: Split text into lines based on line ending.
        lines = splitLines(text, config.lineEnding);

        // Step 2: Get rid of empty lines. (Optional)
        if (config.ignoreEmptyLines) {
            removeEmptyLines(lines);
        }

        // Single line is a syntax error!
        if (lines.length < 2) {
            throw new SyntaxError('missing header');
        }

        // Step 3: Tokenize lines using delimiter.
        tokenizedLines = tokenizeLines(lines, config.delimiter);

        // Step 4: Using first line's tokens as a list of object literal keys, assemble remainder of lines into an array of objects.
        objects = assembleObjects(tokenizedLines);

        return objects;
    };

    // Expose local CSV object somehow.
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        // If Node module pattern is supported, use it and do not create global.
        module.exports = CSV;
    } else if (typeof define === 'function' && define.amd) {
        // Node module pattern not supported, but AMD module pattern is, so use it.
        //eslint-disable-next-line
        define([], function () {
            return CSV;
        });
    } else {
        // No AMD loader is being used; expose to window (create global).
        window.CSV = CSV;
    }
}(typeof window !== 'undefined' ? window : {}));
/*eslint-enable*/
//@@ =====================================================================================================================================

//!! =====================================================================================================================================
//!! ======================================================== FLAMBE PROPER ==============================================================
//!! =====================================================================================================================================
// DECLARATIONS //==================================================================================================================
// Shortcut aliases and Helper functions //-----------------------------------------------------------------------------------------
const DEBUG_MODE = true;    //--> NOT TO BE SET TO 'TRUE' IN PRODUCTION USE - CONTROLS CONSOLE LOGS AND EXCESSIVE MEMORY CONSUMPTION
const INFO_TRACE = false;    //--> NOT TO BE SET TO 'TRUE' IN PRODUCTION USE - CONTROLS CONSOLE LOGS AND EXCESSIVE MEMORY CONSUMPTION

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

const totalItrDayPicker = document.querySelector('.picker-panel-presenter')


    , getDayCountFromPicker = () => (totalItrDayPicker.placeholder / 1);

// Global Variables --------------------------------------------------------------------------------------------------------------
let fileBuffer = []                                                                            		// Stores copies of the file input's data collection (req'd in case the user maskes multiple sets of selections)
    , safeBuffer = []
    , namedFiles = []                                                                            		// Array containing just the names of the files contained within fileBuffer (used for sequencing the read order)
    , COMBD_DATA = []                                                                            		// COMBINED DATA from all the files ingested
    , DEBUG_DATA = []                                                                                   // PLACEHOLDER DATA container for use in debugging
    , ISSUE_KEYS = []                                                                            		// LIST OF ALL THE ISSUES from all the files ingested
    , INTERPOL8D = []                                                                            		// ARRAY OF ALL THE DATES that needed to be interpolated
    , RPTDATA = []                                                                            		//
    , TOTALITRDAYS = getDayCountFromPicker()
    , DAYSLOADED = 0                                                                             		// THE NUMBER OF ACTUAL DAYS we have data for (basically lumps Seed and Day One into a single day)
    , FILESLOADED = 0                                                                             		// THE NUMBER OF FILES entered into the system, regardless of the number of DAYS in the iteration
    , input = document.getElementById('input')                                              		// HTML file <INPUT> field/drop target for uploading XLSX files into the system

    , dateField = qs("#report-start-date")                                                      		// HTML date <INPUT> field representing the start of the iteration
    , sortableList = qs('.has-draggable-children')                                                 		// The <UL> containing the drag-drop-sortable list of files provided by the user
    , doneButton = qs('.done-sorting')                                                        		    // "Run report" button
    , iterationName = qs("#iteration-name")
    , previewPanel = qs('.output-table')
    , dataToGraph = null
    , idealDayCount = null
    , targetSlot = null;

// APPLICATION SOURCE ============================================================================ 🅔🅧🅔🅒🅤🅣🅘🅞🅝 🅢🅔🅠🅤🅔🅝🅒🅔 indicated by encircled digits (➀-➈)
const init = () => {                                                                                      		// ⓿ Initiate application, chaining steps 1-3 above to file input's onChange
    _I("\n\n====== INIT ======\n");
    iterationName.value = recall('iterationName', '') || "Team Byrnedown - Iteration ";                  // Seed the value set for the iteration's name (or blank if none is stored)...
    iterationName.onkeyup = () => { retain('iterationName', iterationName.value); };                    		// ... and set up the field's onKeyUp handler to save any changes henceforth.
    iterationName.onchangd = () => { retain('iterationName', iterationName.value); };                  		// ... aaaand again, some more, for onChange.
    dateField.value = recall('reportStartDate', '');                                         		// Do the same for the Start Date value, seeding it (or blank) if set...
    dateField.onkeyup = () => { retain('reportStartDate', dateField.value); };                	    	// ... and establishing the onKeyUp listener to store any updates.
    dateField.onchange = () => { retain('reportStartDate', dateField.value); };                		    // ... and establishing the onChange listener to store any updates.
    fileBuffer = recall('fileBuffer', null);                                             		// Try and retrieve the fileBuffer in one exisits in Rote memories...
    fileBuffer = (fileBuffer == null) ? [] : JSON.parse(fileBuffer);                    		// ... and, if one does, rehydrate it. Otherwise, establish it as a new array.

    let startingLength = 10;

    if (fileBuffer.length > 0) {                                                                     		// If we DID manage to restore a previous buffer...
        namedFiles = retain('namedFiles', fileBuffer.flatMap(f => (f && f.fileName)               		//    ... and, should it prove that we have a valid file for each (filled) index... ********
            ? f.fileName            	    	//    ... reconstuct the list of previously-provided file names...
            : ''));                 		    //    ... otherwise, flag the individual record as having errored out.
        startingLength = fileBuffer.length - 1;                                                     		//    .. Finally, while we're at it, let's grab the number of files we're starting with.
    }

    if (fileBuffer.length <= 1) {                                                                        		// If we FAILED to restore a previous buffer (or the one we DID errored out)...
        namedFiles = reflect('namedFiles', []);                                                    		//    ... grab theb previous buffer from rote memories (defaulting to [] if not present)...
        if (typeof (namedFiles) === 'string') namedFiles = retain('namedFiles', namedFiles.split(','));         //    ... break our namedFiles back out too.
    }

    totalItrDayPicker.placeholder = startingLength;
    syncSpinner(startingLength);                                                                            //## ➜➜➜ 🅒 

    resizeBufferArraysAndRebuildSlots();                                                                    //@@ ➜➜➜ ︎🅑 
    syncSpinner();                                                                                          //## ➜➜➜ 🅒 

    input.addEventListener('change', e => {                                                                 //$ onChange Event handler for the individual <LI>'s; Allows files ot be added
        _I("EVENT: input.addEventListener('change') e", e);
        if (targetSlot != null && input.files.length === 1) {                                                 // (Since, in the case of a bulk upload attempt, we'd have no slot and more than 1 file)
            return addOrReplaceSingleFileAndParse();                                                        //!! ➜➜➜ 🅐 
        }
    });
};

// const insertFileNodeBetween = (e, trgObj = e.target) => {
//     _I("FUNCTION: insertFileNodeBetween", "e", e, "trgObj", trgObj);                                        //$$ Ⓓ ⬅⬅⬅︎ 
// // _(e, trgObj);
//     if (trgObj.tagName !== 'LI') {
//         // e.preventDefault();
//         return (e.cancelBubble = true);
//     }
//     let targetIndex = trgObj.dataset.slot;
//     fileBuffer.splice(targetIndex, 0, '');
//     namedFiles.splice(targetIndex, 0, '');
//     syncSpinner(((totalItrDayPicker.placeholder / 1) + 1));                                                 //## ➜➜➜ 🅒 
//     resizeBufferArraysAndRebuildSlots();                                                                    //@@ ➜➜➜ 🅑 
// };

const insertFileNodeBetween = (e, trg = e.target) => {
    _I("FUNCTION: insertFileNodeBetween", "e", e, "trg", trg);                                        //$$ Ⓓ ⬅⬅⬅︎ 
    if (!trg.dataset || !trg.dataset.insertion) {
        // e.preventDefault();
        return (e.cancelBubble = true);
    }
    let targetIndex = +trg.dataset.insertion;
    fileBuffer.splice(targetIndex, 0, '');
    namedFiles.splice(targetIndex, 0, '');
    syncSpinner(((totalItrDayPicker.placeholder / 1) + 1));                                                 //## ➜➜➜ 🅒 
    resizeBufferArraysAndRebuildSlots();                                                                    //@@ ➜➜➜ 🅑 
};

const syncSelect = (e, val) => {
    let trg = e.target;
    val = (val != null) ? val : trg.value;
    let txtBox = trg.previousElementSibling.previousElementSibling;
    txtBox.value = val;
    retain(trg.id, val);
    trg.blur();

};

const setSelect = (sel, val) => {
    if (sel == null || val == null) return false;
    sel = (typeof (sel) === 'string') ? qs(sel) : sel;
    sel.value = val;
    syncSelect({ target: sel }, val);
};

let ALLTEAMS = [];
let ALLITRS = [];
const generateTeamsAndIterationLists = () => {
    ALLTEAMS = [];
    ALLITRS = [];
    for (let files in fileBuffer) {
        let file = fileBuffer[files];
        if (file != null && file != '') {
            let teamsInFile = JSON.stringify(file.fileData, ['Component/s']);                 // Rip out all the teams in each file...
            teamsInFile = JSON.parse(teamsInFile).flatMap(d => d['Component/s']);           // ... then flatten the results into a 1-dimensional array.
            let itrsInFile = JSON.stringify(file.fileData, ['Sprint']);                                    // ... then do the same for iterations.
            itrsInFile = JSON.parse(itrsInFile).flatMap(d => d['Sprint']);
            ALLTEAMS = [...teamsInFile, ...ALLTEAMS];                                                // Append the new data to the running variable
            ALLITRS = [...itrsInFile, ...ALLITRS];
        }
    }


    ALLTEAMS = [...new Set(ALLTEAMS)].sort();                                                               // Finally, reduce both to collections containing only unique elements
    ALLITRS = [...new Set(ALLITRS)].sort();


    let teamsDD = qs('#selTeam'),
        itrsDD = qs('#selIteration');

    teamsDD.innerHTML = '<option>Show All Teams</option><option>' + ALLTEAMS.join('</option><option>') + '</option>';
    itrsDD.innerHTML = '<option>Show All Iterations</option><option>' + ALLITRS.join('</option><option>') + '</option>';
    teamsDD.addEventListener('change', syncSelect);
    itrsDD.addEventListener('change', syncSelect);

};
setSelect('#selTeam', recall('selTeam'));
setSelect('#selIteration', recall('selIteration'));
// eslint-disable-next-line
const removeFileAtIndex = (trgBtn, isFilled) => {                                                                 //%% Ⓔ ⬅⬅⬅︎  Remove the file from the slot whose trashcan was clicked (both in the buffer and the UI)
    _I("FUNCTION: removeFileAtIndex", "trgBtn", trgBtn, "isFilled", isFilled);
    let ind = trgBtn.dataset.index;
    if (findLastIndexOf(namedFiles, /.+/) === 0) {
        namedFiles[0] = retain('namedFiles', '');
        fileBuffer[0] = retain('fileBuffer', '');
        return resizeBufferArraysAndRebuildSlots();                                                         //@@ ➜➜➜ 🅑 
    }
// _(ind, trgBtn);
    if (isFilled) {
        namedFiles.splice(ind, 1, "");
        fileBuffer.splice(ind, 1, "");
    } else {
        namedFiles.splice(ind, 1);
        fileBuffer.splice(ind, 1);
        incDec(-1);
    }
    return resizeBufferArraysAndRebuildSlots();                                                             //@@ ➜➜➜ 🅑 
};


const resizeBufferArraysAndRebuildSlots = (newLen = ((totalItrDayPicker.placeholder / 1) + 1)) => {               //@@ Ⓑ ⬅⬅⬅︎ Destroys the current buffer and UI, rebuilding them to reflect new state
    _I("FUNCTION: resizeBufferArraysAndRebuildSlots", newLen);
    if (typeof (namedFiles) == 'undefined' || isNaN(newLen) || newLen < 0) return false;
    let oldLen = (namedFiles && namedFiles.length) ? namedFiles.length / 1 : 0,
        opStr = '';

    namedFiles.length = newLen;
    fileBuffer.length = newLen;
    if (oldLen < newLen) {
        namedFiles.fill('', oldLen);
        fileBuffer.fill('', oldLen);
    }
    retain('namedFiles', namedFiles);
    retain('fileBuffer', JSON.stringify(fileBuffer));

    let interpolated = findLastIndexOf(namedFiles, /.+/);

    for (let i = namedFiles.length - 1; i >= 0; i--) {
        if (namedFiles.indexOf(namedFiles[i]) < i) namedFiles[i] = '';
        let pList = ' class="drag-drop" draggable="true" '
            , dSlot = ` data-slot="${(i > 0) ? i : 'S'}" `
            , fName = ` <label for="input" onMouseDown="setTargetSlot(${i})">
                              ${(namedFiles[i].length > 40) ? namedFiles[i].slice(0, 25) + ' <b>…</b> ' + namedFiles[i].slice(-70) : namedFiles[i]}
                              <button class="remove-buttons" data-index="${i}" onMouseUp="removeFileAtIndex(this, true)" />                            
                           </label>`                                                                        //%% ➜➜➜ 🅔 
            , arrID = ` id="file-slot-${i}" `;

        if (namedFiles[i] == '') {
            if (i < interpolated) {                                                                       //%% ➜➜➜ 🅔 
                fName = ` <label for="input" onMouseDown="setTargetSlot(${i})">
                                No file specified (click to add, or leave blank to interpolate data from neighbors)
                                <button class="remove-buttons" data-index="${i}" onMouseUp="removeFileAtIndex(this, false)" />  
                              </label>`;
                pList += ' data-value="interpolated"';
            } else {
                fName = ` <label for="input" onMouseDown="setTargetSlot(${i})">No file specified (click to add!)
                                <button class="remove-buttons" data-index="${i}" onMouseUp="incDec(-1); released();" />

                            </label>`;
            }
        } else {
            pList += ' data-value="stored"';

        }

        let determinedPos   =   dSlot.replace(/data-slot="(.*)"/, '$1').trim(),
            newSlotMarkup   =   (determinedPos === 'S')
                            ?   `<a href="#" class="rowInserter insertBelow" data-insertion="1"></a>`
                            :   `<a href="#" class="rowInserter insertAbove" data-insertion="${determinedPos}"></a>
                                 <a href="#" class="rowInserter insertBelow" data-insertion="${(+determinedPos + 1)}"></a>`
                            ;   
        newSlotMarkup = `<li ${arrID + dSlot + pList}>${newSlotMarkup}${fName}</li>`;
        opStr = newSlotMarkup + opStr;
    }
    while (sortableList.childElementCount > 0) sortableList.childNodes[0].remove();
    sortableList.insertAdjacentHTML('beforeEnd', opStr);
    qsa('.rowInserter').forEach(li => li.addEventListener('click', insertFileNodeBetween));                         //$$ ➜➜➜ 🅓 

    generateTeamsAndIterationLists();
};
const addOrReplaceSingleFileAndParse = (slotId = targetSlot, liObj = qs('#file-slot-' + slotId)) =>                     //!! Ⓐ ⬅⬅⬅︎ Inserts (or updates) a file at the specified slot (in both the buffer and the UI)
{
    let fileObj = input.files[0],
        fileName = fileObj.name;

    if (namedFiles.indexOf(fileName) != -1) return (alert('This file is already in use!'));
// _("WORKING WITH PROVIDED FILE ", fileName, namedFiles.indexOf(fileName));
    const readUploadedFileAsText = (fileObj) => {
        _I("FUNCTION: readUploadedFileAsText", "fileObj", fileObj);
// _("readUploadedFileAsText");
        let reader = new FileReader();

        return new Promise((resolve) => {
            reader.onload = () => {
                _I("FUNCTION: onload");
// _('onload Event fired...');
                resolve(reader.result);
            };
            reader.readAsText(fileObj);
        });
    };

    readUploadedFileAsText(fileObj)
        .then(result =>
            new Promise(resolve => {
// _('...resolved\n".then()" #1');
                var opJSON = CSV.parse(result);                                                         //    Parse the .CSV file input, ...
// _(opJSON);
                let newJSONData = { fileName: fileName, fileData: opJSON };
                fileBuffer[slotId] = newJSONData;
                namedFiles[slotId] = fileName;
                resolve();
            })
        )
        .then(() => {
// _('...resolved\n".then()" #2');
            resizeBufferArraysAndRebuildSlots();                                                            //@@ ➜➜➜ ︎🅑 
            doneButton.disabled = false;
            doneButton.addEventListener('click', runReport);                                                 //** ➜➜➜ ︎🅗 
            return;
        });
};

const runReport = (obj = doneButton) => {                                                                    //** ⬅⬅⬅︎ Ⓗ    Execute the preview grid and graphing methods 
    //  offerToPerformDayOneOverrideAdjustment()
    // safeBuffer = Object.assign([], );
    let pvTable = qs('.preview-table');
    if (pvTable) pvTable.remove();
    FILESLOADED = fileBuffer.filter(fb => fb != '').length;                                                // Increment our "number of files we've read" counter...
    DAYSLOADED = FILESLOADED - 1;
    if (DAYSLOADED < 0) return false;
    // ... and the number of days that equates out to.
    const sumHours = (hourColl) =>
        hourColl.flatMap(s => { let sth = 0, retVal = parseInt(s['Remaining Estimate']); retVal = isNaN(retVal) || retVal === 'NaN' ? 0 : retVal; sth += retVal; return sth; });

    if (TOTALITRDAYS > 2 && DAYSLOADED === 1) {
        let seedDataCount = fileBuffer[0].fileData.length,
            seedDatatotal = sumHours(fileBuffer[0].fileData);
        let day1DataCount = fileBuffer[1].fileData.length,
            day1Datatotal = sumHours(fileBuffer[1].fileData);
        if (day1DataCount > seedDataCount || day1Datatotal > seedDatatotal) { // 
            offerToPerformDayOneOverrideAdjustment();
        }
    }


    if (obj.disabled == true) return false;
    COMBD_DATA = [];
    ISSUE_KEYS = [];
    DEBUG_DATA = [];

    getDistinctKeysFromFiles();                                                                             //^^ ➜➜➜ 🅕 
};
function checkFilterMatch(fullDaysRecords, teamFilt, itrFilt) {
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    teamFilt = (teamFilt == null || teamFilt == '' || teamFilt == '*' || teamFilt.indexOf('Show All') === 0) ? '.*': escapeRegExp(teamFilt);
    itrFilt  = (itrFilt  == null || itrFilt  == '' || itrFilt  == '*' || itrFilt.indexOf('Show All')  === 0) ? '.*': escapeRegExp(itrFilt);

    if (fullDaysRecords != null) {
        teamFilt = new RegExp(teamFilt, 'gim');
        itrFilt  = new RegExp(itrFilt, 'gim');

        let filteredRecords = fullDaysRecords.filter(
            rtc => {
                return (
                    (teamFilt && rtc['Component/s'] != null && rtc['Component/s'].match(teamFilt))
                    &&
                    (itrFilt && rtc['Sprint'] != null && rtc['Sprint'].match(itrFilt))
                );
            }
        );
        return filteredRecords;
    }
    return false;
}

const getDistinctKeysFromFiles = () => {                                                                    //^^ ⬅⬅⬅︎ Ⓕ    Iterate through our files, constructing a unique JSON structure from them 
    safeBuffer = Object.assign([], JSON.parse(recall('fileBuffer')));                                                             // Duplicate the file buffer (so we're not mucking up our original, "pure" copy. This one's "safe" to screw with

    while (safeBuffer.lastIndexOf('') === (safeBuffer.length - 1)) safeBuffer.pop();                         // Discard any blank indicies And the END of the stack. Those are "missing" days.
    while (safeBuffer.indexOf('') != -1) safeBuffer[safeBuffer.indexOf('')] = 'INTERPOLATED';               // (...since any blanks in the middle of the stack get flagged as needing to be interpolated)
    for (let files in safeBuffer) {                                                                         // Iterate all the files we've collected into the buffer...
        let file = safeBuffer[files];                                                                       //  ... Alias the file (for convenience).
        if (file !== 'INTERPOLATED') {                                                                        //  ... Assuming it's not flagged for interpolation, 
            safeBuffer[files].fileData = checkFilterMatch(file.fileData, recall('selTeam'), recall('selIteration'));            // PERFORM TEAM AND ITR FILTRATION HERE
            let keySet = JSON.stringify(file.fileData, ['Issue key']);                                       //    ... pull out a flattened string containing ONLY the 'Issue key' columns
            keySet = keySet.match(/\bBSWM[A-Z0-9]{0,4}-\d{2,6}\b/g);                                                                 //    ... and then search the pattern DIGTDEV-####(##) out (any 4-6-digit number)
            if (keySet != null && keySet !== '' && Array.isArray(keySet) && keySet.length > 0) ISSUE_KEYS = [...new Set([...ISSUE_KEYS, ...keySet])];                                          //    ... combine keySet and ISSUE_KEYS, remove duplicates, and convert back to an array.
        } else INTERPOL8D.push(files);                                                                      //  ... UNLESS it IS flagged for interpolation, in which case add it to that collection  
    }

    remapDataSoIssueIDIsPrimaryKey();                                                                       //&& ➜➜➜ 🅖
};

const remapDataSoIssueIDIsPrimaryKey = () => {                                                              //&& Ⓖ ⬅︎⬅︎⬅︎    Iterate finalized buffer, and concatinated generate output data
    _I("FUNCTION: remapDataSoIssueIDIsPrimaryKey");
    let temp_store = [];                                                                                        // Create a temporary, empty collection...
    ISSUE_KEYS.forEach(r => {                                                                               //    ... Iterate through our unique keys from all files (from getDistinctKeysFromFiles)...
        temp_store.push(r['Issue key']);                                                                    //    ... stuff 'em into said temp array...
        COMBD_DATA[r] = new Array(safeBuffer.length).fill('');                                              //    ... and create an index to house the data within our Combined Data collection
        if (DEBUG_MODE) DEBUG_DATA[r] = new Array(safeBuffer.length).fill('');                               //    (... and if we're debugging, may as well make a slot a flattened string copy too)
    });

    let prevDay, prevData;

    for (let files in safeBuffer) {
        let file = safeBuffer[files];
        if (file !== 'INTERPOLATED') {
            file = file.fileData;
            console.groupCollapsed('Ingested File')
            console.log('file :', file);
            console.groupEnd();
            file.forEach(f => {
            console.log('f :', f);
                if (f && f['Issue key'] && f['Issue key'] != null && f['Issue key'] !== '') {
                    console.log('f[\'Issue key\'] :', f['Issue key']);
                    COMBD_DATA[f['Issue key']][files] = f;
                    if (DEBUG_MODE) DEBUG_DATA[f['Issue key']][files] = JSON.stringify(f);
                }
            });
            prevDay = files;
            prevData = file;
            prevData = Object.assign([], safeBuffer[files]);
        }
    }
    Object.keys(COMBD_DATA).forEach(cbd => {
        INTERPOL8D.forEach(itp => COMBD_DATA[cbd][itp] = '---');
    });
    window.addEventListener('click', destroyExtantDetailPreviewers);
    processParentChildRelationships();                                                                      //⦾! ➜➜➜ 🅘
};

const destroyExtantDetailPreviewers = (forced=false) => {
    console.log('window.pReviewing :', window.pReviewing);
    if(!window.pReviewing || forced) [...qsa('.extra-details')].forEach(pp => pp.remove())

};

const pReviewing = (e, eventTarget = e.target, engaged = false) => {
    if(engaged) {
        window.pReviewing = true;
        window.clearTimeout(window.pReviewTimer);
    }
    else window.pReviewTimer = window.setTimeout(()=>{window.pReviewing = false; destroyExtantDetailPreviewers(true)}, 500000 );
}

const showRecordDetails = (e, eventTarget = e.target || false) => {
    if(!eventTarget) return false;
    _I("FUNCTION: showRecordDetails", "e", e, "eventTarget", eventTarget);
    let recordIdToDisplay = null;
    
    if(eventTarget.dataset && eventTarget.dataset.recid) recordIdToDisplay = eventTarget.dataset.recid;
    else{
        eventTarget = eventTarget.closest('.issue-link');
        recordIdToDisplay = eventTarget.innerText;
    }
    if (recordIdToDisplay == null) return false;
    console.log('recordIdToDisplay :', recordIdToDisplay);
    e.preventDefault(true);
    destroyExtantDetailPreviewers(true);

    function normalizeHours(inp){
        if(inp == null || isNaN(inp)) return inp;
        return toHours(inp) + 'h';
    }
    
    let gatheredDetails = quickIndex.getLatestDetails(recordIdToDisplay),
        flatData = '<div class="extra-details">' + (Object.entries(gatheredDetails).map(kvp=>{
            if(kvp[1].trim() === '') return
            return (kvp[1].trim() === '') ? '' : `<span>${kvp[0]}</span><span>${normalizeHours(kvp[1])}</span>`;

        }).join('') + '</div>');
    eventTarget.insertAdjacentHTML('beforeEnd', flatData);
    qs('.extra-details').addEventListener('mouseover', (e)=>pReviewing(e, e.target, true));
    qs('.extra-details').addEventListener('mouseout', (e)=>pReviewing(e, e.target));
};
let quickIndex;
const processParentChildRelationships = () => {                                                             //⦾! Ⓘ ⬅︎⬅︎⬅︎ Correllates the parent tasks to their corresponding sub-tasks 
    _I("FUNCTION: processParentChildRelationships");
    const createJIRALink = (IssueId, isParent = false) => {
        // _I("FUNCTION: createJIRALink", "IssueId", IssueId, "isParent", isParent);
        let hrefUrl = `href="https://jirasw.t-mobile.com/browse/${IssueId}"' `,
            clsName = `class="issue-${isParent ? 'parent-' : ''}link iss-hvr-lnk" `;
        let wndoTrg = `target="_blank" `,
            issueID = IssueId.replace(/(\d-)(\d+)/gi, '$1<b>$2</b>');

        return `<a ${hrefUrl + clsName + wndoTrg}>${issueID}</a><span class="record-reviewer" data-recid="${IssueId}" />`;
    };

    var toc = {};
    quickIndex = Object.entries(COMBD_DATA).map(e => {
        // _I("FUNCTION: quickIndex");
        let opIssueObj = {}
            , issueKey = e[0]
            , issueData = e[1]
            , fltrdRows = issueData.filter(col => typeof (col) === 'object')
            , validRow = fltrdRows[fltrdRows.length - 1]
            , issueId = validRow['Issue id'];

        toc[issueId] = issueKey;
        opIssueObj = {
            key: issueKey
            , iid: toc[validRow['Issue id']]
            , pid: toc[validRow['Parent id']] || ''
            , sts: validRow.Status
            , ass: validRow.Assignee
            , sum: validRow.Summary
            , vld: validRow
        };
        opIssueObj.pathLinks = (opIssueObj.pid === '')
            ? createJIRALink(opIssueObj.iid)
            : createJIRALink(opIssueObj.pid, true)
            + ' / ' + createJIRALink(opIssueObj.iid);
        return opIssueObj;
    });
    quickIndex.toc = toc;
    quickIndex.pathedName = (key) => {
        // _I("FUNCTION: pathedName", "key", key);
        let results = quickIndex.find(qI => qI.key === key);
        return (results && results.pathLinks) ? results.pathLinks : key;
    };
    quickIndex.lastStatus = (key) => {
        // _I("FUNCTION: lastStatus", "key", key);
        let results = quickIndex.find(qI => qI.key === key);
        return (results && results.sts) ? results.sts : '';
    };
    quickIndex.getLatestDetails = (key) => {
        // _I("FUNCTION: getLatestDetails", "key", key);
        let results = quickIndex.find(qI => qI.key === key);
        return (results && results.vld) ? results.vld : false;
    };

    constructPreviewAndReportData();

};
const constructPreviewAndReportData = () => {                                                         // ⓺ iterate concatinated output data, look for concern-suggestive trends and build our markup
    const ensureValidValue = (variable, value, altVal = value, tolerateEmptyStr = false) => {
        _I("FUNCTION: ensureValidValue", "variable", variable, "value", value, "altVal", altVal, "tolerateEmptyStr", tolerateEmptyStr);
        return (
            typeof (value) === undefined
            || value == null
            || (!tolerateEmptyStr && value === '')
            || value === '---'
        ) ? ((altVal !== value) ? altVal : variable)
            : value;

    };
// _('constructPreviewAndReportData', COMBD_DATA);
    let MRKUP = [],                                                                                    // Collection of markup that'll we'll used to render both the HTML preview and the ultimate XLSX file output
        _I_ = '||--||';                                                                                // The string delimiter we're using to distinguish one chunk of data from another. Our "Split-target"
    Object.entries(COMBD_DATA).forEach((dataRecord, ind) => {                                          // Iterate across each Issue (the "rows") that we've ingested data for, to extract the following data:

        // _(dataRecord);
        let issueName = dataRecord[0]                                                                 //   - The specific issue being examined (just the name; eg. 'DIGIT-12345'. Also serves as the array key)
            , issueData = dataRecord[1]                                                                 //   - The specific issue being examined (all the data for all the days for the files provided)
            , colCt = issueData.length                                                                  //   - How many "columns" we're looking at
            , opSts = ''
            , ROWOP = ''                                                                                 //   - The iteratively-constructed markup for the "row" corresponding to the issue being examined
            , opHrs = 0
            , flags = ''                                                                                 //   - The empty collection of flags, to be joined & processed later in the loop
            , reCtr = 1                                                                                  //   - Counter for how many consecutive days the Remaining Estimate has languished, unchanged
            , ctCtr = 1                                                                                  //   - Iteration-length counter for how many consecutive days the Remaining Estimate goes unchanged
            , oldRE = ''                                                                                 //   - Previous (from the previous-iterated-over day in the row) Remaining Hours Estimate
            , oldPI = ''                                                                                 //   - Previous (from the previous-iterated-over day in the row) Parent ID
            , oldII = ''                                                                                 //   - Previous (from the previous-iterated-over day in the row) Issue ID
            , newRE = ''                                                                                 //   - Current (from the currently-iterated-over day in the row) Remaining Hours Estimate
            , newPI = ''                                                                                 //   - Current (from the currently-iterated-over day in the row) Parent ID
            , newII = ''                                                                                 //   - Current (from the currently-iterated-over day in the row) Issue ID
            , newST = '';                                                                                //   - Current Status (in this case, we don't care what the previous one was, but need it at the issue scope)

            console.log('issueName, issueData :', issueName, issueData);
        issueData.forEach((datRec, ix) => {                                                             // ...Iterate the issue's collected data (the "columns"), gathering...
            newRE = (datRec === '---') ? '---' : (datRec['Remaining Estimate'] || '---?');
            if (newRE === '---') {
                ROWOP = ROWOP + _I_ + '---';                                                           // Tack the current day being iterated past's Est. hours remaining onto the end of the issue being iterated past
            } else
                ROWOP = ROWOP + _I_ + toHours(newRE) + 'h';                                               // Tack the current day being iterated past's Est. hours remaining onto the end of the issue being iterated past
        });
        ROWOP = quickIndex.lastStatus(issueName) + _I_ + quickIndex.pathedName(issueName) + ROWOP;                                                           // STATUS | JIRA ID | PARENT ID | ISSUE ID | DAY 1 | DAY 2 | ... | DAY n | flags |
        for (var backfill = colCt; backfill <= namedFiles.length - 1; backfill++) {
            ROWOP += _I_ + 'XxXxX';
        }
        MRKUP.push(ROWOP.split(_I_));                                                                  // Convert it to an iterable collection and push it onto the bottom of the output markup stack
    });

    let colHeaders = ['Current Status', 'Issue ID', 'Seed Day']                  // Define always-present column headers (| Current Status | JIRA ID | Parent ID | Issue ID | Seed Day |)
        , dateArr = [];                                                                               // Array holding the labels for each column, each of which represent the file being examined
    if (dateField.checkValidity()) {                                                                   // Since we can't date-stamp a column if the user didn't give us a date, see if they did. IF they did...
        if (colHeaders[4] === 'Seed Day') colHeaders[4] += "<br>" + dateField.value;                     // Append the Seed Date to the seed column header (if currently unset)
        let startDate = new Date(dateField.value).getTime();                                           // Get the epoch value of the StartDate
        let dayCt = 1;                                                                                 // Increment the number of days we're venturing forth from the start date. This is used to ignore weekends
        while (dateArr.length < namedFiles.length - 1 && dayCt < namedFiles.length * 2) {                                                    // Keep going until we have at least 10 days
            let incrementedDate = new Date(startDate + (dayCt * 86400000));                            // Add 24 hours to the daying bering iterated across
            if (incrementedDate.getDay() > 0 && incrementedDate.getDay() < 6)                          // If the now-incremented date falls on a M-F...
                dateArr.push('Day ' + (dateArr.length + 1) + '<br />' +                                //    ... add both the day number... 
                    incrementedDate.toLocaleDateString());                                  //    ... and the date that works out to to the stack.
            dayCt++;                                                                                   // Increment the day counter whether we added to stack or not (since we skip over weekends and holidays)
        }
    } else {
        for (let i = 1; i <= namedFiles.length - 1; i++)
            if (i > safeBuffer.length - 1)
                dateArr.push('XXXDay ' + i);
            else
                dateArr.push('Day ' + i);
    }

    colHeaders = [...colHeaders, ...dateArr];
    let tblMarkup = '<h1>' + iterationName.value + '</h1>' +
        '<table class="preview-table" cellspacing="0">'
        , hdrMarkup = '<thead><tr><th>' + colHeaders.join('</th><th>').replace(/>XXXDay/g, ' class="dim">Day') +
            '</th>'
        , rowMarkup = '</tr></thead><tbody>';
    MRKUP.forEach(o => rowMarkup += '<tr><td>' +
        o.join('</td><td>').replace(/\.00h|\.0h/g, 'h').replace(/>XxXxX/g, ' class="dim">') +
        '</td></tr>');
    rowMarkup += '</tbody>';
    tblMarkup += hdrMarkup + rowMarkup +
        '</tbody>';

    while (previewPanel.childElementCount > 0) { previewPanel.childNodes[0].remove(); }
    let cbPanel = document.getElementById('filter-ckbox-panel');
    if (cbPanel) cbPanel.remove();

    previewPanel.insertAdjacentHTML('beforeEnd', tblMarkup.replace(/<td>(0\*+?)h<\/td>/g, '<td class="major-alert">$1h</td>'));
    // previewPanel.insertAdjacentHTML('beforeEnd', tblMarkup.replace(/<td>0\*h<\/td>/g, '<td class="major-alert">0*h</td>'));

    [...qsa('a.iss-hvr-lnk')].forEach(lnk => {
        // lnk.addEventListener('contextmenu', showRecordDetails);
        let previewEyecon = lnk.nextElementSibling;
        previewEyecon.addEventListener('mouseover', (e)=>{pReviewing(e, e.target, true); showRecordDetails(e, e.target);});
        previewEyecon.addEventListener('mouseout', (e)=>pReviewing(e, e.target));
    });

    createReportData();



    postProcessData();




    let interpString = '',
        genLength = RPTDATA[0].length;
    INTERPOL8D.forEach(itpCol => interpString += `td:nth-of-type(-n + ${itpCol + 3}):nth-last-of-type(-n + ${genLength - 2 - itpCol}),`);
    // interpString += `td:nth-of-type(-n + ${INTERPOL8D[0] - -3}):nth-last-of-type(-n + ${genLength - 2 - INTERPOL8D[0]}),`;
// _(interpString);
    //let fx=[...qsa((interpString.slice(0,-1)))].forEach(itpCell=>itpCell.className+=' interpolated-value');
    return true;
};

const msgBox = (title, msgText, callback = () => { this.parentNode.parentNode.remove(); }, type = 'yesno', buttonText = 'ok') => {
    let boxUI = `<div id="msgbox"><div id="msgbox-window"><h3>${title}</h3><span>${msgText}</span>`;
    if (type === 'yesno') boxUI += `
                                    <button onclick="this.parentNode.parentNode.remove()">No</button>
                                    <button id="msgbox-prime">Yes</button>
                                `;
    else boxUI += `<button id="msgbox-prime">${buttonText}</button>`;
    boxUI += `</div></div>`;
    document.body.insertAdjacentHTML('afterBegin', boxUI);
    qs("#msgbox-prime").addEventListener('click', () => { qs("#msgbox").remove(); callback(); qs("#msgbox").remove(); });
    return;
};

let offerPerformed = false, genModSeeds = recall('genModSeeds');
const closeWindow = () => qs('#adjustement-panel').remove();
const reviseSeed = (newData) => {
    function locateCorrespondingRecord(needle, haystack, propertyToCheck){
        let straw = haystack.find(straws => (straws[propertyToCheck] === needle));
        return straw || null;
    }
    let issueBoxes = qsa(".adjustment-issue-check:checked"),
        seededSet  = fileBuffer[0]["fileData"],
        dayOneSet  = fileBuffer[1]["fileData"];

    issueBoxes = issueBoxes.map(iB => iB.id.replace('adjust-', ''));

    issueBoxes.forEach(issueKey => {
        let seededVersionOfIssue = locateCorrespondingRecord(issueKey, seededSet, "Issue key"),
            dayOneVersionOfIssue = locateCorrespondingRecord(issueKey, dayOneSet, "Issue key");
        if(seededVersionOfIssue === null)   seededSet.push(dayOneVersionOfIssue);
        else                                seededVersionOfIssue = dayOneVersionOfIssue;

        _(issueKey, seededVersionOfIssue, dayOneVersionOfIssue);
    })
    fileBuffer[0]["fileData"] = seededSet;
    retain('fileBuffer', JSON.stringify(fileBuffer));
    document.location.href = document.location;
    closeWindow();
};

const syncAdjCheckboxes = (fromMaster = false) => {
    let masterBox         = qs("#adjustment-all"),
        issueBoxes        = qsa(".adjustment-issue-check");
    masterBox.className   = "adjustment-master";
    if (fromMaster) {
        issueBoxes.forEach(b => { b.checked = masterBox.checked; });
    } else {
        let checkCount = 0;
        issueBoxes.forEach(b => checkCount += b.checked ? 1 : -1);
        if (Math.abs(checkCount) === issueBoxes.length) {
            masterBox.checked = checkCount > 0;
            // masterBox.className = (masterBox.checked) ? "adjustment-master on" : "adjustment-master off"
        } else {
            masterBox.checked = false;
            masterBox.className += " partial";
        }
    }

    issueBoxes.forEach(iB=>{
        let teamTotCell = qs('#teamTot' + iB.dataset.affectsTeam),
            typeTotCell = qs('#typeTot' + iB.dataset.affectsType);
        let sumTotlCell = qs('#overallTot');

        if(teamTotCell) teamTotCell.innerText = '±0 hours';
        if(typeTotCell) typeTotCell.innerText = '±0 hours';
        if(sumTotlCell) sumTotlCell.innerText = '±0 hours';
    });
    let checkedIssueBoxes = qsa(".adjustment-issue-check:checked");
    checkedIssueBoxes.forEach(cIB=>{
        let teamTotCell = qs('#teamTot' + cIB.dataset.affectsTeam),
            typeTotCell = qs('#typeTot' + cIB.dataset.affectsType);
        let sumTotlCell = qs('#overallTot');
        if(teamTotCell) teamTotCell.innerText = '+' + ((teamTotCell.innerText.replace(/[^\d.]/g, '') * 1) + (cIB.dataset.issueImpact * 1)) + ' hours';
        if(typeTotCell) typeTotCell.innerText = '+' + ((typeTotCell.innerText.replace(/[^\d.]/g, '') * 1) + (cIB.dataset.issueImpact * 1)) + ' hours';
        if(sumTotlCell) sumTotlCell.innerText = '+' + ((sumTotlCell.innerText.replace(/[^\d.]/g, '') * 1) + (cIB.dataset.issueImpact * 1)) + ' hours';
    });
};

// let seededSet, dayOneSet, revisedSeed, summaryTxts, summaryTots, seededFlat, lastMinAdds, seedFltKeys, missingStories, lastMinHrs;

const performDayOneOverrideAdjustment = () => {
    function locateCorrespondingRecord(needle, haystack, returnIndex=true){
        for(var idx=0; idx<haystack.length; idx++) if(needle===haystack[idx]) return returnIndex ? idx : haystack[idx];
        return null
    }

    if (offerPerformed || genModSeeds) return false;
    offerPerformed        = true;
    let lastMinAdds       = '',
        lastMinHrs        = '',
        teamsNewRec       = [],
        summaryTxts       = [],
        
        seededSet         = fileBuffer[0]["fileData"],
        dayOneSet         = fileBuffer[1]["fileData"],
        seededFlat        = seededSet.flatMap(s   => s["Issue key"]),
        dayOneFlat        = dayOneSet.flatMap(s   => s["Issue key"]),
        teamKeyStr        = 'Component/s',
        seededFlatKeys    = '_' + seededFlat.join('_') + '_',
        // dayOneFlatKeys = '|' + dayOneFlat.join('|') + '|';

        revisedSeed       = Object.assign([], seededSet),
        alterdHours       = [],

        missues           = dayOneFlat.filter(d1i => !new RegExp(`_${d1i}_`, 'gim').test(seededFlatKeys));
    missues               = missues.map(m => {let newM = dayOneSet[locateCorrespondingRecord(m, dayOneFlat)]; newM.modded = 'ADD'; newM.modValue = newM['Remaining Estimate']*1; return newM; });

    let newSeed           = [...seededSet, ...missues];
    // newSeedFlat   = seededSet.flatMap(s => s["Issue key"]);

    newSeed.forEach(nSI => {
        let relatedDay1Value = dayOneSet[locateCorrespondingRecord(nSI['Issue key'], dayOneFlat)],
            newSeedEstHrsVal = nSI['Remaining Estimate'];
        newSeedEstHrsVal = (newSeedEstHrsVal == null || newSeedEstHrsVal == '' || isNaN((newSeedEstHrsVal*1))) ? 0 : (newSeedEstHrsVal*1);
        if(relatedDay1Value && relatedDay1Value['Remaining Estimate']){
            relatedDay1Value = relatedDay1Value['Remaining Estimate'] * 1;
            if(relatedDay1Value > newSeedEstHrsVal){
                // _(nSI, nSI['Remaining Estimate'], relatedDay1Value, '\n\n========================');
                nSI.oldValue = newSeedEstHrsVal;
                nSI.modded   = 'AMEND';
                nSI.modValue = relatedDay1Value - newSeedEstHrsVal;
                nSI.newValue = relatedDay1Value;
                nSI['Remaining Estimate'] = relatedDay1Value;
            }
        }
    });

    let updates  = [
                        ...missues.sort((a, b) => b[teamKeyStr] - a[teamKeyStr]), 
                        ...newSeed.filter(nSI=>typeof(nSI.oldValue) !== 'undefined').sort((a, b) => b[teamKeyStr] - a[teamKeyStr])
                    ];

    let summaryOPUI = '';

    summaryOPUI += `<div id='adjustement-panel'>
                        <table cellpadding="0' cellspacing="0">
                            <thead>
                                <tr><th colspan="5">Optional Adjustments</th></tr>
                                <tr>
                                    <th>Team</th>
                                    <th><input id="adjustment-all" name="adjustment-all" class="adjustment-master on" type="checkbox" value="*" checked onclick="syncAdjCheckboxes(true)" /></th>
                                    <th>Issue ID</th>
                                    <th>Change that would be made</th>
                                    <th>Impact on Itr.</th>
                                </tr>
                            </thead>
                            <tbody>`;
    let freeText='', typeText='', typeIterating = '', teamIterating='', teamTotal=0, typeTotal=0, overallTotal=0, teamTotFld=0, typeTotFld=0;
    updates.forEach(update=>{
        typeText = (update.modded=='ADD') 
            ? `${update["Issue key"]} would be added (adds ${toHours(update.modValue)} hours)` 
            : `${update["Issue key"]} will increase in hours from ${toHours(update.oldValue)} to ${toHours(update.newValue)} (adds ${toHours(update.modValue)} hours)`;

        if(typeIterating     !== update.modded){
            if(typeIterating !== ''){
                summaryOPUI += `<tr class="adjustment-type-subtotal-row"><td colspan="4">Sub-Total of Adjustments:</td><td id="typeTot${typeTotFld}">+${typeTotal} hours</td></tr>`;
                typeTotFld++;
            }
            typeTotal         = 0;
            typeIterating     = update.modded;
            summaryOPUI      += `<tr class="adjustment-type-row"><td colspan="5">${(typeIterating == 'ADD') ? "Stories to be ADDED" : "Stories whose HOURS INCREASED"}</td></tr>`;
        }
        if(update[teamKeyStr] !== teamIterating){
            if(teamIterating  !== ''){
                summaryOPUI += teamTotal !== 0 ? `<tr class="adjustment-team-subtotal-row"><td colspan="4">Team Impact:</td><td id="teamTot${teamTotFld}">+${teamTotal} hours</td></tr>` : '';
                teamTotFld++;
            }
            teamTotal         = 0;
            teamIterating     = update[teamKeyStr];
        } 
        summaryOPUI      += update.modValue !== 0 ? `<tr class = "adjustment-team-name"><td>${teamIterating}</td>` : '';

        teamTotal    += (toHours(update.modValue) * 1);
        typeTotal    += (toHours(update.modValue) * 1);
        overallTotal += (toHours(update.modValue) * 1);
        
        summaryOPUI  += update.modValue !== 0 ? `<td><input id="adjust-${update["Issue key"]}" name="adjust-${update["Issue key"]}" class="adjustment-issue-check" type="checkbox" value="${update["Issue key"]}" checked data-issue-impact="${toHours(update.modValue)}" data-affects-team="${teamTotFld}" data-affects-type="${typeTotFld}" onclick="syncAdjCheckboxes()" /></td>
                                                    <td>${update["Issue key"]}</td>
                                                    <td>${typeText}</td>
                                                    <td><b>+${toHours(update.modValue)}</b> hrs.</td>
                                                </tr>` : '';

        freeText    += update.modValue === 0 ? `<tr class = "adjustment-team-name"><td>${update[teamKeyStr]}</td>
                                                    <td><input id="adjust-${update["Issue key"]}" name="adjust-${update["Issue key"]}" class="adjustment-issue-check" type="checkbox" value="${update["Issue key"]}" checked data-issue-impact="0" onclick="syncAdjCheckboxes()" /></td>
                                                    <td>${update["Issue key"]}</td>
                                                    <td>Freebie; If added, story won't impact the iteration/burndown.</td>
                                                    <td>±0 hrs.</td>
                                                </tr>` : '';
        
    });
    summaryOPUI += teamTotal !== 0 ? `<tr class="adjustment-team-subtotal-row"><td colspan="4">Team Impact:</td><td id="teamTot${teamTotFld}">+${teamTotal} hours</td></tr>` : '';
    summaryOPUI += typeTotal !== 0 ? `<tr class="adjustment-type-subtotal-row"><td colspan="4">Sub-Total of Adjustments:</td><td id="typeTot${typeTotFld}">+${typeTotal} hours</td></tr>` : '';
    summaryOPUI += `<tr class="adjustment-type-row"><td colspan="5">FREEBIES</td></tr>`;
    summaryOPUI += freeText;
    summaryOPUI += `<tr class="adjustment-type-subtotal-row"><td colspan="4">Sub-Total of Adjustments:</td><td>±0 hours</td></tr>`;
    summaryOPUI += `<tr class="adjustment-total-row"><td colspan="4">Cumulative Impact:</td><td id="overallTot">+${overallTotal} hours</td></tr>`;
    summaryOPUI += `
                        <tr>
                            <td colspan="5">
                                <input class="cta-adjustment secondary" type="button" onclick="closeWindow()" value="Err... Never Mind" />
                                <input class="cta-adjustment primary" type="button" onclick="reviseSeed()" value="Adjust Seed Values" />
                            </td>
                        </tr>
                        </tbody>
                </table>
            </div>`;

    document.body.insertAdjacentHTML('afterBegin', summaryOPUI);




    
    // }
};
const offerToPerformDayOneOverrideAdjustment = () => {
    if (!offerPerformed && !genModSeeds) {
        msgBox('Ruh-roh!', 'Looks like one or more of your scrumbags either failed to seed their hours before the start of the iteration, or "remembered" one or more stories just after the iteration started. <br /><br />Would you like me to correct that for you?', performDayOneOverrideAdjustment);
    }
    // performDayOneOverrideAdjustment();
};

const createReportData = () => {
    _I("FUNCTION: createReportData");
    let tableNode = document.querySelector('.preview-table'),
        tHead = [...tableNode.querySelectorAll('th')].map(th => th.innerText),
        tBody = [...tableNode.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('td')].flatMap(f => f.innerText));
    tBody[0] = tHead;
    RPTDATA = Object.assign([], tBody);
};

const reFilterPreview = (obj) => {
    _I("FUNCTION: reFilterPreview", "obj", obj);
    if (obj != null) {
        let targetClass = obj.id.replace('chk-', '.row-status-');
        [...document.querySelectorAll(targetClass)].forEach(row => {
            row.className = obj.checked ? row.className.replace(' obfuscated', '') : row.className + ' obfuscated';
        });
    }
    let totDisp = 0;
    [...qsa('.status-filter-checkboxes')].forEach(cb => { totDisp += cb.checked ? (cb.value / 1) : 0; });
    document.getElementById('record-ct').innerText = totDisp + ' records shown.';
};

let rowNodes = [];
let colNodes = [];
let hdrRowNode = [];
let hdrColNodes = [];
let numericTotals = ['', ''];
let totalRow = [];
let idealRow;
const postProcessData = () => {
    let rptStatuses = {}
        , dispCkBoxes = ''
        , uniqueStatuses = []
        , RPTString = ""
        , dataColCount = 0
        , nonDataColCount = 2;

    Promise.resolve().then(() => {
        rowNodes = [...qsa('.preview-table tr')];
        RPTString = JSON.stringify(RPTDATA);
        rowNodes.forEach((rows, idx) => {
            let row = [...rows.querySelectorAll('td')];
            colNodes.push(row);
            if (row && row[0] && row[0].innerText !== '') {
                rowNodes[idx].className = 'preview-row preview-row-' + idx + ' row-status-' + row[0].innerText.replace(/\s+/g, '_');
                uniqueStatuses.push(row[0].innerText);
            }
            return rows;
        });
    }).then((res) => {
        _I("THENABLE -> ", "res", res);
        hdrRowNode = rowNodes.splice(0, 1)[0];
        hdrColNodes = [...hdrRowNode.childNodes];
// _('hdrRowNode', hdrRowNode);
// _('rowNodes', rowNodes);
// _('hdrColNodes', hdrColNodes);
// _('colNodes', colNodes);


        // Extarct the unique statuses and generate their respective checkboxes for the display filtes.
        [...new Set(uniqueStatuses)].sort().forEach(status => {
            let muStatus = status.replace(/\s+/g, '_'),
                statusRE = new RegExp(status, 'g');
            rptStatuses[muStatus] = RPTString.match(statusRE).length;
            dispCkBoxes += `<input name="chk-${muStatus}" id="chk-${muStatus}" class='status-filter-checkboxes' type="checkbox" value="${rptStatuses[muStatus]}" checked="true" onChange="reFilterPreview(this)" /><label for="chk-${muStatus}">${status} (${rptStatuses[muStatus]})</label><br>`;
        });
        document.getElementById('output-panels').insertAdjacentHTML('beforeEnd', '<aside id="filter-ckbox-panel" class="status-filters"><h2>Currently Showing:</h2><span id="record-ct"></span>' + dispCkBoxes + '</aside>');
        reFilterPreview();
    }).then((res) => {
        _I("THENABLE -> ", "res", res);
        // Interpolate any missing data into its respective columns, from left to right, top to bottom.
        colNodes.forEach((reportRow, rowIndex) => {
            reportRow.forEach((cols, colIndex) => {
                let col = cols.innerText,
                    cell = colNodes[rowIndex][colIndex];//qs(`.preview-table tr:nth-of-type(${rowIndex}) td:nth-of-type(${colIndex+1})`);
                // _(cell == colNodes[rowIndex][colIndex]);
                if (col === '---') {
                    cell.className = 'interpolated-value';
                    let p = cell.previousSiblingElement;
                    var pCell = cell.previousSibling,
                        pCellVal = pCell.innerText.replace(/h/g, '') / 1,
                        nCell = cell.nextSibling,
                        nCellVal = nCell.innerText;
                    while (nCell && nCellVal === '' || nCellVal === '---') {
                        if (nCell && nCell.innerText) {
                            nCell = nCell.nextSibling;
                            nCellVal = nCell.innerText;
                        } else {
                            nCell = void (0);
                            nCellVal = '';
                        }
                    }
                    nCellVal = nCellVal.replace(/h/g, '') / 1;
                    var cellDiff = pCellVal - nCellVal,
                        itpValue = nCellVal + cellDiff / 2,
                        opString = (itpValue.toPrecision(3).replace(/0+$/g, '') + 'h').replace('.h', 'h');

                    if (!isNaN(itpValue)) {
                        opString = (opString === '0h') ? '<i>0h</i>' : '<strong><em>' + opString + '</em></strong>';
                        cell.innerHTML = opString;
                    }
                }
            });
        });
    }).then(() => { // Analysis
        const num = val => val ? parseInt(val.replace(/\D/gi, '')) : 0;
        const formatFlags = (type, flagColl) => (!Array.isArray(flagColl) || flagColl.length === 0) ? '' : '<a href="#" class="flag-icons ' + type + '-icon"></a><dl><dt>' + flagColl.join('</dd><dt>').replace(/\|/g, '</dt><dd>') + '</dd></dl>';


        rowNodes.forEach((rowObj, rowIdx) => {
           
            let minor           = [],
                medium          = [],
                major           = [],
                critical        = [],
                row             = rowObj.children,                                                                              // NodeList of the cells' DOM objects for the row being examined
                rowHrs          = rowObj.innerText.replace(/[A-Z-]{8}\d{5}/gi, '').replace(/(\d+)h/gi, '$1 ').match(/\d+/gi),  // Array of hours representing all columns in this row (ex        : [8, 8, 7, 6, 4, 2, 0, 0, 0, 0, 0])
                totHrsCols      = rowHrs.length,                                                                                // Number of hours columns being examined (ex                    : 11, for a std length itr)
                seedHours       = num(rowHrs[0]),                                                                               // Number of hours in seed column (ex                            : 8, for an 8h seed)
                rowHoursFlat    = rowHrs.join('').replace(/ /g, ''),
                last72HoursFlat = rowHrs.slice(-3).join('').replace(/ /g, ''),
                allZeroes       = new Array(totHrsCols).fill(0).join(''),                                                       // String of zeroes whose length is number of hours cols (ex     : "00000000000" if a std length itr)
                allSeedValue    = new Array(totHrsCols).fill(seedHours).join(''),                                               // String of seed values whose length is number of hours cols (ex: "88888888888" for an 8h seed)
                finalDaysHours  = num(rowHrs[totHrsCols - 1]),
                seedStoryNumber = row[1].innerText,
                seedStatus      = row[0].innerText,
                devHasBegun     = false,
                newStoryMidItr  = false,
                delStoryFromItr = false,
                allItrZeroedOut = rowHoursFlat === allZeroes,
                noChangeFor72   = rowHrs.slice(-3).join('') === new Array(3).fill(finalDaysHours).join(''),
                noChangeInItr   = rowHoursFlat              === new Array(totHrsCols).fill(finalDaysHours).join('').replace(/ /g, ''),
                zeroesAllItr    = parseInt(rowHrs.join('')) === 0,
                runningValues   = seedHours;

            for (var colIdx = row.length - 1; colIdx >= 2; colIdx--) {
                let col = row[colIdx];

                if (colIdx == row.length - 1 && col.innerText.indexOf('*') !== -1) delStoryFromItr = true;
                if (!delStoryFromItr && col.innerText.indexOf('*') !== -1) newStoryMidItr = true;

                if (!devHasBegun && seedHours !== num(col.innerText)) devHasBegun = true;
            }


            if (!noChangeInItr && devHasBegun && /DEFINITION/i.test(seedStatus)) minor.push('Wrong Status|Work has begun on this story, therefore it must be out of definition phase!');
            if (seedHours === 0 && !/COMPLETED|DEMO/i.test(seedStatus)) medium.push('Hours not set!|The iteration was begin without an hour estimate being set for this story!');
            else if (noChangeInItr && noChangeFor72 && !/COMPLETED|DEMO/i.test(seedStatus)) medium.push('No movement!|There has been no change in the status/hours burned for this story for the full period of the iteration!');
            if (!noChangeInItr && noChangeFor72) medium.push('Development Stalled!|There has been no change in the status/hours burned for this story in the last 3 days!');
            if (newStoryMidItr) {
                if (FILESLOADED > 2)
                    major.push('Story added mid-iteration!|This story which did not exist on the Seed Day has appeared in the iteration!');
                // else

            }
            if (delStoryFromItr) major.push('Story removed from iteration!|This story, which has been tracked from the Seed Day no longer appears in the iteration!');

            row[0].innerHTML += formatFlags('major', major);
            if (major && major.length == 0) row[0].innerHTML += formatFlags('medium', medium);
            if (major && major.length == 0 && medium && medium.length == 0) row[0].innerHTML += formatFlags('minor', minor);
        });
    }).then(() => { // Add Remove behavior on flags
        var removeFlagIcon=(el, trg=el.target)=>{el.preventDefault(); trg.nextSibling.remove(); trg.remove();return false;}
        qsa('.flag-icons').forEach(fi=>fi.addEventListener('click',removeFlagIcon))
    }).then(() => { // Sum up our totals
        totalRow = new Array(hdrColNodes.length-2).fill(0);
        idealRow = new Array(hdrColNodes.length-2).fill(0);

        for(var i=0; i<totalRow.length; i++){
            let sum = 0;
            [...qsa("#output-panels tr.preview-row td:nth-child(" + (i+3) + ")")].forEach((td,idx)=>{
                let iText = td.innerText.replace(/[^\d\.]/g,'') / 1 || 0;
                sum += iText;
                if(i===0){ // Seed Column
                    idealRow[0] = readableRound(sum,2,true);
                    for(var ir=1; ir<idealRow.length; ir++) idealRow[ir] = readableRound(sum - ((sum / (TOTALITRDAYS)) * ir),2, true);
                    totalRow[0] = `<td>${readableRound(sum, 2, true)}h</td>`;
                }else{
                    if(DAYSLOADED >= i)
                        totalRow[i] = (sum > idealRow[i]) ? `<td class='over'>${readableRound(sum, 2, true)}h</td>` : `<td class='under'>${readableRound(sum, 2, true)}h</td>`;
                    else
                        totalRow[i] = '<td></td>';
                }
            });
        }
        let idealRowMarkup = `<tr class="ideal-row"><td colspan="2" class="total-label">Total (Ideal):</td><td>${idealRow.join('h</td><td>')}h</td></tr>`,
            totalRowMarkup = `<tr class="total-row"><td colspan="2" class="total-label">Total (Actual):</td>${totalRow.join('')}</tr>`;
        qs('.preview-table tbody').insertAdjacentHTML('beforeEnd', idealRowMarkup);
        qs('.preview-table tbody').insertAdjacentHTML('beforeEnd', totalRowMarkup);

        qsa('.ideal-row td:nth-child(n + ' + ( 3 + DAYSLOADED) + '), .total-row td:nth-child(n + ' + ( 3 + DAYSLOADED) + ')').forEach(dimIdeal => {dimIdeal.className = dimIdeal.className.replace(/extra-dim /, '') + 'extra-dim '});

        dataToGraph = totalRow.join('|').replace(/[^\d\|\.]/g, '').replace(/\|0/g,'').split('|');
// _(dataToGraph)
        idealDayCount = idealRow.length; 
        return
        
    }).then((res) => {
        renderCHARt(idealDayCount, dataToGraph);
    });
};
//!! =====================================================================================================================================






const released = () => {
    window.clearTimeout(ongoingtimer);
    ongoing = false;
};

let ongoing = false, ongoingtimer = null,
    offset = (totalItrDayPicker.getBoundingClientRect().height - 2),
    activeInteraction = false;

totalItrDayPicker.addEventListener('mouseOver', () => { activeInteraction = true; });
totalItrDayPicker.addEventListener('mouseOut', () => { activeInteraction = false; ongoing = false; });
totalItrDayPicker.addEventListener('blur', () => { activeInteraction = false; ongoing = false; });
window.addEventListener('click', released);

const syncSpinner = (hardValue = null) => {                                                                   //## Ⓒ ⬅⬅⬅︎ 
    _I("FUNCTION: syncSpinner", "hardValue", hardValue);
    if (hardValue != null && !isNaN(hardValue)) totalItrDayPicker.placeholder = hardValue;
    TOTALITRDAYS = getDayCountFromPicker();
    let control = totalItrDayPicker.parentElement;
    offset = (totalItrDayPicker.getBoundingClientRect().height + 2);
    control.style = "--value:" + (TOTALITRDAYS * offset * -1) + "px";
    resizeBufferArraysAndRebuildSlots();                                                                    //@@ ➜➜➜ ︎🅑 
};


const incDec = (dir, mechanical = true, dly = 750, scale = 1) => {
    _I("FUNCTION: incDec", "dir", dir, "mechanical", mechanical, "dly", dly, "scale", scale);

    ongoing = true;
    dly = (dly < 50) ? 50 : Math.log2(dly) * dly / 10.4;
    let adjVal = dir * scale + parseInt(totalItrDayPicker.placeholder);
    if (adjVal <= 1) adjVal = 1;
    if (adjVal > 60) adjVal = 60;
    totalItrDayPicker.placeholder = adjVal;
    syncSpinner();                                                                                           //## ➜➜➜ 🅒 
    // mechanical = false;
    // incDec(dir, false, dly, scale)
    // if (ongoing && !mechanical) ongoingtimer = window.setTimeout(() => , dly);
};



//%% ====================================================================================================
//%% ======================================== GRAPHING FUNCTIONS ========================================
//%% ====================================================================================================


//%% ====================================================================================================
//%% ======================================== GRAPHING FUNCTIONS ========================================
//%% ====================================================================================================
function renderCHARt(totalDaysInIteration, remainingHoursPerDay) {
// _('_renderCHARt', totalDaysInIteration, remainingHoursPerDay)
    // 500, 450, 400, 350, 300, 250, 200, 150, 100, 50*, 0*
    // totalDaysInIteration = 10;
    // remainingHoursPerDay = [500,475,375,450,200,250];

    let par = document.getElementById("burndownOutput").parentNode;
    let oHTML = document.getElementById("burndownOutput").outerHTML;
    document.getElementById("burndownOutput").remove();
    par.insertAdjacentHTML('beforeEnd', oHTML);

    syncSpinner();
    remainingHoursPerDay     = remainingHoursPerDay.slice(0, FILESLOADED);
    console.info(totalItrDayPicker.placeholder);
    totalDaysInIteration    -= 1;
    
    let iterationStartingHrs = remainingHoursPerDay[0],
        totDaysInItrWithSeed = totalDaysInIteration + 1,

        idealPlottedPtValues = [iterationStartingHrs],
        interpolatedIndicies = [],
        colorsForActualHours = ["#009900"],
        pageSettings         = {};
   
    pageSettings.elements    = {
        showPopover: {
            checked : true
        }
    };




    const c                  = document.getElementById("burndownOutput"),
        ctx                  = c.getContext("2d"),
        popoverObj           = document.getElementById("popover"),
        wholePi              = Math.PI * 2;

    let largestActualHrValue = Math.max(...remainingHoursPerDay),
        adjustedRowUnitValue = largestActualHrValue / 10,
        gridScaleMultipliers = 50 / adjustedRowUnitValue,
        gridSideMargins      = 50,
        gridVertMargins      = 50,
        canvasHeight         = 550,
        canvasWidth          = 1050,
        gridRowScale         = 50 / (Math.max(...remainingHoursPerDay) / 10),
        gridColWidth         = Math.floor(canvasWidth / totDaysInItrWithSeed),
        gridRowHeight        = 50;

    const plot               = (day, val) => [plotX(day), plotY(val)],
          plotX              = (day)      => readableRound(gridSideMargins + (gridColWidth * day) + (gridColWidth / 2)),
          plotY              = (val)      => canvasHeight - (gridScaleMultipliers * val) + gridVertMargins
        //   LightenDarkenColor = (col,amt) => (+('0x'+col.replace('#',''))+amt*0x010101).toString(16).padStart(6,0);  

    // canvasWidth              = gridColWidth * (totalDaysInIteration - 1) - gridSideMargins;
    


    console.log("totalDaysInIteration", totalDaysInIteration, "\nremainingHoursPerDay: ", remainingHoursPerDay, "\niterationStartingHrs: ", iterationStartingHrs, "\nidealPlottedPtValues: ", idealPlottedPtValues, "\ninterpolatedIndicies: ", interpolatedIndicies, "\ncolorsForActualHours: ", colorsForActualHours, "\npageSettings: ", pageSettings, "\nlargestActualHrValue", largestActualHrValue, "\nadjustedRowUnitValue: ", adjustedRowUnitValue, "\ngridScaleMultipliers: ", gridScaleMultipliers, "\ngridSideMargins: ", gridSideMargins, "\ngridVertMargins: ", gridVertMargins, "\ncanvasHeight: ", canvasHeight, "\ncanvasWidth: ", canvasWidth, "\ngridRowScale: ", gridRowScale, "\ngridColWidth: ", gridColWidth, "\ngridRowHeight: ", gridRowHeight, "\nplot: ", plot, "\nplotX: ", plotX, "\nplotY: ", plotY, "\ncanvasWidth: ", canvasWidth);



    // COLOR Helper Functions

    const LightenDarkenColor = (colStr, amt, col = parseInt(colStr, 16)) => (((col & 0x0000FF) + amt) | ((((col >> 8) & 0x00FF) + amt) << 8) | (((col >> 16) + amt) << 16)).toString(16);

    const posNegPrcntToGYRHex = (val, saturation = 1, intensity = 1) => {
        let minMaxed = 2 * (Math.round(Math.min(Math.max(val, -50), 50))),
            hVal = Math.round(60 * (minMaxed / 100) + 60);
        let hex = RGBtoHEX(...HSVtoRGB(hVal, saturation, intensity));
        return hex;
    };

    let HSVtoRGB = (h, s, v, f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)) => [f(5), f(3), f(1)],
        RGBtoHEX = (r, g, b) => "#" + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, 0)).join('');
    let HSVtoHEX = (h = 0, s = 1, v = 1) => RGBtoHEX(...HSVtoRGB(h, s, v)),
        rgbStrToHex = (rgbStr) => rgbStr && '#' + rgbStr.slice(4, -1).split(', ').map(x => (+x).toString(16).padStart(2, '0')).join('');


    // Fill in any gaps in our data for the graph.
    const interpolateMissingDays = (() => {
        for (let i = 1; i < remainingHoursPerDay.length - 2; i++) {
            if (remainingHoursPerDay[i] == -1) {
                let bgnIndex = null,
                    endIndex = null;
                for (let b = i; b >= 0 && bgnIndex === null; b--) if (remainingHoursPerDay[b] != -1) bgnIndex = b;
                for (let e = i; e >= 0 && endIndex === null; e++) if (remainingHoursPerDay[e] != -1) endIndex = e;
                if (bgnIndex != null && endIndex != null) {
                    let interpRange = endIndex - bgnIndex,
                        perDiemVals = ((remainingHoursPerDay[endIndex] - remainingHoursPerDay[bgnIndex]) / interpRange);
                    for (let v = bgnIndex + 1; v < endIndex; v++) {
                        if (remainingHoursPerDay[v] == -1) remainingHoursPerDay[v] = readableRound((remainingHoursPerDay[v - 1] + perDiemVals), 2, true);
                        interpolatedIndicies.push(v);
                    }
                }
            }
        }
    })();
    const seedIdealPoints = (() => {
        let idealHoursPerDay = readableRound(iterationStartingHrs / (totDaysInItrWithSeed - 1), 2, true);

        for (let i = 0; i < totDaysInItrWithSeed - 1; i++) {
            idealPlottedPtValues.push(idealPlottedPtValues[i] - idealHoursPerDay);
        }
    })();

    const clearGrid = () => {
        ctx.clearRect(0, 0, c.width, c.height);
    };

    const drawBGGridPanel = () => {
        clearGrid();
        ctx.lineWidth = "2";
        ctx.strokeStyle = "#000";
        ctx.strokeRect(gridVertMargins, gridVertMargins, canvasWidth, canvasHeight);
        ctx.fillStyle = '#eaeaea';
        ctx.fillRect(gridVertMargins, gridVertMargins, canvasWidth-1, canvasHeight);
    };

    const drawColPanels = () => {
        for (let i = 0; i <= totalDaysInIteration; i++) {
            let disabled = i >= remainingHoursPerDay.length,
                interped = interpolatedIndicies.indexOf(i) !== -1;

            ctx.fillStyle = disabled ? '#eaeaea' : (interped) ? '#FAEFFF' : '#fff';
            ctx.fillRect(gridSideMargins + (gridColWidth * i), gridVertMargins, gridColWidth, canvasHeight);

            let lblVals = (i === 0) ? 'ITR' : i,
                lblOSet = (i === 0) ? 21 : (i >= 10) ? 13 : 15;
            let lblUnit = (i === 0) ? 'start' : 'day';

            // if(disabled) ctx.globalAlpha = 0.4
            ctx.fillStyle = '#333';
            ctx.font = 'bold 25px monospace';
            ctx.fillText(lblVals, plotX(i) - (lblVals.toString().length * 7), canvasHeight + 80);
            ctx.fillStyle = '#666';
            ctx.font = '16px monospace';
            ctx.fillText(lblUnit, plotX(i) - lblOSet, canvasHeight + 95);
        }
    };
    const drawGridLines = () => {
        // seedHoverTriggers();
        ctx.beginPath();
        ctx.lineWidth = "1";
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = "#DDD";
        for (let i = 0; i < totalDaysInIteration - 1; i++) {
            ctx.moveTo(plotX(i) + (gridColWidth / 2), gridVertMargins);
            ctx.lineTo(plotX(i) + (gridColWidth / 2), canvasHeight + gridVertMargins);
        }
        ctx.stroke();
        ctx.beginPath();

        for (let i = 1; i <= 10; i++) {
            ctx.moveTo(gridSideMargins, i * gridRowHeight + gridVertMargins);
            ctx.lineTo(canvasWidth + gridSideMargins, i * gridRowHeight + gridVertMargins);
        }
        ctx.stroke();
    };

    const generateYAxis = () => {
        let yAxis = document.getElementById('yaxis');
        yAxis.innerText = "";
        for (var i = 0; i <= 11; i++) {
            yAxis.innerText = i * readableRound(adjustedRowUnitValue) + ' ' + yAxis.innerText;
        }
    };


    let plotIdealPoints = () => {
        for (let i = 0; i <= idealPlottedPtValues.length; i++) {
            ctx.beginPath();
            ctx.lineWidth = "2";
            ctx.setLineDash([]);
            ctx.fillStyle = '#fff';
            // ctx.strokeStyle = "#08b2ed";
            ctx.strokeStyle = interpolatedIndicies.indexOf(i) !== -1 ? "#AA66AA" : "#08b2ed";

            ctx.arc(plotX(i), plotY(idealPlottedPtValues[i]), 6, 0, wholePi);
            ctx.fill();
            ctx.stroke();
        }
    };

    let drawIdealLine = () => {
        ctx.beginPath();
        ctx.strokeStyle = "#08b2ed";
        ctx.moveTo(plotX(0), plotY(idealPlottedPtValues[0]));
        ctx.lineTo(plotX(idealPlottedPtValues.length -1), plotY(0));
        ctx.lineWidth = "3";
        ctx.setLineDash([5, 4]);
        ctx.stroke();
    };

    let preSeedPointColors = (dataObj = remainingHoursPerDay) => {
        for (let i = 1; i <= dataObj.length; i++) {
            let ideal = idealPlottedPtValues[i - 1],
                actual = dataObj[i - 1],
                hourDifference = ideal - actual;
                //posNegPrcntToGYRHex(hourDifference);
                let dotColor;
                if(hourDifference >= 0){
                    dotColor = "#0C0";
                }else{
                    dotColor = (actual / ideal >= 1.15) ? "#E00" : "#EE2"
                }
            colorsForActualHours.push(dotColor);
        }
    };

    let drawBaseGrid = () => {
        clearGrid();
        drawBGGridPanel();
        drawColPanels();
        drawGridLines();
        generateYAxis();
        preSeedPointColors();
    };

    drawBaseGrid();
    drawIdealLine();
    plotIdealPoints();

    let drawBarGraph = (dataObj = remainingHoursPerDay, showIdealBars = true) => {
        var bar = c.getContext("2d");
        bar.globalAlpha = 0.7;
        bar.beginPath();
        let barShift = gridColWidth * -0.4,
            barWidth = gridColWidth * 0.80;

        for (let i = 0; i < idealPlottedPtValues.length; i++) {
            if (i > DAYSLOADED) return false;
            bar.fillStyle = "#08b2ed";
            bar.lineWidth = "2";
            bar.strokeStyle = "#000";
            let ideal = idealPlottedPtValues[i];
            if (i > dataObj.length - 1 || (dataObj[i] && dataObj[i] === ideal)) {
                bar.fillRect(plotX(i) + barShift, plotY(ideal), barWidth, canvasHeight + gridVertMargins - plotY(ideal));
            } else {
                let actual = dataObj[i];

                let hourDifference = ideal - actual;

                // _(ideal, actual, hourDifference)
                if (actual <= ideal) {
                    bar.fillRect(plotX(i) + barShift, canvasHeight + gridVertMargins, barWidth, (-actual * gridRowScale));
                    bar.fillStyle = colorsForActualHours[i + 1];
                    bar.fillRect(plotX(i) + barShift, (canvasHeight + gridVertMargins) + (-actual * gridRowScale), barWidth, (gridRowScale * -hourDifference));
                } else if (actual > ideal) {
                    bar.fillRect(plotX(i) + barShift, canvasHeight + gridVertMargins, barWidth, -gridRowScale * ideal);
                    bar.fillStyle = colorsForActualHours[i + 1];

                    bar.fillRect(plotX(i) + barShift, (canvasHeight - (gridRowScale * ideal)) + gridVertMargins, barWidth, (gridRowScale * hourDifference));
                }
            }
        }
    };

    let plotActualPoints = (dataObj = remainingHoursPerDay) => {
        let plotPt = (startX, startY, radius = 10) => {
            let point = new Path2D();
            point.moveTo(startX, (startY + radius));
            point.lineTo((startX + radius), startY);
            point.lineTo(startX, (startY - radius));
            point.lineTo((startX - radius), startY);
            point.closePath();
            return point;
        };

        let pts = c.getContext("2d");
        for (let i = 1; i <= dataObj.length; i++) {
            if (i > DAYSLOADED + 1) return false;
            let plottedPt = plotPt(plotX(i - 1), plotY(dataObj[i - 1])),
                dotColor  = colorsForActualHours[i],
                lineColor = dotColor;
                
                pts.globalAlpha = 1;
                pts.strokeStyle = lineColor;
                pts.setLineDash([]);
                pts.lineWidth = "2";
                pts.stroke(plottedPt);
                pts.globalAlpha = 0.5;
                pts.fillStyle = dotColor;
                pts.fill(plottedPt, 'evenodd');
                colorsForActualHours.push(dotColor);
        }
    };

    let drawActualLabels = (dayIndex, drawText) => {

        if (dayIndex > remainingHoursPerDay.length - 1 || dayIndex > DAYSLOADED) return '';
        let actual = remainingHoursPerDay[dayIndex],
            ideal = idealPlottedPtValues[dayIndex],
            overUnder = ideal - actual;
        if (overUnder === 0) return '';

        let xOffset     = 0,
            hours       = -readableRound(overUnder, 0, true),
            percentage  = readableRound(100 - ((ideal / actual) * 100), 0),
            plsMinHrs   = (hours > 0) ? '+' : '',
            plsMinPerct = (hours > 0) ? '+' : '-';
            hours       = plsMinHrs + hours + 'h';
            percentage  = percentage + '%';

        // if (overUnder < 0) {
            let lblXLoc = plotX(dayIndex) + xOffset,
                lblYLoc = plotY(remainingHoursPerDay[dayIndex]),
                widthMx = gridColWidth * 0.95,
                ln1Text = plsMinPerct,
                ln2Text = percentage,
                ln3Text = hours,
                hrColor = colorsForActualHours[dayIndex+1],
                yPosAdj = (overUnder <= 0) ? -42 : 37;
                lblYLoc = yPosAdj + lblYLoc;

        if(!drawText){
            ctx.fillStyle = yPosAdj < 0 ? "transparent" : "#FFF6";
            ctx.fillRect((lblXLoc - (widthMx / 2) - 5), (lblYLoc - 17), (widthMx + 10), 50);
        }else{
            ctx.textAlign = "center";
            ctx.font = 'bold 36px monospace';       ctx.fillStyle = '#FFF';     ctx.fillText(ln1Text, lblXLoc - 1, lblYLoc -  1, widthMx); 
            ctx.font = 'bold 36px monospace';       ctx.fillStyle = '#000';     ctx.fillText(ln1Text, lblXLoc + 1, lblYLoc +  1, widthMx); 
            ctx.font = 'bold 36px monospace';       ctx.fillStyle = hrColor;    ctx.fillText(ln1Text, lblXLoc + 0, lblYLoc +  0, widthMx); 
            ctx.font = 'bold 20px monospace';       ctx.fillStyle = '#FFF';     ctx.fillText(ln2Text, lblXLoc - 1, lblYLoc + 16, widthMx); 
            ctx.font = 'bold 20px monospace';       ctx.fillStyle = '#000';     ctx.fillText(ln2Text, lblXLoc + 1, lblYLoc + 18, widthMx); 
            ctx.font = 'bold 20px monospace';       ctx.fillStyle = hrColor;    ctx.fillText(ln2Text, lblXLoc + 0, lblYLoc + 17, widthMx); 
            ctx.font = '12px monospace';            ctx.fillStyle = '#666';     ctx.fillText(ln3Text, lblXLoc + 0, lblYLoc + 29, widthMx);
        }



        //     // ctx.textAlign = "left";

        //     // ctx.font = 'bold 16px monospace';
        //     // ctx.fillStyle = ;
        //     // ctx.fillText("BEHIND!", plotX(dayIndex) + xOffset, plotY(remainingHoursPerDay[dayIndex]) - 15);

        //     // ctx.font = '12px monospace';
        //     // ctx.fillStyle = '#666';
        //     // ctx.fillText(hours, plotX(dayIndex) + xOffset - 5, plotY(remainingHoursPerDay[dayIndex]) - 30);

        //     // ctx.font = 'bold 22px monospace';
        //     // ctx.fillStyle = '#000';
        //     // ctx.fillText(percentage, plotX(dayIndex) + xOffset + 5, plotY(remainingHoursPerDay[dayIndex]) - 40);

        // } else {
        //     ctx.textAlign = "center";

        //     ctx.font = '12px monospace';
        //     ctx.fillStyle = colorsForActualHours[dayIndex + 1];
        //     ctx.fillText("AHEAD!", plotX(dayIndex) + xOffset, plotY(remainingHoursPerDay[dayIndex]) + 30);

        //     ctx.font = '10px monospace';
        //     ctx.fillStyle = '#666';
        //     ctx.fillText(hours, plotX(dayIndex) + xOffset - 10, plotY(remainingHoursPerDay[dayIndex]) + 40);

        //     ctx.font = '14px monospace';
        //     ctx.fillStyle = '#000';
        //     ctx.fillText(percentage, plotX(dayIndex) + xOffset - 7, plotY(remainingHoursPerDay[dayIndex]) + 55);

        // }
        //           
    };


    let drawLineGraph = (dataObj = remainingHoursPerDay) => {
        let segs = c.getContext("2d"),
            prev = dataObj[0];

        segs.strokeStyle = "#000";
        segs.setLineDash([]);
        segs.globalAlpha = 1;


        for (let i = 0; i <= dataObj.length; i++) {
            let ideal = idealPlottedPtValues[i - 1],
                actual = dataObj[i - 1],
                hourDifference = ideal - actual;
            if (dataObj[i + 1]) {
                segs.beginPath();
                let segment = new Path2D(),
                    sX = plotX(i),
                    sY = plotY(dataObj[i]),
                    eX = plotX(i + 1),
                    eY = plotY(dataObj[i + 1]);
                segment.moveTo(sX, sY);
                segment.lineTo(eX, eY);

                let gradient = ctx.createLinearGradient(sX, sY, eX, eY);
                gradient.addColorStop(0, colorsForActualHours[i + 1]);
                gradient.addColorStop(1, colorsForActualHours[i + 2]);
                segs.strokeStyle = gradient;
                segs.lineWidth = "3";
                segs.filter = 'brightness(0.9)';
                segs.stroke(segment);
                segs.fill(segment);
            }
            drawActualLabels(i, false);
        }

        for (let i = 0; i <= dataObj.length; i++) {
            drawActualLabels(i, true);
        }
    };

    let shadeLineGraph = (dataObj = remainingHoursPerDay) => {
        let segs = c.getContext("2d"),
            linePath = new Path2D(),
            i;
        segs.beginPath();
        for (i = 0; i <= dataObj.length; i++) {
            let sX = 100 + (i * 100),
                sY = 650 - dataObj[i],
                eX = 200 + (i * 100),
                eY = 650 - dataObj[i + 1];
            if (dataObj[i + 1]) {
                linePath.moveTo(sX, sY);
                linePath.lineTo(eX, eY);
                //_('linePath.lineTo(',eX, eY,')');
            } 
        }
        linePath.lineTo(100 + ((dataObj.length - 1) * 100), 650 - idealPlottedPtValues[(dataObj.length - 1)]);
        linePath.lineTo(100, 150);
        linePath.closePath();

        let gradient = ctx.createLinearGradient(100, 650 - idealPlottedPtValues[0], 200, 650 - idealPlottedPtValues[1]);
        gradient.addColorStop(0, colorsForActualHours[i]);
        gradient.addColorStop(1, colorsForActualHours[i + 1]);
        segs.strokeStyle = '#000';
        segs.lineWidth = "3";
        segs.stroke(linePath);
        segs.fillRule = "evenodd";
        segs.fill(linePath);
        // segs.stroke();

    };

    const labelGraphChart = () => {
        ctx.textAlign = "right";
            ctx.fillStyle = '#666';
            ctx.font = '20px sans-serif';
            let teamsDD = qs('#txtTeam').value;
            let teamName = teamsDD || 'All Teams'
            console.log('teamsDD, teamName :', teamsDD, teamName);
            ctx.fillText(iterationName.value, 1090, 90);
            ctx.font = '16px sans-serif';
            ctx.fillText(teamName, 1080, 120);
    }

    drawBarGraph();
    plotActualPoints();
    drawLineGraph();
    plotActualPoints();
    labelGraphChart();
    // shadeLineGraph()
}
setTimeout(() => { window.scrollTo(0, 0); }, 500);

window.addEventListener('DOMContentLoaded', init);
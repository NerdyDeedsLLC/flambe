(function (window, undefined) {
    'use strict';

    // Define local CSV object.
    var CSV = {};

    /**
     * Split CSV text into an array of lines.
     */
    function splitLines(text, lineEnding) {
        var strLineEnding = lineEnding.toString(),
            bareRegExp    = strLineEnding.substring(1, strLineEnding.lastIndexOf('/')),
            modifiers     = strLineEnding.substring(strLineEnding.lastIndexOf('/') + 1);

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
        return (line.replace(/^[\s]*|[\s]*$/g, '') === '');
    }

    /**
     * Removes all empty lines from the given array of lines.
     */
    function removeEmptyLines(lines) {
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
        var i;

        for (i = 0; i < lineTokens.length; i++) {
            lineTokens[i] = lineTokens[i].replace(/^[\s]*|[\s]*$/g, '');
        }
    }

    /**
     * Removes leading and trailing quotes from each token.
     */
    function trimQuotes(lineTokens) {
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
        var i, j,
            tokenizedLine, obj, key,
            objects = [],
            keys = tokenizedLines[0];

        for (i = 1; i < tokenizedLines.length; i++) {
            tokenizedLine = tokenizedLines[i];

            if (tokenizedLine.length > 0) {
                if (tokenizedLine.length > keys.length) {
                    throw new SyntaxError('not enough header fields');
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
        var config = {
                lineEnding:       /[\r\n]/,
                delimiter:        ',',
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
        define([], function () {
            return CSV;
        });
    } else {
        // No AMD loader is being used; expose to window (create global).
        window.CSV = CSV;
    }
}(typeof window !== 'undefined' ? window : {}));

// DECLARATIONS ==================================================================================================================
// Shortcut aliases and Helper functions -----------------------------------------------------------------------------------------
const d = document                                       // ⥱ Alias - document
    , qs = (s) => d.querySelector(s)                        // ⥱ Alias - querySelector
    , qsa = (s) => [...d.querySelectorAll(s)]                // ⥱ Alias - querySelectorAll
    , _ = (...args) => console.log.call(this, ...args)     // ⥱ Alias - _
    , pBar = (id, title, barColor, processor = 1, seq = 0, bc = 0) =>     // ⍟ HLPfn - Generates a progress bar
        new Promise(conclude => {
            id = 'pbar-' + id;
            let oldBar = qs('#' + id);
            if (oldBar) oldBar.remove();
            let pb = qs('.pbars');
            pb.insertAdjacentHTML('beforeEnd', `<div id="${id}" class="progress-bar" title="${title}" style="--bar-color:${barColor}; --process:${processor}s; --seq:${seq}; --bc:${bc}"></div>`);
            return conclude(qs('#' + id));
        })
    // Rote memory's storage
    , rote = window.localStorage                                                                    // Alias to the window's localStorage. Really these are all just helper functions that amuse me.
    , memories = ()             => rote.length                                                      // Returns the count of how many memories are being held in rote storage
    , recall   = (k, def=null)  => {k=rote.getItem(k); return k ? k : (def ? def : null);}          // Returns a memory value if present. If not, returns def if provided, null if not
    , retain   = (k,v)          => rote.setItem(k,v) ? v : v                                        // Creates a new memory for key k with value v, then returns v
    , reflect  = (k, def=null)  => retain(k, recall(k, def))                                        // Runs a recall for a memory (value at key or null), then immediately retains it in memories
    , forget   = (k)            => rote.removeItem(k)                                               // Discrads the memories at key k
    , fugue    = ()             => rote.clear()                                                     // Purges all memories... as though they'd NEVER. BEEN. FORMED. AT. ALL!


    , toHours = (val = null) => {
        // _(val);
        if (val === '---'){ return val; }
        if (val == null || isNaN((val / 1))){ return '0*'; }
        return (val / 1 <= 0) ? 0 : (val / 3600).toPrecision(3);
    }
    , setTargetSlot = (slotIndex) => (targetSlot = slotIndex)

    , findLastIndexOf = (arr = void (0), val = void (0), fromIndex = null) => {
        for (var i = arr ? arr.length - 1 : 0; arr !== void(0) && val !== void(0) && i >= 0; i--)
            if (((val.constructor + '').match(/RegExp/) && arr[i].match(val)) || (val + '' == arr[i])) return (i);
        return -1;
    }

// Global Variables --------------------------------------------------------------------------------------------------------------
let   fileBuffer    = []                                                                            // Stores copies of the file input's data collection (req'd in case the user maskes multiple sets of selections)
    , safeBuffer    = []
    , namedFiles    = []                                                                            // Array containing just the names of the files contained within fileBuffer (used for sequencing the read order)
    , COMBD_DATA    = []                                                                            // COMBINED DATA from all the files ingested
    , ISSUE_KEYS    = []                                                                            // LIST OF ALL THE ISSUES from all the files ingested
    , INTERPOL8D    = []
    , RPTDATA       = []
    , input         = document.getElementById('input')                                              // HTML file <INPUT> field/drop target for uploading XLSX files into the system
    , dateField     = qs("#report-start-date")                                                      // HTML date <INPUT> field representing the start of the iteration
    , sortableList  = qs('.has-draggable-children')                                                 // The <UL> containing the drag-drop-sortable list of files provided by the user
    , doneButton    = qs('.done-sorting')                                                           // "Run report" button
    , iterationName = qs("#iteration-name")
    , previewPanel  = qs('.output-table')
    , targetSlot    = null
    , dayCtPicker   = qs('#days-in-iteration')

    , concernColors = ['Transparent', 'DimGray', 'GreenYellow', 'Gold', 'Orange', 'Red']            // 0-indexed Color-Codings used for the 
    , concernFlags  = { // CONCERN CODEX
                        // TRIVIAL CONCERN: An issue weighted 0-1 indicate anomolies that
                        // are visible within the data that are known and being accounted
                        // for. Scrum masters may need to explain the blip to THEIR boss.
                        "HID":    {"weight": 0, "concern": "Hidden By ScrumMaster" },               // Employed at scrum master's discretion to remove a concern from being flagged
                        "ATT":    {"weight": 1, "concern": "Related to Attendance" },               // Assigned developer is AWOL/MIA/on leave/in the med bay. Occasionally presumed dead.
                        "HOL":    {"weight": 1, "concern": "Related to Holiday" },                  // Excluding a day iteration-wide for company holiday/operational shutdown

                        // MINOR CONCERN: Issues weighted at 2- less usually indicates an
                        // error in procedure, in JIRA operation, or on the dev, assigned
                        // the issue. Scrum masters should inquire if it keeps happening.
                        "EST":    {"weight": 2, "concern": "Bad Estimate" },                        // "Build a global satellite network, huh? No problem. 9 lines of code, 16 hours, tops."
                        "AUC":    {"weight": 2, "concern": "Assigned User Changed" },               // "Huh? Bob made an unsubstantiated, unreported offer to handle it while I was in Figi!" 
                        "UER":    {"weight": 2, "concern": "User Error" },                          // "Yeah, lemme just open the story real qui- SH*T! Where did it go!? ^&*%$^%$&* JIRA!"
                        "SCR":    {"weight": 2, "concern": "Scope Creep" },                         // "Hey, so marketing wants to add one more little thing to the user-facing cart portal"
                        "ASS":    {"weight": 2, "concern": "Improperly Assigned" },                 // Likely curprits: "Oh, THAT Deepak?!" and "Why is this assigned to ME!? Stupid JIRA."
                        "PID":    {"weight": 2, "concern": "Parent ID Changed" },                   // "IO-11110 DOES look an awful lot like IO-11101"... mistakes happen.
                        "PID":    {"weight": 2, "concern": "Inconsistent Status" },                 // Status makes no sense (e.g. task In Definition, but hours burned).

                        // MEDIUM CONCERN: Issues weighted at 3+ indicate an issue who is
                        // out of place, whose hours aren't (or, temporarily, CANNOT) get
                        // burned down, or admin error. These MAY/MAY NOT be impactful on
                        // the burndown. Scrum master should investigate & maybe inquire.
                        "USS":    {"weight": 3, "concern": "Unestimated at Sprint Start" },         // Story had no hour estimate when Sprint began
                        "STK":    {"weight": 3, "concern": "Unable to Begin" },                     // Story is precluded from even getting started, Maybe prematurely added to iteration?
                        "STR":    {"weight": 3, "concern": "Bad/Mistaken Story Inclusion" },        // Almost always user error. Story got added to iteration on accident. 
                        "HRS":    {"weight": 3, "concern": "Hours Not Being Burned" },              // Almost always user error. Developer working a story simply hasn't reported the work/
                        "NPR":    {"weight": 3, "concern": "No Progress Reported" },                // Developer has reported no progress on an issue for 3+ days. COULD be a warning flag
                        "DEP":    {"weight": 3, "concern": "Unsatisfied Dependency" },              // Basically, the developer must complete another task first, and is blocking himself. 
                        "TOS":    {"weight": 3, "concern": "Issue Changed to Subtask" },            // Former Issue downgraded to subtask.

                        // HIGH CONCERN: Issues weighted 4+ indicate a change in the tot.
                        // estimated hours for the iteration, and therefore have a DIRECT 
                        // impact on the burndown. Scrum master needs to perform inquiry.
                        "TOI":    {"weight": 4, "concern": "Subtask Changed to Issue" },            // Former Subtask elevated to full Issue.
                        "NEW":    {"weight": 4, "concern": "New Story Added to Iteration" },        // Issue just appeared in iteration.
                        "DEL":    {"weight": 4, "concern": "Story Deleted" },                       // Issue deleted/removed from iteration.

                        // CRITICAL CONCERN: Issues weighted at 5 typically indicate some
                        // flavor of impending disaster or serious problem on the flagged
                        // issue. Scrum masters should be loaded for bear & hunting fixes
                        "XXX":    {"weight": 5, "concern": "Blocking Issue" },                      // ISSUE BLOCKED FROM FURTHER PROGRESS. Highest source of concern
                        // BUNDLES
                        "UNCHGD": {"weight": 2, "collection": "XXX,NPR,STK,HOL,ATT,HRS",     "concern": "No changes made to story for current iteration" },
                        "HRSINC": {"weight": 3, "collection": "EST,UER,SCR,STR,STK,NEW,ASS", "concern": "Hours increased from day prior!" },
                        "UNCHG3": {"weight": 4, "collection": "XXX,NPR,STK,HOL,ATT,HRS",     "concern": "No changes made to story for 3 days!" }
                    }

       // APPLICATION SOURCE ===================================================================== 🅔🅧🅔🅒🅤🅣🅘🅞🅝 🅢🅔🅠🅤🅔🅝🅒🅔 indicated by encircled digits (➀-➈)
init = () => {                                                                                      // ⓿ Initiate application, chaining steps 1-3 above to file input's onChange
    iterationName.value    = recall('iterationName', '');                                           // Seed the value set for the iteration's name (or blank if none is stored)...
    iterationName.onkeyup  = ()=>{retain('iterationName', iterationName.value); }                   // ... and set up the field's onKeyUp handler to save any changes henceforth.
    iterationName.onchangd = ()=>{retain('iterationName', iterationName.value); }                   // ... aaaand again, some more, for onChange.
    dateField.value        = recall('reportStartDate', '');                                               // Do the same for the Start Date value, seeding it (or blank) if set...
    dateField.onkeyup      = ()=>{retain('reportStartDate', dateField.value); }                       // ... and establishing the onKeyUp listener to store any updates.
    dateField.onchange     = ()=>{retain('reportStartDate', dateField.value); }                       // ... and establishing the onChange listener to store any updates.

    fileBuffer             = recall('fileBuffer', null);                                            // Try and retrieve the fileBuffer in one exisits in Rote memories...
    fileBuffer             = (fileBuffer == null) ? [] : JSON.parse(fileBuffer);                    // ... and, if one does, rehydrate it. Otherwise, establish it as a new array.
    console.log('fileBuffer', fileBuffer);

    let startingLength = 1;
    
    console.log('fileBuffer', typeof(fileBuffer), fileBuffer, fileBuffer.length);

    if(fileBuffer.length > 0) {                                                                     // If we DID manage to restore a previous buffer...
        startingLength = fileBuffer.length -1;
        namedFiles  = retain('namedFiles', fileBuffer.flatMap(f=>(f && f.fileName)                  //    ... and, should it prove that we have a valid file for each (filled) index... ********
                                                               ?  f.fileName                        //    ... reconstuct the list of previously-provided file names...
                                                               :  ''))                              //    ... otherwise, flag the individual record as having errored out.
    }

    if(fileBuffer.length <= 1){                                                                     // If we FAILED to restore a previous buffer (or the one we DID errored out)...
        namedFiles  = reflect('namedFiles', []);                                                    //    ... grab theb previous buffer from rote memories (defaulting to [] if not present)...
        if(typeof(namedFiles) === 'string') namedFiles=retain('namedFiles', namedFiles.split(',')); //    ... break our namedFiles back out too.
    }

    trg.placeholder = startingLength;
    syncSpinner(startingLength);
    
    resizeBufferArraysAndRebuildSlots();
    syncSpinner();
    
    input.addEventListener('change', e => {
        if(targetSlot == null || input.files.length > 1){                                                                        // (Indicating we're dealing with a BULK upload)
            return pBar(1, "READING...✓", "teal", 0.1, 0, 0)
                  .then(() => pBar(2, 'PARSING...✓', 'DarkTurquoise', 0.1, 0.1, 0.1))
                  .then(parseFilesAndGenerateDragDrop)
                  .then(primeDragDropListBehaviors);
        }else{
            return pBar(1, "READING...✓", "teal", 0.1, 0, 0)
                  .then(() => pBar(2, 'PARSING...✓', 'DarkTurquoise', 0.1, 0.1, 0.1))
                  .then(() => addOrReplaceSingleFileAndParse());
        }
    });
}; 

insertFileNodeBetween = (e, trgObj=e.target) => {
    console.log(e, trgObj);
    if  (trgObj.tagName !== 'LI') {
                   // e.preventDefault();
            return (e.cancelBubble = true);
        }
    let targetIndex = trgObj.dataset.slot;
    fileBuffer.splice(targetIndex, 0, '');
    namedFiles.splice(targetIndex, 0, '');
    syncSpinner(((trg.placeholder / 1) + 1))
    resizeBufferArraysAndRebuildSlots()
    
}

removeFileAtIndex = (trgBtn, isFilled) => {
    ind = trgBtn.dataset.index;
    if(findLastIndexOf(namedFiles, /.+/) === 0) {
        namedFiles[0]=retain('namedFiles', '');
        fileBuffer[0]=retain('fileBuffer', '');
        return resizeBufferArraysAndRebuildSlots();
    }
    console.log(ind, trgBtn)
    if(isFilled){
        namedFiles.splice(ind, 1, "");
        fileBuffer.splice(ind, 1, "");
    }else{
        namedFiles.splice(ind, 1);
        fileBuffer.splice(ind, 1);
        incDec(1)
    }
    return resizeBufferArraysAndRebuildSlots();
}

resizeBufferArraysAndRebuildSlots = (newLen = ((trg.placeholder / 1) + 1)) => {
        if(typeof(namedFiles)=='undefined' || isNaN(newLen) || newLen<0) return false;
        let oldLen = (namedFiles && namedFiles.length) ? namedFiles.length / 1 : 0,
            opStr = '';
        
        namedFiles.length = newLen;
        fileBuffer.length = newLen;
        if(oldLen < newLen) {
            namedFiles.fill('', oldLen)
            fileBuffer.fill('', oldLen)
        }
        retain('namedFiles',namedFiles)
        retain('fileBuffer',JSON.stringify(fileBuffer));

        let interpolated = findLastIndexOf(namedFiles, /.+/);
        
        for(i=namedFiles.length-1; i>=0; i--){
            if(namedFiles.indexOf(namedFiles[i]) < i) namedFiles[i] = '';
            let  pList = ' class="drag-drop" draggable="true" '
                ,dSlot = ` data-slot="${(i > 0) ? i : 'S'}" `
                ,fName = ` <label for="input" onMouseDown="setTargetSlot(${i})">
                              ${namedFiles[i]}
                              <button class="remove-buttons" data-index="${i}" onMouseUp="removeFileAtIndex(this, true)" />
                           </label>`
                ,arrID = ` id="file-slot-${i}" `;

            if(namedFiles[i] == ''){
                if(i < interpolated){
                    fName = ` <label for="input" onMouseDown="setTargetSlot(${i})">
                                No file specified (click to add, or leave blank to interpolate data from neighbors)
                                <button class="remove-buttons" data-index="${i}" onMouseUp="removeFileAtIndex(this, false)" />
                              </label>`;
                    pList += ' data-value="interpolated"';
                } else {
                    fName = ` <label for="input" onMouseDown="setTargetSlot(${i})">
                                No file specified (click to add!)
                               <button class="remove-buttons" data-index="${i}" onMouseUp="incDec(-1); released();" />

                            </label>`;
                }
            } else {
                pList += ' data-value="stored"';

            }
            
            opStr = `<li ${arrID + dSlot + pList}>${fName}</li>` + opStr;
        }
        while(sortableList.childElementCount>0) sortableList.childNodes[0].remove();
        sortableList.insertAdjacentHTML('beforeEnd', opStr);
        qsa('li').forEach(li=>li.addEventListener('click', insertFileNodeBetween));
    };

addOrReplaceSingleFileAndParse = (slotId=targetSlot, liObj=qs('#file-slot-'+slotId)) =>                                                               // Called when a LI slot is clicked to load a single file
       //    new Promise(conclude => {
    {
        _("\"Yay promises!\"");
        let fileObj  = input.files[0],
            fileName = fileObj.name;
            
        if(namedFiles.indexOf(fileName) != -1) return(alert('This file is already in use!'));
        _("WORKING WITH PROVIDED FILE ", fileName, namedFiles.indexOf(fileName));
        const readUploadedFileAsText = (fileObj) => {
            _("readUploadedFileAsText");
            let reader   = new FileReader();
            
            return new Promise((resolve) => {
                reader.onload = () => {
                    _('onload Event fired...')
                    resolve(reader.result);
                };
              reader.readAsText(fileObj);
            });
          };
          
        readUploadedFileAsText(fileObj)
        .then(result=>
            new Promise(resolve=>{
                _('...resolved\n".then()" #1');
                    var opJSON         = CSV.parse(result);                                                         //    Parse the .CSV file input, ...
                    _(opJSON)
                    let newJSONData    = { fileName: fileName, fileData: opJSON };
                    fileBuffer[slotId] = newJSONData;
                    namedFiles[slotId] = fileName;
                    resolve();
                })
            )
        .then(()=>{
            _('...resolved\n".then()" #2');
            resizeBufferArraysAndRebuildSlots();
            doneButton.disabled = false;
            return ;
        });
    };

         
parseFilesAndGenerateDragDrop = response =>                                                        // ⓵ onChange of file input box, iterate namedFiles and generate Drag/Drop UL
    new Promise(conclude => {
        
        const bufferFile = (fileObj, fileIndex, fileName) =>
            new Promise(fulfill => {
                fileName = fileObj.name;
                if (namedFiles.indexOf(fileName) !== -1) return fulfill(this);
                namedFiles.push(fileName);
                const appendToBuffer = (JSONObj, fileName = null) => {
                    let extantIndex = fileBuffer.find(b => b.fileName === fileName);
                    if (extantIndex) fileBuffer[extantIndex] = JSONObj;
                    else fileBuffer.push(JSON.stringify({ fileName: fileName, fileData: JSONObj }));
                };
                var reader = new FileReader();                                      // Instantiate a new file reader...
                       //   ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  
                reader.onloadend = (progressEvent) => {                              //    ... Add a listener to observe once it's finished loading.
                    var opJSON = CSV.parse(reader.result);                               //    Parse the .CSV file input...
                    appendToBuffer(opJSON, fileName);                                            //    ... and add it to the global variable containing file data,
                    return fulfill(this);
                };                                                                     // ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  
                reader.readAsText(fileObj);                                            // ... And read the file specified.
            });
        var bufferedFiles = Promise.all([...input.files].map((file, ind) => bufferFile(file, ind, file.name)))
        .then(() => {
                namedFiles = [...new Set(namedFiles)];

                let opStr = '';
                for (var i = 0; i < 11; i++) {
                    let dataSlot = !i ? "S" : i;
                    if (i < namedFiles.length) {
                        let fileName = namedFiles[i];
                        opStr += `<li data-slot="${dataSlot}" class="drag-drop" draggable="true">${fileName}</li>`
                    } else {
                        opStr += `<li data-slot="${dataSlot}"><label for="input" onMouseDown="setTargetSlot(${i})">No file specified (click to add!)</label></li>`;
                    }
                }
                
                return conclude(response);
            });
    });

const primeDragDropListBehaviors = (listClass = 'drag-drop') => {                                  // ⓶ iterate UL and set up drag/drop on its children
    const bindDragDropListeners = (obj) => {
        try {

            const drag = (e, trg = e.target, parList = trg.parentNode) => {
                trg.className += " drag-sort-active";
                let swapobj = document.elementFromPoint(event.clientX, event.clientY) || trg;
                if (parList === swapobj.parentNode) {
                           // Thereby constraining the drop to the same list
                    swapobj = (swapobj !== trg.nextSibling) ? swapobj : swapobj.nextSibling;
                    parList.insertBefore(trg, swapobj);
                }
            };
            const drop = (e, trg = e.target) => { e.preventDefault(); trg.className = trg.className.replace(/(\s+)?drag-sort-active(\s+)?/g, ""); }

            obj.addEventListener("drag", drag);
            obj.addEventListener("drop", drop);
            obj.addEventListener("dragend", drop);
            return true;
        } catch (err) {
            return false;
        }
    }
    let ddObjects = sortableList.getElementsByClassName(listClass);
    Array.prototype.map.call(ddObjects,
        list => {
            Array.prototype.map.call(list.children, item => {
                bindDragDropListeners(item);
            });
        }
    );
    [...ddObjects].forEach(o => bindDragDropListeners(o));
    doneButton.disabled = false;
           // retain(
}

const runReport = (obj) => {                                                                       // ⓷ user clicks Run It!; orchastrate remaining steps
    if (obj.disabled == true) return false;
    COMBD_DATA = [];
    ISSUE_KEYS = [];
    DEBUG_DATA = [];
    getDistinctKeysFromFiles();
}

const getDistinctKeysFromFiles = () => {                                                            // ⓸ iterate files in buffer create promise chain to read each in sequence
               // pBar(3, 'PROCESSING', 'aquamarine', 1, 0, 0);
        safeBuffer = Object.assign([], fileBuffer);
        while(safeBuffer.lastIndexOf('') === (safeBuffer.length - 1)) 
            safeBuffer.pop();
        while(safeBuffer.indexOf('') != -1) 
            safeBuffer[safeBuffer.indexOf('')] = 'INTERPOLATED';
        for (files in safeBuffer) {
            let file = safeBuffer[files]
            if(file !== 'INTERPOLATED'){
                let keySet = JSON.stringify(file.fileData, ['Issue key'])              //    ... convert the resultant JSON to a string containing ONLY the 'Issue key' column...
                    .match(/DIGTDEV-\d{4,6}/g)                                         //    ... and then search the pattern DIGTDEV-####(##) out (any 4-6-digit number)
                ISSUE_KEYS = [...new Set([...ISSUE_KEYS, ...keySet])]                  //    ... combine keySet and ISSUE_KEYS, remove duplicates, and convert back to an array.
            } else INTERPOL8D.push(files);
        }

        concatinateDataFromSequencedFiles()
    };

const concatinateDataFromSequencedFiles = () => {                                                  // ⓹ iterate finalized buffer, and concatinated generate output data
    temp_store = [];
    ISSUE_KEYS.forEach(r => {
        temp_store.push(r['Issue key']);
        COMBD_DATA[r] = new Array(safeBuffer.length).fill('');
        DEBUG_DATA[r] = new Array(safeBuffer.length).fill('');
    });
    
    let prevDay, prevData;

    for (files in safeBuffer) {
        let file = safeBuffer[files];
        console.log('file', file);
        console.log('safeBuffer[files]', safeBuffer[files]);
        if(file !== 'INTERPOLATED'){
            file = file.fileData;
            console.log('file', file);
            file.forEach(f => {
                if (f && f['Issue key'] && f['Issue key'] != null && f['Issue key'] !== '') {
                    COMBD_DATA[f['Issue key']][files] = f;
                    DEBUG_DATA[f['Issue key']][files] = JSON.stringify(f);
                }
            });
            prevDay  = files;
            prevData = file;
            prevData = Object.assign([], safeBuffer[files])
        }
    }
    Object.keys(COMBD_DATA).forEach(cbd=>{
        INTERPOL8D.forEach(itp=>COMBD_DATA[cbd][itp] = '---')
    });
    
    processParentChildRelationships();
}

const showRecordDetails = (e, targetLink=e.target) => {
    if(targetLink.tagName != 'A') targetLink = targetLink.parentNode;
    if(targetLink.tagName != 'A') return false;
    e.preventDefault(true);
    const destroyExtantDetailPreviewers = () => [...qsa('.extra-details')].forEach(pp=>pp.remove());
    destroyExtantDetailPreviewers();
    window.addEventListener('click', destroyExtantDetailPreviewers)
    let gatheredDetails = quickIndex.getLatestDetails(targetLink.innerText);
    flatData = '<div class="extra-details"><span>' + Object.entries(gatheredDetails).flat().join('</span><span>') + '</span></div>'
    targetLink.insertAdjacentHTML('afterEnd', flatData);
}

const processParentChildRelationships = () => {
    const createJIRALink = (IssueId, isParent=false) => {
        let hrefUrl = `href="https:       //jira.sprintdd.com/browse/${ IssueId }"' `;
        let clsName = `class="issue-${isParent ? 'parent-' : ''}link iss-hvr-lnk" `;
        let wndoTrg = `target="_blank" `;
        let issueID = IssueId.replace(/(\d+)/gi, '<b>$1</b>');
        
        return `<a ${hrefUrl + clsName + wndoTrg}>${issueID}</a>`;
    }

    var toc = {};
    quickIndex = Object.entries(COMBD_DATA).map(e=>{
        let  opIssueObj = {}
            ,issueKey   = e[0]
            ,issueData  = e[1]
            ,fltrdRows  = issueData.filter(col=>typeof(col) === 'object')
            ,validRow   = fltrdRows[fltrdRows.length-1]
            ,issueId    = validRow['Issue id'];

        toc[issueId]=issueKey;
        opIssueObj = {
             key: issueKey
            ,iid: toc[validRow['Issue id']]
            ,pid: toc[validRow['Parent id']] || ''
            ,sts: validRow['Status']
            ,ass: validRow['Assignee']
            ,sum: validRow['Summary']
            ,vld: validRow
        }
        opIssueObj['pathLinks'] = (opIssueObj.pid === '') 
                                ? createJIRALink(opIssueObj.iid) 
                                : createJIRALink(opIssueObj.pid, true) 
                                    + ' / ' + createJIRALink(opIssueObj.iid);
        return opIssueObj;
    });
    quickIndex.toc = toc;
    quickIndex.pathedName = (key) => {
        let results = quickIndex.find(qI => qI.key === key);
        return (results && results.pathLinks) ? results.pathLinks : key;
    }
    quickIndex.lastStatus = (key) => {
        let results = quickIndex.find(qI => qI.key === key);
        return (results && results.sts) ? results.sts : '';
    }
    quickIndex.getLatestDetails = (key) => {
        let results = quickIndex.find(qI => qI.key === key);
        return (results && results.vld) ? results.vld : false;
    }

    constructPreviewAndReportData();
    
}
const constructPreviewAndReportData = () => {                                                         // ⓺ iterate concatinated output data, look for concern-suggestive trends and build our markup
    const ensureValidValue = (variable, value, altVal=value, tolerateEmptyStr=false) => {
        return  (  
                    typeof(value) === undefined 
                    || value == null 
                    || (!tolerateEmptyStr && value === '') 
                    || value === '---'
                ) ? ((altVal !== value) ? altVal : variable)
                  : value;

    }
    console.log('constructPreviewAndReportData', COMBD_DATA);
    let MRKUP = [],                                                                                    // Collection of markup that'll we'll used to render both the HTML preview and the ultimate XLSX file output
        _I_  = '||--||'                                                                                // The string delimiter we're using to distinguish one chunk of data from another. Our "Split-target"
    Object.entries(COMBD_DATA).forEach((dataRecord, ind) => {                                          // Iterate across each Issue (the "rows") that we've ingested data for, to extract the following data:

               // _(dataRecord);
        let  issueName = dataRecord[0]                                                                 //   - The specific issue being examined (just the name; eg. 'DIGIT-12345'. Also serves as the array key)
            ,issueData = dataRecord[1]                                                                 //   - The specific issue being examined (all the data for all the days for the files provided)
            ,colCt = issueData.length                                                                  //   - How many "columns" we're looking at
            ,opSts = ''
            ,ROWOP = ''                                                                                //   - The iteratively-constructed markup for the "row" corresponding to the issue being examined
            ,opHrs = 0
            ,flags = ''                                                                                //   - The empty collection of flags, to be joined & processed later in the loop
            ,reCtr = 1                                                                                 //   - Counter for how many consecutive days the Remaining Estimate has languished, unchanged
            ,ctCtr = 1                                                                                 //   - Iteration-length counter for how many consecutive days the Remaining Estimate goes unchanged
            ,oldRE = ''                                                                                //   - Previous (from the previous-iterated-over day in the row) Remaining Hours Estimate
            ,oldPI = ''                                                                                //   - Previous (from the previous-iterated-over day in the row) Parent ID
            ,oldII = ''                                                                                //   - Previous (from the previous-iterated-over day in the row) Issue ID
            ,newRE = ''                                                                                //   - Current (from the currently-iterated-over day in the row) Remaining Hours Estimate
            ,newPI = ''                                                                                //   - Current (from the currently-iterated-over day in the row) Parent ID
            ,newII = ''                                                                                //   - Current (from the currently-iterated-over day in the row) Issue ID
            ,newST = '';                                                                                //   - Current Status (in this case, we don't care what the previous one was, but need it at the issue scope)

        issueData.forEach((datRec, ix) => {                                                            // ...Iterate the issue's collected data (the "columns"), gathering...
            newRE = (datRec === '---') ? '---' : (datRec['Remaining Estimate']  || '');           
            if(newRE === '---'){
                ROWOP = ROWOP + _I_ + '---' ;                                               // Tack the current day being iterated past's Est. hours remaining onto the end of the issue being iterated past
            }else
                ROWOP = ROWOP + _I_ + toHours(newRE) + 'h' ;                                               // Tack the current day being iterated past's Est. hours remaining onto the end of the issue being iterated past
        });
        ROWOP = quickIndex.lastStatus(issueName) + _I_ + quickIndex.pathedName(issueName) + ROWOP;                                                           // STATUS | JIRA ID | PARENT ID | ISSUE ID | DAY 1 | DAY 2 | ... | DAY n | flags |
        for(var backfill=colCt; backfill<=namedFiles.length-1; backfill++){
            ROWOP += _I_ + 'XxXxX';
        }
        MRKUP.push(ROWOP.split(_I_));                                                                  // Convert it to an iterable collection and push it onto the bottom of the output markup stack
    })

    pBar(4, 'GENERATING OUTPUT... DONE!', 'LimeGreen', 0.1, 0.1, 0.1);                                 // Show generating output progress meter
    let colHeaders  = ['Current Status','Issue ID', 'Seed Day']                  // Define always-present column headers (| Current Status | JIRA ID | Parent ID | Issue ID | Seed Day |)
        ,dateArr     = [];                                                                               // Array holding the labels for each column, each of which represent the file being examined
    if (dateField.checkValidity()) {                                                                   // Since we can't date-stamp a column if the user didn't give us a date, see if they did. IF they did...
        if(colHeaders[4] === 'Seed Day') colHeaders[4] += "<br>" + dateField.value                     // Append the Seed Date to the seed column header (if currently unset)
        let startDate = new Date(dateField.value).getTime();                                           // Get the epoch value of the StartDate
        let dayCt = 1;                                                                                 // Increment the number of days we're venturing forth from the start date. This is used to ignore weekends
        while (dateArr.length < namedFiles.length - 1 && dayCt < namedFiles.length * 2) {                                                    // Keep going until we have at least 10 days
            let incrementedDate = new Date(startDate + (dayCt * 86400000));                            // Add 24 hours to the daying bering iterated across
            if (incrementedDate.getDay() > 0 && incrementedDate.getDay() < 6)                          // If the now-incremented date falls on a M-F...
                dateArr.push('Day ' + (dateArr.length + 1) + '<br />' +                                //    ... add both the day number... 
                                incrementedDate.toLocaleDateString())                                  //    ... and the date that works out to to the stack.
            dayCt++;                                                                                   // Increment the day counter whether we added to stack or not (since we skip over weekends and holidays)
        }
    } else {
        for(i=1; i<= namedFiles.length-1; i++) 
        if(i > safeBuffer.length-1) 
            dateArr.push('XXXDay ' + i)
        else
            dateArr.push('Day ' + i)
    }
    
    colHeaders = [...colHeaders, ...dateArr];
    let tblMarkup =             '<h1>' + iterationName.value + '</h1>' + 
                                '<table class="preview-table" cellspacing="0">'
        ,hdrMarkup =                '<thead><tr><th>' + colHeaders.join('</th><th>').replace(/>XXXDay/g, ' class="dim">Day') + 
                                    '</th>'
        ,rowMarkup =                '</tr></thead><tbody>'
    MRKUP.forEach(o => rowMarkup +=    '<tr><td>' + 
                                            o.join('</td><td>').replace(/\.00h|\.0h/g, 'h').replace(/>XxXxX/g, ' class="dim">') + 
                                        '</td></tr>');
    rowMarkup +=                   '</tbody>';
    tblMarkup +=                    hdrMarkup + rowMarkup + 
                                '</tbody>'
    
    while (previewPanel.childElementCount > 0){ previewPanel.childNodes[0].remove() }
    let cbPanel = document.getElementById('filter-ckbox-panel');
    if(cbPanel) cbPanel.remove();

    previewPanel.insertAdjacentHTML('beforeEnd', tblMarkup);

    let linkHandlers = [...qsa('a.iss-hvr-lnk')].forEach(lnk=>lnk.addEventListener('contextmenu', showRecordDetails));

    createReportData();



    postProcessData()




    let interpString = '', 
        genLength = RPTDATA[0].length;
    INTERPOL8D.forEach(itpCol=>interpString += `td:nth-of-type(-n + ${itpCol - -3}):nth-last-of-type(-n + ${genLength - 2 - itpCol}),`);
           // interpString += `td:nth-of-type(-n + ${INTERPOL8D[0] - -3}):nth-last-of-type(-n + ${genLength - 2 - INTERPOL8D[0]}),`;
    _(interpString)
    //let fx=[...qsa((interpString.slice(0,-1)))].forEach(itpCell=>itpCell.className+=' interpolated-value');
    return true;
}

const createReportData = () => {
    tableNode = document.querySelector('.preview-table');
    tHead = [...tableNode.querySelectorAll('th')].map(th=>th.innerText);
    tBody = [...tableNode.querySelectorAll('tr')].map(tr=>{
        let opObj = [...tr.querySelectorAll('td')];
        opObj = opObj.flatMap(f=>f.innerText);
        
        return opObj;
    })
    tBody[0]=tHead;
    RPTDATA = Object.assign([], tBody);
}

const reFilterPreview = (obj) => {
    if(obj != null){
        let targetClass = obj.id.replace('chk-','.row-status-');
        [...document.querySelectorAll(targetClass)].forEach(row=>{
            row.className = obj.checked ? row.className.replace(' obfuscated', '') : row.className + ' obfuscated';
        });
    }
    let totDisp = 0;
    [...qsa('.status-filter-checkboxes')].forEach(cb => { totDisp += cb.checked ? (cb.value / 1) : 0});
    document.getElementById('record-ct').innerText = totDisp + ' records shown.';
}

let rowNodes       = [];
let colNodes       = [];
let hdrRowNode     = [];
let hdrColNodes    = [];
let numericTotals = ['',''];
let totalRow = [];

const postProcessData   = () => {
    let rptStatuses     = {}
      , dispCkBoxes     = ''
      , uniqueStatuses  = []
      , RPTString       = ""
      , dataColCount    = 0
      , nonDataColCount = 2;
    
    Promise.resolve().then(()=>{
        rowNodes           = [...qsa('.preview-table tr')];
        RPTString      = JSON.stringify(RPTDATA);
        rowNodes.forEach((rows, idx)=>{
            let row = [...rows.querySelectorAll('td')];
            colNodes.push(row);
            if(row && row[0] && row[0].innerText !== '') {
                rowNodes[idx].className = 'row-status-' + row[0].innerText.replace(/\s+/g, '_');
                uniqueStatuses.push(row[0].innerText);
            }
            return rows;
        })
    }).then(()=>{
        hdrRowNode  = rowNodes.splice(0,1)[0];
        console.log('hdrRowNode', hdrRowNode);
        hdrColNodes = [...hdrRowNode.childNodes];
        console.log('hdrColNodes', hdrColNodes);
        // _(hdrRowNode)
        // hdrColNodes = colNodes.shift();

        console.log('hdrRowNode', hdrRowNode);
        console.log('rowNodes', rowNodes);
        console.log('hdrColNodes', hdrColNodes);
        console.log('colNodes', colNodes);
        
        
        // Extarct the unique statuses and generate their respective checkboxes for the display filtes.
        [...new Set(uniqueStatuses)].sort().forEach(status=>{
            let muStatus = status.replace(/\s+/g, '_');
            let statusRE = new RegExp(status, 'g');
            rptStatuses[muStatus] = RPTString.match(statusRE).length;
            dispCkBoxes += `<input name="chk-${muStatus}" id="chk-${muStatus}" class='status-filter-checkboxes' type="checkbox" value="${rptStatuses[muStatus]}" checked="true" onChange="reFilterPreview(this)" /><label for="chk-${muStatus}">${status} (${rptStatuses[muStatus]})</label><br>`;
        });
        document.getElementById('output-panels').insertAdjacentHTML('beforeEnd', '<aside id="filter-ckbox-panel" class="status-filters"><h2>Currently Showing:</h2><span id="record-ct"></span>' + dispCkBoxes + '</aside>');
        reFilterPreview();
    }).then(()=>{
        // Interpolate any missing data into its respective columns, from left to right, top to bottom.
            colNodes.forEach((reportRow, rowIndex) => {
                reportRow.forEach((cols, colIndex)=>{
                    let col = cols.innerText;
                    let cell = colNodes[rowIndex][colIndex];//qs(`.preview-table tr:nth-of-type(${rowIndex}) td:nth-of-type(${colIndex+1})`);
                    // _(cell == colNodes[rowIndex][colIndex]);
                    if(col==='---'){
                    cell.className = 'interpolated-value'
                    let p = cell.previousSiblingElement;
                    var pCell 	 = cell.previousSibling,
                        pCellVal = pCell.innerText.replace(/h/g, '') / 1,
                        nCell 	 = cell.nextSibling,
                        nCellVal = nCell.innerText;
                    while(nCell && nCellVal === '' || nCellVal === '---'){ 
                        if(nCell && nCell.innerText) {
                            nCell = nCell.nextSibling; 
                            nCellVal = nCell.innerText;
                        }else {
                            nCell    = void(0);
                            nCellVal = '';
                        }
                    }
                    nCellVal = nCellVal.replace(/h/g, '') / 1;
                    var cellDiff = pCellVal - nCellVal,
                        itpValue = nCellVal + cellDiff/2,
                        opString = (itpValue.toPrecision(3).replace(/0+$/g, '') + 'h').replace('.h','h');

                    if(!isNaN(itpValue)) {
                        opString = (opString === '0h') ? '<i>0h</i>' : '<strong><em>' + opString + '</em></strong>';
                        cell.innerHTML = opString;
                    }
                }
            });
        });
    }).then(()=>{
        let opStr = "";
        let idealRow = [];
        totalRow.length = hdrColNodes.length;
        idealRow.length = hdrColNodes.length
        totalRow = totalRow.fill(0, 2, hdrColNodes.length)
        idealRow = idealRow.fill(0, 2, hdrColNodes.length)
        for(var c=2; c<hdrColNodes.length; c++){
            rowNodes.forEach((row, rowIdx) => {
                let cell = row.childNodes
                if(cell != null && cell[c] != null && cell[c].innerText){
                    cell = cell[c].innerText.replace(/h/g, '');
                    totalRow[c] = (totalRow[c] / 1) + (cell / 1);
                }
            });

            if(c === 2) { // Meaning we're working on the seed file...
                let seedTotal = totalRow[c];

            }
        }

        opStr += '<tr class="total-row"><td colspan="2" class="total-label">TOTAL (Actual):</td>';
        opStr += '  <td>' + totalRow.slice(2).join('h</td><td>') + 'h</td>';
        opStr += '</tr>';

        qs('.preview-table').insertAdjacentHTML('beforeEnd', opStr);
    });
}



const trg=document.querySelector('.picker-panel-presenter');
let ongoing = false, ongoingtimer=null, 
    offset  = (trg.getBoundingClientRect().height - 2);

const syncSpinner = (hardValue=null) => {
    if(hardValue != null && !isNaN(hardValue)) trg.placeholder = hardValue;
    let newVal    = trg.placeholder / 1, 
        control   = trg.parentElement;
    offset        =(trg.getBoundingClientRect().height + 2);
    control.style = "--value:" + (trg.placeholder * offset * -1) + "px";
    resizeBufferArraysAndRebuildSlots();
}

const incDec = (dir, mechanical=true, dly=750, scale=1) => {
   
   ongoing=true;
   dly = (dly<50) ? 50 : Math.log2(dly) * dly/10.4;
   let adjVal = dir * scale + parseInt(trg.placeholder);
   if(adjVal <= 1) adjVal = 1;
   if(adjVal > 60) adjVal=60;;
   trg.placeholder = adjVal;
   syncSpinner();
   mechanical = false;
   if(ongoing && !mechanical) ongoingtimer=window.setTimeout(()=>incDec(dir, false, dly, scale), dly)
}

const released = () => window.clearTimeout(ongoingtimer);

window.addEventListener('DOMContentLoaded', init);
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define('flambe', factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.flambe = factory());
}(this, (function () { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var flambe = createCommonjsModule(function (module) {
	  /*eslint-disable*/


	  var CSV = {};

	  (function (window, undefined$1) {

	    /**
	     * Split CSV text into an array of lines.
	     */

	    function splitLines(text, lineEnding) {

	      var strLineEnding = lineEnding.toString(),
	          bareRegExp = strLineEnding.substring(1, strLineEnding.lastIndexOf('/')),
	          modifiers = strLineEnding.substring(strLineEnding.lastIndexOf('/') + 1);

	      if (modifiers.indexOf('g') === -1) {
	        lineEnding = new RegExp(bareRegExp, modifiers + 'g');
	      } // TODO: fix line splits inside quotes


	      return text.split(lineEnding);
	    }
	    /**
	     * If the line is empty (including all-whitespace lines), returns true. Otherwise, returns false.
	     */


	    function isEmptyLine(line) {

	      return line.replace(/^[\s]*|[\s]*$/g, '') === '';
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

	      var i, j, token, quote;

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
	            lineTokens[i] += delimiter + lineTokens.splice(j, 1)[0];
	            token = lineTokens[j].replace(/[\s]*$/g, '');
	          }

	          if (j < lineTokens.length) {
	            lineTokens[i] += delimiter + lineTokens.splice(j, 1)[0];
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

	      var i; // TODO: allow for escaped quotes

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

	      var i,
	          j,
	          tokenizedLine,
	          obj,
	          key,
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

	      var config = {
	        lineEnding: /[\r\n]/,
	        delimiter: ',',
	        ignoreEmptyLines: true
	      },
	          lines,
	          tokenizedLines,
	          objects; // Empty text is a syntax error!

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
	      } // Step 1: Split text into lines based on line ending.


	      lines = splitLines(text, config.lineEnding); // Step 2: Get rid of empty lines. (Optional)

	      if (config.ignoreEmptyLines) {
	        removeEmptyLines(lines);
	      } // Single line is a syntax error!


	      if (lines.length < 2) {
	        throw new SyntaxError('missing header');
	      } // Step 3: Tokenize lines using delimiter.


	      tokenizedLines = tokenizeLines(lines, config.delimiter); // Step 4: Using first line's tokens as a list of object literal keys, assemble remainder of lines into an array of objects.

	      objects = assembleObjects(tokenizedLines);
	      return objects;
	    }; // Expose local CSV object somehow.


	    if (module && 'object' === 'object') {
	      // If Node module pattern is supported, use it and do not create global.
	      module.exports = CSV;
	    } else if (typeof undefined$1 === 'function' && undefined$1.amd) {
	      // Node module pattern not supported, but AMD module pattern is, so use it.
	      //eslint-disable-next-line
	      undefined$1([], function () {
	        return CSV;
	      });
	    } else {
	      // No AMD loader is being used; expose to window (create global).
	      window.CSV = CSV;
	    }
	  })(typeof window !== 'undefined' ? window : {});

	  const d = document // ⥱ Alias - document
	  ,
	        qs = s => d.querySelector(s) // ⥱ Alias - querySelector
	  ,
	        qsa = s => [...d.querySelectorAll(s)] // ⥱ Alias - querySelectorAll
	  ,
	        rote = window.localStorage // Alias to the window's localStorage. Really these are all just helper functions that amuse me.
	  ,
	        recall = (k, def = null) => {
	    k = rote.getItem(k);
	    return k ? k : def ? def : null;
	  } // Returns a memory value if present. If not, returns def if provided, null if not
	  ,
	        retain = (k, v) => rote.setItem(k, v) ? v : v // Creates a new memory for key k with value v, then returns v
	  ,
	        reflect = (k, def = null) => retain(k, recall(k, def)) // Runs a recall for a memory (value at key or null), then immediately retains it in memories
	  ,
	        findLastIndexOf = (arr = void 0, val = void 0, fromIndex = null) => {
	    // eslint-disable-line no-unused-vars
	    for (var i = arr ? arr.length - 1 : 0; arr !== void 0 && val !== void 0 && i >= 0; i--) if ((val.constructor + '').match(/RegExp/) && arr[i].match(val) || val + '' == arr[i]) return i;

	    return -1;
	  };

	  const totalItrDayPicker = document.querySelector('.picker-panel-presenter'),
	        getDayCountFromPicker = () => totalItrDayPicker.placeholder / 1; // Global Variables --------------------------------------------------------------------------------------------------------------


	  let fileBuffer = [] // Stores copies of the file input's data collection (req'd in case the user maskes multiple sets of selections)
	  ,
	      namedFiles = [] // Array containing just the names of the files contained within fileBuffer (used for sequencing the read order)
	  ,
	      TOTALITRDAYS = getDayCountFromPicker(),
	      input = document.getElementById('input') // HTML file <INPUT> field/drop target for uploading XLSX files into the system
	  ,
	      dateField = qs("#report-start-date") // HTML date <INPUT> field representing the start of the iteration
	  ,
	      sortableList = qs('.has-draggable-children') // The <UL> containing the drag-drop-sortable list of files provided by the user
	  ;
	      qs('.done-sorting') // "Run report" button
	  ;
	      let iterationName = qs("#iteration-name");
	      qs('.output-table');
	 // APPLICATION SOURCE ============================================================================ 🅔🅧🅔🅒🅤🅣🅘🅞🅝 🅢🅔🅠🅤🅔🅝🅒🅔 indicated by encircled digits (➀-➈)

	  const init = () => {

	    iterationName.value = recall('iterationName', '') || "Team Byrnedown - Iteration "; // Seed the value set for the iteration's name (or blank if none is stored)...

	    iterationName.onkeyup = () => {
	      retain('iterationName', iterationName.value);
	    }; // ... and set up the field's onKeyUp handler to save any changes henceforth.


	    iterationName.onchangd = () => {
	      retain('iterationName', iterationName.value);
	    }; // ... aaaand again, some more, for onChange.


	    dateField.value = recall('reportStartDate', ''); // Do the same for the Start Date value, seeding it (or blank) if set...

	    dateField.onkeyup = () => {
	      retain('reportStartDate', dateField.value);
	    }; // ... and establishing the onKeyUp listener to store any updates.


	    dateField.onchange = () => {
	      retain('reportStartDate', dateField.value);
	    }; // ... and establishing the onChange listener to store any updates.


	    fileBuffer = recall('fileBuffer', null); // Try and retrieve the fileBuffer in one exisits in Rote memories...

	    fileBuffer = fileBuffer == null ? [] : JSON.parse(fileBuffer); // ... and, if one does, rehydrate it. Otherwise, establish it as a new array.

	    let startingLength = 10;

	    if (fileBuffer.length > 0) {
	      // If we DID manage to restore a previous buffer...
	      namedFiles = retain('namedFiles', fileBuffer.flatMap(f => f && f.fileName ? //    ... and, should it prove that we have a valid file for each (filled) index... ********
	      f.fileName //    ... reconstuct the list of previously-provided file names...
	      : '')); //    ... otherwise, flag the individual record as having errored out.

	      startingLength = fileBuffer.length - 1; //    .. Finally, while we're at it, let's grab the number of files we're starting with.
	    }

	    if (fileBuffer.length <= 1) {
	      // If we FAILED to restore a previous buffer (or the one we DID errored out)...
	      namedFiles = reflect('namedFiles', []); //    ... grab theb previous buffer from rote memories (defaulting to [] if not present)...

	      if (typeof namedFiles === 'string') namedFiles = retain('namedFiles', namedFiles.split(',')); //    ... break our namedFiles back out too.
	    }

	    totalItrDayPicker.placeholder = startingLength;
	    syncSpinner(startingLength); //## ➜➜➜ 🅒 

	    resizeBufferArraysAndRebuildSlots(); //@@ ➜➜➜ ︎🅑 

	    syncSpinner(); //## ➜➜➜ 🅒 

	    input.addEventListener('change', e => {
	    });
	  }; // const insertFileNodeBetween = (e, trgObj = e.target) => {
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


	    if (!trg.dataset || !trg.dataset.insertion) {
	      // e.preventDefault();
	      return e.cancelBubble = true;
	    }

	    let targetIndex = +trg.dataset.insertion;
	    fileBuffer.splice(targetIndex, 0, '');
	    namedFiles.splice(targetIndex, 0, '');
	    syncSpinner(totalItrDayPicker.placeholder / 1 + 1); //## ➜➜➜ 🅒 

	    resizeBufferArraysAndRebuildSlots(); //@@ ➜➜➜ 🅑 
	  };

	  const syncSelect = (e, val) => {
	    let trg = e.target;
	    val = val != null ? val : trg.value;
	    let txtBox = trg.previousElementSibling.previousElementSibling;
	    txtBox.value = val;
	    retain(trg.id, val);
	    trg.blur();
	  };

	  const setSelect = (sel, val) => {
	    if (sel == null || val == null) return false;
	    sel = typeof sel === 'string' ? qs(sel) : sel;
	    sel.value = val;
	    syncSelect({
	      target: sel
	    }, val);
	  };

	  let ALLTEAMS = [];
	  let ALLITRS = [];

	  const generateTeamsAndIterationLists = () => {
	    ALLTEAMS = [];
	    ALLITRS = [];

	    for (let files in fileBuffer) {
	      let file = fileBuffer[files];

	      if (file != null && file != '') {
	        let teamsInFile = JSON.stringify(file.fileData, ['Component/s']); // Rip out all the teams in each file...

	        teamsInFile = JSON.parse(teamsInFile).flatMap(d => d['Component/s']); // ... then flatten the results into a 1-dimensional array.

	        let itrsInFile = JSON.stringify(file.fileData, ['Sprint']); // ... then do the same for iterations.

	        itrsInFile = JSON.parse(itrsInFile).flatMap(d => d['Sprint']);
	        ALLTEAMS = [...teamsInFile, ...ALLTEAMS]; // Append the new data to the running variable

	        ALLITRS = [...itrsInFile, ...ALLITRS];
	      }
	    }

	    ALLTEAMS = [...new Set(ALLTEAMS)].sort(); // Finally, reduce both to collections containing only unique elements

	    ALLITRS = [...new Set(ALLITRS)].sort();
	    let teamsDD = qs('#selTeam'),
	        itrsDD = qs('#selIteration');
	    teamsDD.innerHTML = '<option>Show All Teams</option><option>' + ALLTEAMS.join('</option><option>') + '</option>';
	    itrsDD.innerHTML = '<option>Show All Iterations</option><option>' + ALLITRS.join('</option><option>') + '</option>';
	    teamsDD.addEventListener('change', syncSelect);
	    itrsDD.addEventListener('change', syncSelect);
	  };

	  setSelect('#selTeam', recall('selTeam'));
	  setSelect('#selIteration', recall('selIteration')); // eslint-disable-next-line

	  const resizeBufferArraysAndRebuildSlots = (newLen = totalItrDayPicker.placeholder / 1 + 1) => {

	    if (typeof namedFiles == 'undefined' || isNaN(newLen) || newLen < 0) return false;
	    let oldLen = namedFiles && namedFiles.length ? namedFiles.length / 1 : 0,
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
	      let pList = ' class="drag-drop" draggable="true" ',
	          dSlot = ` data-slot="${i > 0 ? i : 'S'}" `,
	          fName = ` <label for="input" onMouseDown="setTargetSlot(${i})">
                              ${namedFiles[i].length > 40 ? namedFiles[i].slice(0, 25) + ' <b>…</b> ' + namedFiles[i].slice(-70) : namedFiles[i]}
                              <button class="remove-buttons" data-index="${i}" onMouseUp="removeFileAtIndex(this, true)" />                            
                           </label>` //%% ➜➜➜ 🅔 
	      ,
	          arrID = ` id="file-slot-${i}" `;

	      if (namedFiles[i] == '') {
	        if (i < interpolated) {
	          //%% ➜➜➜ 🅔 
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

	      let determinedPos = dSlot.replace(/data-slot="(.*)"/, '$1').trim(),
	          newSlotMarkup = determinedPos === 'S' ? `<a href="#" class="rowInserter insertBelow" data-insertion="1"></a>` : `<a href="#" class="rowInserter insertAbove" data-insertion="${determinedPos}"></a>
                                 <a href="#" class="rowInserter insertBelow" data-insertion="${+determinedPos + 1}"></a>`;
	      newSlotMarkup = `<li ${arrID + dSlot + pList}>${newSlotMarkup}${fName}</li>`;
	      opStr = newSlotMarkup + opStr;
	    }

	    while (sortableList.childElementCount > 0) sortableList.childNodes[0].remove();

	    sortableList.insertAdjacentHTML('beforeEnd', opStr);
	    qsa('.rowInserter').forEach(li => li.addEventListener('click', insertFileNodeBetween)); //$$ ➜➜➜ 🅓 

	    generateTeamsAndIterationLists();
	  };

	  recall('genModSeeds');


	  const released = () => {
	    window.clearTimeout(ongoingtimer);
	  };

	  let ongoingtimer = null,
	      offset = totalItrDayPicker.getBoundingClientRect().height - 2;
	  totalItrDayPicker.addEventListener('mouseOver', () => {
	  });
	  totalItrDayPicker.addEventListener('mouseOut', () => {
	  });
	  totalItrDayPicker.addEventListener('blur', () => {
	  });
	  window.addEventListener('click', released);

	  const syncSpinner = (hardValue = null) => {

	    if (hardValue != null && !isNaN(hardValue)) totalItrDayPicker.placeholder = hardValue;
	    TOTALITRDAYS = getDayCountFromPicker();
	    let control = totalItrDayPicker.parentElement;
	    offset = totalItrDayPicker.getBoundingClientRect().height + 2;
	    control.style = "--value:" + TOTALITRDAYS * offset * -1 + "px";
	    resizeBufferArraysAndRebuildSlots(); //@@ ➜➜➜ ︎🅑 
	  };

	  setTimeout(() => {
	    window.scrollTo(0, 0);
	  }, 500);
	  window.addEventListener('DOMContentLoaded', init);
	});

	return flambe;

})));

//# sourceMappingURL=flambe.js.map

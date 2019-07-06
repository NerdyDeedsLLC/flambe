// DECLARATIONS ==================================================================================================================
// Shortcut aliases and Helper functions -----------------------------------------------------------------------------------------
const d = document // ⥱ Alias - document
,
      qs = s => d.querySelector(s) // ⥱ Alias - querySelector
,
      qsa = s => [...d.querySelectorAll(s)] // ⥱ Alias - querySelectorAll
,
      _ = (...args) => console.log.call(this, ...args) // ⥱ Alias - _
,
      pBar = (id, title, barColor, processor = 1, seq = 0, bc = 0) => // ⍟ HLPfn - Generates a progress bar
new Promise(conclude => {
  id = 'pbar-' + id;
  let oldBar = qs('#' + id);
  if (oldBar) oldBar.remove();
  let pb = qs('.pbars');
  pb.insertAdjacentHTML('beforeEnd', `<div id="${id}" class="progress-bar" title="${title}" style="--bar-color:${barColor}; --process:${processor}s; --seq:${seq}; --bc:${bc}"></div>`);
  return conclude(qs('#' + id));
}),
      rote = window.localStorage,
      memories = a => rote.length,
      recall = a => rote.getItem.call(this, ...args),
      retain = a => rote.setItem.call(this, ...args),
      forget = a => rote.removeItem.call(this, ...args),
      recollect = a => rote.getItem.call(this, ...args),
      fugue = a => rote.clear.call(this, ...args),
      toHours = (val = null) => {
  if (val == null || isNaN(val / 1)) return '0*';
  return val / 1 <= 0 ? 0 : (val / 3600).toPrecision(3);
},
      setTargetSlot = slotIndex => targetSlot = slotIndex; // Global Variables --------------------------------------------------------------------------------------------------------------


let fileBuffer = [] // Stores copies of the file input's data collection (req'd in case the user maskes multiple sets of selections)
,
    fileCount = 0,
    namedFiles = [] // Array containing just the names of the files contained within fileBuffer (used for sequencing the read order)
,
    COMBD_DATA = [] // COMBINED DATA from all the files ingested
,
    ISSUE_KEYS = [] // LIST OF ALL THE ISSUES from all the files ingested
,
    input = document.getElementById('input') // HTML file <INPUT> field/drop target for uploading XLSX files into the system
,
    dateField = qs("#report-start-date") // HTML date <INPUT> field representing the start of the iteration
,
    sortableList = qs('.has-draggable-children') // The <UL> containing the drag-drop-sortable list of files provided by the user
,
    doneButton = qs('.done-sorting') // "Run report" button
,
    iterationName = qs("#iteration-name"),
    previewPanel = qs('.output-table'),
    targetSlot = null,
    concernColors = ['Transparent', 'DimGray', 'GreenYellow', 'Gold', 'Orange', 'Red'] // 0-indexed Color-Codings used for the 
,
    concernFlags = {
  // CONCERN CODEX
  // TRIVIAL CONCERN: An issue weighted 0-1 indicate anomolies that
  // are visible within the data that are known and being accounted
  // for. Scrum masters may need to explain the blip to THEIR boss.
  "HID": {
    "weight": 0,
    "concern": "Hidden By ScrumMaster"
  },
  // Employed at scrum master's discretion to remove a concern from being flagged
  "ATT": {
    "weight": 1,
    "concern": "Related to Attendance"
  },
  // Assigned developer is AWOL/MIA/on leave/in the med bay. Occasionally presumed dead.
  "HOL": {
    "weight": 1,
    "concern": "Related to Holiday"
  },
  // Excluding a day iteration-wide for company holiday/operational shutdown
  // MINOR CONCERN: Issues weighted at 2- less usually indicates an
  // error in procedure, in JIRA operation, or on the dev, assigned
  // the issue. Scrum masters should inquire if it keeps happening.
  "EST": {
    "weight": 2,
    "concern": "Bad Estimate"
  },
  // "Build a global satellite network, huh? No problem. 9 lines of code, 16 hours, tops."
  "AUC": {
    "weight": 2,
    "concern": "Assigned User Changed"
  },
  // "Huh? Bob made an unsubstantiated, unreported offer to handle it while I was in Figi!" 
  "UER": {
    "weight": 2,
    "concern": "User Error"
  },
  // "Yeah, lemme just open the story real qui- SH*T! Where did it go!? ^&*%$^%$&* JIRA!"
  "SCR": {
    "weight": 2,
    "concern": "Scope Creep"
  },
  // "Hey, so marketing wants to add one more little thing to the user-facing cart portal"
  "ASS": {
    "weight": 2,
    "concern": "Improperly Assigned"
  },
  // Likely curprits: "Oh, THAT Deepak?!" and "Why is this assigned to ME!? Stupid JIRA."
  "PID": {
    "weight": 2,
    "concern": "Parent ID Changed"
  },
  // "IO-11110 DOES look an awful lot like IO-11101"... mistakes happen.
  "PID": {
    "weight": 2,
    "concern": "Inconsistent Status"
  },
  // Status makes no sense (e.g. task In Definition, but hours burned).
  // MEDIUM CONCERN: Issues weighted at 3+ indicate an issue who is
  // out of place, whose hours aren't (or, temporarily, CANNOT) get
  // burned down, or admin error. These MAY/MAY NOT be impactful on
  // the burndown. Scrum master should investigate & maybe inquire.
  "USS": {
    "weight": 3,
    "concern": "Unestimated at Sprint Start"
  },
  // Story had no hour estimate when Sprint began
  "STK": {
    "weight": 3,
    "concern": "Unable to Begin"
  },
  // Story is precluded from even getting started, Maybe prematurely added to iteration?
  "STR": {
    "weight": 3,
    "concern": "Bad/Mistaken Story Inclusion"
  },
  // Almost always user error. Story got added to iteration on accident. 
  "HRS": {
    "weight": 3,
    "concern": "Hours Not Being Burned"
  },
  // Almost always user error. Developer working a story simply hasn't reported the work/
  "NPR": {
    "weight": 3,
    "concern": "No Progress Reported"
  },
  // Developer has reported no progress on an issue for 3+ days. COULD be a warning flag
  "DEP": {
    "weight": 3,
    "concern": "Unsatisfied Dependency"
  },
  // Basically, the developer must complete another task first, and is blocking himself. 
  "TOS": {
    "weight": 3,
    "concern": "Issue Changed to Subtask"
  },
  // Former Issue downgraded to subtask.
  // HIGH CONCERN: Issues weighted 4+ indicate a change in the tot.
  // estimated hours for the iteration, and therefore have a DIRECT 
  // impact on the burndown. Scrum master needs to perform inquiry.
  "TOI": {
    "weight": 4,
    "concern": "Subtask Changed to Issue"
  },
  // Former Subtask elevated to full Issue.
  "NEW": {
    "weight": 4,
    "concern": "New Story Added to Iteration"
  },
  // Issue just appeared in iteration.
  "DEL": {
    "weight": 4,
    "concern": "Story Deleted"
  },
  // Issue deleted/removed from iteration.
  // CRITICAL CONCERN: Issues weighted at 5 typically indicate some
  // flavor of impending disaster or serious problem on the flagged
  // issue. Scrum masters should be loaded for bear & hunting fixes
  "XXX": {
    "weight": 5,
    "concern": "Blocking Issue"
  },
  // ISSUE BLOCKED FROM FURTHER PROGRESS. Highest source of concern
  // BUNDLES
  "UNCHGD": {
    "weight": 2,
    "collection": "XXX,NPR,STK,HOL,ATT,HRS",
    "concern": "No changes made to story for current iteration"
  },
  "HRSINC": {
    "weight": 3,
    "collection": "EST,UER,SCR,STR,STK,NEW,ASS",
    "concern": "Hours increased from day prior!"
  },
  "UNCHG3": {
    "weight": 4,
    "collection": "XXX,NPR,STK,HOL,ATT,HRS",
    "concern": "No changes made to story for 3 days!"
  } // APPLICATION SOURCE ===================================================================== 🅔🅧🅔🅒🅤🅣🅘🅞🅝 🅢🅔🅠🅤🅔🅝🅒🅔 indicated by encircled digits (➀-➈)

};

parseFilesAndGenerateDragDrop = response => // ⓵ onChange of file input box, iterate namedFiles and generate Drag/Drop UL
new Promise(conclude => {
  const bufferFile = (fileObj, fileIndex, fileName) => new Promise(fulfill => {
    fileName = fileObj.name;
    if (namedFiles.indexOf(fileName) !== -1) return fulfill(this);
    namedFiles.push(fileName);

    const appendToBuffer = (JSONObj, fileName = null) => {
      let extantIndex = fileBuffer.find(b => b.fileName === fileName);
      if (extantIndex) fileBuffer[extantIndex] = JSONObj;else fileBuffer.push({
        fileName: fileName,
        fileData: JSONObj
      });
    };

    var reader = new FileReader(); // Instantiate a new file reader...
    //   ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  ⌢  

    reader.onloadend = progressEvent => {
      //    ... Add a listener to observe once it's finished loading.
      var opJSON = CSV.parse(reader.result); //    Parse the .CSV file input...

      appendToBuffer(opJSON, fileName); //    ... and add it to the global variable containing file data,

      return fulfill(this);
    }; // ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  ⌣  


    reader.readAsText(fileObj); // ... And read the file specified.
  });

  var bufferedFiles = Promise.all([...input.files].map((file, ind) => bufferFile(file, ind, file.name))).then(() => {
    namedFiles = [...new Set(namedFiles)];
    let opStr = '';

    for (var i = 0; i < 11; i++) {
      let dataSlot = !i ? "S" : i;

      if (i < namedFiles.length) {
        let fileName = namedFiles[i];
        opStr += `<li data-slot="${dataSlot}" class="drag-drop" draggable="true">${fileName}</li>`;
      } else {
        opStr += `<li data-slot="${dataSlot}"><label for="input" onMouseDown="setTargetSlot(${i})">No file specified (click to add!)</label></li>`;
      }
    }

    while (sortableList.childElementCount > 0) sortableList.childNodes[0].remove();

    sortableList.insertAdjacentHTML('beforeEnd', opStr);
    return conclude(response);
  });
});

const primeDragDropListBehaviors = (listClass = 'drag-drop') => {
  // ⓶ iterate UL and set up drag/drop on its children
  const bindDragDropListeners = obj => {
    try {
      const drag = (e, trg = e.target, parList = trg.parentNode) => {
        trg.className += " drag-sort-active";
        let swapobj = document.elementFromPoint(event.clientX, event.clientY) || trg;

        if (parList === swapobj.parentNode) {
          // Thereby constraining the drop to the same list
          swapobj = swapobj !== trg.nextSibling ? swapobj : swapobj.nextSibling;
          parList.insertBefore(trg, swapobj);
        }
      };

      const drop = (e, trg = e.target) => {
        e.preventDefault();
        trg.className = trg.className.replace(/(\s+)?drag-sort-active(\s+)?/g, "");
      };

      obj.addEventListener("drag", drag);
      obj.addEventListener("drop", drop);
      obj.addEventListener("dragend", drop);
      return true;
    } catch (err) {
      return false;
    }
  };

  let ddObjects = sortableList.getElementsByClassName(listClass);
  Array.prototype.map.call(ddObjects, list => {
    Array.prototype.map.call(list.children, item => {
      bindDragDropListeners(item);
    });
  });
  [...ddObjects].forEach(o => bindDragDropListeners(o));
  doneButton.disabled = false; // retain(
};

const runReport = obj => {
  // ⓷ user clicks Run It!; orchastrate remaining steps
  if (obj.disabled == true) return false;
  COMBD_DATA = [];
  ISSUE_KEYS = [];
  DEBUG_DATA = [];
  getDistinctKeysFromFiles();
};

const getDistinctKeysFromFiles = () => // ⓸ iterate files in buffer create promise chain to read each in sequence
new Promise(resolve => {
  pBar(3, 'PROCESSING', 'aquamarine', 1, 0, 0);

  for (files in fileBuffer) {
    let file = fileBuffer[files].fileData;
    let keySet = JSON.stringify(file, ['Issue key']) //    ... convert the resultant JSON to a string containing ONLY the 'Issue key' column...
    .match(/DIGTDEV-\d{4,6}/g); //    ... and then search the pattern DIGTDEV-####(##) out (any 4-6-digit number)

    ISSUE_KEYS = [...new Set([...ISSUE_KEYS, ...keySet])]; //    ... combine keySet and ISSUE_KEYS, remove duplicates, and convert back to an array.
  }

  concatinateDataFromSequencedFiles();
});

const concatinateDataFromSequencedFiles = () => {
  // ⓹ iterate finalized buffer, and concatinated generate output data
  temp_store = [];
  ISSUE_KEYS.forEach(r => {
    temp_store.push(r['Issue key']);
    COMBD_DATA[r] = new Array(fileBuffer.length).fill('');
    DEBUG_DATA[r] = new Array(fileBuffer.length).fill('');
  });

  for (files in fileBuffer) {
    let file = fileBuffer[files].fileData;
    file.forEach(f => {
      if (f && f['Issue key'] && f['Issue key'] != null && f['Issue key'] !== '') {
        COMBD_DATA[f['Issue key']][files] = f;
        DEBUG_DATA[f['Issue key']][files] = JSON.stringify(f);
      }
    });
  } // _(DEBUG_DATA)


  processParentChildRelationships();
};

const processParentChildRelationships = () => {
  var toc = {};
  quickIndex = Object.entries(COMBD_DATA).flatMap(d => {
    let nd = d[1].flat(),
        dat = null;

    for (var i = nd.length - 1; i >= 0; i--) {
      if (nd[i]['Issue id']) dat = nd[i];
    }

    if (!dat) return null;
    console.log(dat);
    let obj = {
      'issueKey': dat['Issue key'],
      'jiraIssueId': dat['Issue id'],
      'parent': dat['Parent id']
    };
    toc[obj.jiraIssueId] = obj.issueKey;
    obj['displayText'] = toc[obj.parent] ? toc[obj.parent] + ' / ' + obj.issueKey : obj.issueKey;
    obj['pathLinks'] = toc[obj.parent] ? '<a href="https://jira.sprintdd.com/browse/' + toc[obj.parent] + '" target="_blank" class="issue-parent-link">' + toc[obj.parent] + '</a>' + ' / ' + '<a href="https://jira.sprintdd.com/browse/' + obj.issueKey + '" target="_blank" class="issue-link">' + obj.issueKey + '</a>' : '<a href="https://jira.sprintdd.com/browse/' + obj.issueKey + '" target="_blank" class="issue-link">' + obj.issueKey + '</a>'; // obj['pathLinks'] = obj.displayText.replace(/(DIGTDEV-\d+)/g, );

    return obj;
  });

  _(quickIndex, toc);

  quickIndex.toc = toc;

  quickIndex.getLinked = issueID => {
    return quickIndex.find((f, i) => f.jiraIssueId == issueID).pathLinks || issueID;
  };

  _(quickIndex);

  analyzeDataAndFlagConcerns();
};

const analyzeDataAndFlagConcerns = () => {
  // ⓺ iterate concatinated output data, look for concern-suggestive trends and build our markup
  let MRKUP = [],
      // Collection of markup that'll we'll used to render both the HTML preview and the ultimate XLSX file output
  _I_ = '||--||'; // The string delimiter we're using to distinguish one chunk of data from another. Our "Split-target"

  Object.entries(COMBD_DATA).forEach((dataRecord, ind) => {
    // Iterate across each Issue (the "rows") that we've ingested data for, to extract the following data:
    let issueName = dataRecord[0],
        //   - The specific issue being examined (just the name; eg. 'DIGIT-12345'. Also serves as the array key)
    issueData = dataRecord[1],
        //   - The specific issue being examined (all the data for all the days for the files provided)
    ROWOP = '',
        //   - The iteratively-constructed markup for the "row" corresponding to the issue being examined
    flags = ''; //   - The empty collection of flags, to be joined & processed later in the loop

    datCt = Object.entries(issueData).length; //   - How many "columns" we're looking at

    reCtr = 1, //   - Counter for how many consecutive days the Remaining Estimate has languished, unchanged
    ctCtr = 1, //   - Iteration-length counter for how many consecutive days the Remaining Estimate goes unchanged
    oldRE = '', //   - Previous (from the previous-iterated-over day in the row) Remaining Hours Estimate
    oldPI = '', //   - Previous (from the previous-iterated-over day in the row) Parent ID
    oldII = '', //   - Previous (from the previous-iterated-over day in the row) Issue ID
    newRE = '', //   - Current (from the currently-iterated-over day in the row) Remaining Hours Estimate
    newPI = '', //   - Current (from the currently-iterated-over day in the row) Parent ID
    newII = '', //   - Current (from the currently-iterated-over day in the row) Issue ID
    newST = ''; //   - Current Status (in this case, we don't care what the previous one was, but need it at the issue scope)

    issueData.forEach((datRec, ix) => {
      // ...Iterate the issue's collected data (the "columns"), gathering...
      newRE = datRec['Remaining Estimate'] || ''; //    ...the latest value from the Remaining Estimated Hours (ideally diminished from Yesterday's)

      newPI = datRec['Parent id'] || ''; //    ...the latest ParentID (we check daily in case someone converts a story to a subtask)

      newII = quickIndex.getLinked(datRec['Issue id']).replace(/(.+?>)(DIGTDEV-)(.+?)(<\/a>)/g, '$1$2<b>$3</b>$4') || ''; //    ...the latest IssueID (we check daily in case someone converts a subtask to a story)

      _(newII);

      newST = datRec['Status'] || ''; //    ...and the latest Status, per Jira. We may alter this if it's insufficient/incorrect later.

      if (newRE !== oldRE) {
        // If the remaining hours have changed, we need to examine the delta to determine if this should be flagged
        flags = '';
        if (newRE > oldRE) flags += ',HRSINC'; //    ** FLAG Estimated Hours INcreased (Bad Estimate? Bad Story Inclusion? New Story Added? Scope Creep?)

        reCtr = 1; // It's changed for the good or the bad. Reset our "same" counter;

        ctCtr = 0; // It's changed at SOME POINT during this iteration. Remove this issue's ITR counter from consideration;
      } else {
        // Estimated Hours Havent Changed (ergo, no burndown)
        // console.log('|', newST, '|', newST == 'Completed', '|', newST.trim() == 'Completed', '|', newST == 'Done', '|', newST.trim() == 'Done')
        if (ix === reCtr) flags += ',UNCHGD';else {
          if (newST !== 'Completed') flags += ',UNCHG3';
        }
        reCtr++; // Increment our unchanged for 3 days counter

        if (!!ctCtr) ctCtr++; // If our iteration-duration unchanged counter is still in play (e.g. it's NEVER changed), increment
      }

      ROWOP = ROWOP + _I_ + toHours(newRE) + 'h'; // Tack the current day being iterated past's Est. hours remaining onto the end of the issue being iterated past

      oldRE = newRE; //   - Previous (from the previous-iterated-over day in the row) Remaining Hours Estimate

      oldPI = newPI; //   - Previous (from the previous-iterated-over day in the row) Parent ID

      oldII = oldII;
    });
    ROWOP += flags === '' ? '' : _I_ + [...new Set(flags.split(','))].join(); // Append joined flag string to end of row

    ROWOP = newST + _I_ + newII + ROWOP; // STATUS | JIRA ID | PARENT ID | ISSUE ID | DAY 1 | DAY 2 | ... | DAY n | flags |

    MRKUP.push(ROWOP.split(_I_)); // Convert it to an iterable collection and push it onto the bottom of the output markup stack
  });
  pBar(4, 'GENERATING OUTPUT... DONE!', 'LimeGreen', 0.1, 0.1, 0.1); // Show generating output progress meter

  let colHeaders = ['Current Status', 'Issue ID', 'Seed Day'] // Define always-present column headers (| Current Status | JIRA ID | Parent ID | Issue ID | Seed Day |)
  ,
      dateArr = []; // Array holding the labels for each column, each of which represent the file being examined

  if (dateField.checkValidity()) {
    // Since we can't date-stamp a column if the user didn't give us a date, see if they did. IF they did...
    if (colHeaders[4] === 'Seed Day') colHeaders[4] += "<br>" + dateField.value; // Append the Seed Date to the seed column header (if currently unset)

    let startDate = new Date(dateField.value).getTime(); // Get the epoch value of the StartDate

    let dayCt = 1; // Increment the number of days we're venturing forth from the start date. This is used to ignore weekends

    while (dateArr.length < 10 && dayCt < 50) {
      // Keep going until we have at least 10 days
      let incrementedDate = new Date(startDate + dayCt * 86400000); // Add 24 hours to the daying bering iterated across

      if (incrementedDate.getDay() > 0 && incrementedDate.getDay() < 6) // If the now-incremented date falls on a M-F...
        dateArr.push('Day ' + (dateArr.length + 1) + '<br />' + //    ... add both the day number... 
        incrementedDate.toLocaleDateString()); //    ... and the date that works out to to the stack.

      dayCt++; // Increment the day counter whether we added to stack or not (since we skip over weekends and holidays)
    }
  } else {
    for (i = 1; i <= namedFiles.length - 1; i++) dateArr.push(i);
  }

  colHeaders = [...colHeaders, ...dateArr];
  let tblMarkup = '<h1>' + iterationName.value + '</h1>' + '<table class="outputTable" cellspacing="0">',
      hdrMarkup = '<thead><tr><th>' + colHeaders.join('</th><th>'),
      rowMarkup = '<tbody>';
  '</th></thead></table>';
  MRKUP.forEach(o => rowMarkup += '<tr><td>' + o.join('</td><td>').replace(/\.00h|\.0h/g, 'h') + '</td></tr>');
  rowMarkup += '</tbody>';
  tblMarkup += hdrMarkup + rowMarkup + '</table>';

  while (previewPanel.childElementCount > 0) {
    previewPanel.childNodes[0].remove();
  }

  previewPanel.insertAdjacentHTML('beforeEnd', tblMarkup);
  return true;
};

(init = () => {
  // ⓿ Initiate application, chaining steps 1-3 above to file input's onChange
  input.addEventListener('change', () => {
    return pBar(1, "READING...✓", "teal", 0.1, 0, 0).then(() => pBar(2, 'PARSING...✓', 'DarkTurquoise', 0.1, 0.1, 0.1)) // .then(parseNamesOfSelectedFiles)
    .then(parseFilesAndGenerateDragDrop).then(primeDragDropListBehaviors);
  });
})();
const trg = document.querySelector('.picker-panel-presenter');
let ongoing = false,
    ongoingtimer = null,
    offset = trg.getBoundingClientRect().height - 2;
console.log(offset);

function syncSpinner() {
  offset = trg.getBoundingClientRect().height + 2;
  let control = trg.parentElement;
  control.style = "--value:" + trg.placeholder * offset * -1 + "px";
}

function incDec(dir, mechanical = true, dly = 750, scale = 1) {
  ongoing = true;
  dly = dly < 50 ? 50 : Math.log2(dly) * dly / 10.4;
  let adjVal = dir * scale + parseInt(trg.placeholder);
  if (adjVal < 0) adjVal = 0;
  if (adjVal > 1000) adjVal = 1000;
  trg.placeholder = adjVal;
  syncSpinner();
  mechanical = false;
  if (ongoing && !mechanical) ongoingtimer = window.setTimeout(() => incDec(dir, false, dly, scale), dly);
}

function released() {
  window.clearTimeout(ongoingtimer);
}
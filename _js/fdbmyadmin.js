import {global_helper_functions}                  from "./global";
import tabulatorTables                            from "tabulator-tables";
import {toDate, intlFormat, isValid, format, set} from "date-fns";
W.tabulatorTables = tabulatorTables;


class FDBMyadmin {
    constructor (...props) {
        this.props = props;
        this.renderNode = qs('.fdbma-tables');
        this.activeRecord = null;
        this.bindingsSet = false;
        this.activeDataSet = null;
        console.log('FDBMyAdmin Loaded!');
        Promise.resolve()
        .then(()=>this.fondutabase = top.fondutabase)
        .then(()=>this.fondutabase.constructMeta(true))
        .then(res=>this.meta = res)
        .then(()=>this.renderTableList());

        window.concludeImport = this.concludeImport.bind(this);
        
    }

    handleDialogButtons (e, trg=e.target) {
        console.log("handleDialogButtons called with params (", e, trg=e.target, ")");
        let self = W.fdbmyadmin;
        if(!trg) return new Error("I can'ts bind what I can'ts find!");
        if(trg.id === 'closeDialog') return self.destroyDialog(trg)
        if(trg.id === 'saveDialog') return self.saveTHENdestroyDialog(trg)
    }

    destroyDialog (trg) {
        console.log("destroyDialog called with params (", trg, ")");
        trg.closest('.editDialog').remove();
    }

    saveTHENdestroyDialog (trg) {
        console.log("saveTHENdestroyDialog called with params (", trg, ")");
        let editedObject = {}
        qsa('input[data-dirty]').forEach(change=>editedObject[change.name] = change.value);
        console.log('this.activeDataSet :', this.activeDataSet);
        editedObject = Object.assign(this.activeDataSet, editedObject);
        console.log('editedObject :', editedObject);
        this.fondutabase.overwrite(trg.dataset.table, editedObject);
        this.activeDataSet = null;
        this.destroyDialog(trg);
    }

    displayTableSchema(tableName) {
        if(!this.fondutabase.meta) this.fondutabase.constructMeta();
        let tableMeta = fondutabase.meta.find(tbl=>tbl.name===tableName);
        let tableSchema = tableMeta.columns;
        console.groupCollapsed('Details for table ' + tableName);
        console.log('NAME: ', tableName);
        console.log('RECORD COUNT:', tableMeta.count);
        console.log('SCHEMA:');
        console.table(tableSchema);
        console.groupEnd();

        
    }

    renderTableList () {
        console.log("renderTableList called!");
        // Outputs the list of tables with their current record counts and their action

        let renderTableContents = () => {
        }
        

        let renderTableMeta = (metaRecord) => {
            let {name, count, columns, data} = metaRecord;
            return Promise.resolve(
                this.renderNode.insertAdjacentHTML('beforeEnd', `<div id="tableOutput-${name}" class="fdbma-table-states">
                                                                    <input type="checkbox" name="${name}-toggler" id="${name}-toggler" class="table-toggler ${!count ? 'disabled' : ''}">
                                                                    <label for="${name}-toggler" class="table-toggler-control ${!count ? 'disabled' : ''}" data-rows="${count}">${name}</label>
                                                                    <span class="table-ctrl_pnl"><button class="table-control schema" data-table="${name}"></button></span>
                                                                    <span class="table-ctrl_pnl"><button class="table-control import" data-table="${name}"></button></span>
                                                                    <span class="table-ctrl_pnl ${!count ? 'disabled' : ''}"><button class="table-control export" data-table="${name}"></button></span>
                                                                    <span class="table-ctrl_pnl ${!count ? 'disabled' : ''}"><button class="table-control deport" data-table="${name}"></button></span>
                                                                </div>`)
            )
            .then(()=>{
                qsa('.fdbma-table-states').forEach(tblExpander=>{
                    tblExpander.addEventListener('change', renderTableContents);
                })
                qsa('.table-control').forEach(tcBtn=>{
                    if (!tcBtn.dataset.bindings) {
                        tcBtn.addEventListener('click', (e, trg=e.target)=>{
                            if(/schema/.test(trg.className)) return this.displayTableSchema(trg.dataset.table);
                            if(/import/.test(trg.className)) return this.showImport(trg.dataset.table);
                            if(/export/.test(trg.className)) return top.window.starport.initializeExporterForSingleTable(trg.dataset.table);
                            if(/deport/.test(trg.className)) return top.window.starport.performSingleTableDeportation(trg.dataset.table);
                        });
                    }
                    tcBtn.dataset.bindings = true;
                });
                return true;
            })
        }

        this.meta.forEach(table=>renderTableMeta(table));
    }
    
    renderTableList_old () {
        console.log("renderTableList_old called!");
        // Creates all the fields in the edit dialog
        let outputFields = (rowData) => {
            console.log('rowData :', rowData);
            let allFields = '';
            Object.entries(rowData).forEach(rowKVP => {
                let rowKVPKey = rowKVP[0];
                let rowKVPVal = rowKVP[1];
                allFields += `<div ${rowKVPKey === 'id' ? 'readonly' : ''} ><label for="${rowKVPKey}">${rowKVPKey}</label>
                <span><input id="${rowKVPKey}" name="${rowKVPKey}" value="${rowKVPVal}" class="inline-table-editor type="text" onInput="this.parentNode.dataset.dirty=true; this.dataset.dirty=true"></span></div>`;
            })
            return allFields;
        }

        // Creates the edit dialog window
        let outputEditDialogMarkup = (row) => {
            let rowData = row.getData();
            console.log('rowData :', rowData);
            this.activeDataSet = rowData;
            console.log('this.activeDataSet :', this.activeDataSet);
            let tableName = row.getTable().element.id.replace('display-table-','');
            return `<div class="editDialog">
                        <div class="editor-window">
                            <h4>
                                <b>U.N.S. Table - Editing Row ${rowData.id}</b>
                                <button id="closeDialog" data-table="${tableName}" data-row="${rowData.id}"></button>
                                <button id="saveDialog" data-table="${tableName}" data-row="${rowData.id}"></button>
                            </h4>
                            <div class="scrollable editor-fields" id="table-editor">
                                ${outputFields(rowData)}
                            </div>
                        </div>
                    </div>`;
        }

        // Converts the now-populated table into a live grid.
        let performTabulatorConversion = (tableName, attempts=0) => {
            if(attempts > 10) return console.error('Cannot find targeted table of values.');
            if (qs(`${tableName}`) == null) {
                attempts++;
                return setTimeout(() => performTabulatorConversion(tableName, attempts), 1000);
            }

            let buttonHandler = W.buttonHandler = this.handleDialogButtons;
            return new tabulatorTables(`${tableName}`, 
                                        {
                                            selectable : 1, 
                                            rowClick   : function(e, row){
                                                console.log('row :', row);
                                                            Promise.resolve()
                                                            .then(()=> {
                                                                W.R=row
                                                                row.getTable().element.closest('.fdbma').insertAdjacentHTML('beforeEnd', outputEditDialogMarkup(row));
                                                                return row;
                                                            })
                                                            .then(() => {
                                                                let bindToDialogButtons = (attempts=0) => {
                                                                    if(this.bindingsSet === true) return;
                                                                    console.log('bindToDialogButtons (attempts)', attempts);
                                                                    attempts++;
                                                                    if(attempts > 15) return console.error('Cannot set bindings on dialog buttons. Race condition.');
                                                                    let buttonsToBind = [...document.querySelectorAll('h4 > button')];
                                                                    console.log('buttonsToBind :', buttonsToBind, this, document, window, qsa('h4'));
                                        
                                                                    if(buttonsToBind.length === 0) return window.bindingTime = setTimeout(() => bindToDialogButtons(attempts), 1000);
                                        
                                                                    _('Made it', buttonsToBind);
                                                                    buttonsToBind.forEach(btn => {
                                                                        _(btn);
                                                                        btn.addEventListener('click', (e) => buttonHandler(e))
                                                                    })
                                                                    this.bindingsSet = true;
                                                                    return true;
                                                                }
                                                                bindToDialogButtons();
                                                            });
                                                            row.toggleSelect(); // Deselect row's state on row click (since the edit dialog is the next to resolve)
                                                         }
                                        }
            )
        }

        // Renders all the columns withing a given row within the table
        let renderData = (tableName, tableData) => {
            if(!tableData || tableData.length === 0) return '';
            let headerData = Object.keys(tableData[0]);
            let headerCells = headerData.map(lbl=>lbl).join('</th><th>');
    
            return `<table id="display-table-${tableName}" class="active-tables">
                            <thead>
                                <tr>
                                    <th>
                                        ${headerCells}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>${tableData.map(data=>'<td>' + Object.values(data).join('</td><td>') + '</td>').join('</tr><tr>')}</tr>
                            </tbody>
                        </table>`
        }

        // Renders all the rows contained within the table
        let renderTable = (tableName, rowCount, tableData) => {
            return Promise.resolve(
                this.renderNode.insertAdjacentHTML('beforeEnd', `<div class="fdbma-table-states">
                                                                    <input type="checkbox" name="${tableName}-toggler" id="${tableName}-toggler" class="table-toggler ${!rowCount ? 'disabled' : ''}">
                                                                    <label for="${tableName}-toggler" class="table-toggler-control ${!rowCount ? 'disabled' : ''}" data-rows="${rowCount}">${tableName}</label>
                                                                    <span class="table-ctrl_pnl"><button class="table-control import" data-table="${tableName}"></button></span>
                                                                    <span class="table-ctrl_pnl ${!rowCount ? 'disabled' : ''}"><button class="table-control export" data-table="${tableName}"></button></span>
                                                                    <span class="table-ctrl_pnl ${!rowCount ? 'disabled' : ''}"><button class="table-control deport" data-table="${tableName}"></button></span>
                                                                    <div id="${tableName}-display" class="table-viewer">${renderData(tableName, tableData)}</div>
                                                                </div>`)
            )
            .then(()=>{

                qsa('.table-control').forEach(tcBtn=>{
                    if (!tcBtn.dataset.bindings) {
                        tcBtn.addEventListener('click', (e, trg=e.target)=>{
                            if(/import/.test(trg.className)) return this.showImport(trg.dataset.table);
                            // if(/import/.test(trg.className)) return top.window.starport.initializeImporterForSingleTable(trg.dataset.table);
                            if(/export/.test(trg.className)) return top.window.starport.initializeExporterForSingleTable(trg.dataset.table);
                            if(/deport/.test(trg.className)) return top.window.starport.performSingleTableDeportation(trg.dataset.table);
                        });
                    }
                    tcBtn.dataset.bindings = true;
                });
                return true;
            })
            .then(() => performTabulatorConversion(`#display-table-${tableName}`))
            
        }

        

        this.tableSchema = [...Object.values([...this.fondutabase.schemaBuilder.schema_.tables_]).map(table=>table[0])];
        this.renderedDomNodes = this.tableSchema.map(table=>{
            return  this.fondutabase.select('SELECT * FROM ' + table)
                    .then(res=> renderTable(table, res.length, res))
        })
    }

    logMessage (textToLog) {
        console.log("logMessage called with params (", textToLog, ")");
        let starportLog = document.getElementById('importLog');
        if (textToLog === '::CLEAR::') {
            textToLog = 'StarPort console cleared.';
            starportLog.innerHTML = "";
        }
        starportLog.innerHTML += '<div class="stamps">' + new Date().toLocaleTimeString() + '</div><div class="logs">' + textToLog + '</div>';
        [...starportLog.children].pop().scrollIntoView()
    }

    parseImportIntoRecords (stringifiedRecord, sprintNum, slotNum) {
        console.log("parseImportIntoRecords called with params (", stringifiedRecord, ")");
        console.log('stringifiedRecord :', stringifiedRecord);
        let hdrData
        let mappings = {
            "Assignee"           : ["assigneeEmail","assigneeName"],
            "Component/s"        : ["component"],
            "Created"            : ["created"],
            "Description"        : ["description"],
            "Issue key"          : ["issueKey"],
            "Issue id"           : ["jiraIssueId","issueId"],
            "Parent id"          : ["parentJiraId"],
            "Reporter"           : ["reporter"],
            "Status"             : ["status"],
            "Summary"            : ["summary","title"],
            "Remaining Estimate" : ["timeestimate"],
            "Original Estimate"  : ["timeoriginalestimate"],
            "Issue Type"         : ["type"],
            "Updated"            : ["updated"]
        }

        function remapHeadersToFondue (importHdr, columnData) {
            console.log("remapHeadersToFondue called with params (", importHdr, columnData, ")");
            let mappedHdr = mappings[importHdr];
            if(/[AP]M$/i.test(columnData) && !isNaN(Date.parse(columnData))) columnData = Date.parse(columnData);
            else if(!/[A-Z]/i.test(columnData) && !isNaN(parseFloat(columnData))) columnData = parseFloat(columnData);
            if(!mappedHdr) return false;
            let retObj = {};
            mappedHdr.forEach(hdr=>Object.assign(retObj, Object.fromEntries([[hdr, columnData]])));
            return retObj;
        }

        function amendMissingImportData (recordToAmend) {
            let amendedRecord = Object.assign(recordToAmend, {
                "created"          : (new Date(recordToAmend.created) == "Invalid Date") ? new Date() : new Date(recordToAmend.created),
                "updated"          : (new Date(recordToAmend.updated) == "Invalid Date") ? new Date() : new Date(recordToAmend.updated),
                "retrevalReadable" : new Date().toLocaleString(),
                "retrevalStamp"    : new Date(),
                "retrievedFor"     : +sprintNum, 
                "retrievedForSlot" : +slotNum,
                "statusColor"      : 'white',
                "subtasks"         : '',
                "labels"           : '',
                "timespent"        : recordToAmend.timeoriginalestimate - recordToAmend.timeestimate,
                "project"          : recordToAmend.issueKey.replace(/^(.*?)-.*$/, '$1'),
                "priority"         : 0,
                "link"             : "https : //jirasw.t-mobile.com/browse/" + recordToAmend.issueKey,
                 "_OPTIONS"        : {}
            });
            console.log("amendMissingImportData called with params (", recordToAmend, "), returning with", amendedRecord);
            return amendedRecord
        }

        function objectifyCSV (csvObj) {
            console.log("objectifyCSV called with params (", csvObj, ")");
            let constructedObj = [];
            csvObj = csvObj.replace(/\\n/g, '<br>');
            csvObj = csvObj.split('\n');
            csvObj = csvObj.map((row, ind) => {
                                    if(!row || row === '' || typeof(row) !== 'string') return false;
                                    return row.replace(/"(.*?)"/g, (...m) => m[1].replace(/,/g, '&comma;') ).split(',');
                            })
                            .filter(v=>v);

            hdrData = csvObj.shift();
            
            csvObj.forEach((row, rInd) => {
                let jsondRow = {};
                row.forEach((col, cInd) => {
                    let hdrForCol = hdrData[cInd];
                    let newCols = remapHeadersToFondue(hdrForCol, col);
                    if (newCols) {
                        Object.assign(jsondRow, newCols);
                    }
                });
                constructedObj.push(amendMissingImportData(jsondRow));
            })
            return constructedObj;
        }

        return new Promise((resolve,reject)=>{
            let parsedRows = objectifyCSV(stringifiedRecord);
            console.groupCollapsed('Data parse successful!');
            console.table(parsedRows);
            console.dir(parsedRows);
            console.groupEnd()
            return resolve(parsedRows);
        });
    }

    concludeImport (sprintNum, slotNum) {
        console.log("concludeImport called!");
        this.logMessage('Attempting to conclude import...');
        return this.parseImportIntoRecords(this.pendingImport, sprintNum, slotNum)
            .then(parsedData => top.fondutabase.insert('issues', parsedData) )
            .then(parsedData => {
                top.lastImportAttempt = parsedData;
                console.log('Imported and parsed data file:', parsedData)
                return parsedData;
            })
            // .then(()=>document.location.reload())
    }
    
    triggerImport (trg) {
        console.log("triggerImport called with params (", trg, ")");
        this.logMessage('::CLEAR::');

        var fileInput = trg.previousElementSibling;
        var reader = new FileReader();
        reader.onload = () => new Promise((resolve,reject)=>{
            let fileContents = reader.result;
            this.logMessage('File uploaded. Ingesting... [DONE]');
            this.logMessage('Determining Schema...<br>' + fileContents.split(/\n/g)[0]);
            this.logMessage('[DONE]<br>Parsing...');
            this.logMessage('<div>' + fileContents.split(/\n/g).join('</div><div>').split(',').map(d=>`<span>${d}</span>`).join('') + '</div>');
            this.logMessage('[DONE]');
            return resolve(fileContents);
        })
        .then(fileContents=>{
            this.pendingImport = fileContents;
            let allSprints = this.meta.find(records=>records.name === 'sprints').data;
            let sprintList = `<select id="sprintImportPicker" name="sprintImportPicker" class="starportField"><option value="">Select sprint to associate import with!</option>${allSprints.map(sprint=>`<option value="${sprint.sprintId}" data-slots="${sprint.workableDaysInSprint}">${sprint.name}</option>`).join("\n")}</select>
                              <select id="slotImportPicker"   name="slotImportPicker"   class="disabled starportField"><option value="">Select day slot to associate import with!</option></select>
                              <input id="fieldsImportSaver"   type="button" value="✓" class="disabled starportField">`;
            
            this.logMessage('Checking for mapping compatability and data completeness... <b>[FAILURE]</b><br>There is necessary data missing before the import can be completed. Please complete the following fields:<br>' + sprintList);
        })
        .then(fileContents=>{
            let sprintPicker = qs("#sprintImportPicker");
            let slotPicker   = qs("#slotImportPicker");
            let fieldSaver   = qs("#fieldsImportSaver");
            sprintPicker.addEventListener('change', (e, trg=e.target)=>{ if(trg.selectedIndex !== 0){ slotPicker.innerHTML = '<option value="">Select day slot to associate import with!</option><option value="0">Day 0 (SEED)</option>' + trg.options[trg.selectedIndex].dataset.slots.split('|').sort().reverse().map((slot, seq)=>`<option value="${seq + 1}">Day ${seq + 1} (${slot})</option>`).join('\n'); slotPicker.classList.remove('disabled'); }else{ slotPicker.classList.add('disabled'); }});
            slotPicker.addEventListener('change', (e, trg=e.target)=>{ if(trg.selectedIndex !== 0 && !/disabled/.test(trg.className)) { fieldSaver.classList.remove('disabled'); }else{ fieldSaver.classList.add('disabled'); }});
            fieldSaver.addEventListener('click', (e, trg=e.target)=>{ if(!/disabled/.test(trg.className)) { this.concludeImport(sprintPicker.value, slotPicker.value); }});
        });
        
        reader.readAsBinaryString(fileInput.files[0]);
        

    }
    
    cancelImport () {
        console.log("cancelImport called!");
        console.log('cancelled');
        qs('#importFilePicker').classList.toggle('active');

    }

    showImport (targetTable) {
        console.log("showImport called with params (", targetTable, ")");
        document.getElementById('importLog').innerHTML = '';
        this.importingFor = targetTable;
        qs('#importFilePicker').classList.toggle('active');
        this.logMessage('Awaiting file selection...');
        let submit = qs('.performImport'),
            cancel = qs('.performImport');
        submit.addEventListener('click', this.performImport);
    }
    
    performImport (e, trg=e.target) {
        console.log("performImport called with params (", e, trg=e.target, ")");
        
    }
}

let fdbmyadmin = W.fdbmyadmin = new FDBMyadmin();
export default fdbmyadmin;

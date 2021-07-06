import {global_helper_functions}                  from "./global";
import tabulatorTables                            from "tabulator-tables";
import {toDate, intlFormat, isValid, format, set} from "date-fns";
W.tabulatorTables = tabulatorTables;
console.clear();
class FDBMyadmin {
    constructor(...props) {
        this.props = props;
        this.renderNode = qs('.fdbma-tables');
        this.activeRecord = null;
        this.bindingsSet = false;
        this.activeDataSet = null;
        console.log('FDBMyAdmin Loaded!');
        Promise.resolve()
        .then(()=>this.fondutabase = top.fondutabase)
        .then(()=>this.renderTableList())

        window.handleDialogButtons = this.handleDialogButtons.bind(this);
        
    }

    handleDialogButtons(e, trg=e.target){
        let self = W.fdbmyadmin;
        if(!trg) return new Error("I can'ts bind what I can'ts find!");
        if(trg.id === 'closeDialog') return self.destroyDialog(trg)
        if(trg.id === 'saveDialog') return self.saveTHENdestroyDialog(trg)
    }

    destroyDialog(trg) {
        trg.closest('.editDialog').remove();
    }

    saveTHENdestroyDialog(trg) {
        let editedObject = {}
        qsa('input[data-dirty]').forEach(change=>editedObject[change.name] = change.value);
        console.log('this.activeDataSet :', this.activeDataSet);
        editedObject = Object.assign(this.activeDataSet, editedObject);
        console.log('editedObject :', editedObject);
        this.fondutabase.overwrite(trg.dataset.table, editedObject);
        this.activeDataSet = null;
        this.destroyDialog(trg);
    }

    
    renderTableList() {

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
            if(qs(`${tableName}`) == null) {
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
                                                                    <input type="checkbox" name="${tableName}-toggler" id="${tableName}-toggler" class="table-toggler">
                                                                    <label for="${tableName}-toggler" class="table-toggler-control" data-rows="${rowCount}">${tableName}</label>
                                                                    <span class="table-ctrl_pnl"><button class="table-control import"></button></span>
                                                                    <span class="table-ctrl_pnl"><button class="table-control export"></button></span>
                                                                    <span class="table-ctrl_pnl"><button class="table-control deport"></button></span>
                                                                    <div id="${tableName}-display" class="table-viewer">${renderData(tableName, tableData)}</div>
                                                                </div>`)
            )
            .then(() => performTabulatorConversion(`#display-table-${tableName}`))
            
        }

        

        this.tableSchema = [...Object.values([...this.fondutabase.schemaBuilder.schema_.tables_]).map(table=>table[0])];
        this.renderedDomNodes = this.tableSchema.map(table=>{
            return  this.fondutabase.select('SELECT * FROM ' + table)
                    .then(res=> (res.length === 0) ? false : renderTable(table, res.length, res))
        })
    }
    

    
}

let fdbmyadmin = W.fdbmyadmin = new FDBMyadmin();
export default fdbmyadmin;

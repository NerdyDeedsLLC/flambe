import tabulatorTables from "tabulator-tables";
import {format} from 'date-fns';

let fondue = window.top.fondue;
const fondutabase = window.top.fondutabase;

fondue.table = null;
    
function toHours(val = null, appendLabel=true) {                                                                   		// Converts the asinine JIRA output we're currently getting (seconds, across the board) to hours
    if(val == null) return 0;
    return parseFloat((val / 3600).toPrecision(3)) + ((appendLabel) ? 'h' : '');                                       		//  ... still be coerced back into a number type by the interpreter)
}

function totalToHours(cell, params){
    let cellement              = cell.getElement();
    cellement.dataset.type     = params.type;
    cellement.dataset.value    = cell.getValue();
    cellement.dataset.totalCol = true;
    cellement.dataset.slot     = params.slot;
    return toHours(cell.getValue());
}

function hourColumnFormatter(cell, formatterParams){
    let cellement = cell.getElement();
    cellement.classList.add('hour-display');
    
    return toHours(cell.getValue());
}


function totalFormatter(cell, recievedData, onRendered){
    onRendered(
        ()=>new Promise((resolve, reject) => {
            let cellement = cell.getElement();
            // console.log(cellement, cellement.parentNode)
            resolve(cellement.parentNode)
        })
    .then(pNode=>{
        if(pNode == null) return null;
        let relatedTotalColumn = pNode.querySelector('[data-total-col][data-type="del"][data-slot="' + totalIndex + '"]');
        // console.log('hit', relatedTotalColumn);
            return relatedTotalColumn;
    })
        .then(relatedTotalColumn=>(relatedTotalColumn != null) ? (console.log(relatedTotalColumn.innerText) || relatedTotalColumn.innerText) : null)
    );
        
    let totDelta;
    let cellement = window.totCell = cell.getElement(),
        totalIndex = cellement.getAttribute('tabulator-field').replace(/\D/g, '');
    if(totalIndex === 0 || totalIndex > fondue.maxSlot) return null;
    let totIdeal = document.querySelector('[data-total-col][data-type="ide"][data-slot="' + totalIndex + '"]');
        totIdeal ='';
    let totRemaining = cell.getValue();
    cellement.style=`--upper:${0}; --lower:${totRemaining};`;
    cellement.classList.add('hour-display');
    cellement.classList.add('bottom-totals');
    cellement.dataset.slot        = totalIndex;
    cellement.dataset.remaining   = totRemaining;
    cellement.dataset.delta       = totDelta;
    cellement.dataset.ideal       = totIdeal;
    cellement.dataset.hoursBurned = 1
    return dayFormatter(cell, {slot : totalIndex, remaining : totRemaining, delta : totDelta, ideal : totIdeal});
}


function dayFormatter( cell, formatterParams) {
    let cellement   = cell.getElement(),
        cellData    = cell.getData(),
        slot        = formatterParams.slot,
        remaining   = formatterParams.remaining || cellData['remaining-'+slot],
        original    = formatterParams.original || cellData['original-'+slot],
        delta       = formatterParams.delta || cellData['delta-'+slot],
        ideal       = formatterParams.ideal || cellData['ideal-'+slot];
    
    
    cellement.classList.add('hour-display');
    cellement.classList.add('day-display');
    cellement.dataset.slot = +slot;
    cellement.dataset.remaining = +remaining;
    cellement.dataset.original = +original;
    cellement.dataset.delta = +delta;
    cellement.dataset.ideal = +ideal;
    cellement.style = `${((delta === 0) ? "" : '--upper:"' + ((delta > 0) ? '+' + toHours(delta) : toHours(delta)) + '"')}; --lower:"${toHours(remaining)}";`;
    if(slot > fondue.maxSlot) {
        cellement.dataset.forthcoming = true;
        return '';
    }
    
    if(cellData['zeroed']){
        cellement.dataset.zeroed = cellData['zeroed']
        return '';
    }
    if(delta < 0) cellement.dataset.decreased = true;
    if(delta > 0) cellement.dataset.increased = true;
    if(delta === 0) cellement.dataset.unchanged = true;
    if(remaining < ideal) cellement.dataset.belowMedian = true;
    if(remaining > ideal) cellement.dataset.aboveMedian = true;
    if(remaining == ideal) cellement.dataset.atMedian = true;
    
    return ''
}

function dayHeaderFormatter(header, params){
    let dateOP = "";
    let headelement = header.getElement();
    headelement.classList.add('day-col-header');
    dateOP = format(new Date(fondue.slotDates[params.slot]), 'MMM dd');
    return header.getValue() + "<br>" + dateOP
}

function generateHourSlots(totColCt = fondue.SprintSlotCount){
    let dynamicallyCreatedColumns = [], dispColOutput = [], hidColOutput = [];
    let remOP=[], delOP=[], ideOP=[], dayOP=[];
    for(var j=0; j<+fondue.SprintSlotCount; j++){
        remOP.push({title: 'REMAIN' + j, field:'remaining-' + j, bottomCalc:"sum", bottomCalcFormatter:totalToHours, bottomCalcFormatterParams:{slot:j, type:'rem'}, hozAlign:'right', formatter:hourColumnFormatter, formatterParams:{slot:j}, class:"day-col-header", visible:false, resizable:false});
        delOP.push({title: 'DELTA' + j, field:'delta-' + j, bottomCalc:"sum", bottomCalcFormatter:totalToHours, bottomCalcFormatterParams:{slot:j, type:'del'}, hozAlign:'right', formatter:hourColumnFormatter, formatterParams:{slot:j}, class:"day-col-header", visible:false, resizable:false});
        ideOP.push({title: 'IDEAL' + j, field:'ideal-' + j, bottomCalc:"sum", bottomCalcFormatter:totalToHours, bottomCalcFormatterParams:{slot:j, type:'ide'}, hozAlign:'right', formatter:hourColumnFormatter, formatterParams:{slot:j}, class:"day-col-header", visible:false, resizable:false});
        dayOP.push({title: 'DAY ' + j, titleFormatter:dayHeaderFormatter, titleFormatterParams:{slot:j}, field:'remaining-' + j, bottomCalc:"sum", bottomCalcFormatter:totalFormatter, bottomCalcFormatterParams:{slot:j, key:''}, hozAlign:'right', formatter:dayFormatter, formatterParams:{slot:j}, visible:true, resizable:false});
    }
    return [...remOP,...delOP,...ideOP, ...dayOP];
}

function titleText(value, forcePlainText=value) {
    return `<p title="${forcePlainText}">${value}</p>`; 
}

function hoverReader(cell, formatterParams) {
    var value = (typeof(cell) !== 'string') ? cell.getValue() : cell;
    return titleText(value);
}

function findSiblingCell(cell, field){
    return cell.getRow().getCell(field) || null;
}

function findSiblingCellValue(cell, field){
    let sibCell = findSiblingCell(cell, field);
    return (sibCell != null) ? sibCell.getValue() : null;
}
        
function instantiateGrid () {
    let sprintObj, dataSource, dataSourceClone, workDays, 
        dataFeed = [],
        sprintId = document.location.href.replace(/^.*?\?sprintID=(\d+?)(?:\&.*)?$/i, '$1');

    return fondutabase.select('SELECT * FROM sprints WHERE sprintId=' + sprintId)
    // .then(results=>console.log(results, JSON.stringify(results)) || results)
    .then(sprintObj=>sprintObj[0])
    .then(sprintObj=>fondue.WorkableDaysInSprint = sprintObj.workableDaysInSprint)
    .then(()=>fondutabase.select('SELECT * FROM issues WHERE retrievedFor=' + sprintId + ' ORDER BY retrievedForSlot, issueKey GROUP BY retrievedForSlot'))
    .then(dataFeed=>{
        fondue.slotDates = fondue.WorkableDaysInSprint.split('|');
        fondue.SprintSlotCount = fondue.slotDates.length;
        let dataOP = {}, masterDataSet;
        dataFeed.forEach(dataPull=>{
            dataPull.forEach((issue, issueCount)=>{
                // delete(issue.description);
                if(!dataOP[issue.issueId]) dataOP[issue.issueId] = {}
                
                let activeStoryRecord = dataOP[issue.issueId],
                    currentIssuesSlot = issue.retrievedForSlot || 0;
                    
                if(currentIssuesSlot !== 0) fondue.maxSlot = currentIssuesSlot;
                
                let reducedForGrid = issue;
                if(typeof(activeStoryRecord['delta-0']) === 'undefined'){
                    for(var i=0; i<fondue.SprintSlotCount; i++){
                        activeStoryRecord['remaining-' + i] = 0;
                        activeStoryRecord['original-'  + i] = 0;
                        activeStoryRecord['delta-'  + i] = 0;
                        activeStoryRecord['ideal-'  + i] = 0;
                    }
                }
                
                
                
                activeStoryRecord = Object.assign(activeStoryRecord, reducedForGrid);
                activeStoryRecord['remaining-' + currentIssuesSlot] = parseInt(issue.timeestimate) || 0;
                activeStoryRecord['ideal-'     + currentIssuesSlot] = parseInt(+activeStoryRecord['remaining-0'] - ((+activeStoryRecord['remaining-0'] / +fondue.SprintSlotCount) * (currentIssuesSlot)));
                activeStoryRecord['original-'  + currentIssuesSlot] = parseInt(issue.timeoriginalestimate);
                if(isNaN(activeStoryRecord['original-'  + currentIssuesSlot])) activeStoryRecord['original-'  + currentIssuesSlot] = 0;
                if(currentIssuesSlot > 0) 
                    activeStoryRecord['delta-' + currentIssuesSlot] = activeStoryRecord['remaining-' + currentIssuesSlot] - activeStoryRecord['remaining-' + (currentIssuesSlot - 1)] || 0
                
                if(+issue.timeestimate <= 0 && activeStoryRecord['delta-' + currentIssuesSlot] == 0){
                    issue.timeestimate = 0;
                    activeStoryRecord.zeroed = activeStoryRecord.zeroed ? activeStoryRecord.zeroed + 1 : 1;
                }
                dataOP[issue['issueId']] = activeStoryRecord;
            });
            window.ds = masterDataSet = dataOP;
        });
            
        // dataFeed=dataFeed.map(s=>{delete(s.description);  return s})
        //define table
        fondue.table = new tabulatorTables("#example-table", {
            data:Object.values(masterDataSet),
            selectable:false,
            initialSort:[
                {column:"issueKey", dir:"asc"}, //sort by this first
            ],
            columns:[
                
                {title:"Status", field:"status", width:120, frozen:true, formatter:function(cell, formatterParams){
                    let value                 = cell.getValue();
                    let $cell                 = cell.getElement();  
                    $cell.dataset.status      = value;
                    $cell.dataset.statusColor = findSiblingCellValue(cell, 'statusColor');
                    return titleText(value);
                }}, //frozen column
                
                {title:"Key", field:"issueKey", width:140, frozen:true, formatter:function(cell, formatterParams) {
                    window.cell = cell;
                return `<a href="${findSiblingCellValue(cell, 'link')}" target="_blank" title="${cell.getValue()}">${cell.getValue()}</a>`;
                }}, //frozen column
                
                {title:"👤", field:"assigneeName", hozAlign:'center', width:52, formatter:function(cell, formatterParams){
                    let value = cell.getValue();
                    return "👤";
                }},
                
                {title:"Assignee", field:"assigneeName", width:150, formatter:function(cell, formatterParams){
                    let value = cell.getValue();
                    if(value !== "Unassigned"){
                        return titleText(`<a href="mailto${findSiblingCellValue(cell, 'assigneeEmail')}">📧</a> ${value}`, value);
                    }else{
                        return "<span style='color:red; font-weight:bold;'>" + value + "</span>";
                    }
                }},
                
                {title:"Summary", field:"summary", formatter:hoverReader},
                
                ...[...generateHourSlots()],
                
                {title:"***STATUS COLOR***", field:"statusColor", visible:false}, //frozen column
                {title:"***EMAIL***", field:"assigneeEmail", visible:false}, //hidden column (to get email address data)
                {title:"***JIRALLINK***", field:"link", visible:false}, //hidden column (to get email address data)
                
            ],
        });
        return;
    })
    
    .then(()=>{
        let gpBy = document.querySelector('#grouping'), prvSt;
        gpBy.addEventListener('input', ()=>{
            if(gpBy.checked) {
                prvSt = table.getSorters();
                prvSt = prvSt ? prvSt[0].field : 'issueKey';
                table.setSort("assigneeName", "asc");
                table.setGroupBy('assigneeName');
            } else { 
                table.setGroupBy();
                table.setSort(prvSt, "asc");
            }
        });
        return;
    })
    // .then(()=>console.log('fondue.table :', fondue.table)||fondue.table));
    }
export default setTimeout(instantiateGrid, 1000);

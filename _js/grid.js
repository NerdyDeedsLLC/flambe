import tabulatorTables from "tabulator-tables";
import {format, toDate} from 'date-fns';

const fondue = top.window.fondue
const fondutabase = window.top.fondutabase;

fondue.table = null;
const gridMode = true;

console.clear();



function overrideLinkContextMenu(allLinks='a'){
    function addListenerByQS(qs, bindingAction, bindingEvent='click') {
        let obj;
        if(!qs) return false;
        if(typeof(qs) !== 'string'){
            obj = qs;
        }else{
           if(!/^[.#]/.test(qs)){
                 obj = document.querySelector('#' + qs) || document.querySelector('.' + qs) || document.querySelector(qs);
           }else obj = document.querySelector(qs);
        }
        if(!obj) return false;
        obj.addEventListener(bindingEvent, bindingAction);
        return true;
    }

    function copy(contentToCopy, menuObject, isHTML=false) {
        let inp=document.createElement('div'),
            selection = window.getSelection(),
            range = document.createRange();

        inp.id="clipboardContent";
        if(!isHTML) inp.innerText = contentToCopy;
        else inp.innerHTML = contentToCopy;
        document.body.insertAdjacentElement('beforeEnd', inp);
        range.selectNodeContents(inp);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("Copy");
        setTimeout(()=>{inp.remove(); menuObject.remove();}, 1);    
    }
    
    function forceOpen(url){
        console.log(url)
        setTimeout(
            function () {
                window.open(url, 'spawnedWindow' + Date.now(), 'toolbar=1, scrollbars=1, location=1, statusbar=1, menubar=1, resizable=1, width=1280, height=1024');
            }
        , 1);
    }    
    allLinks = [...document.querySelectorAll(allLinks)];
    
    allLinks.forEach(noContext=>noContext.addEventListener('contextmenu', (e, trg=e.target) => {
        let extantMenus = document.querySelectorAll('.ctxmenu');
        if(extantMenus) [...extantMenus].forEach(menu=>menu.remove());
        e.preventDefault();
        let menu = document.createElement("div"),
            xPos = Math.max(e.pageX - 480, 50),
            yPos = Math.max(e.pageY - 295, 20);
        menu.className = "ctxmenu"
        menu.style = `top:${yPos}px;left:${xPos}px`
        menu.onmouseenter = () => {menu.classList.add('dirty'); clearTimeout(window.menuCloseTimer); }
        menu.onmouseleave = (e, trg=e.target) => window.menuCloseTimer = setTimeout(()=>trg.remove(), 1000);
        menu.innerHTML = `<ul>
                            <li class="heading">Open issue in...</li>
                            <li data-url="${trg.href}" class="spawnTab"><b>A new tab</b> (Open issue in a new tab of the current browser window)</li>
                            <li data-url="${trg.href}" class="spawnWindow"><b>A new window</b> (Open new browser window containing only this issue)</li>
                            <li class="heading">Copy...</li>
                            <li data-text="${trg.innerText}" class="copyText"><b>Key text only</b> ${trg.innerText}</li>
                            <li data-url="${trg.href}" class="copyUrl"><b>Link URL only</b> ${trg.href}</li>
                            <li data-text="${trg.innerText}" data-title="${trg.dataset.title}" class="copyDetails"><b>Key with title</b> ${trg.innerText}: ${trg.dataset.title}</li>
                            <li data-url="${trg.href}" data-text="${trg.innerText}" class="copyHotText"><b>Hot hyperlink</b> <a href="${trg.href}'">${trg.innerText}</a></li>
                            <li data-url="${trg.href}" data-text="${trg.innerText}" class="copyHotUrl"><b>Hyperlinked URL</b> <a href="${trg.href}'">${trg.href}</a></li>
                            <li data-url="${trg.href}" data-text="${trg.innerText}" data-title="${trg.dataset.title}" class="copyHotDetails"><b>Hyperlinked Detail</b> <a href="${trg.href}'"><strong>${trg.innerText}:</strong> ${trg.dataset.title}</a></li>
                         </ul>`
        document.body.insertAdjacentElement('beforeEnd', menu)
        addListenerByQS('spawnTab',    (e, trg=e.target)=>window.open(trg.dataset.url));
        addListenerByQS('spawnWindow', (e, trg=e.target)=>forceOpen(trg.dataset.url));
        addListenerByQS('copyText',    (e, trg=e.target)=>copy(trg.dataset.text, menu));
        addListenerByQS('copyUrl',     (e, trg=e.target)=>copy(trg.dataset.url, menu));
        addListenerByQS('copyDetails',    (e, trg=e.target)=>copy(`${trg.dataset.text}: ${trg.dataset.title}`, menu));
        addListenerByQS('copyHotText',    (e, trg=e.target)=>copy(`<a href="${trg.dataset.url}">${trg.dataset.text}</a>`, menu, 1));
        addListenerByQS('copyHotUrl',    (e, trg=e.target)=>copy(`<a href="${trg.dataset.url}">${trg.dataset.url}</a>`, menu, 1));
        addListenerByQS('copyHotDetails',    (e, trg=e.target)=>copy(`<a href="${trg.dataset.url}"><b>${trg.dataset.text}:</b> ${trg.dataset.title}</a>`, menu, 1));
    }));
}
    
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
        .then(relatedTotalColumn=>(relatedTotalColumn != null) ? relatedTotalColumn.innerText : null)
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

window.logged = 0;
function dayFormatter( cell, formatterParams) {
    let cellement   = cell.getElement(),
        cellData    = cell.getData(),
        slot        = formatterParams.slot,
        remaining   = formatterParams.remaining || cellData['remaining-'+slot],
        original    = formatterParams.original || cellData['original-'+slot],
        delta       = formatterParams.delta || cellData['delta-'+slot],
        ideal       = formatterParams.ideal || cellData['ideal-'+slot];
    
    let assignee = null;
    if(cell && cell.getRow && cell.getRow().getCells && cell.getRow().getCells() && cell.getRow().getCells()[3] && cell.getRow().getCells()[3].getValue) assignee = cell.getRow().getCells()[3].getValue();

    if(assignee != null){
        if(delta !== 0){
            cellement.dataset["burned" + slot] = assignee;
        }else{
            cellement.dataset["unburned" + slot] = assignee;
        }
    }
        
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
    console.log('dayHeaderFormatter(header, params) :', header, params);
    let dateOP = "";
    let headelement = header.getElement();
    headelement.classList.add('day-col-header');
    dateOP = format(new Date(fondue.slotDates[params.slot] + ' '), 'MMM dd');
    console.log('fondue.slotDates[params.slot] :\n     -', '"' + fondue.slotDates[params.slot] + ' "', new Date(fondue.slotDates[params.slot] + ' '), '\n     -', '"' + fondue.slotDates[params.slot] + '"', new Date(fondue.slotDates[params.slot]));
    if(!Array.isArray(top.window.slotDates)) top.window.slotDates = [];
    top.window.slotDates.push(fondue.slotDates[params.slot])
    return params.slot === 0 ? '<b>SEED</b>' : header.getValue() + "<br>" + dateOP
}

function generateHourSlots(totColCt = fondue.SprintSlotCount){
console.log('totColCt :', totColCt);
    let dynamicallyCreatedColumns = [], dispColOutput = [], hidColOutput = [];
    let remOP=[], delOP=[], ideOP=[], dayOP=[];
    for(var j=0; j<totColCt; j++){
        console.log('j :', j);
        remOP.push({title: 'REMAIN' + j, field:'remaining-' + j, bottomCalc:"sum", bottomCalcFormatter:totalToHours, bottomCalcFormatterParams:{slot:j, type:'rem'}, hozAlign:'right', formatter:hourColumnFormatter, formatterParams:{slot:j}, visible:false, resizable:false, width:100});
        delOP.push({title: 'DELTA' + j, field:'delta-' + j, bottomCalc:"sum", bottomCalcFormatter:totalToHours, bottomCalcFormatterParams:{slot:j, type:'del'}, hozAlign:'right', formatter:hourColumnFormatter, formatterParams:{slot:j}, visible:false, resizable:false, width:100});
        ideOP.push({title: 'IDEAL' + j, field:'ideal-' + j, bottomCalc:"sum", bottomCalcFormatter:totalToHours, bottomCalcFormatterParams:{slot:j, type:'ide'}, hozAlign:'right', formatter:hourColumnFormatter, formatterParams:{slot:j}, visible:false, resizable:false, width:100});
        dayOP.push({title: 'DAY ' + j, titleFormatter:dayHeaderFormatter, titleFormatterParams:{slot:j}, field:'remaining-' + j, bottomCalc:"sum", bottomCalcFormatter:totalFormatter, bottomCalcFormatterParams:{slot:j, key:''}, hozAlign:'right', formatter:dayFormatter, formatterParams:{slot:j}, visible:true, resizable:false, width:100});
        console.log('remOP, delOP, ideOP, dayOP; :', remOP, delOP, ideOP, dayOP);
    }
    console.log('remOP, delOP, ideOP, dayOP; :', remOP, delOP, ideOP, dayOP);
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
        fondue.slotDates.unshift(fondue.slotDates[0]);
        // fondue.slotDates = fondue.slotDates.map(dt=> dt + ' 00:00:00 ');
        fondue.SprintSlotCount = fondue.slotDates.length;
        let dataOP = {}, masterDataSet;
        dataFeed.forEach((dataPull, pullCt)=>{
            console.groupCollapsed('[*][*][*][*] (Iteration #' + pullCt + ') [*] All issues within ', dataPull, '(Expand for details) [*][*][*][*]');
            dataPull.forEach((issue, issueCount)=>{
                console.log('[*] issueCount: ' + issueCount + ' [*] issue :', issue);
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
            console.log('[*][*][*][*][*][*][*][*]')
            console.groupEnd()
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

                // {title:"***TITLE PLACEHOLDER***", field:"title", visible:false}, //frozen column
                
                {title:"Key", field:"issueKey", width:140, frozen:true, formatter:function(cell, formatterParams) {
                    window.cell = cell;
                    return `<a href="${findSiblingCellValue(cell, 'link')}" data-url="${findSiblingCellValue(cell, 'link')}" data-title="${findSiblingCellValue(cell, 'summary')}" data-text="${cell.getValue()}" target="_blank" title="${cell.getValue()}">${cell.getValue()}</a>`;
                }}, //frozen column
                
                // {title:"Key", field:"issueKey", width:140, frozen:true, formatter:function(cell, formatterParams) {
                //     window.cell = cell;
                // return `<a href="${findSiblingCellValue(cell, 'link')}" target="_blank" title="${cell.getValue()}">${cell.getValue()}</a>`;
                // }}, //frozen column
                
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

        fondue.table.retrieveBurners = function(column) {
            let pyroList, 
                getPyroList = (slot) => {
                                            let pList = {
                                                unburned: [...new Set([...document.querySelectorAll('[data-unburned' + slot + ']')].map(cell=>cell.dataset['unburned' + slot]))].sort(),
                                                burned: [...new Set([...document.querySelectorAll('[data-burned' + slot + ']')].map(cell=>cell.dataset['burned' + slot]))].sort()
                                            };
                                            pList.burned   = pList.burned.map(name=>name.replace(/^(.).+ (\S*)$/, '$1 $2'))
                                            pList.unburned = pList.unburned.filter(pyro=>pList.burned.indexOf(pyro) === -1).map(name=>name.replace(/^(.).+ (\S*)$/, '$1 $2'));
                                            return pList;
                                        }
            if(column)
                pyroList = getPyroList(column);
            else {
                pyroList = new Array(fondue.maxSlot);
                pyroList = pyroList.map((s,i)=>getPyroList(i));
                pyroList.unshift({seedColumn:'non-applicable', burned:[], unburned:[]});
            }            
            return pyroList;
        }
        return;
    })
    
    .then(()=>{
        let gpBy = document.querySelector('#grouping'), prvSt;
        gpBy.addEventListener('input', ()=>{
            if(gpBy.checked) {
                prvSt = fondue.table.getSorters();
                prvSt = prvSt ? prvSt[0].field : 'issueKey';
                fondue.table.setSort("assigneeName", "asc");
                fondue.table.setGroupBy('assigneeName');
            } else { 
                fondue.table.setGroupBy();
                fondue.table.setSort(prvSt, "asc");
            }
        });
        return;
    })
    .then(()=>overrideLinkContextMenu('a'))
    .then(()=>console.log('fondue.table :', fondue.table)||fondue.table);
    }
export default setTimeout(instantiateGrid, 1000);

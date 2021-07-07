
export default class Starport{
    constructor(portDirection) {
        console.log(':::: STARPORT :::: portDirection :', portDirection);
        if(portDirection === 'import') this.initializeImporter();
        if(portDirection === 'export') this.initializeExporter();
        this.exportOutput = null;
        this.hail = this.hail.bind(this);
        
    }

    iterateExports(json){
        let csvCollOP = {}, allSets=[];
        Object.values(json).forEach (
                                        (coll, ind) => 
                                            allSets.push(
                                                Promise.resolve(
                                                    csvCollOP[Object.keys(json)[ind]] = this.convertJSONtoCSV(JSON.stringify(coll))
                                                )
                                            )
                                    )
        return Promise.all(allSets).then(()=>console.log(csvCollOP) || csvCollOP);
    }

    convertJSONtoCSV (exportDataInJSON) {
        const validJSON = (str) => {
            try { JSON.parse(str); return true; } 
            catch (e) { return false; }
        };

        if (exportDataInJSON != null && exportDataInJSON !== "" && validJSON(exportDataInJSON)) {
            const parsedInput = JSON.parse(exportDataInJSON);
            const header = '"' + Object.keys(parsedInput[0]).join('", "') + '"';
            const dataLines = parsedInput.map(line => {
                let lineData = Object.values(line);
                lineData = lineData.map(e=>{
                    if(!isNaN(parseInt(e)))   return e;
                    if(typeof e === 'object') return e == null ? '"NULL"' : '"' + JSON.stringify(e).replace(/,/g, '&x44;').replace(/"/g, '\\"') + '"';
                    if(typeof e === 'string') return '"' + this.eject(this.warp(e), true, true) + '"';
                    return e;
                }).join(', ');
                window.lastLine = lineData;
                return lineData;
            });
            dataLines.unshift(header)
            return dataLines.join("\r\n");
        } else {
            throw new Error("Must be valid, flattened JSON!");
        }
    };
        
        
        
        
    saveCSV() {
        const fileType = ["csv", "csv"];
        const blob = new Blob([csvBox.value], {
            type: `text/${fileType[0]};charset=utf-8`
        });
        if (fileName.value === "") fileName.value = "json";
        saveAs(blob, `${fileName.value}.${fileType[1]}`);
        fileName.value = "";
        };

    generateDownloadableFile(fileName, fileExtension, fileContent, autoTriggerDownload=true, linkText=fileName){
        if(!fileName || !fileContent) throw new Error('Name or Body were missing!');
        fileName = `${fileName}_${new Date().toISOString()}.${fileExtension}`;
        let fileBlob = new Blob([fileContent], {type: 'text/plain'});

        window.URL = window.URL || window.webkitURL;
        var dlBtn = document.createElement("a");
        dlBtn.setAttribute("href", window.URL.createObjectURL(fileBlob));
        dlBtn.setAttribute("download", fileName);
        if(autoTriggerDownload){
            document.body.insertAdjacentElement('beforeEnd', dlBtn);
            dlBtn.click();
            dlBtn.remove();
        }else{
            dlBtn.innerHTML = linkText;
            return dlBtn;
        }

    }

    initializeExporter() {
        this.mode = 'EXPORT';
        this.exportOutput = {};
        this.tableSchema = [...Object.values([...fondutabase.schemaBuilder.schema_.tables_]).map(table=>table[0])];
        var workers = [], nonEmptyTableData = {};

        this.tableSchema.forEach(table=>
                                    workers.push(
                                        fondutabase.select('SELECT * FROM ' + table)
                                        .then (res => res.length>=1 ? nonEmptyTableData[table] = res : void(0))
                                    )
                                );

        return Promise.all(workers)
                        .then(result=>console.log(result))
                        .then(this.exportOutput = nonEmptyTableData)
    }
    initializeImporterForSingleTable(tableName){}
    
    initializeExporterForSingleTable(tableName, exportType='csv') {
        return fondutabase.select('SELECT * FROM ' + tableName)
        .then(result => this.convertJSONtoCSV(JSON.stringify(result)))
        .then(csvOutput=>this.generateDownloadableFile('fondutabase-' + tableName, 'csv', csvOutput));
    }

    performSingleTableDeportation(tableName){if(confirm(`Really deport (delete the full contents of) fondutabase table ${tableName}?`)) fondutabase.delete('DELETE FROM ' + tableName);}
    
    exportToJSON(exportData){
        let exportPromise;
        if(exportData == null){
            exportPromise = (this.exportOutput == null) ? this.initializeExporter() : Promise.resolve();
            exportData = this.exportOutput;
        }else{
            exportPromise = Promise.resolve();
        }
        return exportPromise.then(()=>JSON.stringify(exportData))
        .then(stringifiedOP=>this.generateDownloadableFile('fondutabase', 'json', stringifiedOP));
    }

    exportToCSV(){
        let exportPromise;
        exportPromise = (this.exportOutput == null) ? this.initializeExporter() : Promise.resolve();
        return exportPromise.then(()=>this.exportOutput)
        .then(stringifiedOP=>this.iterateExports(stringifiedOP))
        .then(collectionOfCSVs=>{
            // var zip = new JSZip();
            console.log('collectionOfCSVs :', collectionOfCSVs);
            
        })
        .then(csvOutput=>this.generateDownloadableFile('fondutabase', 'csv', csvOutput));
    }

    initializeImporter(){
        this.mode = 'IMPORT';
    }

    hail(){
        _('Incoming transmission...')
        top.window.starport = this;
    }

    // Removes all pauses from the values contained within a line of JSON
    warp(string){
        return string.replaceAll('",\"', '~~~+~++~++~+~~~').replace(/,/gm, '&#44;').replaceAll('~~~+~++~++~+~~~', ', ');
    }

    eject(string, specials=true, punctuation=false){
        if(punctuation) string = string.replaceAll(/"/g, '&#22;');
        if(specials) string = string.replace(/\t/gm, '').replace(/\v/gm, '').replace(/\n/gm, '\\n').replace(/\r/gm, '\\r').replace(/\f/gm, '\\f');
        return string;
    }

    dock(){
        this.undock();
        document.head.insertAdjacentHTML('beforeEnd', `<link rel='stylesheet' type='text/css' href='./lib/css/starport.css'>`);
        document.body.insertAdjacentHTML('beforeEnd', `<div class="stars"></div><aside id="starport"><iframe src="fdbmyadmin.html" frameborder="0" width="100%" height="600" style="z-index: 100000;background-color: white;" ></iframe><button class="undock" onclick="starport.undock()"</aside>`)
    }

    undock(){
        let existingPort = qsa('#starport, .stars');
        if(existingPort.length > 0) existingPort.forEach(port=>port.remove());
    }
}

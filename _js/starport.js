    import { json2csv } from 'json-2-csv';

    export default class Starport{
        constructor(portDirection) {
            console.log(':::: STARPORT :::: portDirection :', portDirection);
            if(portDirection === 'import') this.initializeImporter();
            if(portDirection === 'export') this.initializeExporter();
            this.exportOutput = null;
        }

        generateDownloadableFile(fileName, fileExtension, fileContent, autoTriggerDownload=true, linkText=fileName){
            if(!fileName || !fileContent) throw new Error('Name or Body were missing!');
            fileName = `${fileName}_${new Date().toISOString}.${fileExtension}`;
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

        exportToJSON(){
            let exportPromise;
            exportPromise = (this.exportOutput == null) ? this.initializeExporter() : Promise.resolve();
            return exportPromise.then(()=>JSON.stringify(this.exportOutput))
            .then(stringifiedOP=>this.generateDownloadableFile('fondutabase', 'json', stringifiedOP));
        }

        exportToCSV(){
            let exportPromise;
            exportPromise = (this.exportOutput == null) ? this.initializeExporter() : Promise.resolve();
            return exportPromise.then(()=>JSON.stringify(this.exportOutput))
            .then(stringifiedOP=>json2csv(stringifiedOP))
            .then(csvOutput=>this.generateDownloadableFile('fondutabase', 'json', csvOutput));
        }

        initializeImporter(){
            this.mode = 'IMPORT';
        }
    }

import * as Pako from "pako";

export default class Starport{
        constructor(portDirection) {
            console.log(':::: STARPORT :::: portDirection :', portDirection);
            if(portDirection === 'import') this.initializeImporter();
            if(portDirection === 'export') this.initializeExporter();
            this.exportOutput = null;
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
                try { JSON.parse(str); } catch (e) { return false; }
                return true;
              };

            if (validJSON(exportDataInJSON) && exportDataInJSON != "") {
              const input = JSON.parse(exportDataInJSON);
              const header = Object.keys(input[0]);
              const dataLines = input.map(x => {
                                    return Object.values(x)
                                    .toString()
                                    .replace(/,/g, ", ");
                                });
              return header.toString().replace(/,/g, ", ") + "\r\n" + dataLines.join("\r\n");
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

        exportToJSON(){
            let exportPromise;
            exportPromise = (this.exportOutput == null) ? this.initializeExporter() : Promise.resolve();
            return exportPromise.then(()=>JSON.stringify(this.exportOutput))
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
    }

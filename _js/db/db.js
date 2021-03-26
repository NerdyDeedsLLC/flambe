import * as db from "../localforage.js"
import {__TableStorage} from "./c_TableStorage.js"

window.pogo = function (promiseToOutput){
    return Promise.resolve(promiseToOutput)
    .then(promisaryResults=>console.log('[POGO] - ', promiseToOutput, '=>', promisaryResults) || promisaryResults);
}

localforage.tables = null;
localforage.getItem('tables')
.then(tblList => localforage.tables = new __TableStorage({__parent:localforage, __tables: tblList})); 

localforage.bindTableInstance = (instanceName, tableObject) => {
    // let tableInstance;
    Promise.resolve(()=>localforage.createInstance({name:instanceName}))
    .then(tableInstance=> Object.assign(tableInstance, tableObject))
    .then(tableInstance=> localforage.tables[instanceName] = tableInstance());
}

// Promise.resolve(localforage)
// .then(lf=>window.db=new DBExtensions(lf));
// // .then(()=>localforage=void(0));

// class DBExtensions extends localforage.constructor {
//     constructor(props) {
//         super(props);
        

//         this.tables = new __TableStorage({__parent:this});
        
        
        
//         this.useTable = (...tableNames) =>{
//             let tablesCreated = [];
            
//             tableNames.forEach(tableName =>{
//                 this.tables.setItem(tableName);
//                 tablesCreated.push(this.tables.createInstance({ name: tableName }));
//             });
//             if(tablesCreated.length === 0) return Promise.resolve(null);
//             return Promise.all(tablesCreated);
//         }
    
//         this.schema = () => {
//             let localforageSchema = {};
//             return Promise.resolve(this.tables.list)
//                 // .then((lfTables) => console.log("lfTables", lfTables) || lfTables)
//                 .then(lfTables => {
//                     if(lfTables == null || (Array.isArray(lfTables) && lfTables.length <= 0)){
//                         throw new Error('No tables stored!')
//                     }
//                     return lfTables
//                 })
//                 .catch(err=>{
//                     console.log(err); 
//                     return Promise.resolve(null);
//                 });
//         }
        
//     }
//     _tables() {
//         return new Promise((resolve, reject)=>{
//             if(this.tables && this.tables.keys)
//                 resolve(this.tables.keys());
//             else resolve(null);
//         });
//     }
// }

// let lf 
// var preConstruct = () => new Promise((resolve)=>setTimeout(()=>resolve(window.lf = Object.assign({}, localforage)),150));
// preConstruct().then(()=> console.log(window.lf));

// new Promise((resolve, reject)=> {
//     let tooMany = 0;
//     window.dbaccessor = setInterval(()=>{
//         tooMany += 1;
//         if(tooMany > 30){
//             clearInterval(window.dbaccessor);
//             reject('Could not forage!');
//         }
//         if(localforage && localforage.INDEXEDDB != null){
//             clearInterval(window.dbaccessor);
//             resolve(window.lf=localforage );
//         }
//     },100);
// })
// .then(lf=>console.log(lf))
// .catch(err=>console.error(err))
// // console.clear();
// localforage.clear();



//         // .then(lfTables => {
//         //   
//         //     if(lfTables) {
//         //         return lfTables
//         //                 .then(tables=>localforageSchema.tables = tables)
//         //                 .then(t=>console.log(t)||t)
//         //                 .then(t=>t.map(tbl=>localforage.getItem(tbl).then(tableInstance=>console.log(tableInstance))));
//         //                 // .then(tables=>localforageSchema.keyMap = tables.map(tbl=>localforage[tbl].keys()))
//         //                 // .catch(err=>console.error("LocalForageSchema Error:", err));
//         //         }
//         //     return Promise.resolve(null);
//         // })
//     const db = new DB('flambe');
//     db.schema().then(t=>console.log("Currently-stored tables within localforage:", t));

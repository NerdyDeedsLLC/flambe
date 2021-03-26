import {__DBTable} from "./c_DBTable.js"

class __TableStorage extends Array {
    constructor(props) {
        super(props);
        console.log('__TableStorage :', __TableStorage, "props : ", props);
        // this.props  = props;
        this.parent = props.__parent;
        this.list   = props.__tables;
        this.pop();

        (() => {
            let tblsToCreate = [...this.list];
            tblsToCreate.map(tbl => new __DBTable({__root:this.parent, __name:tbl}));
            Object.assign(this, this.tblsToCreate);
        })();

        console.log('Table Storage Initialized!', this);

        // this._setList = (tblNames=[]) => {
        //     if(typeof(tblNames) === 'string') tblNames = tblNames.split(',');
        //     else if(!Array.isArray(tblNames)) throw new TypeError('Invalid Input to tables._setList()! Expected either string or array, got ' + typeof(tblNames) + ' (' + tblNames + ')!');
        //     tblNames.forEach(tblName=>{
        //         if(this.list.indexOf(tblName) === -1) this.list.push(tblName);
        //     });
        // }
        
        // // parent.getItem('tables')
        // // .then(tblList => {
        // //     const t=tblList
        // //     if (tblList == null || (typeof(tblList) != 'string' && !Array.isArray(tblList))) {
        // //         return [];
        // //     }
        // //     this.create(tblList);
        // //     return tblList;
        // // })
        

        // this.drop = (tblToDrop) => {
        //     parent.removeItem(tblToDrop).then(() => {
        //         this.list.splice(this.list.indexOf(tblToDrop), 1);
        //         parent.setItem('tables', this.list);
        //         console.log('Dropped Table ' + tblToDrop);
        //     }).catch(function(err) {
        //         // This code runs if there were any errors
        //         console.error("Unable to drop table " + tblToDrop + " (" + err + ")");
        //     });
        // }

        // this.create = ()=>{}

        // this.loadTable = (tblNames) => {
        // console.log('tblNames :', tblNames);
        //                                if(typeof(tblNames) === 'string') tblNames = tblNames.split(',');
        //                                else if(!Array.isArray(tblNames)) 
        //                                     throw new TypeError('Invalid Input to tables.create()! Expected either string or array, got ' + typeof(tblNames) + ' (' + tblNames + ')!');
        //                                return Promise.all( tblNames.map( tblName=> {
        //                                         this[tblName] =  parent.createInstance({name:tblName});
        //                                         this[tblName].name = tblName;
        //                                         this._setList(tblName);
        //                                         return  parent.getItem('tables')
        //                                                 .then(tblList => { 
        //                                                     if(tblList.indexOf(tblName) === -1){ 
        //                                                         tblList.push(tblName); 
        //                                                         parent.setItem('tables', tblList);
        //                                                     } 
        //                                                     return tblList; 
        //                                                 })
        //                                     })
        //                                )
        //                            }
        // Object.defineProperties(this, {list:this.list, loadTable:this.loadTable, drop:this.drop});
    }
} 

export {__TableStorage}
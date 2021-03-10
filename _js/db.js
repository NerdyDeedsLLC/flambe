import localforage from "./localforage";
/*
// document.getElementById("app").innerHTML = `
//   Open your console to see the results of things in motion!
// `;

// console.clear();
// localforage.clear();


class DB extends localforage{
    constructor(props) {
        super(props);
        
        this.props = props;
        this.name = name;
        this.tables = (this.tables == null) ? this.createInstance({ name: "localforage_tables" }) : this.tables;
        const t1Key  = "T1_Key";
        const t2Key  = "T2_Key";
    }

    useTable(...tableNames){
        let tablesCreated = [];
        
        tableNames.forEach(tableName =>{
            this.tables.setItem(tableName);
            tablesCreated.push(this.tables.createInstance({ name: tableName }));
        });
        if(tablesCreated.length === 0) return Promise.resolve(null);
        return Promise.all(tablesCreated);
    }

    tables(){
        return new Promise((resolve, reject)=>{
            if(this.tables && this.tables.keys)
                resolve(this.tables.keys());
            else resolve(null);
        });
    }

    schema(){
        let localforageSchema = {};
        return localforage.tables()
            // .then((lfTables) => console.log("lfTables", lfTables) || lfTables)
            .then(lfTables => {
                if(lfTables == null){
                    throw new Error('No tables stored!')
                }
                return lfTables
            })
            .catch(err=>{
                console.error(err); 
                return Promise.resolve(null);
            });
    }
}
        // .then(lfTables => {
        //   
        //     if(lfTables) {
        //         return lfTables
        //                 .then(tables=>localforageSchema.tables = tables)
        //                 .then(t=>console.log(t)||t)
        //                 .then(t=>t.map(tbl=>localforage.getItem(tbl).then(tableInstance=>console.log(tableInstance))));
        //                 // .then(tables=>localforageSchema.keyMap = tables.map(tbl=>localforage[tbl].keys()))
        //                 // .catch(err=>console.error("LocalForageSchema Error:", err));
        //         }
        //     return Promise.resolve(null);
        // })
    const db = new DB('flambe');
    db.schema().then(t=>console.log("Currently-stored tables within localforage:", t));

    */
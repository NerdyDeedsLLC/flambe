class __DBTable extends Array {
    constructor(props) {
        super(props);
        console.log('__DBTable :', __DBTable, "\n   - Props : ", props, this);

        Object.assign(this, props);

        this.__name = props.__name;
        this.parent = props.__parent;
        this.root = props.__root;
        this.isIterable = object => (object != null && typeof object[Symbol.iterator] === 'function');
        
        //console.log('this.root.createInstance({name:this.name}) :', this.root.createInstance({name:this.name}));
        this.root.bindTableInstance(this.__name, this);
        
        // Object.assign(this, );

        return
        // WRITING a record to the table
        this.write = this.gi = (key, value, force=1) => {
            if(!!force){                                                                     // IF we're following standard KVP procedure (e.g. inserts and updates ALWAYS behave like overwrites) [FORCE MODE]...
                return  this.setItem(key, value)                                             // ... set the KVP...
                        .then(()=>force);                                                    // ... and return 1, signifying the number of records written.
            }                                                                                // OTHERWISE (we're being cautious and refusing to overwrite extant data, in which case) [CAUTIOUS MODE]...
            return  this.go(item, null, true)                                                // ... attempt to retrieve the count of the number of records with <key> (0 or 1)
                    .then(recordExists => (!!recordExists)                                   //   IF a record with <key> exists already... 
                                            ? false                                          //   ...return false, signifying we refused the op and nothing has been changed.
                                            : this.gi(key, value, true));                    //   OTHERWISE recall this same method in force mode, but send back a true instead of a 1 (which can be coerced to 1 anyway)
                    
                
        }

        // Retrieve a SINGLE record (or the count of same) by <key>, and optionally matching <condition>
        this.read = this.go = (key, condition, count=false) => {
            if(condition == null || condition === '') {                                      // IF no condition has been specified [SIMPLE RETRIEVAL]...
                if (!count) return this.getItem(key);                                        //   IF method is not being called in Count Mode, just retrieve the item with <key>
                return this.getItem(key)                                                     //   OTHERWISE it IS a count. Attempt to retrieve the item (and since this method ONLY gets one item)...
                       .then(item=>+(item != null))                                          //   ... then cooerce its boolean test for null ("is there an item with <key>?") into its numeric equivalent (0 or 1)
            }                                                                                // OTHERWISE...
            return this.getItem(key)                                                         //   Attempt to retrieve the item...
                   .then(item=> {                                   
                            if(item == null) return (!count) ? null : 0;                     //   If ITEM *IS NOT* found (it proves to be null/no key exists) return either 0 (if a count op) or null (if not)
                            return (!count)                                                  //   If IT *IS FOUND*, then...
                                    ? condition(item)                                        //     ...apply the condition callback and return the results, whatever those should prove to be.
                                    : condition(item).then(item=>+(item != null));           //   Otherwise apply the condition callback and return the cooerced boolean test for null.
                        });      
        }

        // Retrieve ALL records (or the count of same), optionally matching <condition>
        this.readAll = this.gogo = (condition, includeKeys=false, count=false) => {
            let tableData = (!includeKeys) ? [] : {};                                        // Create a variable to hold the result set
            return this.iterate((value,key)=>{                                               // Loop through all the records in this table...
                if(includeKeys) tableData[key] = value;                                      // ... and IF the user has requested the results in object form, construct the {K:V} JSON...
                else tableData.push(value);                                                  // ... OTHERWISE just stuff each value into an array...
                return tableData;                                                            // ... and hand it off to the next processing phase.
            })
            .then(() => {                                                                    // RUN THE CONDITIONALS
                if(condition == null || condition === '') return tableData;                  // IF no condition was set (SELECT * FROM) THEN just pass the whole set along.
                if(!includeKeys) return tableData.filter(condition);                         // IF, likewise, we're returning an ARRAY, we just filter it through <condition> and pass IT along.
                return  Object.fromEntries(                                                  // OTHERWISE (we have an OBJECT that needs filtration)...
                            Object.entries(tableData)                                        // ... convert the data set to an iterable set of KVPs...
                            .filter(entry=>(condition(entry[1])))                            // ... and use just the value (V) part if the KVPs to ascertain their validity against <condition>, then pass IT along
                        );
            })
            .then(filteredData => (count)                                                    // Finally, IF we're in COUNT MODE...
                                ? Object.entries(filteredData).length                        // ... return the number of records in the filtered, final set instead of the array/object itself
                                : filteredData);                                             // OTHERWISE the data set, having been filtered agaist <condition> already can just be passed through.
        }

        // VIEWING the current "schema" (read: the "shape" and data types of the data being stored inside at this minute)
        this.schema = () => {                                                                // NOTE: this method returns the keys (K) for each KVP record stored in this table/bucket to one layer deep, NO VALUES are returned
            var tableSchema = {};                                                            // Create a variable to hold the result metadata set
            return db.tables.Teams.iterate((value,key)=>{                                    // Loop through all the records in this table...
                tableSchema[key] = (typeof(value) === 'object')                              // ... IF <value> is an object...
                                 ? Object.keys(value)                                        //    ... overwrite it with its own list of keys, then use the result as the value (V) in the KVP output...
                                 : "<value> (" + typeof(value) + ")";                        // ... OTHERWISE (<value is NOT an object>) set value (V) to whatever its current data type happens to be...
                return tableSchema;                                                          // ... and pass it back.
            });
        }

        // db.tables.Teams.joinTo(db.tables.TeamMembers, 'teamID', 'teamID', 'eq')
        // db.tables.Teams.joinTo(db.tables.TeamMembers, 'teamID', 'teamID', 'eq')
        this.joinTo = (targData, targCol, thisData, thisCol, comparison='eq') => {
            
        }

        root.createInstance(this.name);

        

        Object.defineProperties(this, {gi:this.gi, write:this.gi, go:this.go, read:this.read, go:this.gogo, read:this.readAll, schema:this.schema});
    }
}

export {__DBTable}
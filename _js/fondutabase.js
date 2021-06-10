
export default class Fondutabase {
    #config
    #db

    get config(){ return this.#config; }
    set config(cfg){ this.#config = cfg; }
    get db(){ return this.#db; }
    set db(dbObject){ this.#db = dbObject; }

    constructor() {
        console.log('Fondutabase has initialized!');
        this.#config       = null;
        this.#db           = null;
        this.openDB        = null;
        this.attemptCount  = 0;
        this.schemaBuilder = null;
        this.lf            = window.lf;
        this.initialized   = false;
        this.connected = false;
        this.generateDatabaseSchema();
            
    }

    insert(table, fieldData){
        if(!Array.isArray(fieldData)) fieldData = [fieldData];
        console.log('fieldData :', fieldData);
        var targetTable = this.db.getSchema().table(table);
        var allRows = fieldData.map(row=>targetTable.createRow(row));
        return this.db.insert().into(targetTable).values(allRows).exec()
    }

    delete(table, condition){
        var targetTable = this.db.getSchema().table(table);
        this.db.delete().from(targetTable).exec();
    }

    overwrite(table, fieldData){
        if(!Array.isArray(fieldData)) fieldData = [fieldData];
        console.log('fieldData :', fieldData);
        var targetTable = this.db.getSchema().table(table);
        var allRows = fieldData.map(row=>targetTable.createRow(row));
        return this.db.insertOrReplace().into(targetTable).values(allRows).exec()
    }

    // Usage: select('SELECT manager FROM sprints').then(rows=>console.log(rows))
    select(tsql, dryrun=false){
        let {db} = this;
        const booleanConditions = {
            '='  : 'eq',
            '<>' : 'neq',
            '>=' : 'gte',
            '>'  : 'gt',
            '<=' : 'lte',
            '<'  : 'lt'
        }
        const prefixColumn = (columnName, tableCollection) => {
            console.log('prefixColumn = (columnName, tableCollection) :', columnName, tableCollection);
            columnName = columnName.trim().split('.');
            if(columnName[0] === '*') return void(0);
            if(columnName.length === 1) return Object.values(tableCollection)[0].schema[columnName[0]]
            return tableCollection[columnName[0]].schema[columnName[1]];
        }



        let tableMappings = {};
        let targetData = tsql.match(/^(?:SELECT)?(?<COLUMNS>[a-z0-9\.\*\, ]+)FROM (?<TABLES>.*?)(?: (?<JOIN_TYPE>LEFT OUTER JOIN|INNER SELF JOIN|INNER JOIN) (?<JOIN_ON>.+?))?(?: WHERE (?<WHERE>.+?))?(?:(?: ORDER BY )(?<ORDER_BY>.+?))?(?: LIMIT (?<LIMIT>.+?))?(?: SKIP (?<SKIP>.+?))?$/i).groups
        
        //# TABLES (A)      Begin with the tables specified in the tSQL
        let tableQuery = targetData.TABLES.split(',');
        
        //# JOIN_ON (A)     Due to the wonkiness of tSQL syntax, there are instances in which additional table specifications are made after a JOIN declaration has been made. Test for and address the case if relevant.
        if(targetData.JOIN_ON && / ON /i.test(targetData.JOIN_ON)) {        //# If there is a JOIN in the tSQL and it contains an ON modifier...
            let joinOnParse = targetData.JOIN_ON.split(' ON ');             //...# split it into its parts...
            tableQuery.push(joinOnParse.pop());                             //...# remove the table from the ON conditions and insert it into the TABLES collection...
            targetData.JOIN_ON = targetData.JOIN_ON.pop();                  //...# and restore the JOIN_ON parameter to a string, now missing the table name.
        }        
        //# TABLES (B)      Next, we need to account for the ability to alias a table name ("first_table FT, second_table ST").
        tableQuery.forEach(tbl=>{                                           //# So let's loop 'em...
            tbl = tbl.trim().split(/ +/);                                   //...# split each table name on whitespace...
            tableMappings[tbl[tbl.length-1]] = {name:tbl[0]};               //...# if there's a space, it's aliased ({FT: {name: 'first_table'}}) otherwise equal to itself ({first_table: {name: 'first_table'}})
        });
        Object.entries(tableMappings).map(tblData=>                          //# Finally, we take those mappings, iterate them...
            Object.assign(          
                            tableMappings[tblData[0]],                                        //...# and merge into them...
                            {schema:db.getSchema().table(tblData[1].name).as(tblData[0])}     //...# a schema KVP containing their schema object.
                         )
        );
        tableQuery = tableMappings;

        //# COLUMNS         Next, lets grab the separated columns from the tSQL (e.g. '*'/'some, column, names'/'table.prefixed, column.names')
        let columnQuery = targetData.COLUMNS.split(',').map(col=>prefixColumn(col, tableQuery));

        //# CONDITIONS      Obtain the WHERE statements and evaluate them to construct the boolean value expression
        //## ITERATIVE DEV ON THIS BIT: initial support: = and <>
        let whereQuery = null, conditionResults = [], pseudoCond = [];
        if(targetData.WHERE){
            whereQuery = {};
            targetData.WHERE.replace(/^(.*?)(?: *([=<>]+) *)(.*)$/, 
                                                  (p, c1, op, c2)=>{
                                                      window.c1 = whereQuery.c1 = prefixColumn(c1, tableQuery);
                                                      window.op = whereQuery.op = [booleanConditions[op]];
                                                      window.c2 = whereQuery.c2 = c2;
                                                    //   return c1.eq(c2);
                                                  });
            console.log('whereQuery :', whereQuery = [whereQuery]);
        }

        let pseudoColQuery = [...columnQuery];
        pseudoColQuery = pseudoColQuery[0] ? pseudoColQuery : '*'
        let pseudoQuery = ["SELECT", pseudoColQuery, 'FROM', ...Object.values(tableQuery).map(v=>v.name)];
        if(whereQuery) pseudoQuery.push(...['WHERE', Object.values(whereQuery[0]).join(' ')])
        
        
        try {
            console.time('     ↳ ⏱');
            let result, runningQuery;
            return !dryrun ? Promise.resolve(
                result = Promise.resolve(db.select(...columnQuery))
                       .then(QUERY=>QUERY.from(...Object.values(tableQuery).map(v=>v.schema)))
                       .then(QUERY=>{
                           if(whereQuery == null) return QUERY;
                           let q = whereQuery[0];
                           return QUERY.where(q.c1[q.op](q.c2))
                       })
                       .then(QUERY=>runningQuery=QUERY.exec()))
            .then(result=>console.groupCollapsed('▶️ 🟢 Executed tSQL from components: ', pseudoQuery.flat()) || console.log('     ↳ 🛠 Query Literal:', runningQuery) || result)
            .then(result=>console.log('     ↳ ✅ Transaction Succeeded!', result) || result)
            .then(result=>console.timeEnd('     ↳ ⏱') || console.groupEnd() || result)
            :
            Promise.resolve()
            .then(result=>console.group('▶️ 🟡 DRY RUN: Executed tSQL from components: ', pseudoQuery.flat()) || console.log('     ↳ 🔕 Query Literal: Unavailable in Dry Run') || result)
            .then(result=>console.log('     ↳ 🔕 Transaction Status: Unavailable in Dry Run!'))
            .then(result=>console.timeEnd('     ↳ ⏱') || console.groupEnd() || result)
            ;
                
            
        }catch(err){
            console.group('▶️ 🔴 Executed tSQL from components: ', pseudoQuery.flat());
            console.error('     ↳ ❌ Transaction Failed! Compiler explanation:', err);
            console.timeEnd('     ↳ ⏱')
            console.groupEnd();
        }
    }

    



    
    // Creates the Database if none exists.
    generateDatabaseSchema(){
        console.log('generateDatabaseSchema');
        return new Promise((resolve, reject) => {
            this.schemaBuilder = this.lf.schema.create('fondue', 1);
            // Adds the "config" table to the "fondue" database
            this.schemaBuilder.createTable('config').
                addColumn('key', this.lf.Type.STRING).
                addColumn('value', this.lf.Type.STRING).
                addPrimaryKey(['key']).
                addNullable(['value']);

            // Adds the "imports" table to the "fondue" database
            this.schemaBuilder.createTable('imports').
                addColumn('importId', this.lf.Type.INTEGER).
                addColumn('sprintId', this.lf.Type.INTEGER).
                addColumn('importedFor', this.lf.Type.STRING).
                addColumn('slotNumber', this.lf.Type.NUMBER).
                addColumn('datePulled', this.lf.Type.DATE_TIME).
                addPrimaryKey(['importId'], true);


            // Adds the "sprints" table to the "fondue" database
            this.schemaBuilder.createTable('sprints').
                addColumn('sprintId',             this.lf.Type.INTEGER).
                addColumn('jiraId',               this.lf.Type.INTEGER).
                addColumn('teamId',               this.lf.Type.INTEGER).
                addColumn('originBoardId',        this.lf.Type.INTEGER).
                addColumn('startDate',            this.lf.Type.DATE_TIME).
                addColumn('endDate',              this.lf.Type.DATE_TIME).
                addColumn('activatedDate',        this.lf.Type.DATE_TIME).
                addColumn('completeDate',         this.lf.Type.DATE_TIME).
                addColumn('sprintLengthInDays',   this.lf.Type.INTEGER).
                addColumn('workableDaysInSprint', this.lf.Type.STRING).
                addColumn('workableDaysCount',    this.lf.Type.INTEGER).
                addColumn('name',                 this.lf.Type.STRING).
                addColumn('state',                this.lf.Type.STRING).
                addColumn('pullAssociations',     this.lf.Type.ARRAY_BUFFER).
                addColumn('_OPTIONS',             this.lf.Type.STRING).


                addPrimaryKey(['sprintId'], true).
                addNullable(['sprintLengthInDays','pullAssociations', 'teamId','jiraId', 'originBoardId', 'activatedDate', 'state', 'startDate', 'name', 'endDate', 'completeDate', '_OPTIONS']);
                // addIndex('idxSprints', ['sprintId'], false, this.lf.Order.DESC);

            // Adds the "teams" table to the "fondue" database
            this.schemaBuilder.createTable('teams').
                addColumn('teamId', this.lf.Type.INTEGER).
                addColumn('name', this.lf.Type.STRING).
                addColumn('description', this.lf.Type.STRING).
                addColumn('manager', this.lf.Type.STRING).
                addPrimaryKey(['teamId'], true).
                addNullable(['manager']);


            // Adds the "personnel" table to the "fondue" database
            this.schemaBuilder.createTable('personnel').
                addColumn('personId', this.lf.Type.INTEGER).
                addColumn('firstName', this.lf.Type.STRING).
                addColumn('lastName', this.lf.Type.STRING).
                addColumn('email', this.lf.Type.STRING).
                addColumn('ADID', this.lf.Type.STRING).
                addColumn('NTID', this.lf.Type.STRING).
                addColumn('avatarURL', this.lf.Type.STRING).
                addPrimaryKey(['personId'], true).
                addNullable(['firstName','lastName','email','ADID','NTID','avatarURL']);


            // Adds the "personnel" table to the "fondue" database
            this.schemaBuilder.createTable('issues').
                addColumn('issueId',	           this.lf.Type.INTEGER).
                addColumn('jiraIssueId',	       this.lf.Type.INTEGER).
                addColumn('parentJiraId',	       this.lf.Type.INTEGER).
                addColumn('issueKey',	           this.lf.Type.STRING).
                addColumn('type',	               this.lf.Type.STRING).
                addColumn('assigneeName',	       this.lf.Type.STRING).
                addColumn('assigneeEmail',	       this.lf.Type.STRING).
                addColumn('component',	           this.lf.Type.STRING).
                addColumn('created',	           this.lf.Type.DATE_TIME).
                addColumn('description',	       this.lf.Type.STRING).
                addColumn('labels',	               this.lf.Type.STRING).
                addColumn('link',	               this.lf.Type.STRING).
                addColumn('priority',	           this.lf.Type.STRING).
                addColumn('project',	           this.lf.Type.STRING).
                addColumn('reporter',	           this.lf.Type.STRING).
                addColumn('status',	               this.lf.Type.STRING).
                addColumn('statusColor',	       this.lf.Type.STRING).
                addColumn('subtasks',	           this.lf.Type.STRING).
                addColumn('summary',	           this.lf.Type.STRING).
                addColumn('title',	               this.lf.Type.STRING).
                addColumn('timeestimate',	       this.lf.Type.NUMBER).
                addColumn('timeoriginalestimate',  this.lf.Type.NUMBER).
                addColumn('timespent',	           this.lf.Type.NUMBER).
                addColumn('updated',	           this.lf.Type.DATE_TIME).
                addColumn('retrievedFor',	       this.lf.Type.INTEGER).
                addColumn('retrievedForSlot',      this.lf.Type.INTEGER).
                addColumn('retrevalStamp',	       this.lf.Type.DATE_TIME).
                addColumn('retrevalReadable',	   this.lf.Type.STRING).
                addColumn('_OPTIONS',              this.lf.Type.STRING).

                addPrimaryKey(['issueId'], true).
                addNullable(['jiraIssueId', 'parentJiraId', 'issueKey', 'type', 'assigneeName', 'assigneeEmail', 
                             'component', 'created', 'description', 'labels', 'link', 'priority', 'project', 
                             'reporter', 'status', 'statusColor', 'subtasks', 'summary', 'title', 'timeestimate', 
                             'timeoriginalestimate', 'timespent', 'updated', '_OPTIONS']);
            resolve(this.schemaBuilder);
                
        })
        .then(schemaBuilder=>(this.schemaBuilder = schemaBuilder))
        .then(schemaBuilder=>this.verifyDBConnectivity())
        .then(()=>this.initialized = true)
        .catch((err)=>{
            this.initialized = false;
            console.error('FONDON\'T: Error during setup: ', err);
        });
    }

    connect() {
        if(this.connected === true && this.db != null) return Promise.resolve(this.db);
        this.connected = true;
        return this.schemaBuilder.connect()
    }

    getconfig(dbConn){
        _I('Attempting to retrieve Fondue configuration form local storage...');
        this.db = dbConn;
        return this.select('SELECT * FROM config')
        .then(configObject=>this.config = configObject);
    }

    verifyDBConnectivity(){
        return this.connect()
        .then(dbConn=>this.getconfig(dbConn))
        .then(configObj=>window.credentials.verifyJiraCredentials(configObj))
    }

}

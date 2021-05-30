
export default class Fondutabase {
    #config

    get config(){ return this.#config; }
    set config(cfg){ this.#config = cfg; }

    constructor() {
        console.log('Fondutabase has initialized!');
        this.#config = null;
        this.attemptCount = 0;
        this.schemaBuilder = null;
        this.lf = window.lf;
        this.initialized = false;
        
        this.generateDatabaseSchema();
            
    }

    
    // Creates the Database if none exists.
    generateDatabaseSchema(){
        console.log('generateDatabaseSchema');
        return new Promise((resolve, reject) => {
            this.schemaBuilder = this.lf.schema.create('fondue', 1);
            // Adds the "fondueConfig" table to the "fondue" database
            this.schemaBuilder.createTable('fondueConfig').
                addColumn('userInstance', this.lf.Type.INTEGER).
                addColumn('jiraHash', this.lf.Type.STRING).
                addPrimaryKey(['userInstance']).
                addNullable(['jiraHash']);

            // Adds the "imports" table to the "fondue" database
            this.schemaBuilder.createTable('imports').
                addColumn('importId', this.lf.Type.INTEGER).
                addColumn('sprintId', this.lf.Type.INTEGER).
                addColumn('fileName', this.lf.Type.STRING).
                addColumn('dayNumber', this.lf.Type.NUMBER).
                addColumn('datePulled', this.lf.Type.DATE_TIME).
                addPrimaryKey(['importId']);


            // Adds the "sprints" table to the "fondue" database
            this.schemaBuilder.createTable('sprints').
                addColumn('sprintId', this.lf.Type.INTEGER).
                addColumn('teamId', this.lf.Type.INTEGER).
                addColumn('sprintName', this.lf.Type.STRING).
                addColumn('sprintDaySpan', this.lf.Type.NUMBER).
                addColumn('startDate', this.lf.Type.DATE_TIME).
                addColumn('endDate', this.lf.Type.DATE_TIME).
                addPrimaryKey(['sprintId']).
                addNullable(['sprintDaySpan']);
                // addIndex('idxSprints', ['sprintId'], false, this.lf.Order.DESC);

            // Adds the "teams" table to the "fondue" database
            this.schemaBuilder.createTable('teams').
                addColumn('teamId', this.lf.Type.INTEGER).
                addColumn('teamName', this.lf.Type.STRING).
                addColumn('manager', this.lf.Type.STRING).
                addPrimaryKey(['teamId']).
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
                addPrimaryKey(['personId']).
                addNullable(['firstName','lastName','email','ADID','NTID','avatarURL']);


            // Adds the "personnel" table to the "fondue" database
            this.schemaBuilder.createTable('issues').
                addColumn('issueId', this.lf.Type.INTEGER).
                addColumn('jiraIssueId', this.lf.Type.INTEGER).
                addColumn('issueType', this.lf.Type.STRING).
                addColumn('issueKey', this.lf.Type.STRING).
                addColumn('parentJiraId', this.lf.Type.STRING).
                addColumn('status', this.lf.Type.STRING).
                addColumn('assignee', this.lf.Type.STRING).
                addColumn('component', this.lf.Type.STRING).
                addColumn('created', this.lf.Type.DATE_TIME).
                addColumn('updated', this.lf.Type.DATE_TIME).
                addColumn('summary', this.lf.Type.STRING).
                addColumn('priority', this.lf.Type.STRING).
                addColumn('sprint', this.lf.Type.STRING).
                addColumn('cfIssueId', this.lf.Type.STRING).
                addColumn('cfFeatureLink', this.lf.Type.STRING).
                addColumn('originalEst', this.lf.Type.NUMBER).
                addColumn('remainingEst', this.lf.Type.NUMBER).
                addColumn('timeSpent', this.lf.Type.NUMBER).
                addColumn('totRemainingEst', this.lf.Type.NUMBER).
                addColumn('totTimeSpent', this.lf.Type.NUMBER).
                addPrimaryKey(['issueId']).
                addNullable(['jiraIssueId','issueType','issueKey','parentJiraId','status','assignee','component','created','updated','summary','priority','sprint','cfIssueId','cfFeatureLink','originalEst','remainingEst','timeSpent','totRemainingEst','totTimeSpent']);
            resolve(this.schemaBuilder);
                
        })
        .then(schemaBuilder=>(this.schemaBuilder = schemaBuilder))
        .then(schemaBuilder=>this.checkForDatabase(schemaBuilder))
        .then(()=>this.initialized = true)
        .catch((err)=>{
            console.error('FONDON\'T: Error during setup: ', err);
        });
    }


    checkForDatabase(schemaBuilder){
        console.log('checkForDatabase');
        return schemaBuilder.connect().then((db) => {
            window.fondutabase = db;
            this.config = window.fondutabase.getSchema().table('fondueConfig')
            let retVal = window.fondutabase.select().from(this.#config).exec();
            return retVal;
        })
        .then(configData=>window.credentials.verifyJiraCredentials(configData, this.#config))
        .catch((err)=>{
            console.count(err)
            if(this.attemptCount <= 3){
                this.attemptCount++;
                this.generateDatabaseSchema();
            }else{
                console.error(err);
            }
        });
        
    }
}

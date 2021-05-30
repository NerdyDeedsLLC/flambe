
export default class Credentials {
    #credentials
    #hasCreds
    
    get creds() { 
        return this.#credentials
    }
    
    get hasCreds() { 
        return this.#hasCreds
    }
    
    constructor() {
        console.log('Credentials has initialized!');
        this.#hasCreds    = false;
        this.#credentials = null;
        this.configDBContents = null;
        this.dbConnection = null;
    }

    destroyCredentialDialog() {
        let dialog=document.getElementById('JIRACredentialDialog')
        return dialog != null ? dialog.remove() : void(0);
    }


    displayCredentialDialog() {
        document.body.insertAdjacentHTML('afterBegin', this.generateCredentialDialog());
        document.getElementById('authBtn').addEventListener('click', ()=>{
            let authString = btoa(`${document.getElementById('userName').value}:${document.getElementById('password').value}`);
            var row = this.dbConnection.createRow({
                'userInstance': 1,
                'jiraHash': 'Basic ' + authString,
            });
            return window.fondutabase.insertOrReplace().into(this.dbConnection).values([row]).exec()
        });
        return;
    }

    generateCredentialDialog() {
        return `
                <form id="JIRACredentialDialog" action="" onsubmit="return false" method="GET">
                <link rel='stylesheet' type='text/css' href='lib/css/install.css'>
                    <section id="jiraAuthRequired" class="show">
                        <header>
                            <input type="checkbox" name="showLongDesc" id="showLongDesc">
                            <h3>You Jira User Credentials Are Required!
                                <label for="showLongDesc" data-text="why?" data-toggle="longDesc"></label>  
                            </h3>
                            <div id="shortDesc">Please provide your Jira Account credentials. </div>
                            <div id="longDesc">
                                    In order for the platform to performs actions like querying users' information and retrieving the list of Features applicable to your project,
                                    you will need to provide your Jira credentials. This data is not used beyond this initial login, and you should not need to do this again,
                                    unless you reset or reinstall the application.
                            </div>
                        </header>
                        <main>
                            <div>
                                    <label for="userName">Username:</label>
                                    <span>
                                        <input id="userName" name="userName" type="text" autocomplete="username">
                                        <em>(this is typically your T-MOBILE e-mail address or &laquo;Your NTID&raquo;@gsm1900.org)</em>
                                    </span>
                            </div>
                            <div>

                                <label for="password">Password:</label>
                                <span>
                                    <input type="password" name="password" id="password" autocomplete="current-password">
                                        <em>(the password you use when logging into Jira)</em>
                                </span>
                                
                            </div>

                            </main>
                            <footer>
                                <button id="authBtn">Authenticate Computer</button>

                        </footer>
                    </section>
                </form>`;
    }

    verifyJiraCredentials(configDBContents=null, dbConnection){
        this.configDBContents = configDBContents;
        this.dbConnection     = dbConnection;
        return new Promise((resolve, reject)=>{
            this.destroyCredentialDialog();
            if(configDBContents == null || !Array.isArray(configDBContents))
                throw reject(new Error('Cannot Instantiate Database!'));
                if(configDBContents && configDBContents[0] && configDBContents[0].jiraHash){
                    this.#credentials = configDBContents[0].jiraHash;
                    JDR.credentials   = this.creds;
                    return resolve();
                }
                if(configDBContents.length < 1) return resolve(this.toggleToCredentialCollector());
                throw reject(new Error('Unable to read from database table!'));
        });
    }
    
    toggleToCredentialCollector(){
        if(document.getElementById()){
            this.destroyCredentialDialog();
            return true;
        }
        this.displayCredentialDialog(); 
        document.getElementById('authBtn').addEventListener('click', ()=>{
            let authString = btoa(`${document.getElementById('userName').value}:${document.getElementById('password').value}`);
            var row = this.dbConnection.createRow({
                'userInstance': 1,
                'jiraHash': 'Basic ' + authString,
            });
            return fondutabase.insertOrReplace().into(this.dbConnection).values([row]).exec()
            .then(window.fondutabase.checkForDatabase);
        });
    }
}

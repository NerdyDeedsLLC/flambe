
export default class Credentials {
    #credentials
    #hasCreds
    
    get token() { 
        return this.#credentials
    }
    
    get hasCreds() { 
        return this.#hasCreds
    }
    
    constructor() {
        console.log('Credentials has initialized!');
        this.#hasCreds    = false;
        this.#credentials = null;
        this.fondueConfigObj = null;
        this.dbConnection = null;
        this.dialog = null;
    }

    destroyCredentialDialog() {
        return this.dialog != null ? this.dialog.remove() : void(0);
    }


    displayCredentialDialog() {
        APP.insertAdjacentHTML('afterBegin', this.generateCredentialDialog());
        this.dialog = qs('#JIRACredentialDialog');
        document.getElementById('authBtn').addEventListener('click', ()=>{
            return new Promise((resolve, reject)=>{
                let authString = btoa(`${document.getElementById('userName').value}:${document.getElementById('password').value}`);
                return resolve(window.fondutabase.insert('fondueConfig', {
                    key: 'jiraHash',
                    value: 'Basic ' + authString,
                }))
                ;

            })
            .then(() => this.dialog.classList.toggle('finished'))
            .then(() => setTimeout(()=>{this.dialog.classList.toggle('finished'); this.destroyCredentialDialog()}, 4000))
            .then(() => fondutabase.verifyDBConnectivity());
        });
        return ;
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
                        <div class="main">
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
                        </div>
                        <footer>
                            <button id="authBtn">Authenticate Computer</button>
                        </footer>
                    </section>
                </form>`;
    }

    verifyJiraCredentials(fondueConfigObj = null){
        _I('Verifying presence of JIRA credentials...');
        this.fondueConfigObj = fondueConfigObj;

        return new Promise((resolve, reject)=>{
            if(fondueConfigObj == null || !Array.isArray(fondueConfigObj)) {
                _E('FATAL ERROR! Configuration Object provided is missing, malformed, or corrupted!', fondueConfigObj);
                throw reject(new Error('Unable to read object.'));
            }
            let jiraHashKVP = fondueConfigObj.find(ent=>ent.key==='jiraHash');
            if(jiraHashKVP != null){
                _I('...success! Jira credentials securely loaded. No further authentication required.');
                this.#credentials = jiraHashKVP.value;
                JDR.credentials   = this.token;
                return resolve();
            }else{
                _I('...unsuccessful. Config loaded, but Jira token is absent or corrupted. Transferrring user to Jira login credential collection dialog!');
                return resolve(this.toggleToCredentialCollector());
            }
        });
    }
    
    toggleToCredentialCollector(){
        return  (qs('#JIRACredentialDialog') != null) ? true : this.displayCredentialDialog(); 
    }
}

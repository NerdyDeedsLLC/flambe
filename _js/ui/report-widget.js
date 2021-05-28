
    export default class ReportWidget extends HTMLElement {
        constructor(...props) {
            super()
            this.monitoredProperties = [];
            this.props = {};
            [...this.attributes].forEach(attr=>Object.assign(this.props, Object.fromEntries([[attr.name, attr.value]])))
            console.log('this.props :', this.props);
            window.wid = this;

            if(!this.props.type) throw new TypeError("report-widget.js :: UNABLE TO INSTATIATE WIDGET!\n\n'Type' was not amongs the properteis set while instantiating this widget!\n\nInstead got ", this.props);
        }

        render() {
            const entryToCSSVar = (propertyName, propertyValue, manualInsertion=false) => {
            console.log('propertyName, propertyValue :', propertyName, propertyValue);
                if(!propertyName) return;
                if(!propertyValue) return;
                
                let varName = "--" + propertyName;
                if(!isNaN(parseInt(propertyValue))) propertyValue = +propertyValue

                console.log('propertyValue :', propertyName, ':',  propertyValue, ' (', typeof(propertyValue), ')');

                if(!isNaN(parseInt(propertyValue))) this.style.setProperty(varName, propertyValue);
                else this.style.setProperty(varName, '"' + propertyValue + '"');
            }
            
            const observeProperty = (propertyName, propertyValue) => {
                this.monitoredProperties.push(propertyName);
                this[propertyName] = propertyValue;
                entryToCSSVar(propertyName, propertyValue);
            }

            Object.entries(this.props).forEach(prop => observeProperty(prop[0], prop[1]));

            console.log('RENDERING :', this.props.type, this[this.props.type]);
            this.innerHTML = `<i class="help widget-${this.props.type}"></i>` + this[this.props.type]();
        }
        
        /**
        * @name                yesterday(properties)
        * @description         Renders the widget summarizing the data related to the burning of hours for the preceding 24 hours.
        * 
        * @param   {OBJECT}     properties     Data object containing the data required to render the widget. fullSprint expects:
        *          {NUMBER}      burned        The total number of hours burned this sprint
        *          {NUMBER}        max         The total number of burnable hours that exist to date in the current sprint
        *          {STRING}       delta        String representing if there were more or less hours burned this day than the previous. Possible values: 'up'/'down'
        *          {NUMBER}     deltaValue     Number representing the Percentage difference between number of hours burned today vs. the previous.
        */
        yesterday(properties = this.props) {
            let {burned, max, delta, deltav} = properties;
            this.title = "Last 24 Hours"
            return `
                    <hydro-meter value="${burned}" max="${max}"></hydro-meter>
                    <upsy-downsy delta='${delta}' value='${deltav}'></upsy-downsy>
                    `;
        }

        /**
        * @name                fullSprint(properties)properties
        * @description         Renders the widget summarizing the data related to the burning of hours each day throughout the sprint.
        * 
        * @param   {OBJECT}     properties     Data object containing the data required to render the widget. fullSprint expects:
        *          {NUMBER}       burned       The total number of hours burned this sprint
        *          {NUMBER}        max         The total number of burnable hours that exist to date in the current sprint
        *          {NUMBER}    daysInSprint    The planned number of workable days within the sprint
        *          {ARRAY}     burnedPerDay    Array of {NUMBER} values whose indices correspond to the day number and represent the number of hours burned that day.
        */
        fullSprint(properties = this.props) {
            let {burned, max, daysinsprint, burnedperday} = properties;
            daysinsprint = daysinsprint == null ? 10 : daysinsprint;
            burnedperday = JSON.parse(burnedperday);

            this.title="Total Burn"
            let codeOp = `  <hydro-meter value="${burned}" max="${max}"></hydro-meter>
                            <div class="meter-block">`;
            for(var i=1; i<=daysinsprint; i++){ 
                codeOp += (i <= burnedperday.length) 
                        ? `<micro-meter id="Day-${i}" label="Day ${i}" value="${burnedperday[i]}" max="${parseInt(max/burnedperday.length)}" active="true"></micro-meter>`
                        : `<micro-meter id="Day-${i}" label="Day ${i}" value="0" max="${max}" active="false"></micro-meter>`;
            }
            codeOp += `     </div>`;
            return codeOp;
        }
        

        /**
        * @name                byTeamMember(properties)
        * @description         Renders the widget summarizing the data related to the burning of hours each day throughout the sprint.
        * 
        * @param   {OBJECT}     properties     Data object containing the data required to render the widget. fullSprint expects:
        *          {NUMBER}       burned       The total number of hours burned this sprint
        *          {NUMBER}        max         The total number of burnable hours that exist to date in the current sprint
        *          {NUMBER}    daysInSprint    The planned number of workable days within the sprint
        *          {ARRAY}     burnedPerDay    Array of {NUMBER} values whose indices correspond to the day number and represent the number of hours burned that day.
        */
        byTeamMember(properties = this.props) {
            let data;
            if(properties.data === "raw-content"){
                data = JSON.parse(this.innerText);
            }

            this.title="By Individual"

            let markup = `<div class="team-silhouettes">`;
            let burned = 0;
            data.forEach(person=>{
                markup += `<teammate-silhouette name="${person.name}" email="${person.email}" burntotal="${person.hoursBurnedSprint}" previousburn="${person.hoursBurnedYesterday}" hourstodate="${properties.hourstodate}" ooo="${person.oooYesterday}" prctTotal="${(person.hoursBurnedSprint/properties.hourstodate).toPrecision(2)}" spCommitment="7" spDone="0" storyCommitment="1" storiesDone="0"></teammate-silhouette>`
                burned += person.hoursBurnedSprint;
            });
            markup += ` </div>
                        <div class="toggler-panel">
                            <hydro-meter value="${burned}" max="${properties.hourstodate}" size="120"></hydro-meter>
                            <input type="radio" name="individuals-toggler" id="individualsTogglerHours" checked><label for="individualsTogglerHours">HOURS BURNED</label>
                            <!--input type="radio" name="individuals-toggler" id="individualsTogglerPts"><label for="individualsTogglerPts">ST. PTS</label-->
                        </div>`;


            this.innerText = '';
            return markup; 
        }

        commitments(properties = this.props){
            let data, stories={};
            if(properties.data === "raw-content"){
                data                     = JSON.parse(this.innerText);
                stories.all              = Object.values(data);
                console.log('stories.all : ', stories.all);
                stories['Defined']       = stories.all.filter(story => /Defined|New/.test(story.state));
                stories['In Progress']   = stories.all.filter(story => story.state === 'In Progress');
                stories['Dev Complete']  = stories.all.filter(story => story.state === 'Dev Complete');
                stories['In Testing']    = stories.all.filter(story => story.state === 'Pending Approval');
                stories['Complete']      = stories.all.filter(story => /Withdrawn|Done/i.test(story.state));
                stories['Blocked']       = stories.all.filter(story => story.state === 'Blocked');
                stories['Proxied']       = ["New", "Withdrawn", "Done"];
                this.innerText           = '';
            }else return false;
            stories
            console.log('stories :', stories);
            let totalStoriesInSprint = stories.all.length;
            console.log('stories :', stories);
            this.title="Commitments";
            let markup=`<hydro-meter value="${stories.Complete.length}" max="${totalStoriesInSprint}" size="140"></hydro-meter>`;
            let storyDetails = '';
            markup += ` <div class="progress-bars" style="--all-stories:${totalStoriesInSprint}">`

            Object.entries(stories).forEach(storySet => {
                if(/all|proxied/i.test(storySet[0]) || stories['Proxied'].indexOf(storySet.state) !==-1) return;
                console.log('storySet :', storySet);
                let setName = storySet[0];
                let setList = storySet[1];
                
                markup += `<a id="${setName.replace(/\s/g, '')}" href="javascript:void(0)"><progress-bar all-stories="${totalStoriesInSprint}" stories-in-state="${setList.length}" state="${setName}"></progress-bar></a>`;
                setList.forEach(story=> storyDetails += `<jira-issue  issue-id="${story["issue-id"]}" href="https://jirasw.t-mobile.com/secure/RapidBoard.jspa&selectedIssue=${story["issue-key"]}" owner="${story["owner"]}" owner-email="${story["owner-email"]}" avatar="${story["avatar"]}" storypoints="${story["storypoints"]}" state="${story["state"]}">${story["summary"]}</jira-issue>`);
            });
            markup += `<div class="progress-bar-popover">${storyDetails}</div>
                    </div>`;
            /*
            {
    "issue-id": "1459345",
    "issue-type": "Story",
    "issue-key": "BSWMDBN2-5013",
    "owner": "Pamidari, Sai",
    "owner-email": "SPamidi7@gsm1900.org",
    "avatar": "url(../avatars/SPamidi7.jpg)",
    "storypoints": "5",
    "state": "Defined",
    "remaining-est": "86400",
    "original-est": "86400",
    "summary": "Create Swagger for PAH update Event"
}
    {ACTUAL FIELD NAMES: Issue Type, Issue key, Issue id, Parent id, Status, Assignee, Component/s, Created, Updated, Summary, Priority, Sprint, Custom field (Issue Id), Custom field (Link to Feature in Jira Align), Original Estimate, Remaining Estimate, Time Spent, Σ Remaining Estimate, Σ Time Spent)
    Issue Type	 Issue key		     Issue id	Parent id	 Status		     Assignee		             Component/s		         Created		         Updated		         Summary		                                                     Priority	Sprint		                Custom field (Issue Id)		 OrigEst	RmnEst	   TimeSpt		ΣRmnEst		ΣTimeSpt
    Story		 BSWMDBN2-5013		 1459345		 		 Defined		 SPamidi7@gsm1900.org		 BSWMDBN2:DB Techquilla		 04/Feb/21 11:38 AM		 12/Feb/21 2:26 AM		 Create Swagger for PAH update Event		                            High	 DB Techquilla-21S04 02/10		 1459345		 		 86400		 86400	    	 		 86400		 
    Story		 BSWMDBN2-4863		 1438776		 		 Defined		 NPatel56@gsm1900.org		 BSWMDBN2:DB Techquilla		 27/Jan/21 11:32 AM		 09/Feb/21 3:45 PM		 Request Status and Code in DB		 									Low		 DB Techquilla-21S04 02/10		 1438776		 		 144000		 144000	    	 		 144000		 
    Story		 BSWMDBN2-4795		 1433931		 		 Defined		 HKoppar1@gsm1900.org		 BSWMDBN2:DB Techquilla		 26/Jan/21 5:45 PM		 09/Feb/21 3:45 PM		 Mongo DB Event Storage :   Create Shedlock		 						Low		 DB Techquilla-21S04 02/10		 1433931		 		 86400		 86400	    	 		 86400		 
    Story		 BSWMDBN2-4786		 1430409		 		 In Progress	 CJarami7@gsm1900.org		 BSWMDBN2:DB Techquilla		 26/Jan/21 12:01 PM		 11/Feb/21 3:50 PM		 COMPTEL_ACTIVATE_REQUEST		 										Low		 DB Techquilla-21S04 02/10		 1430409		 		 144000		 46800		 97200		 46800		 97200
    Story		 BSWMDBN2-4606		 1385246		 		 Defined		 tv568045@ad.sprint.com		 BSWMDBN2:DB Techquilla		 12/Jan/21 4:32 PM		 09/Feb/21 9:40 AM		 Create MS code for network-provision-indicator Endpoint		 		Low		 DB Techquilla-21S04 02/10		 1385246		 		 144000		 144000		     		 144000		 
    Story		 BSWMDBN2-4605		 1385236		 		 In Progress	 xw889417@ad.sprint.com		 BSWMDBN2:DB Techquilla		 12/Jan/21 4:26 PM		 10/Feb/21 4:05 PM		 Create Test Cases for network-provision-indicator Endpoint		 		Low		 DB Techquilla-21S04 02/10		 1385236		 		 144000		 72000		 72000		 72000		 72000
    Story		 BSWMDBN2-4451		 1347431		 		 Defined		 NPatel56@gsm1900.org		 BSWMDBN2:DB Techquilla		 30/Dec/20 12:49 PM		 09/Feb/21 3:45 PM		 Create DEEP.IO Send Unit Test		 									Low		 DB Techquilla-21S04 02/10		 1347431		 		 144000		 144000		    		 144000		 
    Story		 BSWMDBN2-4450		 1347427		 		 In Progress	 AReddy1@gsm1900.org		 BSWMDBN2:DB Techquilla		 30/Dec/20 12:49 PM		 10/Feb/21 3:01 PM		 Create Method to send Deep.io Event 		 							Low		 DB Techquilla-21S04 02/10		 1347427		 		 144000		 79200		 64800		 79200		 64800
    Story		 BSWMDBN2-4445		 1347051		 		 Defined		 MKonank1@gsm1900.org		 BSWMDBN2:DB Techquilla		 30/Dec/20 12:12 PM		 09/Feb/21 3:13 PM		 Create Unit Test Cases for call to AMIL API for additional attributes	Low		 DB Techquilla-21S04 02/10		 1347051		 		 144000		 144000		    		 144000		 
    Story		 BSWMDBN2-4444		 1347041		 		 In Progress	 MKonank1@gsm1900.org		 BSWMDBN2:DB Techquilla		 30/Dec/20 12:07 PM		 10/Feb/21 3:51 PM		 Create Unit Tests for Storing AMIL Requests and Replies		 		Low		 DB Techquilla-21S04 02/10		 1347041		 		 288000		 212400		 75600		 212400		 75600
    Story		 BSWMDBN2-4306		 1292420		 		 Dev Complete	 MIraqi1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 11:18 AM		 11/Feb/21 10:24 AM		 Create Unit test for NPE Response API		 							Low		 DB Techquilla-21S04 02/10		 1292420		 		 108000		 86400		    		 86400		 
    Story		 BSWMDBN2-4305		 1292240		 		 In Progress	 CJarami7@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 11:12 AM		 11/Feb/21 3:50 PM		 COMPTEL_DEACTIVATE_REQUEST		 										Low		 DB Techquilla-21S04 02/10		 1292240		 		 144000		 36000		 108000		 36000		 108000
    Story		 BSWMDBN2-4303		 1291977		 		 Defined		 RYadav23@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 11:02 AM		 09/Feb/21 3:45 PM		 Create method to call NPE API		 									Low		 DB Techquilla-21S04 02/10		 1291977		 		 144000		 144000		    		 144000		 
    Sub-task     BSWMDBN2-4302		 1292003	 1291487	 Done	    	 MDuree1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 11:01 AM		 27/Jan/21 9:23 AM		 CLONE - Submit Tickets to Create Production DB		 					Low		 DB Techquilla-21S04 02/10		 1292003		 		 		 		 		 		 
    Sub-task	 BSWMDBN2-4301		 1291099	 1291487	 Done		     MDuree1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 11:00 AM		 27/Jan/21 9:24 AM		 Submit Tickets to Create Test DB		 								Low		 DB Techquilla-21S04 02/10		 1291099		 		 		 		 		 		 
    Story		 BSWMDBN2-4296		 1291845		 		 New		     JOlenho1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 10:53 AM		 09/Feb/21 2:40 PM		 Create Methods for Call to CHUB API		 							Low		 DB Techquilla-21S04 02/10		 1291845		 		 162000		 162000		 	    	 162000		 
    Story		 BSWMDBN2-4295		 1291823		 		 In Progress	 JOlenho1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 10:51 AM		 11/Feb/21 3:19 PM		 Create Unit Tests for Call to CHUB API		 							Low		 DB Techquilla-21S04 02/10		 1291823		 		 144000		 108000		 183600		 108000		 183600
    Story		 BSWMDBN2-4292		 1291527		 		 In Progress	 HKoppar1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 10:37 AM		 09/Feb/21 9:49 AM		 Event Orchestrator :   Setup Mock server for Event Orchestrator		Low		 DB Techquilla-21S04 02/10		 1291527		 		 144000		 144000	    	 		 144000		 
    Story		 BSWMDBN2-4291		 1291506		 		 Withdrawn		 HKoppar1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 10:34 AM		 26/Jan/21 2:37 PM		 Cassandra Event Storage :   Create Unit Test for Cassandra CRUD		Low		 DB Techquilla-21S04 02/10		 1291506		 		 144000		 144000		     		 144000		 
    Story		 BSWMDBN2-4290		 1291487		 		 In Progress	 MDuree1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 10:31 AM		 12/Feb/21 8:11 AM		 EventOrchestrator :   Define Database Schema for Orchastrator events	Low		 DB Techquilla-21S04 02/10		 1291487		 		 57600		 67500		 501300		 67500		 501300
    Story		 BSWMDBN2-4288		 1291047		 		 Defined		 MDuree1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 10:28 AM		 10/Feb/21 7:26 AM		 DBSC saves event Data to Database		 								Low		 DB Techquilla-21S04 02/10		 1291047		 		 72000		 72000		 	    	 72000		 
    Story		 BSWMDBN2-4287		 1290906		 		 In Progress	 MDuree1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 10:00 AM		 10/Feb/21 5:55 PM		 Mongo Event Storage :  Create DB Scheme		 						Low		 DB Techquilla-21S04 02/10		 1290906		 		 115200		 79200		 57600		 79200		 57600
    Story		 BSWMDBN2-4284		 1290657		 		 In Progress	 PDurgem1@gsm1900.org		 BSWMDBN2:DB Techquilla		 15/Dec/20 9:51 AM		 10/Feb/21 3:03 PM		 Create DEEP.IO Unit Test		 										Low		 DB Techquilla-21S04 02/10		 1290657		 		 144000		 100800		 43200		 100800		 43200
    <jira-issue issue-id="(B2)-5821" href="https://jirasw.t-mobile.com/secure/RapidBoard.jspa?rapidView=8021&view=detail&selectedIssue=BSWMDBN2-5821" owner="Jurusz, Jason" owner-email="jason.jurusz@sprint.com" avatar="url(https://assets.codepen.io/678043/MMG7.jpg)" storypoints="5" state="Defined">Jira Issue Title</jira-issue>
    */
        //     <div class="commitments widget" data-title="Commitments">
        //     <hydro-meter value="11" max="64" size="140"></hydro-meter>
        //     <progress-bar all-stories="12" stories-in-state="2" state="Defined"></progress-bar>
        //     <progress-bar all-stories="12" stories-in-state="1" state="In Progress"></progress-bar>
        //     <progress-bar all-stories="12" stories-in-state="1" state="Dev Complete"></progress-bar>
        //     <progress-bar all-stories="12" stories-in-state="0" state="In Testing"></progress-bar>
        //     <progress-bar all-stories="12" stories-in-state="0" state="Complete"></progress-bar>
        //     <a id="ShowBlockedStories" class="StoryPopoverTrigger" href="javascript:void(0))"><progress-bar all-stories="12" stories-in-state="1" state="Blocked"></progress-bar></a>

        //     <div class="progress-bar-popover">
        //         <jira-issue issue-id="(B2)-5821" href="https://jirasw.t-mobile.com/secure/RapidBoard.jspa?rapidView=8021&view=detail&selectedIssue=BSWMDBN2-5821" owner="Jurusz, Jason" owner-email="jason.jurusz@sprint.com" avatar="url(https://assets.codepen.io/678043/MMG7.jpg)" storypoints="5" state="Defined">Jira Issue Title</jira-issue>
        //         <jira-issue issue-id="(B2)-5821" href="https://jirasw.t-mobile.com/secure/RapidBoard.jspa?rapidView=8021&view=detail&selectedIssue=BSWMDBN2-5821" owner="Jurusz, Jason" owner-email="jason.jurusz@sprint.com" avatar="url(https://assets.codepen.io/678043/MMG7.jpg)" storypoints="5" state="Defined">Jira Issue Title</jira-issue>
        //         <jira-issue issue-id="(B2)-5821" href="https://jirasw.t-mobile.com/secure/RapidBoard.jspa?rapidView=8021&view=detail&selectedIssue=BSWMDBN2-5821" owner="Jurusz, Jason" owner-email="jason.jurusz@sprint.com" avatar="url(https://assets.codepen.io/678043/MMG7.jpg)" storypoints="5" state="Defined">Jira Issue Title</jira-issue>
        //     </div>
        // </div>  
            

            return markup;
        }

        
        connectedCallback() { // (2)
            if (!this.rendered) {
                this.render();
                this.rendered = true;
            }
        }

        static get observedAttributes() { // (3)
            return this.monitoredProperties;
        }
        
        attributeChangedCallback(name, oldValue, newValue) { // (4)
            if(newValue !== this.props[name] || newValue !== oldValue) {
                this.props[name] = newValue;
                this.render();
            }
        }
    }
    /* let the browser know that <my-element> is served by our new class */
    customElements.define('report-widget', ReportWidget);

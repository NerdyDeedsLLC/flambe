
import {startOfDay, isWeekend, addDays, differenceInDays, formatISO} from 'date-fns'

export default class DataRetriever {
    #credentials
    
    
    set credentials(credentialData){
        if(credentialData==null) throw new SyntaxError('Missing credential data!');
        credentialData = [credentialData].flat();
        if(!Array.isArray(credentialData) || credentialData.length <= 0){
            throw new SyntaxError('Unparseable credential data! Data must come in a BASE64 encoded string or an array of format ["<userEmailAdddres>","<userPassword>"]. Instead, received: ' + credentialData);
        }else if(credentialData.length === 1){
            credentialData = credentialData[0];
        }else if(credentialData.length > 1){
            let credEmail = credentialData[0],
                credPWord = credentialData[1];
            credentialData = btoa(`${credEmail}:${credPWord}`);
        }
        this.#credentials = credentialData;
    } get credentials(){ return 'Basic ' + this.#credentials }
    
    constructor() {
        console.log('DataRetriever has initialized!');
        
        this.#credentials = '';
        this.loaderOverlay = null;

        
    }

    ready(){
        let isReady = (this.jql !== '' && this.credentials !== 'Basic ');
        if(!isReady) console.warn("The user's credentials have not been set (more likely), or the search JQL is missing (less likely) within the JDR. \n  - Either way, no fondue for you til you do.")
        else console.log("JDR has everything it needs. You're cleared to proceed!");
        return isReady;
    }
/*
    getXMLAsObj(xmlObj) {
        function getNodeAsArr(nodeChild) {
            var nodeObj = getXMLAsObj(nodeChild),
                nodeName = nodeChild.nodeName, finObj;
        
            // property names are unknown here,
            // and so for-loop is used
            if (Array.isArray(nodeObj)) {
                finObj = nodeObj;
            } else {
                finObj = [nodeObj];
            }
        
            return finObj;
        }
    
        // get a node's value redefined to accomodate
        // attributes
        function getWithAttributes(val, node) {
            var attrArr = node.attributes, attr, x, newObj;
            if (attrArr) {
                if (Array.isArray(val)) {
                newObj = val;
                } else if (typeof val === 'object') {
                newObj = val;
                for (x = attrArr.length; x--;) {
                    val[attrArr[x].name] = attrArr[x].nodeValue;
                }                        
                } else if (typeof val === 'string') {
                if (attrArr.length) {
                    newObj = {};
                    for (x = attrArr.length; x--;) {
                    if (val) {
                        newObj[attrArr[x].nodeValue] = val;                  
                    } else {
                        newObj[attrArr[x].name] = attrArr[x].nodeValue;                  
                    }
                    }                                      
                }
                } else {
                newObj = val;
                }
            }
            return newObj || val;
        }
    
        function getXMLAsObj(node) {
            var nodeName, nodeType, 
                strObj = "", finObj = {}, isStr = true, x;
        
            if (node) {
                if (node.hasChildNodes()) {
                node = node.firstChild;
                do {
                    nodeType = node.nodeType;
                    nodeName = node.nodeName;
                    if (nodeType === 1) {
                    isStr = false;
                    // if array trigger, make this an array
                    if (nodeName.match(/Arr$/)) { 
                        finObj[nodeName] = getNodeAsArr(node);
                    } else if (finObj[nodeName]) { 
                        // if array already formed, push item to array
                        // else a repeated node, redefine this as an array
                        if (Array.isArray(finObj[nodeName])) {
                        // if attribute... define on first attribute
                        finObj[nodeName].push(
                            getWithAttributes(getXMLAsObj(node), node)
                        );
                        } else {
                        finObj[nodeName] = [finObj[nodeName]];
                        finObj[nodeName].push(
                            getWithAttributes(getXMLAsObj(node), node)
                        );
                        }
                    } else {
                        finObj[nodeName] = getWithAttributes(getXMLAsObj(node), node);
                    }
                    } else if (nodeType === 3) {
                    strObj += node.nodeValue;
                    }
                } while ((node = node.nextSibling));
                }
                return isStr ? strObj : finObj;
            }
        }
    
        return getXMLAsObj(xmlObj);
    }
    
    parseXMLObjData(xmlResults){
        console.log('parseXMLObjData(xmlResults) :', xmlResults);
        let xmlNode = new DOMParser().parseFromString(xmlResults, 'text/xml'),
            xmlJSON = this.getXMLAsObj(xmlNode),
            pulledIssues = xmlJSON.rss.channel.item,
            readableDate = new Date().toLocaleString();
    
        this.RAW_DATA_PULL = pulledIssues; // TODO: DELETE ME
    
        const mappings = {
            "issueId"              : "key.key",
            "assigneeName"         : "assignee.value",
            "assigneeEmail"        : "assignee.key",
            "component"            : "component",
            "created"              : "created",
            "description"          : "description",
            "issueKey"             : "key.value",
            "jiraIssueId"          : "key.key",
            "labels"               : "labels",
            "link"                 : "link",
            "parentJiraId"         : "",
            "priority"             : "priority",
            "project"              : "project",
            "reporter"             : "reporter.value",
            "retrevalReadable"     : "retrevalReadable",
            "retrevalStamp"        : "retrevalStamp",
            "status"               : "status.1.value",
            "statusColor"          : "statusCategory.value",
            "subtasks"             : "subtasks",
            "summary"              : "summary",
            "title"                : "title",
            "type"                 : "type.value",
            "timeestimate"         : "timeestimate.key",
            "timeoriginalestimate" : "timeoriginalestimate.key",
            "timespent"            : "timespent.key",
            "updated"              : "updated",
        }
    
        console.group('Parsing ingested issues from JIRA...');
        let parsedIssueDetails = [];
        pulledIssues.forEach((issue,ct)=>{
            Object.assign(issue, {retrevalStamp:Date.now(), retrevalReadable:readableDate}); 
            console.groupCollapsed("Retrieved issue " + ct + ":", issue.key);
            console.log('Raw Issue Data: ', issue);
            
            let parsedIssue = {};
            Object.entries(mappings).forEach(mapping=>{
                let localColumnName = mapping[0], 
                    mapsTo          = mapping[1].split('.'), 
                    jiraColumnName  = mapsTo[0],
                    mapsToValue     = issue[jiraColumnName], 
                    mapsToIndex;
    
                switch(mapsTo.length){
                    case 1:         // Exact 1:1 map with retrieved data
                        parsedIssue[localColumnName] = mapsToValue;
                        break;
                    case 2:         // Want either the key or the value of retrieved data (retrieved node is an object with ONE entry : {foo : bar}
                        mapsToIndex                  = mapsTo[1] === 'key' ? 0 : 1;
                        parsedIssue[localColumnName] = mapsToValue ? Object.entries(mapsToValue)[0][mapsToIndex] : null;
                        break;
                    case 3:        // Want key or the value of SOME NODE of retrieved data (retrieved node is an object with many entries: {foo:'bar', baz:'boo'}
                        mapsToIndex                  = mapsTo[2] === 'key' ? 0 : 1;
                        parsedIssue[localColumnName] = mapsToValue ? Object.entries(mapsToValue)[mapsTo[1]][mapsToIndex] : null;
                        break;
                }
            });
            console.log('Parsed Issue Data: ', parsedIssue);
            console.groupEnd()
            parsedIssueDetails.push(parsedIssue);
        });
        console.log('Parse Complete.', parsedIssueDetails);
        console.groupEnd();
        return parsedIssueDetails;
    }
*/
    getRetrieverURL(baseURL){return "http://0.0.0.0:8080/" + baseURL; }

    getRetrieverHeaders() {
        return new Promise((resolve, reject)=>{
            if(credentials.token == null) {
                console.error("🔴 TRANSACTION FAILURE! Credential token object missing, corrupt, or expired!")
                reject('Credential Token Missing!');
            }
            let myHeaders = new Headers();
            myHeaders.append("Authorization", credentials.token);
            myHeaders.append("Cookie", "AWSALB=tSqsQiDM6xRnwAkDJwVyfWO6WLbD5fP99ekmoh1YyJR5LQI1zIW766YFk9qyhb2xtY0WbXTxW2Qa52e2BOlrmg3czb+g7UEfWtNJ7B4BunZllYkTtOhOKeCQ3QeN; AWSALBCORS=tSqsQiDM6xRnwAkDJwVyfWO6WLbD5fP99ekmoh1YyJR5LQI1zIW766YFk9qyhb2xtY0WbXTxW2Qa52e2BOlrmg3czb+g7UEfWtNJ7B4BunZllYkTtOhOKeCQ3QeN; JSESSIONID=C433D78A8704BAFD74A2C854FB3A61E9; atlassian.xsrf.token=BM4R-2E5N-4QKW-6H2V_17257220f18a3eb7a0946a9dde40543156f4a144_lin");
            
            resolve({
                method: 'GET',
                headers: myHeaders,
                redirect: 'follow'
            });
        });
    }   

//     getJiraData(JQL=this.jql){
//         if(this.loaderOverlay == null) this.loaderOverlay = qs('#loading-overlay');
//         let constructedJQLQuery = "https://jirasw.t-mobile.com/sr/jira.issueviews:searchrequest-xml/temp/SearchRequest.xml?jqlQuery=" + JQL;
//         this.loaderOverlay.classList.toggle('on');
// 
//         this.getRetrieverHeaders()
//         .then(hdrs=>fetch(this.getRetrieverURL(constructedJQLQuery), hdrs))
//         .then(response => _(response.text()))
// 
//         .then(result   => window.lastTransaction = result)
//         .then(result   => this.parseXMLObjData(result))
//         .then(()       => this.loaderOverlay.classList.toggle('on'))
//         .catch(error   => console.error('error', error))
// 
// 
// // 
//         console.log('Constructing request...')
//         let xmlResults, retrieverHeaders = new Headers();
//         retrieverHeaders.append("Authorization", this.credentials);
//         
//         let requestOptions = {
//           method: 'GET',
//           headers: retrieverHeaders,
//           redirect: 'follow'
//         };
//         
//         console.log('Performing requested retrieval...')
// //         return fetch("http://0.0.0.0:8080/https://jirasw.t-mobile.com/sr/jira.issueviews:searchrequest-xml/temp/SearchRequest.xml?jqlQuery=" + JQL, requestOptions)
// //           .then(response => {
// //               let jiraResponseBody = response.text();
// //               console.log('Data retrieved!', jiraResponseBody);
// //               return jiraResponseBody;
// //           })
//           .then(result => this.parseXMLObjData(result))
//           .then(()=>this.loaderOverlay.classList.toggle('on'))
//           .catch(error => console.error('error', error));
    // }

    seedSprints(){
        let spo = qs('#sprint');
        spo.options.length = 2;
        return fondutabase.select('SELECT * FROM sprints')
                .then(result=>spo.insertAdjacentHTML('beforeEnd', 
                result.map(sp=>`<option value="${sp.sprintId}" data-jiraid="${sp.jiraId}" data-start="${new Date(sp.startDate).toISOString().slice(0, 10)}" data-end="${new Date(sp.endDate).toISOString().slice(0, 10)}">${sp.name}</option>`).reverse().join()))
    }

    datestampDataRetrieval(tablePulled) {
        let pullLog = {key:tablePulled, value:(Date.now() + fondue.PREFS.caching.ttl)}
        fondutabase.overwrite('config', pullLog);
    }

    // Returning TRUE means the data is STILL VALID
    checkDataDateStamp(tableSought) {
        console.log('checkDataDateStamp(tableSought) :', tableSought);
        return fondutabase.select('SELECT * FROM config WHERE config.key=' + tableSought)
        .then(results=>!!(results && results.length && results[0] && results[0].value >= Date.now()));
    }



    getJiraProperties(property, purgeBeforeRetrieval=false){
        //// return;// FIXME: IN PLACE FOR TESTING
        if(this.loaderOverlay == null) this.loaderOverlay = qs('#loading-overlay');
        let availableProps = {
            teams: {
                url: 'https://jirasw.t-mobile.com/rest/api/2/project/BSWMDBN2/components',
                destination:'teams',
                cleanup: records=>{
                    return elideObjectKeys(JSON.parse(records).filter(rec=>!rec.archived), ['id', 'name', 'description'], true).map(rec=> {
                        rec = Object.assign(rec, {jiraID:rec.id}); 
                        delete(rec.id); 
                        return rec;
                    });
                },
                callBack: ()=>{} //this.seedSprints
            },
            sprints: {
                url: 'https://jirasw.t-mobile.com/rest/agile/1.0/board/8455/sprint?maxResults=150',
                destination:'sprints',
                cleanup: records=>{
                console.log('records :', records);
                    records = JSON.parse(records).values;
                    window.toInsert = [];
                    records.forEach(sprint=>{
                        
                        
                        sprint = Object.assign( sprint, 
                                               {jiraId: sprint.id, 
                                                startDate:              sprint.startDate ? (new Date(sprint.startDate)) : null, 
                                                endDate:                sprint.endDate ? (new Date(sprint.endDate)) : null, 
                                                activatedDate:          sprint.activatedDate ? (new Date(sprint.activatedDate)) : null, 
                                                completeDate:           sprint.completeDate ? (new Date(sprint.completeDate)) : null,
                                                // pullAssociations: new Array((isNaN(dayGap) ? null : dayGap))
                                            });
                        delete(sprint.self);
                        delete(sprint.id);
                        
                        toInsert.push(sprint);
                    })
                    toInsert = toInsert.map(sprint=>{
                        let dayGap   = differenceInDays((new Date(sprint.endDate)), new Date(sprint.startDate));
                        let running  = startOfDay(new Date(sprint.startDate));
                        let end      = startOfDay(new Date(sprint.endDate));
                        let workable = [];
                        let breaker  = 0;

                        for(var i=0; i<=dayGap; i++){
                            if(!isWeekend(running)) workable.push(formatISO(running, { representation: 'date' }));
                            console.log('running :', running);
                            running = addDays(running, 1);
                        }
                        return Object.assign(sprint, {
                                                        workableDaysInSprint:   workable.length > 0 ? workable.join('|') : '',
                                                        workableDaysCount:      workable.length,
                                                        sprintLengthInDays:     dayGap
                                                
                        });
                    })
                    console.log('toInsert :', toInsert);
                    return toInsert
                    
                },
                callBack: this.seedSprints
            }
        }

        
        console.log('getJiraProperties :', availableProps[property], '\nstampCheck:');
        
        this.loaderOverlay.classList.toggle('on');
        
        

        return  this.checkDataDateStamp(availableProps[property].destination)
                .then(result => {
                    console.log('Last Update Check:', result);
                    if(result != true) {
                        console.log(availableProps[property].destination + ' not found!');
                        return this.getRetrieverHeaders()
                            .then(hdrs     => fetch(this.getRetrieverURL(availableProps[property].url), hdrs))
                            .then(response => response.text())
                            .then(result   => window.lastTransaction = result)
                            .then(result   => {fondutabase.delete(availableProps[property].destination); return result; })
                            .then(result   => fondutabase.overwrite(availableProps[property].destination, availableProps[property].cleanup(result)))
                            .then(result   => availableProps[property].callBack(result))
                            .then(()       => this.datestampDataRetrieval(availableProps[property].destination))
                            .then(()       => this.loaderOverlay.classList.toggle('on'))
                            .catch(error   => console.error('error', error))
                    } else {
                        console.log(availableProps[property].destination + ' found!');
                        return availableProps[property].callBack(result)
                        .then(()       => this.loaderOverlay.classList.toggle('on'))
                        .catch(error   => console.error('error', error))
                    }
                });
    }
}

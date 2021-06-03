
export default class DataRetriever {
    #jql
    #credentials

    set jql(jqlString){ 
        if(jqlString == null || jqlString === '') jqlString = `component in ("BSWMBE:Hot team", "BSWMDBN2:DB Scrum And Coke", "BSWMDBN2:DB Techquilla", "BSWMDBN2:Scrum Punch", "BSWMDBN2:DB Scrum Runner") AND Sprint in openSprints()`;
    } get jql() { 
        function jiraEncodeURI(uri){ // No, I'm not a moron. I'm aware of encodeURIComponent. It's simply that Jira wants CERTAIN rules processed, and others not.
            return uri.replace(/[ \s]+/g, '+')    // Replace...     ' ' (spaces)
                      .replace(/:/g,      '%3A')  //                ':' (colons)
                      .replace(/,/g,      '%2C')  //                ',' (commas)
                      .replace(/"/g,      '%22')  //                '"' (quotes)
                      .replace(/\(/g,     '%28')  //                '(' (open parentheses)
                      .replace(/\)/g,     '%29'); //                ')' (close parentheses)
        }
        return jiraEncodeURI(this.#jql) + '&tempMax=1000' 
    }
    
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
        this.#jql = `component in ("BSWMBE:Hot team", "BSWMDBN2:DB Scrum And Coke", "BSWMDBN2:DB Techquilla", "BSWMDBN2:Scrum Punch", "BSWMDBN2:DB Scrum Runner") AND Sprint in openSprints()`;
        this.#credentials = '';
        this.loaderOverlay = null;
    }

    ready(){
        let isReady = (this.jql !== '' && this.credentials !== 'Basic ');
        if(!isReady) console.warn("The user's credentials have not been set (more likely), or the search JQL is missing (less likely) within the JDR. \n  - Either way, no fondue for you til you do.")
        else console.log("JDR has everything it needs. You're cleared to proceed!");
        return isReady;
    }

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

    getJiraData(JQL=this.jql){
        if(this.loaderOverlay == null) this.loaderOverlay = qs('#loading-overlay');
        this.loaderOverlay.classList.toggle('on');
        console.log('Constructing request...')
        let xmlResults, myHeaders = new Headers();
        myHeaders.append("Authorization", this.credentials);
        
        let requestOptions = {
          method: 'GET',
          headers: myHeaders,
          redirect: 'follow'
        };
        
        console.log('Performing requested retrieval...')
        return fetch("http://0.0.0.0:8080/https://jirasw.t-mobile.com/sr/jira.issueviews:searchrequest-xml/temp/SearchRequest.xml?jqlQuery=" + JQL, requestOptions)
          .then(response => {
              let jiraResponseBody = response.text();
              console.log('Data retrieved!', jiraResponseBody);
              return jiraResponseBody;
          })
          .then(result => this.parseXMLObjData(result))
          .then(()=>this.loaderOverlay.classList.toggle('on'))
          .catch(error => console.error('error', error));
    }

    seedSprints(){
        let spo = qs('#sprint');
        spo.options.length = 2;
        return fondutabase.select('SELECT * FROM sprints')
                .then(result=>spo.insertAdjacentHTML('beforeEnd', 
                                                    _(result.map(sp=>`<option value="${sp.sprintId}" data-jiraid="${sp.jiraId}">${sp.name}</option>`).reverse().join())))
    }

    getJiraProperties(property, purgeBeforeRetrieval=false){
        if(this.loaderOverlay == null) this.loaderOverlay = qs('#loading-overlay');
        let availableProps = {
            components: {
                url: 'https://jirasw.t-mobile.com/rest/api/2/project/BSWMDBN2/components'
            },
            projects: {
                url: 'https://jirasw.t-mobile.com/rest/api/2/project/BSWMDBN2/components'
            },
            sprints: {
                url: 'https://jirasw.t-mobile.com/rest/agile/1.0/board/8455/sprint?maxResults=150',
                destination:'sprints',
                cleanup: records=>{
                    records = JSON.parse(records).values;
                    window.toInsert = []
                    records.forEach(sprint=>{
                        let dayGap = daysApart(new Date(sprint.startDate), new Date(sprint.endDate));
                        sprint = Object.assign( sprint, 
                                               {jiraId: sprint.id, 
                                                startDate:      sprint.startDate ? (new Date(sprint.startDate)) : null, 
                                                endDate:        sprint.endDate ? (new Date(sprint.endDate)) : null, 
                                                activatedDate:  sprint.activatedDate ? (new Date(sprint.activatedDate)) : null, 
                                                completeDate:   sprint.completeDate ? (new Date(sprint.completeDate)) : null
                                                ,sprintLengthInDays: dayGap
                                                // pullAssociations: new Array((isNaN(dayGap) ? null : dayGap))
                                            });
                        delete(sprint.self);
                        delete(sprint.id);
                        
                        toInsert.push(sprint);
                    })
                    return toInsert
                    // fondutabase.insert('sprints', toInsert);
                },
                callBack: this.seedSprints
            }
        }

        let destinationURL = "http://0.0.0.0:8080/" + availableProps[property].url;
        
        console.log('getJiraProperties :', availableProps[property]);
        
        this.loaderOverlay.classList.toggle('on');

        if(purgeBeforeRetrieval) fondutabase.delete(availableProps[property].destination)
        


        var myHeaders = new Headers();
        myHeaders.append("Authorization", credentials.token);
        myHeaders.append("Cookie", "AWSALB=K37aW7IayNAZyw3YsfiK4n4kDwonfAMJj6rAkKatjwdPnqt2nF7GrONtjmoe7bVPxjNBlVeWEesQ7y0jYEyalq8+0FYMK3C1QWvQeVfHKwvH2nF3CVQcAhbqhBHt; AWSALBCORS=K37aW7IayNAZyw3YsfiK4n4kDwonfAMJj6rAkKatjwdPnqt2nF7GrONtjmoe7bVPxjNBlVeWEesQ7y0jYEyalq8+0FYMK3C1QWvQeVfHKwvH2nF3CVQcAhbqhBHt; JSESSIONID=E31D87E6EB6D1038466AB6A32D31E9C2; atlassian.xsrf.token=BM4R-2E5N-4QKW-6H2V_091fc0aa625d0da3c8a0964cecd6ae6f466e258e_lin");

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        return  fetch(destinationURL, requestOptions)
                .then(response => response.text())
                .then(result   => window.lastTransaction = result)
                .then(result   => fondutabase.overwrite(availableProps[property].destination, availableProps[property].cleanup(result)))
                .then(result   => availableProps[property].callBack(result))
                .then(()       => this.loaderOverlay.classList.toggle('on'))
                .catch(error   => console.error('error', error));
    }
}

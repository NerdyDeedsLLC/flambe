export default class SprintRetriever {
    #jql

    set jql(jqlString){ 
        if(jqlString == null || jqlString === '') jqlString = `component in ("BSWMBE:Hot team", "BSWMDBN2:DB Scrum And Coke", "BSWMDBN2:DB Techquilla", "BSWMDBN2:Scrum Punch", "BSWMDBN2:DB Scrum Runner") AND Sprint in openSprints()`;
        this.#jql = jqlString
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

    constructor(...props) {
        this.props = props;
        this.#jql = `component in ("BSWMBE:Hot team", "BSWMDBN2:DB Scrum And Coke", "BSWMDBN2:DB Techquilla", "BSWMDBN2:Scrum Punch", "BSWMDBN2:DB Scrum Runner") AND Sprint in openSprints()`;
        this.mostRecentStamp = null;
        this.mostRecentSlotObj = null;
    }

    getXMLAsObj(xmlObj) {
        function getNodeAsArr(nodeChild) {
            var nodeObj  = getXMLAsObj(nodeChild),
                // nodeName = nodeChild.nodeName,
                finObj;

            if (Array.isArray(nodeObj)) {
                finObj = nodeObj;
            } else {
                finObj = [nodeObj];
            }

            return finObj;
        }

        // get a node's value redefined to accomodate attributes
        function getWithAttributes(val, node) {
            var attrArr = node.attributes,
                attr, x, newObj;
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
                strObj = "",
                finObj = {},
                isStr = true,
                x;

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

    
    parseXMLObjData(xmlResults) {
        var xmlNode = new DOMParser().parseFromString(xmlResults, 'text/xml')
        let xmlJSON = this.getXMLAsObj(xmlNode),
            retrevalStamp        = Date.now(),
            retrevalReadable     = new Date().toISOString();
        // console.log('xmlJSON :', xmlJSON);
        // console.log('xmlJSON.rss :', xmlJSON.rss);
        // console.log('xmlJSON.rss.channel :', xmlJSON.rss.channel);
        let pulledIssues = xmlJSON.rss.channel.item;
        window.RAW_ISSUES = pulledIssues;
        let readableDate = new Date().toLocaleString();
    
        const mappings = {
            "issueId"              : "key.key",
            "assigneeName"         : "assignee.value",
            "assigneeEmail"        : "assignee.key",
            "component"            : "component",
            "created"              : "created",
            "description"          : "description",
            "issueKey"             : "key.value",
            "jiraIssueId"          : "key.key",
            "labels"               : "labels.label...*",
            "link"                 : "link",
            "parentJiraId"         : "",
            "priority"             : "priority.0.value",
            "project"              : "project.1.key",
            "reporter"             : "reporter.value",
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
    
        console.groupCollapsed("Parsing response payload from JIRA's &^%@!$-ed-up version of XML into something the REST of the world can use...");
        let parsedIssueDetails = [];
        pulledIssues.forEach((issue, ct) => {
            Object.assign(issue, {
                retrevalStamp: Date.now(),
                retrevalReadable: readableDate
            });
            console.groupCollapsed("Retrieved issue " + ct + ":", issue.key);
            console.log('Raw Issue Data: ', issue);
    
            let parsedIssue = {};
            Object.entries(mappings).forEach(mapping => {
                let localColumnName = mapping[0],
                    mapsTo = mapping[1].split('.'),
                    jiraColumnName = mapsTo[0],
                    mapsToValue = issue[jiraColumnName],
                    mapsToIndex;
    
                switch (mapsTo.length) {
                    case 1: // Exact 1:1 map with retrieved data
                        parsedIssue[localColumnName] = mapsToValue;
                        break;
                    case 2: // Want either the key or the value of retrieved data (retrieved node is an object with ONE entry : {foo : bar}
                        mapsToIndex = mapsTo[1] === 'key' ? 0 : 1;
                        parsedIssue[localColumnName] = mapsToValue ? Object.entries(mapsToValue)[0][mapsToIndex] : null;
                        break;
                    case 3: // Want key or the value of SOME NODE of retrieved data (retrieved node is an object with many entries: {foo:'bar', baz:'boo'}
                        mapsToIndex = mapsTo[2] === 'key' ? 0 : 1;
                        parsedIssue[localColumnName] = mapsToValue ? Object.entries(mapsToValue)[mapsTo[1]][mapsToIndex] : null;
                        break;
                    case 5:
                        let valArr           = mapsToValue[mapsTo[1]],
                            stringifiedArray = null;
                        console.log('mapsTo :', mapsTo, 'valArr :', valArr, 'Array.isArray(valArr) : ', Array.isArray(valArr));
                        if(Array.isArray(valArr)){
                            if(mapsTo[4] === '*') stringifiedArray = valArr.flat().join(',');
                            if(mapsTo[4] === '#') stringifiedArray = valArr.length;
                        }
                        parsedIssue[localColumnName] = stringifiedArray;
                        break;
                }
            });
            console.log('Parsed Issue Data: ', parsedIssue);
            console.groupEnd()
            this.mostRecentStamp = new Date(retrevalStamp);
            parsedIssueDetails.push(Object.assign(parsedIssue, {
                "retrievedFor"         : fondue.ExtantSprintID,
                "retrievedForSlot"     : fondue.TransactionSlot,
                "retrevalStamp"        : new Date(retrevalStamp),
                "retrevalReadable"     : retrevalReadable,
                "created": new Date(parsedIssue.created),
                "updated": new Date(parsedIssue.updated),
            }));
        });
        console.log('Parse Complete.', parsedIssueDetails);
        console.groupEnd();
        return parsedIssueDetails;
    }

    headers = () => {
        return new Promise((resolve, reject)=>{
            console.group('Performing data retrieval from JIRA -------------------------------');
            if(credentials.token == null) {
                throw("🔴 TRANSACTION FAILURE! Credential token object missing, corrupt, or expired!")
            }
            _I('(JQL:', this.#jql, ')');
            _I('  - Constructing request headers... done.\n  - Constructing request body... done. \n  - Initializing XHR request with specified JQL... OK.\n  - Executing...')
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

    query(jqlString, callback){
        this.jql = jqlString;
        this.retrieve(callback);
        this.jql = '';
    }

    storeDataRetrieval(resultsCollection){
        fondutabase.insert('issues', resultsCollection);
    }

    performRetrieve(){
        return    this.headers()
        .then(headerObj=>fetch("http://127.0.0.1:1337/https://jirasw.t-mobile.com/sr/jira.issueviews:searchrequest-xml/temp/SearchRequest.xml?jqlQuery=" + this.jql + "&tempMax=1000", headerObj))
        .then(response => console.log('🟢 SUCCESS!... response received!') && console.log('\n\n  - Decoding response & parsing...') || response.text())
        .then(result => window.LAST_RAW_RETRIEVE = result)
        .then(result => window.LAST_RETRIEVE = this.parseXMLObjData(result))
        .then(result => console.log('🟢 SUCCESS!... data successfully retrieved and parsed.') || result)
        .catch(error => {console.error('🔴 FAILURE! An Error occurred in SprintRetriever.js. Details are as follows:\n', error); throw new Error(error); })
        
    }

    retrieve(slotObj) {
        this.mostRecentSlotObj = slotObj;
        return this.performRetrieve()
        .then(result => console.log('  - Attempting to write to Fondutabase...') || this.storeDataRetrieval(result))
        .then(result => console.log('🟢 SUCCESS!... all retrieved issues written to data store.') || result)
        .then(result => console.log('🟢 COMPLETE!') &&  console.groupEnd() || result)
        .then(result => qs('input', slotObj).value="Retrieved :: " + this.mostRecentStamp)
        .catch(error => {console.error('🔴 FAILURE! An Error occurred in SprintRetriever.js. Details are as follows:\n', error); throw new Error(error); })
    }
        

}

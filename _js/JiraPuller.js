// class JiraPuller {
//     constructor() {
//         this._jql = '';
//         this._credentials = '';
//     }

//     set jql(jqlString){ 
//         if(jqlString == null || jqlString === '') jqlString = `component in ("BSWMBE:Hot team", "BSWMDBN2:DB Scrum And Coke", "BSWMDBN2:DB Techquilla", "BSWMDBN2:Scrum Punch", "BSWMDBN2:DB Scrum Runner") AND Sprint in openSprints()`;
//         this._jql = '?jqlQuery=' + encodeURIComponent(jqlString) + '&tempMax=1000';
//     } get jql() { return this._jql }
    
//     set credentials([credentialData]){
//         if(credentialData==null || !Array.isArray(credentialData) || credentialData.length <= 0){
//             throw new SyntaxError('Missing credential data!');
//         }else if(credentialData.length > 1){
//             let credEmail = credentialData[0],
//                 credPWord = credentialData[1];
//             credentialData = btoa(`${credEmail}:${credPWord}`);
//         }else if(credentialData.length === 1){
//             credentialData = credentialData[0];
//         }
//         this._credentials = credentialData;
//     } get credentials(){ return this._credentials }

//     test(){
//         console.log('Yep! I\'m loaded!')
//         }

//     getXMLAsObj(xmlObj) {
//         function getNodeAsArr(nodeChild) {
//         var nodeObj = getXMLAsObj(nodeChild),
//             nodeName = nodeChild.nodeName, finObj;
    
//         // property names are unknown here,
//         // and so for-loop is used
//         if (Array.isArray(nodeObj)) {
//             finObj = nodeObj;
//         } else {
//             finObj = [nodeObj];
//         }
    
//         return finObj;
//         }
    
//         // get a node's value redefined to accomodate
//         // attributes
//         function getWithAttributes(val, node) {
//         var attrArr = node.attributes, attr, x, newObj;
//         if (attrArr) {
//             if (Array.isArray(val)) {
//             newObj = val;
//             } else if (typeof val === 'object') {
//             newObj = val;
//             for (x = attrArr.length; x--;) {
//                 val[attrArr[x].name] = attrArr[x].nodeValue;
//             }                        
//             } else if (typeof val === 'string') {
//             if (attrArr.length) {
//                 newObj = {};
//                 for (x = attrArr.length; x--;) {
//                 if (val) {
//                     newObj[attrArr[x].nodeValue] = val;                  
//                 } else {
//                     newObj[attrArr[x].name] = attrArr[x].nodeValue;                  
//                 }
//                 }                                      
//             }
//             } else {
//             newObj = val;
//             }
//         }
//         return newObj || val;
//         }
    
//         function getXMLAsObj(node) {
//         var nodeName, nodeType, 
//             strObj = "", finObj = {}, isStr = true, x;
    
//         if (node) {
//             if (node.hasChildNodes()) {
//             node = node.firstChild;
//             do {
//                 nodeType = node.nodeType;
//                 nodeName = node.nodeName;
//                 if (nodeType === 1) {
//                 isStr = false;
//                 // if array trigger, make this an array
//                 if (nodeName.match(/Arr$/)) { 
//                     finObj[nodeName] = getNodeAsArr(node);
//                 } else if (finObj[nodeName]) { 
//                     // if array already formed, push item to array
//                     // else a repeated node, redefine this as an array
//                     if (Array.isArray(finObj[nodeName])) {
//                     // if attribute... define on first attribute
//                     finObj[nodeName].push(
//                         getWithAttributes(getXMLAsObj(node), node)
//                     );
//                     } else {
//                     finObj[nodeName] = [finObj[nodeName]];
//                     finObj[nodeName].push(
//                         getWithAttributes(getXMLAsObj(node), node)
//                     );
//                     }
//                 } else {
//                     finObj[nodeName] = getWithAttributes(getXMLAsObj(node), node);
//                 }
//                 } else if (nodeType === 3) {
//                 strObj += node.nodeValue;
//                 }
//             } while ((node = node.nextSibling));
//             }
//             return isStr ? strObj : finObj;
//         }
//         }
    
//         return getXMLAsObj(xmlObj);
//     }
    
//     parseXMLObjData(xmlResults){
//         let xmlNode = new DOMParser().parseFromString(xmlResults, 'text/xml'),
//             xmlJSON = getXMLAsObj(xmlNode),
//             pulledIssues = xmlJSON.rss.channel.item,
//             readableDate = new Date().toLocaleString();
    
//         this.RAW_DATA_PULL = pulledIssues; // TODO: DELETE ME
    
//         const mappings = {
//             "issueId"              : "key.key",
//             "assigneeName"         : "assignee.value",
//             "assigneeEmail"        : "assignee.key",
//             "component"            : "component",
//             "created"              : "created",
//             "description"          : "description",
//             "issueKey"             : "key.value",
//             "jiraIssueId"          : "key.key",
//             "labels"               : "labels",
//             "link"                 : "link",
//             "parentJiraId"         : "",
//             "priority"             : "priority",
//             "project"              : "project",
//             "reporter"             : "reporter.value",
//             "retrevalReadable"     : "retrevalReadable",
//             "retrevalStamp"        : "retrevalStamp",
//             "status"               : "status.1.value",
//             "statusColor"          : "statusCategory.value",
//             "subtasks"             : "subtasks",
//             "summary"              : "summary",
//             "title"                : "title",
//             "type"                 : "type.value",
//             "timeestimate"         : "timeestimate.key",
//             "timeoriginalestimate" : "timeoriginalestimate.key",
//             "timespent"            : "timespent.key",
//             "updated"              : "updated",
//         }
    
//         console.group('Parsing ingested issues from JIRA...');
//         let parsedIssueDetails = [];
//         pulledIssues.forEach((issue,ct)=>{
//             Object.assign(issue, {retrevalStamp:Date.now(), retrevalReadable:readableDate}); 
//             console.groupCollapsed("Retrieved issue " + ct + ":", issue.key);
//             console.log('Raw Issue Data: ', issue);
            
//             let parsedIssue = {};
//             Object.entries(mappings).forEach(mapping=>{
//                 let localColumnName = mapping[0], 
//                     mapsTo          = mapping[1].split('.'), 
//                     jiraColumnName  = mapsTo[0],
//                     mapsToValue     = issue[jiraColumnName], 
//                     mapsToIndex;
    
//                 switch(mapsTo.length){
//                     case 1:         // Exact 1:1 map with retrieved data
//                         parsedIssue[localColumnName] = mapsToValue;
//                         break;
//                     case 2:         // Want either the key or the value of retrieved data (retrieved node is an object with ONE entry : {foo : bar}
//                         mapsToIndex                  = mapsTo[1] === 'key' ? 0 : 1;
//                         parsedIssue[localColumnName] = mapsToValue ? Object.entries(mapsToValue)[0][mapsToIndex] : null;
//                         break;
//                     case 3:        // Want key or the value of SOME NODE of retrieved data (retrieved node is an object with many entries: {foo:'bar', baz:'boo'}
//                         mapsToIndex                  = mapsTo[2] === 'key' ? 0 : 1;
//                         parsedIssue[localColumnName] = mapsToValue ? Object.entries(mapsToValue)[mapsTo[1]][mapsToIndex] : null;
//                         break;
//                 }
//             });
//             console.log('Parsed Issue Data: ', parsedIssue);
//             console.groupEnd()
//             parsedIssueDetails.push(parsedIssue);
//         });
//         console.log('Parse Complete.', parsedIssueDetails);
//         console.groupEnd();
//         return parsedIssueDetails;
//     }

//     getJiraData(JQL){
//         console.log('Constructing request...')
//         let xmlResults, myHeaders = new Headers();
//         myHeaders.append("Authorization", "Basic " + credentialData);
//         myHeaders.append("Cookie", "AWSALB=tSqsQiDM6xRnwAkDJwVyfWO6WLbD5fP99ekmoh1YyJR5LQI1zIW766YFk9qyhb2xtY0WbXTxW2Qa52e2BOlrmg3czb+g7UEfWtNJ7B4BunZllYkTtOhOKeCQ3QeN; AWSALBCORS=tSqsQiDM6xRnwAkDJwVyfWO6WLbD5fP99ekmoh1YyJR5LQI1zIW766YFk9qyhb2xtY0WbXTxW2Qa52e2BOlrmg3czb+g7UEfWtNJ7B4BunZllYkTtOhOKeCQ3QeN; JSESSIONID=C433D78A8704BAFD74A2C854FB3A61E9; atlassian.xsrf.token=BM4R-2E5N-4QKW-6H2V_17257220f18a3eb7a0946a9dde40543156f4a144_lin");
        
//         let requestOptions = {
//           method: 'GET',
//           headers: myHeaders,
//           redirect: 'follow'
//         };
        
//         console.log('Performing requested retrieval...')
//         return fetch("http://0.0.0.0:8080/https://jirasw.t-mobile.com/sr/jira.issueviews:searchrequest-xml/temp/SearchRequest.xml" + this.JQL, requestOptions)
//           .then(response => console.log('Data retrieved!') || response.text())
//           .then(result => parseXMLObjData(result))
//           .catch(error => console.error('error', error));
//     }
// }

// let jiraPuller = new JiraPuller();
function test(){alert(1)};
console.log('ATTEMPTING EXPORT OF FUNCTION test', test);
export {test}
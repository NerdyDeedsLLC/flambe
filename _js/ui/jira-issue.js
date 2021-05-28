/*
    SAMPLE USAGE    
    <jira-issue issue-id = "ISSUE-01" href = "http : //path.to/issue/in/jira" owner = "LastName, FirstName" owner-email = "owner@email.address" avatar = "url(http : //path.to/pic)" storypoints = "5" state = "Defined">Jira Issue Title</jira-issue>
        issue-id    : The jira-issued id for the issue/story being rendered
        href        : The URL() to the story IN jira
        owner       : The person assigned to the task
        owner-email : That person's email address
        avatar      : The URL() to the avatar being used by that person IN Jira
        storypoints : The stroypoint value of the issue
        state       : The current progress state the story is resting in
        
*/
export default class JiraIssue extends HTMLElement {
    render() {
        this.style.setProperty("--issue-id",    "'" + (this.getAttribute('issue-id')    || '') + "'");
        this.style.setProperty("--owner",       "'" + (this.getAttribute('owner')       || '') + "'");
        this.style.setProperty("--owner-email", "'" + (this.getAttribute('owner-email') || '') + "'");
        this.style.setProperty("--storypoints", "'" + (this.getAttribute('storypoints') || '') + "'");
        this.style.setProperty("--avatar",      this.getAttribute('avatar'));
        this.style.setProperty("--state",       "'" + (this.getAttribute('state')       || '') + "'");

        this.innerHTML = `<a href="${ this.getAttribute('href') }">${this.innerText}</a>`;
    }
    
    connectedCallback() { // (2)
        if (!this.rendered) {
            this.render();
            this.rendered = true;
        }
    }
    
    static get observedAttributes() { // (3)
        return ['issue-id', 'href', 'owner', 'owner-email', 'avatar', 'storypoints', 'state'];
    }
    
    attributeChangedCallback(name, oldValue, newValue) { // (4)
        this.render();
    }
}
/* let the browser know that <my-element> is served by our new class */
customElements.define('jira-issue', JiraIssue);

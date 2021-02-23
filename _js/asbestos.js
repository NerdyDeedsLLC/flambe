class Asbestos {
    constructor() {
        this.list = [];
        this.dialog       = null
        this.displayPanel = null;
    }

    init() {
        document.body.insertAdjacentHTML('afterBegin', `<div id="osha-it">
            <header><span>DANGER!</span><button>+</button></header>
            <H1><b>Caution!</b> Achtung! Precaucíon!</H1>
            <div>
                <span class="osha"></span>
                <span class="oshacopy">
                    <h2>A.S.B.E.S.T.O.S.</h2>
                    <h3>ASSOCIATES SAND-BAGGING EVERYONES STORY TOTALS: ONGOING SPRINT</h3>
        
                    <ul id="asbestlist">
                        <b>Everybody's burning! We're good!</b>
                    </ul>
                </span>
            </div>
        </div>
        <div class="osha-blotter"></div>`);
        this.dialog       = document.querySelector("#osha-it");
        this.displayPanel = document.querySelector("#asbestlist");
        this.dialog.querySelector('button').addEventListener('click', ()=>this.hideAsbestos());
        window.setTimeout(()=>window.document.querySelector('.asbestos-trigger').addEventListener('click', ()=>window.asbestos.showAsbestos()), 3000);

    }

    showAsbestos(text = this.buildShitlist()) {
        if(text == null || text === "") return;
        let opPanel = document.querySelector("#asbestlist");
        opPanel.innerHTML = `<b>The following people have not burned this sprint:</b>${text}`;
        this.dialog.className = 'visible';
    }

    hideAsbestos() {
        this.dialog.className = '';
    }

    buildShitlist() {
        let sequences = {},
            assignees = [];
        fileBuffer
            .flatMap((r) => r.fileData)
            .forEach((issue) => {
                if (
                    issue == null ||
                    typeof issue["Issue key"] === "undefined"
                ) {
                    return;
                }
                assignees.push(issue["Assignee"]);
                var iss = issue["Issue key"];
                if (sequences[iss]) {
                    sequences[iss].push(issue);
                } else sequences[iss] = [issue];
            });
        assignees = [...new Set(assignees)];
        Object.values(sequences).forEach((seq) => {
            var startingEstHours = seq[0]["Remaining Estimate"],
                hoursBurnedAtSomePoint = seq.every(
                    (day) => day["Remaining Estimate"] >= startingEstHours
                ),
                finalAssignee = seq.reverse()[0]["Assignee"];
            seq.reverse();
            if (
                hoursBurnedAtSomePoint &&
                assignees.indexOf(finalAssignee) !== -1
            )
                assignees.splice(assignees.indexOf(finalAssignee), 1);
        });
        let rval = assignees.length > 0 ? teamDialog.performSubstitution(`<li>${assignees.join("</li><li>")}</li>`) : '';
        console.log('rval :', rval);
        return rval;
    }
}

window.asbestos = new Asbestos();
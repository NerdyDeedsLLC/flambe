import {differenceInCalendarDays} from "date-fns";

const fondue = top.window.fondue,
      monTxt=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],     // Month abbreviations

      dayTxt=['sun', 'mon','tue','wed','thu','fri','sat'],                                  // Day abbreviations

      spotOn=['Spot on!', 'Nailed it!', 'On point!', 'Dead-on!', 'Flawless victory!',       // Cheerful captions for beneath perfect points
              'On track!', 'On the money!', 'Cookin\' with gas!', 'On the nose!', 
              'Right as rain!', 'In the swing of it!', 'All systems: go!', 'BOOM, baby!', 
              'Peachy keen!', 'Hunky-dory!', 'In the swim!', 'Up to snuff!', 
              'In it to win it!', 'On the ball!', 'Kicking butt and taking names!',
              'Rockin\' it!', 'Coolsville, daddio!', 'Large and in charge!', 'A-OK!',
              'On target!', 'On the button!', 'Makin\' it look easy!', 'In full swing!',
              'Out in force!', 'Slayin\' it!', 'On the qui vive!', 'Smooth operators!',
              'Up to snuff!', 'Wicked smaaht!', 'Playing hardball!', 'Dilligence: Dued.',
              'Shooting for the stars!', 'Like rhinestone cowpersons!', 'Tricks missed: 0', 
              'Aiming for the bleachers!', 'G.O.A.T.\s, every one!', 'Laser-focused!', 
              'Bright & bushy (eyes & tails, respectively)', 'Playin\' for keeps!'],
      zeroPt=()=>spotOn[Math.floor(Math.random() * spotOn.length)];
      
let QryStr = {};
    document.location.search.split(/[?&]/g).forEach(ind=>{if(ind !== ""){ Object.assign(QryStr, Object.fromEntries([ind.split('=')])); }})

let dayta = QryStr.runningTotals.split('|').map(v=>v/3600);                                       // 8 Hours each day to graph

let workDatesInSprint  = fondue.slotDates;                                       // the first date listed here should be 6/14/21

              
class BurndownChart {
    constructor(props) {
        console.clear();
        this.props = props;
        this.rerunGraph()

        this.plotSpoilers = this.plotSpoilers.bind(this);
}

    rerunGraph() {
        this.setDefaultValuesForClass();
        this.renderBaseSVGintoPage();
        this.renderOverflowMasks();
        this.renderSprintDataGradientMaskedPlates();
        this.generateIdeal();
        this.renderSprintDataGradients();
        this.generateHeaders()
        this.labelAxis()
    }


    setDefaultValuesForClass(){
        if(this.props) Object.assign(this, this.props);
        
        this.dayta             = this.props.dailyHourTotals
        
        this.workDatesInSprint = this.props.datesToGraph.map(inputDate =>  new Date(inputDate + ' ') || null);
                
        this.graphObjectSVG    = null
        this.graphSVGDefs      = null
        this.isIntialized      = false
        
        this.sprintSeedDate    = this.workDatesInSprint[0];
        this.firstDateInSprint = this.workDatesInSprint[1];
        this.lastDateInSprint  = this.workDatesInSprint[this.workDatesInSprint.length - 1];
        this.sprintSeedDate= workDatesInSprint
        this.topMargin         = 100;                                                       // Number of pixels above the graph area in addition to baseResolution
        this.leftMargin        = 100;                                                       // Number of pixels to the left of the graph area in addition to baseResolution
        this.bottomMargin      = 100;                                                       // Number of pixels below the graph area in addition to baseResolution
        this.rightMargin       = 5;                                                         // Number of pixels to the right of the graph area in addition to baseResolution
        this.baseResolutionX   = 1000;                                                      // DEFAULT number of horizontal pixels the graph area occupies
        this.baseResolutionY   = 500;                                                       // DEFAULT number of vertical pixels the graph area occupies
        this.maxHourValue      = Math.max(...dayta);                                        // The highest # of hours amonst the data to be graphed (sets scale factor)
        this.workDayCtInSprint = workDatesInSprint.length - 1;                              // The number of ACTUAL work days in the sprint (sets the ideal value per day)
        this.totalDayCtInSprint= 14;//dateFns.differenceInCalendarDays(this.workDatesInSprint[this.workDatesInSprint.length-1], this.workDatesInSprint[0]);                                        // The number of days DISPLAYED in the graph (sets headers and horiz spacing)

        this.horizontalInterval= this.baseResolutionX / this.workDayCtInSprint;      // The number of horizontal pixels a single "day" occupies in the graph
        this.verticalInterval  = this.baseResolutionY / this.totalDayCtInSprint;      // The number of horizontal pixels a single "day" occupies in the graph
        this.vertScaleFactor   = this.baseResolutionY / this.maxHourValue;            // Scale factor to adjust the Y coordinate assuming the sprint's total hours !== 500
        console.log('this.vertScaleFactor :', this.vertScaleFactor);
        this.idealHoursPerDay  = this.vertScaleFactor * (this.maxHourValue / this.workDayCtInSprint);          // The number of hours per work day that should have ideally been accomplished
        this.pointCount = 0;
        
        this.idealHoursByDay   = new Array(this.workDayCtInSprint);          // Quick-reference shorthand array to prevent the need to constantly multiply these
        this.idealHoursByPlot   = new Array(this.workDayCtInSprint);          // Quick-reference shorthand array to prevent the need to constantly multiply these
        for(var i=0; i<=this.workDayCtInSprint+1; i++){
            this.idealHoursByDay[i] = this.maxHourValue - (this.maxHourValue / this.workDayCtInSprint * i);
            this.idealHoursByPlot[i] = this.baseResolutionY - (this.baseResolutionY / this.workDayCtInSprint * i);
            
        }
    }
    
    renderBaseSVGintoPage(insertionDOMnode=document.body,directlyToDOM=true){
        let markup = `<svg id="burndownGraphPanel" class="bdgPanel" viewBox="${-this.leftMargin} ${-this.topMargin} ${this.baseResolutionX + this.leftMargin + this.rightMargin} ${this.baseResolutionY + this.topMargin + this.bottomMargin}" xmlns="http://www.w3.org/2000/svg">
                        <defs id="burndownGraphPanelDefs">
                            <linearGradient id="posNegGradient" x1="0" y1="1" x2="1" y2="0">
                                <stop offset="0%" stop-color="#090"/>
                                <stop offset="35%" stop-color="#0d0"/>
                                <stop offset="47%" stop-color="#aea"/>
                                <stop offset="50%" stop-color="#cf9"/>
                                <stop offset="51%" stop-color="#ffa"/>
                                <stop offset="55%" stop-color="#fc9"/>
                                <stop offset="62%" stop-color="#c88"/>
                                <stop offset="100%" stop-color="#700"/>
                            </linearGradient>
                           
                            <filter id="idealGlow">
                                <feGaussianBlur stdDeviation="5" />
                            </filter>
                            <filter id="sheen">
                                <feGaussianBlur stdDeviation="20" />
                            </filter>
                            <radialGradient id="spoiler_panel_overlay_1">
                              <stop offset="0%" stop-color="#FFFD" />
                              <stop offset="60%" stop-color="#FFFD" />
                              <stop offset="100%" stop-color="#FFFA" />
                            </radialGradient>
                            <radialGradient id="spoiler_panel_overlay_2">
                              <stop offset="70%" stop-color="rgb(255,255,255)" stop-opacity="0.75" />
                              <stop offset="100%" stop-color="rgb(255,255,255)" stop-opacity="0.5" />
                            </radialGradient>
                        </defs>
                      
                        <rect width="${this.baseResolutionX + 5}" height="${this.baseResolutionY + 4}" x="-5" y="1"></rect>
                        <rect width="${this.baseResolutionX}" height="${this.baseResolutionY}" x="0" y="0" fill="#eee"></rect>
                      
                    </svg>`;
        insertionDOMnode.insertAdjacentHTML('beforeEnd', markup);
        this.graphObjectSVG     = document.getElementById('burndownGraphPanel');
        this.graphSVGDefs       = document.getElementById('burndownGraphPanelDefs');
        if(!this.isIntialized){
            this.isIntialized      = true
            this.graphObjectSVG.addEventListener('mouseup', (e, trg=e.target)=>{
                
                if(!/slot-plot/.test(trg.className) && trg.tagName !== 'image' && trg.closest('foreignObject') === null){
                    this.plotSpoilers(null, null, this)
                }
            });
        }

        return markup;
    }
    
    toggleWhoBurnedView(e, trg=e.target){
        console.log('trg :', trg);
        if(!trg.id) trg = trg.nextElementSibling;
        console.log('trg :', trg);
        let ROOT = document.querySelector(':root');
        if(trg.style.opacity == 1){
            trg.style.opacity = 0;
            if(trg.id === 'didBurn') ROOT.style.setProperty("--show-did-burn", 0); else ROOT.style.setProperty("--show-did-not-burn", 0);
        } else {
            trg.style.opacity = 1;
            if(trg.id === 'didBurn') ROOT.style.setProperty("--show-did-burn", 1); else ROOT.style.setProperty("--show-did-not-burn", 1);
        }
    }
    
    renderPoly(sx, sy, ex, ey, props) {
        let polyPts = `${sx} ${sy},${ex} ${ey}, ${ex} ${this.baseResolutionY}, ${sx} ${this.baseResolutionY}`;
        if(props && props !== "") props = Object.entries(props).map(prop=>`${prop[0]}="${prop[1]}"`).join(' ');
        this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `<polyline points="${polyPts}" ${props} />`);
    }
    
    renderAdjustedPoly (plotCoordinates, props) {
        plotCoordinates = plotCoordinates.map(coordinatePair=>{
            let coords = coordinatePair.split(' ');
            return parseInt(coords[0]) + ' ' + (parseInt((this.vertScaleFactor * this.baseResolutionY) - (this.vertScaleFactor * coords[1])));
        });
        this.renderComplexPoly(plotCoordinates, props);
    }
    
    renderComplexPoly(plotCoordinates, props) {
        let coordinatePairs = `${plotCoordinates.join(',')}`;
        
        if(props && props !== "") props = Object.entries(props).map(prop=>`${prop[0]}="${prop[1]}"`).join(' ');
        this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `<polyline points="${coordinatePairs}" ${props} />`);
    }
    
    renderOverflowMasks(){
        this.renderComplexPoly(['0 0',this.baseResolutionX + ' ' + this.baseResolutionY, '0 ' + this.baseResolutionY],{fill:'white', mask:'url(#sprintDate)'})
        this.renderComplexPoly(['0 0',this.baseResolutionX + ' ' + this.baseResolutionY, this.baseResolutionX + ' 0'],{fill:'white', mask:'url(#sprintDate)'})
    }
    
    getYForGraph(yToGet) {
        var maxY  = this.baseResolutionY;
        let newY = maxY - yToGet;
        return newY;
    }

    generateIdeal(){
        const getYForGraph = (yToGet) => {
            var maxY  = this.baseResolutionY;
            let newY = maxY - yToGet;
            return newY;
        }
        
        const drawDottedLine = () =>{
            this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `<line x1="0" y1="0" x2="1000" y2="500" stroke-width="100" stroke="#fff4" filter="url(#sheen)"/>`);
            this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `<line x1="0" y1="0" x2="1000" y2="500" stroke-width="10" stroke="#fff9" filter="url(#idealGlow)"/>`);
            this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `<line x1="0" y1="0" x2="1000" y2="500" stroke-width="3" stroke="#C005" stroke-dasharray="0 8" stroke-linecap="round"/>`);

        }
        
        for(var i=0; i<=this.workDayCtInSprint; i++){
            var iLow  = i;
            var iHigh = i + 1;
            var hLow  = iLow * this.horizontalInterval;
            var hHigh = iHigh * this.horizontalInterval - 1;
            var vLow  = getYForGraph(this.idealHoursByPlot[iLow]);
            var vHigh = getYForGraph(this.idealHoursByPlot[iHigh]);
            var maxY  = (this.maxHourValue * this.vertScaleFactor);
            var alternator = (i%2==0) ? '55' : '66';
            var columnColor = (i < dayta.length - 1) ? '#77ccdd' + alternator : '#666666' + alternator;
            
            if(i < this.dayta.length - 1)   this.renderPoly(hLow, vLow, hHigh, vHigh, {id:"idealArea" + i, fill:columnColor, "strokeWidth": "1px", stroke:'#FFF8'});
            else                            this.renderPoly(hLow, vLow, hHigh, vHigh, {id:"idealArea" + i, fill:columnColor, "strokeWidth": "1px", stroke:'#FFF8'});
        }
        drawDottedLine();
    }
    
    renderSprintDataGradientMaskedPlates(){
        this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `
            <rect width="${this.baseResolutionX + 5}" height="${this.baseResolutionY + 5}"  x="-4" y="-1" mask="url(#sprintMap)"></rect>
            <rect width="${this.baseResolutionX}" height="${this.baseResolutionY}" x="0" y="0" fill="url(#posNegGradient)" mask="url(#sprintMap)"></rect>
        `);
    }
    
    plotSpoilers(e, trg=e.target||null, scope){
        let openPoints = document.querySelectorAll('.plot-spoiler');
        if(openPoints) [...openPoints].forEach(el=>el.remove())
        if(!trg) return;
        let x               = trg.x.baseVal.value;
        let y               = trg.y.baseVal.value;
        x                   = parseInt(Math.max(0,Math.min(700, x - 150)));
        y                   = parseInt(Math.max(0,Math.min(425, (y * this.vertScaleFactor) - 125)));
        let activeOverUnder = trg.style.getPropertyValue('--overUnder'),
        daytaIndex          = trg.dataset.index
        let overUnderLabel  = (activeOverUnder > 0) ? "behind"              : "ahead";
        activeOverUnder     = (activeOverUnder > 0) ? '+' + activeOverUnder : activeOverUnder;
        let burners         = fondue.table.retrieveBurners(daytaIndex);
        
        let spoilerAlert = `<g class="plot-spoiler" style="--base-color:hsl(${trg.style.getPropertyValue('--calc-color')}, 100%, 30%);">
            <rect x="${x + 0}" y="${y + 0}" width="300" height="250" rx="25" filter="drop-shadow(0 20px 10px #0009)" stroke="#0002" stroke-width="4" />
            <rect x="${x + 4}" y="${y + 4}" width="292" height="242" rx="25" fill="url(#spoiler_panel_overlay_1)" />
            <rect x="${x + 4}" y="${y + 4}" width="292" height="242" rx="25" fill="url(#spoiler_panel_overlay_2)" />
            <rect x="${x + 19}" y="${y + 78}" width="262" height="3" filter="brightness(0.75)" />
            <rect x="${x + 19}" y="${y + 108}" width="262" height="3" filter="brightness(0.75)" />
            <image href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTYiIGhlaWdodD0iNzEuOTY5IiB2aWV3Qm94PSIwIDAgNTYgNzEuOTY5Ij4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjODVjMjgwOwogICAgICB9CgogICAgICAuY2xzLTEwLCAuY2xzLTExLCAuY2xzLTEyLCAuY2xzLTEzLCAuY2xzLTIsIC5jbHMtMywgLmNscy00LCAuY2xzLTUsIC5jbHMtNiwgLmNscy03LCAuY2xzLTgsIC5jbHMtOSB7CiAgICAgICAgZmlsbC1ydWxlOiBldmVub2RkOwogICAgICB9CgogICAgICAuY2xzLTExLCAuY2xzLTEyLCAuY2xzLTIgewogICAgICAgIG9wYWNpdHk6IDAuNTsKICAgICAgfQoKICAgICAgLmNscy0yIHsKICAgICAgICBmaWxsOiB1cmwoI2xpbmVhci1ncmFkaWVudCk7CiAgICAgIH0KCiAgICAgIC5jbHMtMyB7CiAgICAgICAgZmlsbDogI2Y2ZGI5ZTsKICAgICAgfQoKICAgICAgLmNscy00IHsKICAgICAgICBmaWxsOiAjY2M5NzQxOwogICAgICB9CgogICAgICAuY2xzLTUgewogICAgICAgIGZpbGw6ICMwMDM0MTM7CiAgICAgIH0KCiAgICAgIC5jbHMtNiB7CiAgICAgICAgZmlsbDogI2YzM2IxNDsKICAgICAgfQoKICAgICAgLmNscy03IHsKICAgICAgICBvcGFjaXR5OiAwLjQ7CiAgICAgICAgZmlsbDogdXJsKCNyYWRpYWwtZ3JhZGllbnQpOwogICAgICB9CgogICAgICAuY2xzLTggewogICAgICAgIG9wYWNpdHk6IDAuMTsKICAgICAgICBmaWxsOiB1cmwoI3JhZGlhbC1ncmFkaWVudC0yKTsKICAgICAgfQoKICAgICAgLmNscy05IHsKICAgICAgICBmaWxsOiAjZmI2YzE3OwogICAgICB9CgogICAgICAuY2xzLTEwIHsKICAgICAgICBmaWxsOiAjYWQ4NDU5OwogICAgICB9CgogICAgICAuY2xzLTExIHsKICAgICAgICBmaWxsOiAjNGMzMTE1OwogICAgICB9CgogICAgICAuY2xzLTEyIHsKICAgICAgICBmaWxsOiAjZmZlYTFjOwogICAgICB9CgogICAgICAuY2xzLTEzIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICAgIG9wYWNpdHk6IDAuMzsKICAgICAgfQogICAgPC9zdHlsZT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50IiB4MT0iMjIuODMzIiB5MT0iNDM4Ljg0NCIgeDI9IjM0LjI5MiIgeTI9IjQyNS4xODgiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSJyYWRpYWwtZ3JhZGllbnQiIGN4PSI0OC44NzUiIGN5PSI0MjIuMzEyIiByPSI3IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZmZjI4MiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmYyODIiIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0icmFkaWFsLWdyYWRpZW50LTIiIGN4PSI0NC4yODEiIGN5PSI0MjQuNjU2IiByPSI3IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZiNmMxNyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmYjZjMTciIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICA8L2RlZnM+CiAgPGNpcmNsZSBjbGFzcz0iY2xzLTEiIGN4PSIyNi40MjIiIGN5PSI0NS43MTkiIHI9IjI2LjI1Ii8+CiAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNDIuMTY3LDQyNy44NThhMTU1LjIwOSwxNTUuMjA5LDAsMCwxLTIyLjg2NCwxMSwyNi4yMzUsMjYuMjM1LDAsMCwxLTQuMzg5LTYuMzM2bDIxLjM1Ni03LjA0NUM0MC4yOCw0MjQuNTYzLDQyLjYxMSw0MjUuOTkyLDQyLjE2Nyw0MjcuODU4WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTEzLjQ4OSw0MzQuMWw5LjU0Ni0xMC44ODYsMy44ODktMi43NjYtMSwzLjgwOWExLjgzOSwxLjgzOSwwLDAsMCwxLjQtLjM3OSwwLjg2NSwwLjg2NSwwLDAsMSwuMzQ2LTAuMzA5LDIuNzUxLDIuNzUxLDAsMCwxLS4wMTksMS41MDdsMC4yNywzLjM1NywwLjAyLDAuMDI3cS0wLjU3OS44NDItMS4xNjcsMS42NzctMy4yLDQuNTM5LTYuNjU4LDguODcxQTI1LjkxOCwyNS45MTgsMCwwLDEsMTMuNDg5LDQzNC4xWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTI3LjM4Myw0MjUuNjg1YzAuMDk0LS4xMzkuMTg2LTAuMjgxLDAuMjc5LTAuNDJsMC4yNTUsMy4xNywwLjAyLDAuMDI3cS0wLjU3OS44NDItMS4xNjcsMS42NzctMy4yLDQuNTM5LTYuNjU4LDguODcxLTEuMDkyLS41NjYtMi4xMjItMS4yMjlBMTE3LjU4NiwxMTcuNTg2LDAsMCwwLDI3LjM4Myw0MjUuNjg1WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtNSIgZD0iTTMyLjIyOCw0NDNhMjYuMjUsMjYuMjUsMCwxLDEsMjYuMjUtMjYuMjVBMjYuMjUsMjYuMjUsMCwwLDEsMzIuMjI4LDQ0M1ptMC00OS41YTIzLjI1LDIzLjI1LDAsMSwwLDIzLjI1LDIzLjI1QTIzLjI1LDIzLjI1LDAsMCwwLDMyLjIyOCwzOTMuNVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTYiIGQ9Ik0zMi42NDYsMzcxLjFhMjQuNTc1LDI0LjU3NSwwLDAsMSwuNzI2LDE1LjgyOGMtMS42MTEsNi4wNTMtNC4wNjQsOC4wODUtNy4wNSwxNC4wNjktNC43MzMsOS40ODIsNC40MzIsMTcuNzkyLDEyLjMzOCwxNS44MjgsNy4yNDItMS44LDkuNjI3LTEwLjU5NSwxMC4xNjEtMTMuMTM4YTIxLjIzNSwyMS4yMzUsMCwwLDAtMy43MzMtMTYuNTUyczAuNzY1LDMuMzEyLjEsMy45MzFhMzkuMywzOS4zLDAsMCwwLTUuMTg0LTEyLjUxN0MzNy41MSwzNzQuNjQ0LDMzLjg4NSwzNzAuNDY5LDMyLjY0NiwzNzEuMVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTciIGQ9Ik00Mi4xLDQxNy42YzUuOTczLTIuODYsMTMuODQ3LTMuMDY3LDE3LjU4Ny0uNDYzczEuOTMsNy4wMzQtNC4wNDMsOS44OTQtMTMuODQ3LDMuMDY3LTE3LjU4Ny40NjNTMzYuMTI2LDQyMC40NTYsNDIuMSw0MTcuNloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTgiIGQ9Ik0zNy41MTcsNDE5Ljk1MWM1Ljk3My0yLjg2LDEzLjg0Ny0zLjA2NywxNy41ODctLjQ2MnMxLjkzLDcuMDMzLTQuMDQ0LDkuODkzLTEzLjg0NywzLjA2Ny0xNy41ODcuNDYzUzMxLjU0NCw0MjIuODExLDM3LjUxNyw0MTkuOTUxWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtOSIgZD0iTTM1LjM0MiwzNzguNzU5YzEuODcxLDkuOS41MTIsMTUuNDkyLDAuMSwxNi41NTFhNC44NzMsNC44NzMsMCwwLDEtLjQxNS0zLjMxYy0xLjMzMiwyLjA1Ni0uMTQ1LDUuMTA5LTEuMTQsNC44NjJzLTAuOTMzLTEuNjU1LS45MzMtMS42NTVhMjEuNzQ1LDIxLjc0NSwwLDAsMC0zLjk0LDljLTAuNjA5LDMuMzQyLTEuMjI2LDkuNzU0LDEuOTcsMTEuNzkzLDMuNjcsMi4zNDEsMTEuMTI4LTEuNjU1LDE0LjMwOC03LjI0MSwyLjg2Mi01LjAyNywyLjI3Ny0xMS4zMzktLjcyNi0xNi41NTItMC4xLDEuMDUxLS4yNzMsMi4xMzQtMC42MjIsMi4xNzItMC42MjcuMDY4LTIuNzc4LTcuMzYxLTMuMDA3LTcuOTY1LTAuNTA2LTEuMzM2LS4zNzMtMy4wMzgtMS42NTktMy45MzFsMC4xLDMuMjA3QzM4Ljk3LDM4Mi45NCwzNS4xNDIsMzc2Ljk4LDM1LjM0MiwzNzguNzU5WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMTAiIGQ9Ik00My45Niw0MDYuMDc1YTYuMTIsNi4xMiwwLDAsMS0xLjM3Nyw0LjAxOGMtMS4xMiwxLjUtMi4zLDIuMDc4LTQuMDU5LDMuMjQ1LTAuNzM2LjQ4Ny0xLjQ0NywxLTIuMTU3LDEuNTQ5cS00LjAwOSw3LjA1OS04LjYsMTMuNzI5bC0wLjAyLS4wMjctMC4yNy0zLjM1N2EyLjc1MywyLjc1MywwLDAsMCwuMDItMS41MDcsMC44ODMsMC44ODMsMCwwLDAtLjM0Ni4zMDksMS44MzksMS44MzksMCwwLDEtMS40LjM3OWwxLTMuODA5LTMuODg5LDIuNzY2LDcuMTQ5LTguMTUzYTkuMyw5LjMsMCwwLDAsMS42OTMtMi4xMzMsMTAuODU3LDEwLjg1NywwLDAsMCwxLjA0OS0yLjc5MSwxOC4yODQsMTguMjg0LDAsMCwxLDEuNC00LjM0NSw3Ljc2Niw3Ljc2NiwwLDAsMSwzLjg4Ni0zLjA5LDUuNTEyLDUuNTEyLDAsMCwxLDMuNTkyLS4yMjRBNC4yODcsNC4yODcsMCwwLDEsNDMuOTYsNDA2LjA3NVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTExIiBkPSJNNDMuMDcsNDA5LjM1NmE3Ljg0OCw3Ljg0OCwwLDAsMS0uNDg2LjczN2MtMS4xMiwxLjUtMi4zLDIuMDc4LTQuMDU5LDMuMjQ1LTAuNzM2LjQ4Ny0xLjQ0NywxLTIuMTU3LDEuNTQ5cS00LjAwOSw3LjA1OS04LjYsMTMuNzI5bC0wLjAyLS4wMjctMC4yNTUtMy4xN2ExMTcuNzA5LDExNy43MDksMCwwLDAsNy45MDgtMTMuN1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTEyIiBkPSJNMzUuNTQ0LDM3OC42MDdhMjIuMDg1LDIyLjA4NSwwLDAsMS0uMSwxNi43LDMyLjY0MiwzMi42NDIsMCwwLDEsLjQxNS01LjY4OWMtMS4zMzIsMi4wNTYtMi45NDgsMTEuMDY1LTEuNTU1LDE0LjM3OS0xLjc2MiwyLjUyOC0xLjM0OC04Ljc5My0xLjM0OC04Ljc5My0wLjQ1OSwxLjgzOC02LjYxMywxNi4zNy0uMjA3LDE4LjMxLDQuMTY4LDEuMjYzLDguNDMyLDEuMjQxLDExLjYxMi00LjM0NSwyLjg2Mi01LjAyNywxLjgxMS05LjMuMjA3LTE2Ljk2NS0wLjQyLjk2OS0uNDQzLDIuNDczLTAuNjIyLDIuMTcyLTMuMjM1LTUuNDE1LTQuMjQzLTUuNjY1LTQuNjY2LTExLjlsLTAuNDE1LDYuMjA3QzM5LjUwNSwzODYuNDgxLDM3LjQ1OCwzNzguMTY4LDM1LjU0NCwzNzguNjA3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMTMiIGQ9Ik00MC45NSwzODguNzJhMTUuNDY1LDE1LjQ2NSwwLDAsMC0uMjQyLDExLjY2NSwyMi45MjYsMjIuOTI2LDAsMCwwLS4xODUtMy45OTRjMC44OTUsMS41MDYsMS40NTIsNy44OC0uMjM4LDEwLjExOSwwLjY0NSwxLjg1NywyLjE2Ni02LjA2NywyLjE2Ni02LjA2NywwLjI4OCwxLjMwNywxLjYsMTEuNzc1LTMuMjE1LDEyLjc5Mi0zLjEzNS42NjItNi4wNSwwLjQyMy02Ljk4Ny0zLjY0My0wLjg0My0zLjY2Ljg2My02LjU4NSwyLjEyOC0xMS44NTQsMC4yNzYsMC43LjI2NCwxLjc1LDAuNCwxLjU0OSwyLjM2Ni0zLjYwOSwzLjA3Ni0zLjczMSwzLjQ4OC04LjA1OGwwLjE3NSw0LjM1NEMzOC4wMywzOTQuMDA4LDM5LjYxOCwzODguMzEzLDQwLjk1LDM4OC43MloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KPC9zdmc+Cg==" height="48" width="48" x="${x + 4}" y="${y + 195}"  filter="saturate(0) opacity(0.5)"/>
            <image id="didBurn" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTYiIGhlaWdodD0iNzEuOTY5IiB2aWV3Qm94PSIwIDAgNTYgNzEuOTY5Ij4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjODVjMjgwOwogICAgICB9CgogICAgICAuY2xzLTEwLCAuY2xzLTExLCAuY2xzLTEyLCAuY2xzLTEzLCAuY2xzLTIsIC5jbHMtMywgLmNscy00LCAuY2xzLTUsIC5jbHMtNiwgLmNscy03LCAuY2xzLTgsIC5jbHMtOSB7CiAgICAgICAgZmlsbC1ydWxlOiBldmVub2RkOwogICAgICB9CgogICAgICAuY2xzLTExLCAuY2xzLTEyLCAuY2xzLTIgewogICAgICAgIG9wYWNpdHk6IDAuNTsKICAgICAgfQoKICAgICAgLmNscy0yIHsKICAgICAgICBmaWxsOiB1cmwoI2xpbmVhci1ncmFkaWVudCk7CiAgICAgIH0KCiAgICAgIC5jbHMtMyB7CiAgICAgICAgZmlsbDogI2Y2ZGI5ZTsKICAgICAgfQoKICAgICAgLmNscy00IHsKICAgICAgICBmaWxsOiAjY2M5NzQxOwogICAgICB9CgogICAgICAuY2xzLTUgewogICAgICAgIGZpbGw6ICMwMDM0MTM7CiAgICAgIH0KCiAgICAgIC5jbHMtNiB7CiAgICAgICAgZmlsbDogI2YzM2IxNDsKICAgICAgfQoKICAgICAgLmNscy03IHsKICAgICAgICBvcGFjaXR5OiAwLjQ7CiAgICAgICAgZmlsbDogdXJsKCNyYWRpYWwtZ3JhZGllbnQpOwogICAgICB9CgogICAgICAuY2xzLTggewogICAgICAgIG9wYWNpdHk6IDAuMTsKICAgICAgICBmaWxsOiB1cmwoI3JhZGlhbC1ncmFkaWVudC0yKTsKICAgICAgfQoKICAgICAgLmNscy05IHsKICAgICAgICBmaWxsOiAjZmI2YzE3OwogICAgICB9CgogICAgICAuY2xzLTEwIHsKICAgICAgICBmaWxsOiAjYWQ4NDU5OwogICAgICB9CgogICAgICAuY2xzLTExIHsKICAgICAgICBmaWxsOiAjNGMzMTE1OwogICAgICB9CgogICAgICAuY2xzLTEyIHsKICAgICAgICBmaWxsOiAjZmZlYTFjOwogICAgICB9CgogICAgICAuY2xzLTEzIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICAgIG9wYWNpdHk6IDAuMzsKICAgICAgfQogICAgPC9zdHlsZT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50IiB4MT0iMjIuODMzIiB5MT0iNDM4Ljg0NCIgeDI9IjM0LjI5MiIgeTI9IjQyNS4xODgiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSJyYWRpYWwtZ3JhZGllbnQiIGN4PSI0OC44NzUiIGN5PSI0MjIuMzEyIiByPSI3IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZmZjI4MiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmYyODIiIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0icmFkaWFsLWdyYWRpZW50LTIiIGN4PSI0NC4yODEiIGN5PSI0MjQuNjU2IiByPSI3IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZiNmMxNyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmYjZjMTciIHN0b3Atb3BhY2l0eT0iMCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICA8L2RlZnM+CiAgPGNpcmNsZSBjbGFzcz0iY2xzLTEiIGN4PSIyNi40MjIiIGN5PSI0NS43MTkiIHI9IjI2LjI1Ii8+CiAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNDIuMTY3LDQyNy44NThhMTU1LjIwOSwxNTUuMjA5LDAsMCwxLTIyLjg2NCwxMSwyNi4yMzUsMjYuMjM1LDAsMCwxLTQuMzg5LTYuMzM2bDIxLjM1Ni03LjA0NUM0MC4yOCw0MjQuNTYzLDQyLjYxMSw0MjUuOTkyLDQyLjE2Nyw0MjcuODU4WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTEzLjQ4OSw0MzQuMWw5LjU0Ni0xMC44ODYsMy44ODktMi43NjYtMSwzLjgwOWExLjgzOSwxLjgzOSwwLDAsMCwxLjQtLjM3OSwwLjg2NSwwLjg2NSwwLDAsMSwuMzQ2LTAuMzA5LDIuNzUxLDIuNzUxLDAsMCwxLS4wMTksMS41MDdsMC4yNywzLjM1NywwLjAyLDAuMDI3cS0wLjU3OS44NDItMS4xNjcsMS42NzctMy4yLDQuNTM5LTYuNjU4LDguODcxQTI1LjkxOCwyNS45MTgsMCwwLDEsMTMuNDg5LDQzNC4xWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTI3LjM4Myw0MjUuNjg1YzAuMDk0LS4xMzkuMTg2LTAuMjgxLDAuMjc5LTAuNDJsMC4yNTUsMy4xNywwLjAyLDAuMDI3cS0wLjU3OS44NDItMS4xNjcsMS42NzctMy4yLDQuNTM5LTYuNjU4LDguODcxLTEuMDkyLS41NjYtMi4xMjItMS4yMjlBMTE3LjU4NiwxMTcuNTg2LDAsMCwwLDI3LjM4Myw0MjUuNjg1WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtNSIgZD0iTTMyLjIyOCw0NDNhMjYuMjUsMjYuMjUsMCwxLDEsMjYuMjUtMjYuMjVBMjYuMjUsMjYuMjUsMCwwLDEsMzIuMjI4LDQ0M1ptMC00OS41YTIzLjI1LDIzLjI1LDAsMSwwLDIzLjI1LDIzLjI1QTIzLjI1LDIzLjI1LDAsMCwwLDMyLjIyOCwzOTMuNVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTYiIGQ9Ik0zMi42NDYsMzcxLjFhMjQuNTc1LDI0LjU3NSwwLDAsMSwuNzI2LDE1LjgyOGMtMS42MTEsNi4wNTMtNC4wNjQsOC4wODUtNy4wNSwxNC4wNjktNC43MzMsOS40ODIsNC40MzIsMTcuNzkyLDEyLjMzOCwxNS44MjgsNy4yNDItMS44LDkuNjI3LTEwLjU5NSwxMC4xNjEtMTMuMTM4YTIxLjIzNSwyMS4yMzUsMCwwLDAtMy43MzMtMTYuNTUyczAuNzY1LDMuMzEyLjEsMy45MzFhMzkuMywzOS4zLDAsMCwwLTUuMTg0LTEyLjUxN0MzNy41MSwzNzQuNjQ0LDMzLjg4NSwzNzAuNDY5LDMyLjY0NiwzNzEuMVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTciIGQ9Ik00Mi4xLDQxNy42YzUuOTczLTIuODYsMTMuODQ3LTMuMDY3LDE3LjU4Ny0uNDYzczEuOTMsNy4wMzQtNC4wNDMsOS44OTQtMTMuODQ3LDMuMDY3LTE3LjU4Ny40NjNTMzYuMTI2LDQyMC40NTYsNDIuMSw0MTcuNloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTgiIGQ9Ik0zNy41MTcsNDE5Ljk1MWM1Ljk3My0yLjg2LDEzLjg0Ny0zLjA2NywxNy41ODctLjQ2MnMxLjkzLDcuMDMzLTQuMDQ0LDkuODkzLTEzLjg0NywzLjA2Ny0xNy41ODcuNDYzUzMxLjU0NCw0MjIuODExLDM3LjUxNyw0MTkuOTUxWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtOSIgZD0iTTM1LjM0MiwzNzguNzU5YzEuODcxLDkuOS41MTIsMTUuNDkyLDAuMSwxNi41NTFhNC44NzMsNC44NzMsMCwwLDEtLjQxNS0zLjMxYy0xLjMzMiwyLjA1Ni0uMTQ1LDUuMTA5LTEuMTQsNC44NjJzLTAuOTMzLTEuNjU1LS45MzMtMS42NTVhMjEuNzQ1LDIxLjc0NSwwLDAsMC0zLjk0LDljLTAuNjA5LDMuMzQyLTEuMjI2LDkuNzU0LDEuOTcsMTEuNzkzLDMuNjcsMi4zNDEsMTEuMTI4LTEuNjU1LDE0LjMwOC03LjI0MSwyLjg2Mi01LjAyNywyLjI3Ny0xMS4zMzktLjcyNi0xNi41NTItMC4xLDEuMDUxLS4yNzMsMi4xMzQtMC42MjIsMi4xNzItMC42MjcuMDY4LTIuNzc4LTcuMzYxLTMuMDA3LTcuOTY1LTAuNTA2LTEuMzM2LS4zNzMtMy4wMzgtMS42NTktMy45MzFsMC4xLDMuMjA3QzM4Ljk3LDM4Mi45NCwzNS4xNDIsMzc2Ljk4LDM1LjM0MiwzNzguNzU5WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMTAiIGQ9Ik00My45Niw0MDYuMDc1YTYuMTIsNi4xMiwwLDAsMS0xLjM3Nyw0LjAxOGMtMS4xMiwxLjUtMi4zLDIuMDc4LTQuMDU5LDMuMjQ1LTAuNzM2LjQ4Ny0xLjQ0NywxLTIuMTU3LDEuNTQ5cS00LjAwOSw3LjA1OS04LjYsMTMuNzI5bC0wLjAyLS4wMjctMC4yNy0zLjM1N2EyLjc1MywyLjc1MywwLDAsMCwuMDItMS41MDcsMC44ODMsMC44ODMsMCwwLDAtLjM0Ni4zMDksMS44MzksMS44MzksMCwwLDEtMS40LjM3OWwxLTMuODA5LTMuODg5LDIuNzY2LDcuMTQ5LTguMTUzYTkuMyw5LjMsMCwwLDAsMS42OTMtMi4xMzMsMTAuODU3LDEwLjg1NywwLDAsMCwxLjA0OS0yLjc5MSwxOC4yODQsMTguMjg0LDAsMCwxLDEuNC00LjM0NSw3Ljc2Niw3Ljc2NiwwLDAsMSwzLjg4Ni0zLjA5LDUuNTEyLDUuNTEyLDAsMCwxLDMuNTkyLS4yMjRBNC4yODcsNC4yODcsMCwwLDEsNDMuOTYsNDA2LjA3NVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTExIiBkPSJNNDMuMDcsNDA5LjM1NmE3Ljg0OCw3Ljg0OCwwLDAsMS0uNDg2LjczN2MtMS4xMiwxLjUtMi4zLDIuMDc4LTQuMDU5LDMuMjQ1LTAuNzM2LjQ4Ny0xLjQ0NywxLTIuMTU3LDEuNTQ5cS00LjAwOSw3LjA1OS04LjYsMTMuNzI5bC0wLjAyLS4wMjctMC4yNTUtMy4xN2ExMTcuNzA5LDExNy43MDksMCwwLDAsNy45MDgtMTMuN1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTEyIiBkPSJNMzUuNTQ0LDM3OC42MDdhMjIuMDg1LDIyLjA4NSwwLDAsMS0uMSwxNi43LDMyLjY0MiwzMi42NDIsMCwwLDEsLjQxNS01LjY4OWMtMS4zMzIsMi4wNTYtMi45NDgsMTEuMDY1LTEuNTU1LDE0LjM3OS0xLjc2MiwyLjUyOC0xLjM0OC04Ljc5My0xLjM0OC04Ljc5My0wLjQ1OSwxLjgzOC02LjYxMywxNi4zNy0uMjA3LDE4LjMxLDQuMTY4LDEuMjYzLDguNDMyLDEuMjQxLDExLjYxMi00LjM0NSwyLjg2Mi01LjAyNywxLjgxMS05LjMuMjA3LTE2Ljk2NS0wLjQyLjk2OS0uNDQzLDIuNDczLTAuNjIyLDIuMTcyLTMuMjM1LTUuNDE1LTQuMjQzLTUuNjY1LTQuNjY2LTExLjlsLTAuNDE1LDYuMjA3QzM5LjUwNSwzODYuNDgxLDM3LjQ1OCwzNzguMTY4LDM1LjU0NCwzNzguNjA3WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuNzk3IC0zNzEuMDMxKSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMTMiIGQ9Ik00MC45NSwzODguNzJhMTUuNDY1LDE1LjQ2NSwwLDAsMC0uMjQyLDExLjY2NSwyMi45MjYsMjIuOTI2LDAsMCwwLS4xODUtMy45OTRjMC44OTUsMS41MDYsMS40NTIsNy44OC0uMjM4LDEwLjExOSwwLjY0NSwxLjg1NywyLjE2Ni02LjA2NywyLjE2Ni02LjA2NywwLjI4OCwxLjMwNywxLjYsMTEuNzc1LTMuMjE1LDEyLjc5Mi0zLjEzNS42NjItNi4wNSwwLjQyMy02Ljk4Ny0zLjY0My0wLjg0My0zLjY2Ljg2My02LjU4NSwyLjEyOC0xMS44NTQsMC4yNzYsMC43LjI2NCwxLjc1LDAuNCwxLjU0OSwyLjM2Ni0zLjYwOSwzLjA3Ni0zLjczMSwzLjQ4OC04LjA1OGwwLjE3NSw0LjM1NEMzOC4wMywzOTQuMDA4LDM5LjYxOCwzODguMzEzLDQwLjk1LDM4OC43MloiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01Ljc5NyAtMzcxLjAzMSkiLz4KPC9zdmc+Cg==" height="48" width="48" x="${x + 4}" y="${y + 195}" />
            <image href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1Mi41IiBoZWlnaHQ9IjcxLjI1IiB2aWV3Qm94PSIwIDAgNTIuNSA3MS4yNSI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgZmlsbDogI2Y3NzsKICAgICAgfQoKICAgICAgLmNscy0xLCAuY2xzLTEwLCAuY2xzLTIsIC5jbHMtMywgLmNscy00LCAuY2xzLTUsIC5jbHMtNiwgLmNscy03LCAuY2xzLTgsIC5jbHMtOSB7CiAgICAgICAgZmlsbC1ydWxlOiBldmVub2RkOwogICAgICB9CgogICAgICAuY2xzLTIgewogICAgICAgIG9wYWNpdHk6IDAuMjsKICAgICAgfQoKICAgICAgLmNscy0zIHsKICAgICAgICBmaWxsOiAjY2M5NzQxOwogICAgICB9CgogICAgICAuY2xzLTQgewogICAgICAgIGZpbGw6ICNmNmRiOWU7CiAgICAgIH0KCiAgICAgIC5jbHMtNSB7CiAgICAgICAgZmlsbDogIzU4MDAwMDsKICAgICAgfQoKICAgICAgLmNscy02LCAuY2xzLTcgewogICAgICAgIG9wYWNpdHk6IDAuNTsKICAgICAgfQoKICAgICAgLmNscy03IHsKICAgICAgICBmaWxsOiAjNTk1OTU5OwogICAgICB9CgogICAgICAuY2xzLTggewogICAgICAgIGZpbGw6ICMyNzFkMTM7CiAgICAgIH0KCiAgICAgIC5jbHMtOSB7CiAgICAgICAgZmlsbDogIzEyMGUwNzsKICAgICAgfQoKICAgICAgLmNscy0xMCB7CiAgICAgICAgZmlsbDogI2ZmZjsKICAgICAgICBvcGFjaXR5OiAwLjM7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTM2Ny43MjgsMzkwLjVhMjYuMjUsMjYuMjUsMCwxLDEtMjYuMjUsMjYuMjVBMjYuMjUsMjYuMjUsMCwwLDEsMzY3LjcyOCwzOTAuNVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNDEuNDY5IC0zNzEuNzUpIi8+CiAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMzc5LjgsNDM4LjY0OWwtNS4zNjQtNS45MmMwLjMxNSwwLjctNC4xODQtNC45Ny01LjE0Ni01LjY4Mi0xLjAyOS0uNzYxLTMuNTM0LTIuNDgxLTMuNjI1LTIuNjE3LDAuMDctMy4wNTItMi4zMi0xLjg4MS0zLjY4Mi00LjYzNy0xLjU0Mi0xLjItNi40MTEtMy43NjQtNi45MzItNS4wNzEtMC42NTYtMS42NDkuMjA5LTYuNDQxLTQuMDcxLTUuMTEzYTEyLjMwNSwxMi4zMDUsMCwwLDAtMywxLjc2M2MtMi43NzYsMS42NDcuMjIzLDMuOTE4LDEuMTUyLDUuODg1LDUuMiwyLjczMiw4LjMyNCw3LjA2Myw3Ljg1Miw2LjgyLDEuNzIsMC44ODcsMy4zNTUsMS4yNjcsMy42MTgsMS42ODUsMC45MjQsMS40NjksMi4yNjYsMi4zNDIsMi44MzIsNC41MSwxLjUzMiw1LjI3OSwxLjg0OCw1LjQzNiw4LjE0LDEyLjIxMUEzNS41MTMsMzUuNTEzLDAsMCwwLDM3OS44LDQzOC42NDlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzQxLjQ2OSAtMzcxLjc1KSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTM3My42OSw0NDAuNzkzbC01LjE3OS0xMS4xMjQsMy40ODItMS40MjMsNS4zLDExLjQyN0EyNS45NjksMjUuOTY5LDAsMCwxLDM3My42OSw0NDAuNzkzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0zNzUuOCw0MzkuNjczbC0zLjgtMTEuNDI3LDUuMzgyLTIuMiwzLjYsMTAuOTE5QTI2LjIwNywyNi4yMDcsMCwwLDEsMzc1LjgsNDM5LjY3M1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNDEuNDY5IC0zNzEuNzUpIi8+CiAgPHBhdGggY2xhc3M9ImNscy01IiBkPSJNMzY3LjcyOCw0NDNhMjYuMjUsMjYuMjUsMCwxLDEsMjYuMjUtMjYuMjVBMjYuMjUsMjYuMjUsMCwwLDEsMzY3LjcyOCw0NDNabTAtNDkuNWEyMy4yNSwyMy4yNSwwLDEsMCwyMy4yNSwyMy4yNUEyMy4yNSwyMy4yNSwwLDAsMCwzNjcuNzI4LDM5My41WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTYiIGQ9Ik0zNjIuMjI0LDM3NS41ODNjMy43MzktNi45NTEtMTkuMDgzLTUuMzE1LTYuMzgyLDExLjY4My0zLjE2NC00LjIzNCwxLjQuNzU2LS43OTEsMi44MzlsMS42MS0xLjA1NGMtMy4wMjcuNTY4LTQuNDg2LDAuMDYzLTMuMjMyLTEuMjI5LDEuNDgxLTEuNTI3LDMuODY2LDEuNjQ0LDUuMjE2LTEuNTEycy0zLjUwNy0xLjQwNi00LjQzLTMuNDU2Yy0yLjMyOS01LjE3OCw1Ljg4Mi0xMi43NjgsNy45LTguNzc3QzM2NC4xNzUsMzc4LjE3MSwzNjEuMzI0LDM3NS42NzcsMzYyLjIyNCwzNzUuNTgzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTciIGQ9Ik0zNTUuMTE2LDM4OC43NDljNC4xNzktLjYzMSw5LjEyMS01LjI5NCwzLjU0OC0zLjUyNS0yLjk2NS45NDItMS4zNTktLjUzMy0xLjEyLTAuOTEsNS44NTItOS4yNzYtMy4yNzgtLjE1OC0wLjczMi00LjM2LDEuNjQ2LTIuNzE3LTYuNzIyLTUuNTQ4LjQ3Ni00LjMsOC42NDUsMC41Miw3LjEsNy4yLDEuOTIzLDEwLjA2NkMzNTguODE5LDM4NS45MzYsMzU0LjkxOSwzODguNzc4LDM1NS4xMTYsMzg4Ljc0OVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNDEuNDY5IC0zNzEuNzUpIi8+CiAgPHBhdGggY2xhc3M9ImNscy04IiBkPSJNMzU4LjcwNywzODUuOTQ1YTcuNzQ0LDcuNzQ0LDAsMCwwLTMuMywxLjg2NWMtMS43OCwxLjYzNi0xLjQ0NSwzLTEuMDgzLDQuNTY4LDAuNDIyLDEuODMuMzIsMy42MjQsMS4yMzksNC44MjRhMzAuOTM1LDMwLjkzNSwwLDAsMSwyLjY0MiwzLjczNSwzMS40NzMsMzEuNDczLDAsMCwxLDEuODg3LDMuN2MwLjQ2MiwxLjA2MSwxLjE1MywyLjAzMywxLjY0NSwzLjExLDAuMDY4LDAuMTQ4LjEyOCwwLjI5MywwLjE4MiwwLjQ0MmExMi45MzIsMTIuOTMyLDAsMCwwLC4zNDgsMS43NDljMS41NzEsMS44NTQsMy4xNDIsMi45LDMuMzM1LDMuNjIzLDAuNjc1LDIuNTI1LDEuODcxLDQuMjUxLDIuMDcsNy43NTFhNDMuODY2LDQzLjg2NiwwLDAsMCwuNTcsNy43YzEuMzksMy42LDMuMjI0LDcuOTMzLDIuNzA3LDYuODIyYTEyLjIxNSwxMi4yMTUsMCwwLDEsMS4wMTktMy40NTYsMC45NzEsMC45NzEsMCwwLDEsMS42MzUtLjMzYy0yLjM3Ny0zLjY0OCwxLjIwOC01Ljc2NSwyLjU1My00LjQ2OCw0LjU2Nyw0LjQuNDA4LTMuNTExLDAuNDA4LTMuNTExLTEuMDItMy40NS0xLjI3NC00LjA5My0yLjQ4My02LjA1OS0wLjU3MS0uOTI4LTEuNjYzLTIuNy0yLjAyMy0zLjEyOGE2LjUxNCw2LjUxNCwwLDAsMS0xLjE2My0xLjkzMmMtMC4zNy0xLjA3Ni4zNjYtMi40NDgtLjItMy4xODYtMS42MTQtMi4xMTUtMi0yLjM4Ny0yLjg2OS01LjE5LTEuNTc3LTEuOTMxLTIuMjExLTMuNzQzLTMuOC01LjY2N2E3LjI5LDcuMjksMCwwLDEtMi4xMDctMy45MjVjLTAuMjQ2LTEuNzc1LjM5My0zLjgzNi0uMDU1LTUuODUxQzM2MS4zMjcsMzg2LjcyMSwzNjAuMzMyLDM4NS42NDYsMzU4LjcwNywzODUuOTQ1WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTkiIGQ9Ik0zNTguOTExLDM4NS45MTVhMi41MjMsMi41MjMsMCwwLDEsLjU0MiwwYy0wLjI0MS4xODgtLjQzNSwwLjM1Ni0wLjU2NCwwLjQ3NS0xLjc4MSwxLjYzNi0zLjQsMy41NjYtMy4wNDIsNS4xMzUsMC4yMjMsMC45Nyw0LjMsMy42ODMsMy4wNjMsMTAuNjctMC4yMTEtLjM4OS0wLjQzOS0wLjc5Mi0wLjcwNy0xLjI1NWEzMC45MzUsMzAuOTM1LDAsMCwwLTIuNjQyLTMuNzM1Yy0wLjkxOS0xLjItLjgxNy0yLjk5NC0xLjIzOS00LjgyNC0wLjM2Mi0xLjU2OS0uNy0yLjkzMiwxLjA4My00LjU2OGE3Ljc0NCw3Ljc0NCwwLDAsMSwzLjMtMS44NjVjMC4wNjUtLjAxMi4xMjgtMC4wMjEsMC4xOS0wLjAyOFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNDEuNDY5IC0zNzEuNzUpIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xMCIgZD0iTTM1NS4yOTMsMzg0Ljk4Yy0zLjIwNiwzLDcuODg4LDcuNzM3LDUuNDM0LTUuMDIsMC42MTIsMy4xNzgtLjUtMC43NzQuOTYzLTEuNDA4bC0wLjk3OC4yYzEuNTQ0LDAuNDMsMi4xMjcsMS4wNzcsMS4yNjgsMS41LTEuMDE2LjUtMS40ODEtMS44ODgtMi43NzItLjQ0czEuMzQzLDEuNjY1LDEuMzY5LDMuMDUyYzAuMDY2LDMuNDkxLTMuNjc5LDUuMjQzLTMuNTU4LDIuNDE3UzM1NS43MzYsMzg1LjE1LDM1NS4yOTMsMzg0Ljk4WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KPC9zdmc+Cg==" height="48" width="48" x="${x + 250}" y="${y + 195}" filter="saturate(0) opacity(0.5)" />
            <image id="didNotBurn" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1Mi41IiBoZWlnaHQ9IjcxLjI1IiB2aWV3Qm94PSIwIDAgNTIuNSA3MS4yNSI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgZmlsbDogI2Y3NzsKICAgICAgfQoKICAgICAgLmNscy0xLCAuY2xzLTEwLCAuY2xzLTIsIC5jbHMtMywgLmNscy00LCAuY2xzLTUsIC5jbHMtNiwgLmNscy03LCAuY2xzLTgsIC5jbHMtOSB7CiAgICAgICAgZmlsbC1ydWxlOiBldmVub2RkOwogICAgICB9CgogICAgICAuY2xzLTIgewogICAgICAgIG9wYWNpdHk6IDAuMjsKICAgICAgfQoKICAgICAgLmNscy0zIHsKICAgICAgICBmaWxsOiAjY2M5NzQxOwogICAgICB9CgogICAgICAuY2xzLTQgewogICAgICAgIGZpbGw6ICNmNmRiOWU7CiAgICAgIH0KCiAgICAgIC5jbHMtNSB7CiAgICAgICAgZmlsbDogIzU4MDAwMDsKICAgICAgfQoKICAgICAgLmNscy02LCAuY2xzLTcgewogICAgICAgIG9wYWNpdHk6IDAuNTsKICAgICAgfQoKICAgICAgLmNscy03IHsKICAgICAgICBmaWxsOiAjNTk1OTU5OwogICAgICB9CgogICAgICAuY2xzLTggewogICAgICAgIGZpbGw6ICMyNzFkMTM7CiAgICAgIH0KCiAgICAgIC5jbHMtOSB7CiAgICAgICAgZmlsbDogIzEyMGUwNzsKICAgICAgfQoKICAgICAgLmNscy0xMCB7CiAgICAgICAgZmlsbDogI2ZmZjsKICAgICAgICBvcGFjaXR5OiAwLjM7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTM2Ny43MjgsMzkwLjVhMjYuMjUsMjYuMjUsMCwxLDEtMjYuMjUsMjYuMjVBMjYuMjUsMjYuMjUsMCwwLDEsMzY3LjcyOCwzOTAuNVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNDEuNDY5IC0zNzEuNzUpIi8+CiAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMzc5LjgsNDM4LjY0OWwtNS4zNjQtNS45MmMwLjMxNSwwLjctNC4xODQtNC45Ny01LjE0Ni01LjY4Mi0xLjAyOS0uNzYxLTMuNTM0LTIuNDgxLTMuNjI1LTIuNjE3LDAuMDctMy4wNTItMi4zMi0xLjg4MS0zLjY4Mi00LjYzNy0xLjU0Mi0xLjItNi40MTEtMy43NjQtNi45MzItNS4wNzEtMC42NTYtMS42NDkuMjA5LTYuNDQxLTQuMDcxLTUuMTEzYTEyLjMwNSwxMi4zMDUsMCwwLDAtMywxLjc2M2MtMi43NzYsMS42NDcuMjIzLDMuOTE4LDEuMTUyLDUuODg1LDUuMiwyLjczMiw4LjMyNCw3LjA2Myw3Ljg1Miw2LjgyLDEuNzIsMC44ODcsMy4zNTUsMS4yNjcsMy42MTgsMS42ODUsMC45MjQsMS40NjksMi4yNjYsMi4zNDIsMi44MzIsNC41MSwxLjUzMiw1LjI3OSwxLjg0OCw1LjQzNiw4LjE0LDEyLjIxMUEzNS41MTMsMzUuNTEzLDAsMCwwLDM3OS44LDQzOC42NDlaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzQxLjQ2OSAtMzcxLjc1KSIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMyIgZD0iTTM3My42OSw0NDAuNzkzbC01LjE3OS0xMS4xMjQsMy40ODItMS40MjMsNS4zLDExLjQyN0EyNS45NjksMjUuOTY5LDAsMCwxLDM3My42OSw0NDAuNzkzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0zNzUuOCw0MzkuNjczbC0zLjgtMTEuNDI3LDUuMzgyLTIuMiwzLjYsMTAuOTE5QTI2LjIwNywyNi4yMDcsMCwwLDEsMzc1LjgsNDM5LjY3M1oiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNDEuNDY5IC0zNzEuNzUpIi8+CiAgPHBhdGggY2xhc3M9ImNscy01IiBkPSJNMzY3LjcyOCw0NDNhMjYuMjUsMjYuMjUsMCwxLDEsMjYuMjUtMjYuMjVBMjYuMjUsMjYuMjUsMCwwLDEsMzY3LjcyOCw0NDNabTAtNDkuNWEyMy4yNSwyMy4yNSwwLDEsMCwyMy4yNSwyMy4yNUEyMy4yNSwyMy4yNSwwLDAsMCwzNjcuNzI4LDM5My41WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTYiIGQ9Ik0zNjIuMjI0LDM3NS41ODNjMy43MzktNi45NTEtMTkuMDgzLTUuMzE1LTYuMzgyLDExLjY4My0zLjE2NC00LjIzNCwxLjQuNzU2LS43OTEsMi44MzlsMS42MS0xLjA1NGMtMy4wMjcuNTY4LTQuNDg2LDAuMDYzLTMuMjMyLTEuMjI5LDEuNDgxLTEuNTI3LDMuODY2LDEuNjQ0LDUuMjE2LTEuNTEycy0zLjUwNy0xLjQwNi00LjQzLTMuNDU2Yy0yLjMyOS01LjE3OCw1Ljg4Mi0xMi43NjgsNy45LTguNzc3QzM2NC4xNzUsMzc4LjE3MSwzNjEuMzI0LDM3NS42NzcsMzYyLjIyNCwzNzUuNTgzWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTciIGQ9Ik0zNTUuMTE2LDM4OC43NDljNC4xNzktLjYzMSw5LjEyMS01LjI5NCwzLjU0OC0zLjUyNS0yLjk2NS45NDItMS4zNTktLjUzMy0xLjEyLTAuOTEsNS44NTItOS4yNzYtMy4yNzgtLjE1OC0wLjczMi00LjM2LDEuNjQ2LTIuNzE3LTYuNzIyLTUuNTQ4LjQ3Ni00LjMsOC42NDUsMC41Miw3LjEsNy4yLDEuOTIzLDEwLjA2NkMzNTguODE5LDM4NS45MzYsMzU0LjkxOSwzODguNzc4LDM1NS4xMTYsMzg4Ljc0OVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNDEuNDY5IC0zNzEuNzUpIi8+CiAgPHBhdGggY2xhc3M9ImNscy04IiBkPSJNMzU4LjcwNywzODUuOTQ1YTcuNzQ0LDcuNzQ0LDAsMCwwLTMuMywxLjg2NWMtMS43OCwxLjYzNi0xLjQ0NSwzLTEuMDgzLDQuNTY4LDAuNDIyLDEuODMuMzIsMy42MjQsMS4yMzksNC44MjRhMzAuOTM1LDMwLjkzNSwwLDAsMSwyLjY0MiwzLjczNSwzMS40NzMsMzEuNDczLDAsMCwxLDEuODg3LDMuN2MwLjQ2MiwxLjA2MSwxLjE1MywyLjAzMywxLjY0NSwzLjExLDAuMDY4LDAuMTQ4LjEyOCwwLjI5MywwLjE4MiwwLjQ0MmExMi45MzIsMTIuOTMyLDAsMCwwLC4zNDgsMS43NDljMS41NzEsMS44NTQsMy4xNDIsMi45LDMuMzM1LDMuNjIzLDAuNjc1LDIuNTI1LDEuODcxLDQuMjUxLDIuMDcsNy43NTFhNDMuODY2LDQzLjg2NiwwLDAsMCwuNTcsNy43YzEuMzksMy42LDMuMjI0LDcuOTMzLDIuNzA3LDYuODIyYTEyLjIxNSwxMi4yMTUsMCwwLDEsMS4wMTktMy40NTYsMC45NzEsMC45NzEsMCwwLDEsMS42MzUtLjMzYy0yLjM3Ny0zLjY0OCwxLjIwOC01Ljc2NSwyLjU1My00LjQ2OCw0LjU2Nyw0LjQuNDA4LTMuNTExLDAuNDA4LTMuNTExLTEuMDItMy40NS0xLjI3NC00LjA5My0yLjQ4My02LjA1OS0wLjU3MS0uOTI4LTEuNjYzLTIuNy0yLjAyMy0zLjEyOGE2LjUxNCw2LjUxNCwwLDAsMS0xLjE2My0xLjkzMmMtMC4zNy0xLjA3Ni4zNjYtMi40NDgtLjItMy4xODYtMS42MTQtMi4xMTUtMi0yLjM4Ny0yLjg2OS01LjE5LTEuNTc3LTEuOTMxLTIuMjExLTMuNzQzLTMuOC01LjY2N2E3LjI5LDcuMjksMCwwLDEtMi4xMDctMy45MjVjLTAuMjQ2LTEuNzc1LjM5My0zLjgzNi0uMDU1LTUuODUxQzM2MS4zMjcsMzg2LjcyMSwzNjAuMzMyLDM4NS42NDYsMzU4LjcwNywzODUuOTQ1WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTkiIGQ9Ik0zNTguOTExLDM4NS45MTVhMi41MjMsMi41MjMsMCwwLDEsLjU0MiwwYy0wLjI0MS4xODgtLjQzNSwwLjM1Ni0wLjU2NCwwLjQ3NS0xLjc4MSwxLjYzNi0zLjQsMy41NjYtMy4wNDIsNS4xMzUsMC4yMjMsMC45Nyw0LjMsMy42ODMsMy4wNjMsMTAuNjctMC4yMTEtLjM4OS0wLjQzOS0wLjc5Mi0wLjcwNy0xLjI1NWEzMC45MzUsMzAuOTM1LDAsMCwwLTIuNjQyLTMuNzM1Yy0wLjkxOS0xLjItLjgxNy0yLjk5NC0xLjIzOS00LjgyNC0wLjM2Mi0xLjU2OS0uNy0yLjkzMiwxLjA4My00LjU2OGE3Ljc0NCw3Ljc0NCwwLDAsMSwzLjMtMS44NjVjMC4wNjUtLjAxMi4xMjgtMC4wMjEsMC4xOS0wLjAyOFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zNDEuNDY5IC0zNzEuNzUpIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xMCIgZD0iTTM1NS4yOTMsMzg0Ljk4Yy0zLjIwNiwzLDcuODg4LDcuNzM3LDUuNDM0LTUuMDIsMC42MTIsMy4xNzgtLjUtMC43NzQuOTYzLTEuNDA4bC0wLjk3OC4yYzEuNTQ0LDAuNDMsMi4xMjcsMS4wNzcsMS4yNjgsMS41LTEuMDE2LjUtMS40ODEtMS44ODgtMi43NzItLjQ0czEuMzQzLDEuNjY1LDEuMzY5LDMuMDUyYzAuMDY2LDMuNDkxLTMuNjc5LDUuMjQzLTMuNTU4LDIuNDE3UzM1NS43MzYsMzg1LjE1LDM1NS4yOTMsMzg0Ljk4WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTM0MS40NjkgLTM3MS43NSkiLz4KPC9zdmc+Cg==" height="48" width="48" x="${x + 250}" y="${y + 195}" />`;
        spoilerAlert += (parseInt(activeOverUnder) === 0) 
                     ? `<text class="spoiler-hrs perfect" x="${x -40}" y="${y + 60}" text-anchor="start">🎈equal to 🎉</text>` 
                     : `<text class="spoiler-hrs" x="${x + 150}" y="${y + 70}" text-anchor="end">${activeOverUnder}</text>
                        <g transform="rotate(-90 ${x + 150} ${y + 32})"><text class="spoiler-hrs-sign" x="${x + 148}" y="${y + 32}" text-anchor="start" transform="translate(-36 15)">percent</text></g>
                        <text class="spoiler-hrs-character" x="${x + 145}" y="${y + 32}" text-anchor="start" transform="translate(-12 0)">%</text>
                        <text class="spoiler-over-under-label" x="${x + 173}" y="${y + 43}" text-anchor="start">${overUnderLabel}</text>`;
        
        spoilerAlert += `<text class="spoiler-ideal-label" x="${x + 173}" y="${y + 69}" text-anchor="start">ideal burn</text>
                        <text class="hour-synopsis" x="${x + 150}" y="${y + 102}" text-anchor="middle">
                            <tspan>${this.dayta[daytaIndex]}</tspan> of <tspan>${this.idealHoursByDay[daytaIndex]}</tspan> hours remaining
                        </text>

                        <g transform="rotate(-90 ${x + 9} ${y + 219})"><text class="spoiler-facilitated" x="${x + 35}" y="${y + 244}" text-anchor="start">facilitated by:</text></g>
                        <foreignObject x="${x + 48}" y="${y + 115}" width="205" height="130">
                            <div xmlns="http://www.w3.org/1999/xhtml" style="overflow:auto;">

                              <span id="didBurnNames"><b>Burned: </b>${burners.burned.join(', ').replace(/@.*?(?:org|com)|\d/gi, '').replace(/(, )?([A-Z])([A-Z])/g, '$1$2 $3')}</span>
                              <span id="didNotBurnNames"><b>Didn't Burn: </b>${burners.unburned.join(', ').replace(/@.*?(?:org|com)|\d/gi, '').replace(/(, )?([A-Z])([A-Z])/g, '$1$2 $3')}</span>
                            </div>
                        </foreignObject>
                        </g>`;
        this.graphObjectSVG.insertAdjacentHTML('beforeEnd', spoilerAlert);
        document.querySelectorAll("#didBurn, #didNotBurn").forEach(el=>{
            el.addEventListener('click', this.toggleWhoBurnedView);
            el.previousElementSibling.addEventListener('click', this.toggleWhoBurnedView)
        });
        
    }
    
    plotDataPoint(daytaIndex, x, y, radius, id, overUnder, drawLines=true, dynamicColor=true, click=true, hover=true, animated=true){
        let inertCaptionOffset = (overUnder > 0) ? -60 : 35,
            calcColor = Math.min(120, Math.max(0, parseInt((this.idealHoursPerDay + 30 + -overUnder)))),
            capY;
        x -= radius;
        y = parseInt((y * this.vertScaleFactor) - (radius / 2) - 6);
        capY = y + inertCaptionOffset + radius;
        if(this.pointCount){
        this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `
                                                             <rect id="slotPlot${this.pointCount}" class="${this.pointCount === 0 ? 'seed' : '' } slot-plot"
                                                                   x="${x + (radius / 2) - 3}" 
                                                                   y="${y}" 
                                                                   rx="${radius}" 
                                                                   width="${radius*2}" 
                                                                   height="${radius*2}"
                                                                   data-index="${daytaIndex}"
                                                                   style="--calc-color:${calcColor}; 
                                                                          --x:${x - radius / 4}; 
                                                                          --y:${y - radius / 4};
                                                                          --rx:${radius}; 
                                                                          --overUnder:${overUnder};
                                                                          --width:${radius*2}px; 
                                                                          --height:${radius*2}px;"
                                                             />
                                                             
                                                             `);
            document.querySelector("#slotPlot" + this.pointCount).addEventListener('mouseover', (e, trg=e.target)=>{
                trg.dataset.hovering="true"
                trg.insertAdjacentHTML('beforeBegin', `<circle class="pulsar" cx="${x + (radius)}" cy="${y+3}" r="${radius-8}" style="--calc-color:${calcColor};" />`);
            });
            document.querySelector("#slotPlot" + this.pointCount).addEventListener('mouseout', (e, trg=e.target)=>{
                let openPulsars = document.querySelectorAll('.pulsar');
                if(openPulsars) [...openPulsars].forEach(pulsar=>pulsar.remove())
                trg.removeAttribute('data-hovering')
            });            
            document.querySelector("#slotPlot" + this.pointCount).addEventListener('click', (e, trg=e.target)=>{
                this.plotSpoilers(e, trg, this);
            });
            if(parseInt(overUnder) !== 0){
               this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `
                    <text class="slot-plot-caption" x="${x + (radius)}" y="${overUnder > 0 ? capY - 25 : capY}" text-anchor="middle" style="--calc-color:${calcColor}; --over-under-inverter:${overUnder > 0 ? 1 : 0}; --y:${overUnder > 0 ? capY - 25 : capY}">${overUnder}%</text>
                    <text class="slot-plot-caption" x="${x + (radius)}" y="${overUnder > 0 ? capY : capY + 25}" text-anchor="middle" style="--calc-color:${calcColor}; --over-under-inverter:${overUnder > 0 ? 1 : 0}; --y:${overUnder > 0 ? capY : capY + 25}">${(overUnder > 0) ? "behind!" : "ahead!"}</text>
               `);
            }else{
                let spotOnMsg = zeroPt();
                this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `<foreignObject class="slot-plot-wrapped" width="80" height="150"  x="${x + (radius) - 40}" y="${(y - (radius)) + (inertCaptionOffset * this.vertScaleFactor) - 15}" text-anchor="middle" style="color:hsla(${calcColor}, 100%, 30%, 0.66);"><center>${spotOnMsg}</center></foreignObject>`);
            }
        }else{
            this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `
                <image x="-18" y="-28" height="42" width="32" href='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTAuNjU3IiBoZWlnaHQ9IjY1LjgxMiIgdmlld0JveD0iMCAwIDUwLjY1NyA2NS44MTIiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGw6ICM1MzI4MTI7CiAgICAgIH0KCiAgICAgIC5jbHMtMSwgLmNscy0yIHsKICAgICAgICBmaWxsLXJ1bGU6IGV2ZW5vZGQ7CiAgICAgIH0KCiAgICAgIC5jbHMtMiB7CiAgICAgICAgZmlsbDogdXJsKCNsaW5lYXItZ3JhZGllbnQpOwogICAgICB9CiAgICA8L3N0eWxlPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJsaW5lYXItZ3JhZGllbnQiIHgxPSIzMjAuOTYyIiB5MT0iMzI3LjY1NiIgeDI9IjMzNy43NTciIHkyPSIyNzUuOTY5IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzUzMjgxMiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjAuMDE0IiBzdG9wLWNvbG9yPSIjNTMyODEyIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMC4wNzciIHN0b3AtY29sb3I9IiMyNzY2MjMiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIwLjE0OCIgc3RvcC1jb2xvcj0iIzE4MCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjAuNzgxIiBzdG9wLWNvbG9yPSIjMTYwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMC45OSIgc3RvcC1jb2xvcj0iIzM1NWMxYiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMzNTVjMWIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTM0Mi4xMjksMzIzLjc0N2MzLjUyNywxMS45ODMtMTYuMzkxLDEyLjU4Mi0xOC4zNjcsMTguMDMzbC0wLjA3Mi0uMDExYzguNjMxLTEwLjI4MSwxMS43MTEtNS4yODYsMTYuNjIyLTEzLjEtMTcuODQyLDE1LjM3My0zNC44NTcsMS41NzctMzMuMjQ2LTguMDE1LDkuMTA4LS4xMzQsMTQuNjkzLDUuODkzLDIyLjA0NSw3LjY3OCw0LjYzNywxLjIsMTAuMTQ5LS44NTMsMTIuMzQ1LTQuODc2WiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTMwNC4wMzEgLTI3NS45NjkpIi8+CiAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMzM4LjA2MSwzMDkuMjI2Yy04LjIzNiwyLTEyLjc4OS0uNzk0LTEyLjc4OS0wLjc5NCwzLjI4MSwxMS43MzgsMTMuMTI1LDQuMTYxLDE1LjUzNSwxMC4xNWE2LjA5NCw2LjA5NCwwLDAsMSwuMTQsNC42OCwxMS40NjUsMTEuNDY1LDAsMCwxLTExLjgzNiw0LjA2OGMtNy40OS0xLjgxOS0xMy4xNC04LjA0OC0yMi41NTQtNy42NzIsMTQuMjg2LTE0LjY1OCwyMS4xMjguODUzLDMyLjU5MywwLjE2NkMzMjUuOTI3LDMxOC4xODksMzI0LDMwOCwzMjQsMzA4YzAtMy42NjcsMTcuMTc1LTExLjU5NCwyMS45NzEtMTguNC01Ljc5NCw2LTExLjExMSw4LTE2LjU1MSwxMS4yNzhsLTQuODMzLDMuOTU0di0wLjg3OWMtMC44NzgtMi4yLS42MTMtNS4wNzUtMC4yOTMtNy4zMjMsMi4wMjgtMTQuMjc4LDIwLjEyMS0xMS4yLDI5LjczMi0yMC42NTJDMzU2LjU1NiwyODQuNDYyLDM1MS42NjYsMzA1LjkxNSwzMzguMDYxLDMwOS4yMjZaTTMyNCwzMTFjMCwwLjc1NS4xMzgsMS4wNjksMCwxLTEuODM4LTQuOS0zLjI4Ni00LjQ1Mi0zLjgyNS00Ljg4NS02LjE1OSw2LjU1LTE0LjkyMy0zLjk1MS0xNi4xNDMtOS4wMTcsMy41MjgsMS4yMjYsNi40OTQtMi4wNzIsMTEuNDIyLS4yMDksMy45ODMsMS4zNiw2LDMuNjMsNi4xMTIsNi43NTdsLTAuMTktLjA3NGMtMy4yNjgtMi43NDYtNy43OTQtMy4zNTMtMTEuNjUyLTQuMjczbC0wLjA3OC4yQzMxNy43MzYsMzAyLjgsMzIxLjksMzA0LjAyLDMyNCwzMTFaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzA0LjAzMSAtMjc1Ljk2OSkiLz4KPC9zdmc+Cg=='/>
                <text class="seed slot-plot-caption" x="-32" y="18" text-anchor="middle" style="--calc-color:${calcColor};">seed</text>
                <text class="seed slot-plot-caption" x="35" y="25" text-anchor="middle" style="--calc-color:${calcColor};" >(day 0)</text>
           `);
        }
        this.pointCount++;
    }

    renderSprintDataGradients(drawLines=true){
        let coordinatePairs=[], pointPlot = [];

        let daytaPlots = [...dayta].map((plot, ind)=> (ind * this.horizontalInterval).toFixed(1) + ' ' + this.getYForGraph(plot * this.vertScaleFactor).toFixed(1));
        daytaPlots.push((this.horizontalInterval * (this.dayta.length-1)) + ' ' + this.getYForGraph(this.idealHoursByPlot[this.dayta.length-1]))
        this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `<mask id="sprintMap"><polygon points="${daytaPlots}" ${{fill:'black'}}" fill="white" /></mask>`);


        for(var i=0; i<this.dayta.length; i++){
            let x = (i * this.horizontalInterval),
                y = (this.maxHourValue - this.dayta[i]);
            
            coordinatePairs.push(x + ' ' + (y * this.vertScaleFactor));
            let hourDelta = (this.dayta[i] - this.idealHoursByDay[i]);
            let hourDifferential = ((this.dayta[i] / this.idealHoursByDay[i] * 100)).toFixed(1);
            let overUnder = (hourDifferential - 100).toFixed(1);
            let hourDeltaDetails = 'Right on track!';

            if(overUnder !== 0) 
                hourDeltaDetails = (overUnder < 0) ? 'behind by ' + hourDelta + ' hours (' + hourDifferential + '%)!' : 'ahead by +' + hourDelta + ' hours (+' + hourDifferential + '%)!';
            
            pointPlot.push([i, x, y, 20, 'plotted-point-' + i, overUnder]);
        }
        if(drawLines){
            // coordinatePairs.push(((this.dayta.length-1) * this.horizontalInterval) + ' ' + (500 - (this.idealHoursByDay[i-1] * this.vertScaleFactor)));
            this.renderComplexPoly(coordinatePairs, {class:'progress-bg', fill:'transparent', stroke:'#FFF', 'stroke-dasharray':'3 1', 'stroke-width':3});
            this.renderComplexPoly(coordinatePairs, {class:'progress-bg', fill:'transparent', stroke:'#AA6F', 'stroke-dasharray':'3 1', 'stroke-width':3});
            this.renderComplexPoly(coordinatePairs, {class:'progress', fill:'transparent', stroke:'#066C', 'stroke-dasharray':'3 1', 'stroke-width':3});
        }
        pointPlot.forEach(pt=>this.plotDataPoint(...pt))
        
        
    }
    
     generateHeaders(){
        for(var i=1; i<workDatesInSprint.length; i++){
            console.log(this.workDatesInSprint[i])
            let dayToRepresent = new Date(this.workDatesInSprint[i]);
            console.log('dayToRepresent :', dayToRepresent);

            this.generateHeader(i, monTxt[dayToRepresent.getMonth()] + ' ' + dayToRepresent.getDate(), dayTxt[dayToRepresent.getDay()])
        }
    }

     generateHeader(slot, date, dayOfWeek){
        if(slot == null ||  date == null ||  dayOfWeek == null) return
        this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `<g class="header-panel" style="--slot:${slot};">
                                                <rect class="panel-ele" x="0" y="0" width="99" height="45"></rect>
                                                <text class="calendar-date" text-anchor="end" x="60" y="17">${date}</text>
                                                <text class="day-of-week" text-anchor="begin" x="10" y="43">${dayOfWeek}</text>
                                                <text class="slot-number" text-anchor="middle" x="76" y="48">${slot}</text>
                                            </g>`);
    }
    
    labelAxis(upperBoundary=this.maxHourValue) {
        let gradScale = upperBoundary / 16,
            gradLines = 500/16;
        let graduations = [];
        for(var i=0; i<16; i++){
            graduations.push(`<text class="graduations" text-anchor="end" x="-10" y="${(i * gradLines) }">${(i%2!==0) ? '⸺' : this.maxHourValue - Math.round(i*gradScale) + 'hrs –'} </text>`);
        }
        graduations.push(`<text class="graduations" text-anchor="end" x="-10" y="${(gradLines * 16) }">DONE! 🎉</text>`);
        this.graphObjectSVG.insertAdjacentHTML('beforeEnd', graduations.join(''))
        if((this.workDatesInSprint.length - 1) % 5 === 0){
            this.graphObjectSVG.insertAdjacentHTML('beforeEnd', `
                <rect x="0" y="501" width="499" height="30" rx="6" fill="#FFF" />
                <rect x="500" y="501" width="499" height="30" rx="6" fill="#FFF" />
                <text x="250" y="523" text-anchor="middle" fill="#DDD"> WEEK 1</text>
                <text x="750" y="523" text-anchor="middle" fill="#DDD"> WEEK 2</text>
                <rect x="-5" y="501" width="1005" height="4" rx="0" fill="#333" />
            `)
        }
    }
}
let burndown = new BurndownChart({dailyHourTotals: dayta, datesToGraph:workDatesInSprint});
fondue.burndown = burndown;
export default burndown;

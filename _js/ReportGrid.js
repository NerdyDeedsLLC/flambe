import {toDate, format, isDate, startOfDay, parseISO, isWeekend, isEqual, isBefore, isAfter, differenceInCalendarDays, differenceInBusinessDays, differenceInCalendarISOWeeks, getDay, formatRFC3339, addDays, subDays } from 'date-fns'

export default class ReportGrid {
    constructor() {
        this.isInitialized  = false
        this.sprintName     = null;
        this.startDate      = null;
        this.endDate        = null;
        this.startDayOfWeek = null;
        this.endDayOfWeek   = null;
        this.daySpan        = 0;
        this.workdaySpan    = 0;
        this.weekSpan       = 0
        this.nameOfSprint   = '';
        this.dataFilePulls  = [];
        this.sprintSettings = {
            "showWeekends"    : false,
            "showNonWorkDays" : true,
            "excludedDays"    : [],
            "showGrid"        : true,
            "showGraph"       : true
        };
    }

    initializeGrid(name=fondue.SprintName, sDate=fondue.SprintStartDate, eDate=fondue.SprintEndDate){
    console.log('initializeGrid :', name, sDate, eDate);
        if(!(sDate && eDate)) return false;
        this.sprintName     = name;
        this.startDate      = parseISO(sDate + 'T00:00:00');
        this.endDate        = parseISO(eDate + 'T00:00:00');
        this.startDate      = startOfDay(this.startDate);
        this.endDate        = startOfDay(this.endDate);
        this.isInitialized  = true;
        this.startDayOfWeek = getDay(this.startDate);
        this.endDayOfWeek   = getDay(this.endDate);
        this.weekSpan       = Math.abs(differenceInCalendarISOWeeks(this.startDate, this.endDate))

        this.daySpan   = differenceInCalendarDays(this.endDate, this.startDate);
        this.workdaySpan    = differenceInBusinessDays(this.endDate, this.startDate);

        // if(this.isInitialized) return false;

        qs(".param-form.report-options").addEventListener('click', (e, trg=e.target)=>this.updateDaysInSprint())
        this.updateDaysInSprint()
        this.isInitialized  = true;
    }

    generateReportSettingsCalendar(){
        if(!this.isInitialized) return false;
        let getCalDay = (dt, declareChecked=null, outOfRange=false) => {
            dt = new Date(dt);
            console.log('dt :', dt);
            let sD = new Date(this.startDate);
            let eD = new Date(this.endDate);
            
            declareChecked = (!isBefore(dt, sD) && !isAfter(dt, eD) && !isWeekend(dt));
            declareChecked = declareChecked ? 'checked' : '';
            let calDay = `<input type="checkbox" name="calSel${format(dt, 'MM-dd')}" id="calSel${format(dt, 'MM-dd')}"  class="checkable-day date-${format(dt, 'dd')} day-${daysOfWeek[getDay(dt)]} ${isWeekend(dt) ? 'weekend' : 'weekday'}" ${declareChecked} ${outOfRange ? "readonly disabled" : ""}>
                <label for="calSel${format(dt, 'MM-dd')}" class="calendar-sel-toggler" data-month="${format(dt, 'MMM')}">${format(dt, 'dd')}
            </label>`
            return calDay;
        }

        let numberOfWeeksInCalendar = differenceInCalendarISOWeeks(this.endDate, this.startDate)
        console.log('numberOfWeeksInCalendar :', numberOfWeeksInCalendar);
        let calOutput = '';
        let calOutput2 = '';
        let daysToAccountFor = this.workdaySpan;
        let runningDay = 0,
            runningDate = null;;

        for(var i=0; i<this.startDayOfWeek; i++){
            runningDate = subDays(this.startDate, (this.startDayOfWeek-i))
            calOutput2 += getCalDay(runningDate, false, true);
        }
        while(runningDay <= this.daySpan){
            runningDate = addDays(this.startDate, runningDay);
            calOutput2 += getCalDay(runningDate);
            runningDay++;
        }
        for(var i=this.endDayOfWeek + 1; i<7; i++){
            runningDate = addDays(this.endDate, (i-this.endDayOfWeek));
            calOutput2 += getCalDay(runningDate, false, true);
        }

        qs('#calSelDays').innerHTML = calOutput2;
        
    }

    updateDaysInSprint(){
        if(window.debounce === true || !this.isInitialized) return false;
        window.debounce = true;
        setTimeout(()=>{
            let selectedDisplayMode, countSelectedWeekdays, countSelectedWeekends = null, allSelectableDays ;
            if(qs("#display-weekends").checked){
                selectedDisplayMode = qs("[name='weekends-display-mode']:checked").id;
                console.log('selectedDisplayMode :', selectedDisplayMode);
                allSelectableDays = (selectedDisplayMode === 'we-disp-as-placeholders') ? qsa('.checkable-day.weekday:not(:disabled)') : qsa('.checkable-day:not(:disabled)');
                countSelectedWeekends = qsa('.checkable-day.weekend:checked');
            }else{
                allSelectableDays = qsa('.checkable-day.weekday:not(:disabled)');
            }
            let unselectedWeekends = qsa('.checkable-day.weekend:not(:checked):not(:disabled)');
            unselectedWeekends = (unselectedWeekends == null) ? 0 : unselectedWeekends.length;
        countSelectedWeekdays = qsa('.checkable-day.weekday:checked');
        allSelectableDays = (allSelectableDays == null) ? 0 : allSelectableDays.length;
        countSelectedWeekdays = (countSelectedWeekdays == null) ? 0 : countSelectedWeekdays.length;
        countSelectedWeekends = (countSelectedWeekends == null) ? 0 : countSelectedWeekends.length;
        if(selectedDisplayMode === 'we-disp-as-placeholders') countSelectedWeekends = 0;
        if(selectedDisplayMode === 'we-disp-as-optional-days') allSelectableDays = allSelectableDays - unselectedWeekends;

        console.log('countSelectedWeekdays, countSelectedWeekends, allSelectableDays :', countSelectedWeekdays, countSelectedWeekends, allSelectableDays);
        let DIS = qs('#days-in-sprint');
        DIS.dataset.value = countSelectedWeekdays + countSelectedWeekends;
        DIS.dataset.span = allSelectableDays;

        window.debounce = false;}, 100)
    }
}

window.reportGrid    = new ReportGrid()
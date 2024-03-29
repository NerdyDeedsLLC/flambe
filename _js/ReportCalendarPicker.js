import {toDate, format, isDate, startOfDay, parseISO, isWeekend, isEqual, isBefore, isAfter, differenceInCalendarDays, differenceInBusinessDays, differenceInCalendarISOWeeks, getDay, addDays, subDays } from 'date-fns'

export default class ReportCalendarPicker {
    constructor() {
        this.isInitialized  = false
        this.sprintName     = null;
        this.startDate      = null;
        this.endDate        = null;
        this.startDayOfWeek = null;
        this.endDayOfWeek   = null;
        this.dateCollection = null;

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

    initializeCalendarPicker(name=fondue.SprintName, sDate=fondue.SprintStartDate, eDate=fondue.SprintEndDate){
    console.log('initializeCalendarPicker :', name, sDate, eDate);
        if(!(sDate && eDate)) return false;
        this.sprintName     = name;
        this.startDate      = fondue.MANdate(sDate);
        this.endDate        = fondue.MANdate(eDate);
        this.startDate      = this.startDate;
        this.endDate        = this.endDate;
        this.isInitialized  = true;
        this.startDayOfWeek = getDay(this.startDate);
        this.endDayOfWeek   = getDay(this.endDate);
        this.weekSpan       = Math.abs(differenceInCalendarISOWeeks(this.startDate, this.endDate))

        this.daySpan        = differenceInCalendarDays(this.endDate, this.startDate);
        this.workdaySpan    = differenceInBusinessDays(this.endDate, this.startDate);

        // if(this.isInitialized) return false;

        qs(".param-form.report-options").addEventListener('click', (e, trg=e.target)=>this.updateDaysInSprint())
        this.updateDaysInSprint()
        this.isInitialized  = true;
    }

    generateReportSettingsCalendar(){
        if(!this.isInitialized) return false;
        let sD = fondue.MANdate(this.startDate);
        let eD = fondue.MANdate(this.endDate);
        
        let getCalDay = (dt, declareChecked=null, outOfRange=false) => {
            dt = fondue.MANdate(dt);
            declareChecked = (!isBefore(dt, sD) && !isAfter(dt, eD) && !isWeekend(dt));
            declareChecked = declareChecked ? 'checked' : '';
            let calDay = `<input type="checkbox" name="calSel${format(dt, 'MM-dd')}" id="calSel${format(dt, 'MM-dd')}" data-fulldate="${format(dt, 'yyyy-MM-dd')}" class="checkable-day date-${format(dt, 'dd')} day-${daysOfWeek[getDay(dt)]} ${isWeekend(dt) ? 'weekend' : 'weekday'}" ${declareChecked} ${outOfRange ? "readonly disabled" : ""}>
                <label for="calSel${format(dt, 'MM-dd')}" class="calendar-sel-toggler" data-month="${format(dt, 'MMM')}" data-fulldate="${format(dt, 'yyyy-MM-dd')}">${format(dt, 'dd')}
            </label>`
            return calDay;
        }

        let numberOfWeeksInCalendar = differenceInCalendarISOWeeks(eD, sD);
        console.log('numberOfWeeksInCalendar :', numberOfWeeksInCalendar);
        let calOutput = '';
        let calOutput2 = '';
        let daysToAccountFor = [];
        let daysToAccountFormat = 'yyyy-MM-dd';
        let runningDay = 0,
            runningDate = null;;

        for(var i=0; i<this.startDayOfWeek; i++){
            runningDate = subDays(sD, (this.startDayOfWeek-i))
            calOutput2 += getCalDay(runningDate, false, true);
            // daysToAccountFor.push(format(runningDate, daysToAccountFormat))
        }
        while(runningDay <= this.daySpan){
            runningDate = addDays(sD, runningDay);
            calOutput2 += getCalDay(runningDate);
            daysToAccountFor.push(format(runningDate, daysToAccountFormat))
            runningDay++;
        }
        for(var i=this.endDayOfWeek + 1; i<7; i++){
            runningDate = addDays(this.endDate, (i-this.endDayOfWeek));
            calOutput2 += getCalDay(runningDate, false, true);
            // daysToAccountFor.push(format(runningDate, daysToAccountFormat))
        }


        qs('#calSelDays').innerHTML = calOutput2;
        this.dateCollection = daysToAccountFor;
        return daysToAccountFor;
    }

    updateDaysInSprint(){
        if(window.debounce === true || !this.isInitialized) return false;
        window.debounce = true;
        setTimeout(()=>{
            let selectedDisplayMode, countSelectedWeekdays, countSelectedWeekends = null, allSelectableDays ;
            if(qs("#weekends-display").checked){
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

            let allDatesMarkedWorkable = [];
            
            if(countSelectedWeekdays && Array.isArray(countSelectedWeekdays)) allDatesMarkedWorkable = [...allDatesMarkedWorkable, ...countSelectedWeekdays];
            if(countSelectedWeekends && Array.isArray(countSelectedWeekends)) allDatesMarkedWorkable = [...allDatesMarkedWorkable, ...countSelectedWeekends];
            allDatesMarkedWorkable = [...allDatesMarkedWorkable];

            let a=[1,2,3,4],
                b=[5,6,7,8],
                c=a;
                c = [...c, ...b]
            console.log('allDatesMarkedWorkable :', allDatesMarkedWorkable, c);
            
            countSelectedWeekdays = (countSelectedWeekdays == null) ? 0 : countSelectedWeekdays.length;
            countSelectedWeekends = (countSelectedWeekends == null) ? 0 : countSelectedWeekends.length;
            if(selectedDisplayMode === 'we-disp-as-placeholders') countSelectedWeekends = 0;
            if(selectedDisplayMode === 'we-disp-as-optional-days') allSelectableDays = allSelectableDays - unselectedWeekends;

            let DIS = qs('#days-in-sprint');
            DIS.dataset.value = countSelectedWeekdays + countSelectedWeekends;
            DIS.dataset.span = allSelectableDays;

            if(allDatesMarkedWorkable.length) {
                console.log('allDatesMarkedWorkable :', allDatesMarkedWorkable);
                let strigifiedDatesInSprint = [...allDatesMarkedWorkable].map(dts=>dts.dataset.fulldate);
                fondue.WorkableDaysCount    = strigifiedDatesInSprint.length;
                fondue.WorkableDaysInSprint = strigifiedDatesInSprint.join('|');
                if(allDatesMarkedWorkable && allDatesMarkedWorkable.length > 0) {
                    fondue.WorkableDaysCount = allDatesMarkedWorkable.length;
                }
                fondue.SprintEndDate = strigifiedDatesInSprint.pop();
                fondue.SprintStartDate = strigifiedDatesInSprint.length ? strigifiedDatesInSprint.unshift : fondue.SprintEndDate;

                fondue.gui.processReportParameters();
            }
            _('fondue object', fondue);

        window.debounce = false;}, 100)
    }
}
// 
// window.ReportCalendarPicker    = new ReportCalendarPicker()

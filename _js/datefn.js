import parseISO from 'date-fns/parseISO'
import isEqual from 'date-fns/isEqual'
import isBefore from 'date-fns/isBefore'
import isAfter from 'date-fns/isAfter'
import subDays from 'date-fns/subDays'

export default class ReportCalendarPicker {
    constructor() {
        this.startDate = parseISO('2021-05-26T00:00:00');
        this.produceErrorCondition()
    }

    produceErrorCondition(){
        let leaveOpen = true;
        let getCalDay = (dt, sD) => {
            if(leaveOpen) leaveOpen = console.group('Iterating date:', dt);
            else console.groupCollapsed('Iterating date:', dt);
            
            console.log('isBefore(dt,sD):', isBefore(dt, sD));
            console.log('isBefore(sD,dt):', isBefore(sD, dt));
            console.log('isAfter(dt,sD):',  isAfter( dt, sD));
            console.log('isAfter(sD,dt):',  isAfter( sD, dt));
            console.log('isEqual(sD,dt):',  isEqual( sD, dt));
            
            console.groupEnd()
        }

        for(var i=0; i<5; i++){ getCalDay(subDays(this.startDate, (5-i)), this.startDate) }
    }
}

window.ReportCalendarPicker = new ReportCalendarPicker()

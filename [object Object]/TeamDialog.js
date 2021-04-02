(function (factory) {
    typeof define === 'function' && define.amd ? define('teamDialog', factory) :
    factory();
}((function () { 'use strict';

    class TeamDialog {
      constructor() {
        this.initialized = false;
        this.deleteMode = false;
        this.teamList = muse('teamlist', {});
        this.subSearchRE = '';
        this.dialogObj = qs('#team');
        this.memberSel = qs('#team-members');
        this.notifier = qs('#tm-message');
        this.ctaButtons = {
          'cancel': qs('#tmbtnCancel'),
          'save': qs('#tmbtnSave'),
          'done': qs('#tmbtnDone'),
          'winX': qs('#team > h1 > button')
        };
        this.formFields = qsa('input,hidden', this.dialogObj);
        this.init();
        this.performSubstitution = this.performSubstitution.bind(this);
      }

      init() {
        if (this.initialized) return false;
        this.ctaButtons.winX.addEventListener('click', () => this.closeDialog());
        this.ctaButtons.cancel.addEventListener('click', () => this.closeDialog());
        this.ctaButtons.save.addEventListener('click', () => this.saveMember());
        this.ctaButtons.done.addEventListener('click', () => this.saveAndClose());
        this.memberSel.addEventListener('change', () => this.loadMember());
        this.syncMemberList();
        this.initialized = true;
      }

      closeDialog() {
        setTimeout(() => {
          if (this.confirmDiscard()) {
            this.toggle();
            this.notifier.style = "display:none";
          }
        }, 250);
      }

      buildSubstitutionSearchRegEx() {
        this.subSearchRE = new RegExp(`(${Object.keys(this.teamList).join('|')})`, 'gim');
      }

      autoLearn(emailToLearn, attemptToParse = true) {
        if (Object.keys(this.teamList).indexOf(emailToLearn) !== -1) return false;
        let newPerson = {},
            personData = {};
        personData = {
          'tmdata-email': emailToLearn
        };

        if (attemptToParse) {
          let parsedComponents = emailToLearn.replace(/@.+|\d/g, '').match(/([A-Z])([A-Z][a-z]+)/);

          if (parsedComponents != null && parsedComponents.length > 2) {
            personData['tmdata-fname'] = parsedComponents[1] || "";
            personData['tmdata-lname'] = parsedComponents[2] || "";
          }
        }

        newPerson[emailToLearn] = personData;
        this.teamList = Object.assign(this.teamList, newPerson);
        retain('teamlist', JSON.stringify(this.teamList));
        this.syncMemberList();
      }

      performSubstitution(stringToSub) {
        const emailRE = /\b[A-Z]{1,2}\w+@\w+\.\w{2,8}\b/gim; // console.log('performSubstitution(stringToSub) :',stringToSub);

        let retVal = stringToSub.replace(this.subSearchRE, (s, m1) => {
          // console.log('m1 :', m1);
          if (this.teamList[m1]) {
            let foundPerson = this.teamList[m1]; // console.log('foundPerson :', foundPerson);

            return `${foundPerson['tmdata-fname']} ${foundPerson['tmdata-lname']}`;
          }
        });

        if (emailRE.test(retVal)) {
          if (window.autoLearn === true || confirm('Whoa there boss! Looks like you got some unknown emails there. You want I should try to learn them?')) {
            window.autoLearn = true;
            let newEmails = retVal.match(emailRE);
            newEmails.forEach(addr => this.autoLearn(addr));
          }
        }

        return retVal == null ? stringToSub : retVal;
      }

      showMessage(message, color = [100, 255, 100], delay = 1.75) {
        if (message == null) {
          this.notifier.style = "display:none;";
          return this.notifier.className = '';
        }

        this.notifier.innerText = message;
        this.notifier.style = 'display:block; --bgcolor:rgba(' + color + ',0.5);' + '--delay:' + delay + 's';
        this.notifier.className = 'show';
        this.timer = setTimeout(() => this.notifier.className = '', delay * 1000);
      }

      toggle(force) {
        this.dialogObj.classList.toggle('visible', force);
      }

      checkDirty() {
        var flds = this.formFields,
            isDirty = false;
        flds.forEach(fld => {
          isDirty = isDirty || fld.dataset.initial !== fld.value;
        });
        return isDirty;
      }

      confirmDiscard() {
        if (this.checkDirty()) {
          this.showMessage('Unsaved changes will be lost!', [255, 0, 0], 10);
          return confirm('Any unsaved changes will be lost with this action. Proceed?');
        }

        return true;
      }

      saveMember() {
        var flds = this.formFields,
            someContent = false;
        flds.forEach(fld => {
          someContent = someContent || fld.value !== "";
          if (typeof fld.dataset.initial === 'undefined' && this.memberSel.value !== "") fld.dataset.initial = fld.value;
        });

        if (this.memberSel.value !== "" && !someContent) {
          if (!this.deleteMode) {
            // console.log(this.memberSel, this.teamList)
            this.deleteMode = true;
            return this.showMessage("Clicking Save or Done again will DELETE selected team member.", [255, 100, 100], 20);
          } else {
            this.deleteMode = false; // console.log(window.tl = this.teamList);

            window.ms = this.memberSel;
            let saveResult = delete this.teamList[this.memberSel.value.split('|')[0]]; // console.log(this.teamList);

            if (saveResult === true) {
              this.showMessage("Team member removed.", [255, 100, 100]);
              this.timer = setTimeout(() => this.memberSel.selectedIndex = 0, 1000);
            } else this.showMessage("Unable to remove team member! Alert @JJ and... release the hounds.", [255, 100, 100]);
          }
        } else {
          if (!this.checkDirty()) return this.showMessage("Um... nothing's actually been changed...", [255, 255, 100]);
          flds = Object.fromEntries(flds.map(fld => [fld.name, fld.value]));
          if (flds['tmdata-email'] == null || flds['tmdata-email'] === '') return this.showMessage("Gotta at least gimme an e-mail, bucko....", [255, 100, 100]);
          this.teamList[flds['tmdata-email']] = Object.fromEntries(Object.entries(flds).filter(o => /tmdata/.test(o[0])));
        }

        retain('teamlist', JSON.stringify(this.teamList));
        this.syncMemberList();
        this.showMessage('Your changes were saved successfully.');
        return true;
      }

      saveAndClose() {
        let saveResult = this.saveMember();
        if (saveResult === true) this.timer = setTimeout(() => this.toggle(), 1500);
      }

      loadMember() {
        let memSel = this.memberSel.value;
        let flds = this.formFields;
        flds = Object.fromEntries(flds.map(fld => [fld.name, fld])); // console.log(flds);

        if (memSel !== '') memSel = memSel.split('|');
        flds['tmdata-email'].dataset.initial = flds['tmdata-email'].value = memSel[0] || '';
        flds['tmdata-fname'].dataset.initial = flds['tmdata-fname'].value = memSel[1] || '';
        flds['tmdata-lname'].dataset.initial = flds['tmdata-lname'].value = memSel[2] || '';
        this.showMessage('User data loaded.');
      }

      syncMemberList() {
        this.formFields.forEach(fld => fld.value = '');
        let teamMembers = Object.entries(this.teamList);
        let opStr = '';
        teamMembers.sort();
        teamMembers.forEach(member => opStr += `<option value="${member[1]['tmdata-email']}|${member[1]['tmdata-fname']}|${member[1]['tmdata-lname']}">${member[1]['tmdata-fname']} ${member[1]['tmdata-lname']} (${member[1]['tmdata-email']})</option>`);
        qs('#tmOptions').innerHTML = opStr;
        this.buildSubstitutionSearchRegEx();
      }

    }

    const teamDialog = new TeamDialog();
    qs('#launch').addEventListener('click', () => teamDialog.toggle());

})));

//# sourceMappingURL=TeamDialog.js.map

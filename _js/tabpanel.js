const switchTabs = (tabObj) => {
    if(tabObj == null || tabObj.disabled) return false;
    if(tabObj.__proto__.constructor.name === 'MouseEvent'){
        tabObj.preventDefault();
        tabObj = tabObj.target;
    }
    else if(typeof(tabObj).match(/object/i)) tabObj = tabObj.target;
    else tabObj = qs(tabObj);
    console.log(tabObj, tabObj.disabled, tabObj.dataset.index === -1);
    if(tabObj == null || tabObj.disabled || tabObj.dataset.index === '-1') return false;
    let tabSet = tabObj.parentNode;
    let tabPanel = tabSet.nextElementSibling;
    let newActiveIndex = tabObj.dataset.index;
    qs('a.active', tabSet).classList.remove('active')
    qs('a.tab-bar-tab[data-index="' + newActiveIndex + '"]', tabSet).classList.add('active');
    qs('.itr-form-field.visible', tabPanel).classList.remove('visible')
    qs('.itr-form-field[data-index="' + newActiveIndex + '"]', tabPanel).classList.add('visible');
    // qs('a.tab-bar-tab:nth-of-type(' + (newActiveIndex + 1) + ')', tabSet)
    // let actTab = qs('a.active', tabSet);
    // actTab.className = actTab.className.replace(/ active/gim, '');
/*
    
    qsa('a', tabSet).forEach((tab, i)=>{
        tab.className = tab.className.replace(/ active/gim, '')
        console.log(tabObj.dataset.index)
        if(tabObj.dataset.index === i){
            tabObj.className += ' active';
            newActiveIndex = i;
            console.log(newActiveIndex)
        }
    });
    console.log(tabPanel);
    qsa('.itr-form-field', tabPanel).forEach((tab, i)=>tab.className = (newActiveIndex === i) ? tab.className.replace(/ visible/gim, '') + ' visible' : tab.className.replace(/ visible/gim, ''));
    */
}

qsa('.tab-bar-tab').forEach((tab, i)=>{
    tab.addEventListener('click', switchTabs);
    if(i===0) tab.click();
});
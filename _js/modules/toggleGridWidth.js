export const toggleGridWidth = (e, trg=e.target) => {
    let panel  = qs('#output-panels'),
        button = qs('#GrowShrink');
    button.classList.toggle('expand');
    setTimeout(()=>panel.classList.toggle('skinny'), 550);
}

export const gridWidthTogglerButton = () => {
    return `<button id="GrowShrink" class="contract" onclick="toggleGridWidth(this)"></button>`;
}
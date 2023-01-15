function pickup(ev) {
    ev.dataTransfer.setData('application/unclean.token', ev.target.id || '');
    ev.dataTransfer.setData('application/unclean.drag.x', ev.offsetX);
    ev.dataTransfer.setData('application/unclean.drag.y', ev.offsetY);
}
function noPickup(ev) {
    ev.preventDefault();
}

function onDragEnter(ev) {
    if (ev.dataTransfer.types.includes('application/unclean.token')) {
        ev.preventDefault();
    }
}
function noDragEnter(ev) {
    ev.stopPropagation();
}
function positionToken(element, newPosition) {
    element.style.left = newPosition.x + 'px';
    element.style.top = newPosition.y + 'px';
}
function makeNewToken(newId, ev) {
    element = document.createElement('div', {is: 'unclean-token'});
    element.id = newId;
    tabletop.appendChild(element);
    positionToken(element, ev);
    persistToken(element);
    element.shadowRoot.querySelector('input').focus();
}
function onDrop(ev) {
    console.log(ev);
    elementId = ev.dataTransfer.getData('application/unclean.token');
    newPosition = {
        x: ev.offsetX - ev.dataTransfer.getData('application/unclean.drag.x'),
        y: ev.offsetY - ev.dataTransfer.getData('application/unclean.drag.y')
    }
    if (!elementId) {
        google.script.run
            .withSuccessHandler(makeNewToken)
            .withUserObject(newPosition)
            .getNewId();
        return;
    }
    element = document.getElementById(elementId);
    positionToken(element, newPosition);
    persistToken(element);
}

function removePx(style) {
    let l = style.length;
    return style.substring(0, l - 2);
}

function persistToken(element) {
    let properties = {id: element.id, pX: removePx(element.style.left), pY: removePx(element.style.top)};
    properties.name = element.shadowRoot.querySelector('input').value;
    google.script.run.persistToken(0, properties);
}

function tokenFromProperties(properties) {
    let element = document.getElementById(properties.id);
    if (!element) {
        element = document.createElement('div', {is: 'unclean-token'});
        element.id = properties.id;
        tabletop.appendChild(element);
    }
    positionToken(element, properties);
    element.shadowRoot.querySelector('input').value = properties.name;
}

function tokensFromProperties(properties) {
    properties.forEach(tokenFromProperties);
}

function loadTokens() {
    google.script.run
        .withSuccessHandler(tokensFromProperties)
        .loadTokens(0);
}

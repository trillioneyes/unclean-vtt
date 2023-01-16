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
  };
  if (!elementId) {
    makeNewToken(crypto.randomUUID(), newPosition);
    return;
  }
  element = document.getElementById(elementId);
  positionToken(element, newPosition);
  persistToken(element);
}

function removePx(style) {
  let l = style.length;
  return parseInt(style.substring(0, l - 2));
}

function persistToken(element) {
  let properties = {id: element.id, x: removePx(element.style.left), y: removePx(element.style.top)};
  properties.name = element.shadowRoot.querySelector('input').value;
  for (const module of element.modules) {
    element.getModule(module).toProperties(properties);
  }
  properties.modules = element.modules;
  tokenPost([properties]);
}

function tokenFromProperties(properties) {
  const modules = properties.modules;
  let element = document.getElementById(properties.id);
  if (!element) {
    element = document.createElement('div', {is: 'unclean-token'});
    element.id = properties.id;
    tabletop.appendChild(element);
  }
  element.modules = modules;
  positionToken(element, properties);
  element.shadowRoot.querySelector('input').value = properties.name;
  for (const module of modules) {
    element.getModule(module).fromProperties(properties);
  }
}

function tokensFromProperties(properties) {
  properties.forEach(tokenFromProperties);
}

function loadTokens() {
  tokensGet().then(tokensFromProperties);
}

function pickup(ev) {
  ev.dataTransfer.setData(
    'application/unclean.token',
    ev.target.id || '');
  ev.dataTransfer.setData(
    'application/unclean.modules',
    ev.target.getAttribute('data-modules'));
  ev.dataTransfer.setData(
    'application/unclean.drag.x',
    ev.offsetX);
  ev.dataTransfer.setData(
    'application/unclean.drag.y',
    ev.offsetY);
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
function makeNewToken() {
  element = document.createElement('div', {is: 'unclean-token'});
  tabletop.appendChild(element);
  // positionToken(element, ev);
  // persistToken(element);
  element.shadowRoot.querySelector('input').focus();
  element.setAttribute('data-dirty', true);
  getNewId().then((id) => element.id = id);
  return element;
}
function onDrop(ev) {
  const elementId = ev.dataTransfer.getData('application/unclean.token');
  const newPosition = {
    x: ev.offsetX - ev.dataTransfer.getData('application/unclean.drag.x'),
    y: ev.offsetY - ev.dataTransfer.getData('application/unclean.drag.y')
  };
  const modules = ev.dataTransfer.getData('application/unclean.modules');
  let element;
  if (!elementId) {
    element = makeNewToken();
  } else {
    element = document.getElementById(elementId);
  }
  element.setAttribute('data-modules', modules);
  positionToken(element, newPosition);
}

function removePx(style) {
  let l = style.length;
  return parseInt(style.substring(0, l - 2));
}

function tokenToProperties(element) {
  let properties = {
    id: element.id,
    x: removePx(element.style.left),
    y: removePx(element.style.top)
  };
  properties.name = element.shadowRoot.querySelector('input').value;
  for (const module of element.modules) {
    element.getModule(module).toProperties(properties);
  }
  properties.modules = element.modules;
  return properties;
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
  element.setAttribute('data-dirty', false);
}

function tokensFromProperties(properties) {
  properties.forEach(tokenFromProperties);
}

function loadTokens() {
  tokensGet().then(tokensFromProperties);
}

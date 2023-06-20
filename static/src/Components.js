function attachShadowTemplate(element, templateId) {
  if (!element.shadowRoot) element.attachShadow({mode: 'open'});
  element.shadowRoot.appendChild(
    document.getElementById(templateId).content.cloneNode(true)
  );
}

class UncleanToken extends HTMLDivElement {
  static get observedAttributes() {
    return ['data-modules'];
  }

  constructor() {
    super();
    this.draggable = true;
    this.setAttribute('is', 'unclean-token');
    this.addEventListener('unclean-set-modules', (ev) => {
      this.setAttribute('data-modules', ev.detail.join(','));
    });
    attachShadowTemplate(this, 'new-token');
    attachShadowTemplate(this, 'character-sheet');
    this.addEventListener('dragstart', pickup);
    this.addEventListener('dragenter', noDragEnter);
    this.addEventListener('dragover', noDragEnter);
    this.shadowRoot.querySelector('.details-button')
        .addEventListener('click', (ev) => {
          this.detailSheet.showModal();
        });
    this.shadowRoot.querySelector('.delete-button')
        .addEventListener('click', (ev) => {
          tokensDelete([this.id]);
          this.parentElement.removeChild(this);
        });
    this.addEventListener(
      'change',
      (ev) => this.setAttribute('data-dirty', true)
    );
    this.addEventListener(
      'unclean-revert',
      (ev) => this.revert()
    );
    this.addEventListener(
      'unclean-promote',
      (ev) => this.promote()
    );
  }

  get modules() {
    return this.getAttribute('data-modules').split(',');
  }

  set modules(value) {
    this.setAttribute('data-modules', value);
  }

  attributeChangedCallback(name, oldValue, value) {
    const sheet = this.detailSheet.querySelectorAll('.unclean-module');
    for (const element of sheet) {
      if (!this.modules.includes(element.tagName.toLowerCase())) {
        this.detailSheet.removeChild(element);
      }
    }
    for (const module of this.modules) {
      if (!this.detailSheet.querySelector(module)) {
        const element = document.createElement(module);
        element.className = 'unclean-module';
        this.detailSheet.appendChild(element);
      }
    }
    for (let i = 0; i + 1 < this.modules.length; i++) {
      const moduleHere = this.getModule(this.modules[i]);
      const moduleNext = this.getModule(this.modules[i+1]);
      if (moduleHere &&
          moduleNext &&
          moduleHere.nextElementSibling !== moduleNext)
      moduleHere.after(moduleNext);
    }
    this.setAttribute('data-dirty', true);
  }

  getModule(moduleName) {
    return this.detailSheet.querySelector(moduleName);
  }

  connectedCallback() {
  }

  getName() {
    return this.shadowRoot.querySelector('input').value;
  }

  setName(value) {
    this.shadowRoot.querySelector('input').value = value;
  }

  focus() {
    this.shadowRoot.querySelector('input').focus();
  }

  get detailSheet() {
    return this.shadowRoot.querySelector('dialog');
  }

  revert() {
    tokenGetCommitted(this.id)
      .then((props) => {
        tokenFromProperties(props);
        this.setAttribute('data-dirty', true);
      });
  }

  promote() {
    tokenPostPromote([tokenToProperties(this)]);
  }
}

class UncleanNametag extends HTMLInputElement {
  constructor() {
    super();
    this.draggable = true;
    this.setAttribute('is', 'unclean-nametag');
    this.className = 'nametag';
    this.addEventListener('dragstart', noPickup);
  }
}


class UncleanDots extends HTMLElement {
  constructor() {
    super();
    attachShadowTemplate(this, 'unclean-dots-svg');
    this.shadowRoot.querySelectorAll('circle').forEach((circle) => {
      circle.addEventListener('click', UncleanDots.handleDotClick);
    });
  }

  static handleDotClick(ev) {
    let circle = ev.currentTarget;
    // Special case: if we clicked the only filled dot, set rating to 0.
    if (circle.classList.contains('filled')
        && !circle.nextElementSibling.classList.contains('filled')
        && !circle.previousElementSibling) {
      circle.classList.remove('filled');
    } else if (circle.classList.contains('filled')) {
      circle = circle.nextElementSibling;
      while (circle) {
        circle.classList.remove('filled');
        circle = circle.nextElementSibling;
      }
    } else {
      while (circle) {
        circle.classList.add('filled');
        circle = circle.previousElementSibling;
      }
    }
    const event = new CustomEvent('change', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  get svgDots() {
    let out = [], element = this.shadowRoot.querySelector('circle');
    while (element) {
      out.push(element);
      element = element.nextElementSibling;
    }
    return out;
  }

  set rating(value) {
    for (const dot of this.svgDots) {
      if (value > 0) {
        dot.classList.add('filled');
        value--;
      } else {
        dot.classList.remove('filled');
      }
    }
  }

  get rating() {
    let value = 0;
    for (const dot of this.svgDots) {
      if (dot.classList.contains('filled')) {
        value++;
      } else {
        break;
      }
    }
    return value;
  }

  get value() {
    return this.rating;
  }
  set value(x) {
    this.rating = x;
  }
}

class CofDDotsBlock extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = './styles/Token.css';
    this.shadowRoot.appendChild(style);
    const div = document.createElement('div');
    div.className = this.constructor.containerClassName;
    this.shadowRoot.append(div);
    for (const attr of this.constructor.order) {
      const element = document.createElement('span');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = attr;
      element.appendChild(nameSpan);
      const dots = document.createElement('unclean-dots');
      dots.setAttribute('name', attr);
      element.appendChild(dots);
      div.appendChild(element);
    }
  }

  fromProperties(properties) {
    const key = this.constructor.storageKey;
    if (!properties[key]) return;
    for (const attr of this.constructor.order) {
      this.shadowRoot.querySelector(`[name="${attr}"]`)
          .rating = properties[key][attr];
    }
  }
  toProperties(properties) {
    const key = this.constructor.storageKey;
    if (!properties[key])
      properties[key] = {};
    for (const dots of this.shadowRoot.querySelectorAll('unclean-dots')) {
      properties[key][dots.getAttribute('name')] = dots.rating;
    }
  }
}

class CofDAttributes extends CofDDotsBlock {
  static order = ["Intelligence", "Strength", "Presence",
                  "Wits", "Dexterity", "Manipulation",
                  "Resolve",  "Stamina", "Composure"];
  static containerClassName = 'cofd-attributes';
  static storageKey = 'attributes';
  constructor() {
    super();
    const dots = this.shadowRoot.querySelectorAll('unclean-dots');
    for (const dot of dots) {
      dot.rating = 1;
    }
  }
}

class CofDSkills extends CofDDotsBlock {
  static order = ["Academics", "Computer", "Crafts", "Investigation",
                  "Medicine", "Occult", "Politics", "Science",

                  "Athletics", "Brawl", "Drive", "Firearms",
                  "Larceny", "Stealth", "Survival",  "Weaponry",

                  "Animal Ken", "Expression", "Empathy", "Intimidation",
                  "Persuasion", "Socialize", "Streetwise", "Subterfuge"];
  static containerClassName = "cofd-skills";
  static storageKey = 'skills';

  constructor() {
    super();
    const container = this.shadowRoot.querySelector('.cofd-skills');
    const skills = Array.from(container.children);
    for (const [ixStart, category]
         of ["mental", "physical", "social"].entries()) {
      const div = document.createElement('div');
      div.classList.add('category', category);
      for (let offset = 0; offset < 8; offset++) {
        const ix = 8*ixStart + offset;
        skills[ix].querySelector('unclean-dots').rating = 0;
        div.appendChild(skills[ix]);
      }
      container.appendChild(div);
    }
  }
}

class EditableList extends HTMLElement {
  static getListParent(element, targetClass) {
    const listClasses = targetClass? [targetClass] :
          ['data-column', 'data-row', 'data-container'];
    let parent = element.parentElement;
    while (parent &&
           !listClasses.some(c => parent.classList.contains(c))) {
      parent = parent.parentElement;
    }
    return parent;
  }

  constructor() {
    super();
    if (this.constructor.templateId) {
      attachShadowTemplate(this, this.constructor.templateId);
    } else {
      const children = Array.from(this.children);
      this.attachShadow({mode: 'open'});
      for (const child of children) {
        this.shadowRoot.appendChild(child);
      }
    }
    this.shadowRoot.querySelector('button')
        .addEventListener('click', ev => {
          this.buttonCallback(ev);
        });
  }

  get container() {
    return this.shadowRoot.querySelector('.data-container');
  };

  buttonCallback(ev) {
    const newRow = this.addNew(ev);
    const rowName = newRow.querySelector('.data-row-name');
    rowName.focus();
    rowName.addEventListener('focusout', ev => {
      this.constructor.removeIfEmpty(ev.currentTarget);
    }, {once: true});
  }

  get entries() {
    return Array.from(
      this.shadowRoot.querySelectorAll('.data-row')
    ).map(column =>
      Array.from(
        column.querySelectorAll('.data-column')
      ).map(col => col.value)
    );
  }

  set entries(entries) {
    Array.from(this.shadowRoot.querySelectorAll('.data-row'))
         .forEach(row => {
           if (row.parentElement) row.remove();
         });
    for (const row of entries) {
      const rowEl = this.cloneNewRow();
      const fieldEls = rowEl.querySelectorAll('.data-column');
      this.container.appendChild(rowEl);
      for (let i = 0; i < row.length; i++) {
        fieldEls[i].value = row[i];
      }
    }
  }

  get value() { return this.entries; }
  set value(entries) { this.entries = entries; }

  addNew(event) {
    const button = event.currentTarget;
    const row = this.constructor.getListParent(button);
    const newRow = this.cloneNewRow();
    const dataRowElement = newRow.querySelector('.data-row');
    if (row) {
      row.after(newRow);
    } else {
      const firstDataRow = this.container.querySelector('.data-row');
      this.container.insertBefore(newRow, firstDataRow);
    }
    return dataRowElement;
  }

  cloneNewRow() {
    const fragment =
          this.shadowRoot.getElementById('new-row').content.cloneNode(true);
    fragment.querySelector('button').addEventListener('click', (ev) => {
      this.buttonCallback(ev);
    });
    fragment.querySelector('.data-row-name')
            .addEventListener('change', (ev) => {
              this.constructor.removeIfEmpty(ev.currentTarget);
              this.dispatchEvent(new CustomEvent('change', {
                composed: true,
                bubbles: true
              }));
            });
    return fragment;
  }

  static removeIfEmpty(cell) {
    if (cell.value == '') {
      this.container.removeChild(
        this.constructor.getListParent(cell, 'data-row')
      );
    }
  }
}

class CofDMerits extends EditableList {
  static templateId = 'unclean-cofd-merits';

  fromProperties(properties) {
    if (!properties.merits) return;
    this.entries = properties.merits;
  }
  toProperties(properties) {
    properties.merits = this.entries;
  }
}

class CofDSocial extends HTMLElement {
  constructor() {
    super();
    attachShadowTemplate(this, 'unclean-cofd-social');
    this.shadowRoot
        .addEventListener('change', (event) => {
          this.addOrRemoveDoors();
          this.bubbleChanged(event);
        });
  }

  fromProperties(properties) {
    if (properties.social) {
      this.numDoors = properties.social.total;
      this.openDoors = properties.social.open;
    }
  }

  toProperties(properties) {
    properties.social = {total: this.numDoors, open: this.openDoors};
  }

  addOrRemoveDoors() {
    const doorsWanted =
          this.shadowRoot.querySelector('#cofd-num-doors').value;
    let doorsSeen = 0;
    let door = this.shadowRoot.querySelector('.cofd-door');
    const doorsContainer = door.parentElement;
    while (door) {
      doorsSeen++;
      const nextDoor = door.nextElementSibling;
      if (doorsSeen > doorsWanted) {
        doorsContainer.removeChild(door);
      }
      door = nextDoor;
    }
    const firstDoor = this.shadowRoot.querySelector('.cofd-door');
    while (doorsSeen < doorsWanted) {
      doorsContainer.appendChild(firstDoor.cloneNode(true));
      doorsContainer.lastChild.checked = false;
      doorsSeen++;
    }
  }

  bubbleChanged(event) {
    const newEvent = new CustomEvent('change', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(newEvent);
  }

  get numDoors() {
    return this.shadowRoot.querySelector('#cofd-num-doors').value;
  }
  set numDoors(value) {
    this.shadowRoot.querySelector('#cofd-num-doors').value = value;
    this.addOrRemoveDoors();
  }

  get openDoors() {
    let open = 0;
    for (const door of this.shadowRoot.querySelectorAll('.cofd-door')) {
      if (door.checked) open++;
    }
    return open;
  }
  set openDoors(count) {
    for (const [i, door] of
         this.shadowRoot.querySelectorAll('.cofd-door').entries()) {
      if (i < count) {
        door.checked = true;
      } else {
        door.checked = false;
      }
    }
  }
}

class TokenEditor extends HTMLElement {
  constructor() {
    super();
    this.querySelector('button.open')
        .addEventListener(
          'click',
          (ev) => this.open()
        );
    this.querySelector('button.revert')
        .addEventListener(
          'click',
          (ev) => this.dispatchEvent(new CustomEvent('unclean-revert', {
            composed: true
          }))
        );
    this.querySelector('button.save')
        .addEventListener(
          'click',
          (ev) => this.dispatchEvent(new CustomEvent('unclean-promote', {
            composed: true
          }))
        );
    this.querySelector('dialog button.cancel')
        .addEventListener(
          'click',
          (ev) => this.querySelector('dialog').close()
        );
    this.addEventListener('submit', (ev) => {
      this.dispatchEvent(new CustomEvent('unclean-set-modules', {
        composed: true,
        detail: this.querySelector('editable-list').value
                    .map(row => row[0])
      }));
    });
  }

  open() {
    this.querySelector('dialog').showModal();
    this.querySelector('editable-list')
        .value = this.modules;
  }

  get modules() {
    const elements = this.parentElement.querySelectorAll('.unclean-module');
    return Array.from(elements)
                .map((element) => [element.tagName.toLowerCase()]);
  }
}

class ModulesDatalist extends HTMLDataListElement {
  constructor() {
    super();
    for (const tag of Object.keys(window.uncleanModules)) {
      this.appendChild(document.createElement('option'))
          .innerText = tag;
    }
  }
}

function defineModule(tag, moduleClass) {
  if (!window.uncleanModules) window.uncleanModules = {};
  if (!moduleClass.prototype.toProperties
      || !moduleClass.prototype.fromProperties)
    return;
  window.uncleanModules[tag] = moduleClass;
  customElements.define(tag, moduleClass);
}
customElements.define('unclean-token', UncleanToken, {extends: 'div'});
customElements.define('unclean-nametag', UncleanNametag, {extends: 'input'});
customElements.define('unclean-dots', UncleanDots);
customElements.define('unclean-token-editor', TokenEditor);
customElements.define('editable-list', EditableList);
customElements.define(
  'unclean-modules-datalist', ModulesDatalist, {extends: 'datalist'});
defineModule('unclean-cofd-attributes', CofDAttributes);
defineModule('unclean-cofd-social', CofDSocial);
defineModule('unclean-cofd-skills', CofDSkills);
defineModule('unclean-cofd-merits', CofDMerits);

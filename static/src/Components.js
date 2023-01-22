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
      this.setAttribute('data-modules', ev.detail);
    });
    attachShadowTemplate(this, 'new-token');
    attachShadowTemplate(this, 'character-sheet');
  }

  get modules() {
    return this.getAttribute('data-modules').split(',');
  }

  set modules(value) {
    this.setAttribute('data-modules', value);
  }

  attributeChangedCallback(name, oldValue, value) {
    const sheet = this.characterSheet.querySelectorAll('.unclean-module');
    for (const element of sheet) {
      if (!this.modules.includes(element.tagName.toLowerCase())) {
        this.characterSheet.removeChild(element);
      }
    }
    for (const module of this.modules) {
      if (!this.characterSheet.querySelector(module)) {
        const element = document.createElement(module);
        element.className = 'unclean-module';
        this.characterSheet.appendChild(element);
      }
    }
    this.setAttribute('data-dirty', true);
  }

  getModule(moduleName) {
    return this.characterSheet.querySelector(moduleName);
  }

  connectedCallback() {
    this.addEventListener('dragstart', pickup);
    this.addEventListener('dragenter', noDragEnter);
    this.addEventListener('dragover', noDragEnter);
    this.shadowRoot.querySelector('.details-button')
        .addEventListener('click', (ev) => {
          this.characterSheet.showModal();
        });
    this.shadowRoot.querySelector('.delete-button')
        .addEventListener('click', (ev) => {
          tokensDelete(this.id);
          this.parentElement.removeChild(this);
        });
    this.addEventListener(
      'changed',
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

  getName() {
    return this.shadowRoot.querySelector('input').value;
  }

  setName(value) {
    this.shadowRoot.querySelector('input').value = value;
  }

  focus() {
    this.shadowRoot.querySelector('input').focus();
  }

  get characterSheet() {
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
    const event = new CustomEvent('changed', {
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

class CofDMerits extends HTMLElement {
  constructor() {
    super();
    attachShadowTemplate(this, 'unclean-cofd-merits');
    this.shadowRoot.querySelector('button')
        .addEventListener('click', (ev) => {
          this.addNew(ev);
        });
  }

  fromProperties(properties) {
    if (!properties.merits) return;
    for (const row of this.shadowRoot.querySelectorAll('.data-row')) {
      row.parentElement.removeChild(row);
    }
    for (const [merit, rating] of properties.merits) {
      const newRow = this.cloneNewRow();
      const name = newRow.querySelector('[contenteditable=true]');
      const dots = newRow.querySelector('unclean-dots');
      this.shadowRoot.querySelector('tbody')
          .appendChild(newRow);
      name.textContent = merit;
      dots.rating = rating;
    }
  }
  toProperties(properties) {
    const merits = [];
    for (const td of
         this.shadowRoot.querySelectorAll('[contenteditable=true]')) {
      const merit = td.textContent;
      const rating = td.nextElementSibling.querySelector('unclean-dots')
                       .rating;
      merits.push([merit, rating]);
    }
    properties.merits = merits;
  }

  addNew(event) {
    const button = event.currentTarget;
    const row = button.parentElement.parentElement;
    const newRow = this.cloneNewRow();
    row.after(newRow);
    return newRow;
  }

  cloneNewRow() {
    const fragment =
          this.shadowRoot.getElementById('new-row').content.cloneNode(true);
    fragment.querySelector('button').addEventListener('click', (ev) => {
      this.addNew(ev);
    });
    fragment.querySelector('[contenteditable=true]')
            .addEventListener('focusout', (ev) => {
              if (ev.currentTarget.textContent == '') {
                ev.currentTarget.parentElement.parentElement
                  .removeChild(ev.currentTarget.parentElement);
              }
              this.dispatchEvent(new CustomEvent('changed', {
                composed: true,
                bubbles: true
              }));
            });
    return fragment;
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
    const newEvent = new CustomEvent('changed', {
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
        detail: this.querySelector('textarea').value
      }));
    });
  }

  open() {
    this.querySelector('textarea')
        .value = this.modules.join(',');
    this.querySelector('dialog').showModal();
  }

  get modules() {
    const elements = this.parentElement.querySelectorAll('.unclean-module');
    return Array.from(elements)
                .map((element) => element.tagName.toLowerCase());
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
defineModule('unclean-cofd-attributes', CofDAttributes);
defineModule('unclean-cofd-social', CofDSocial);
defineModule('unclean-cofd-skills', CofDSkills);
defineModule('unclean-cofd-merits', CofDMerits);

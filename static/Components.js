class UncleanToken extends HTMLDivElement {
  constructor() {
    super();
    this.draggable = true;
    this.setAttribute('is', 'unclean-token');
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(
      document.getElementById('new-token').content.querySelector('div').cloneNode(true)
    );
    this.shadowRoot.appendChild(
      document.getElementById('character-sheet').content.querySelector('dialog').cloneNode(true)
    );
    this.modules = ['unclean-cofd-attributes'];
  }

  get modules() {
    return this.getAttribute('data-modules').split(',');
  }

  set modules(value) {
    this.setAttribute('data-modules', value);
    const sheet = this.characterSheet.querySelectorAll('.unclean-module');
    for (const element of sheet) {
      if (!value.includes(element.tagName.toLowerCase())) {
        sheet.removeChild(element);
      }
    }
    for (const module of value) {
      if (!this.characterSheet.querySelector(module)) {
        const element = document.createElement(module);
        element.className = 'unclean-module';
        this.characterSheet.appendChild(element);
      }
    }
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
    this.addEventListener('unclean-changed', this.persist);
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

  persist(ev) {
    persistToken(this);
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
    this.attachShadow({mode: 'open'});
    let template = document.getElementById('unclean-dots-svg').content.cloneNode(true);
    for (let i = 0; i < template.children.length; i++) {
      this.shadowRoot.appendChild(template.children[i]);
    }
    this.shadowRoot.querySelectorAll('circle').forEach((circle) => {
      circle.addEventListener('click', UncleanDots.handleDotClick);
    });
  }

  static handleDotClick(ev) {
    let circle = ev.currentTarget;
    if (circle.classList.contains('filled')) {
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
    const event = new CustomEvent('unclean-changed', {
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

class CofDAttributes extends HTMLElement {
  static order = ["Intelligence", "Strength", "Presence",
                  "Wits", "Dexterity", "Manipulation",
                  "Resolve",  "Stamina", "Composure"];
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'Token.css';
    this.shadowRoot.appendChild(style);
    const div = document.createElement('div');
    div.className = 'cofd-attributes';
    this.shadowRoot.append(div);
    for (const attr of CofDAttributes.order) {
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
    for (const attr of CofDAttributes.order) {
      this.shadowRoot.querySelector(`[name=${attr}]`)
          .rating = properties.attributes[attr];
    }
  }
  toProperties(properties) {
    if (!properties.attributes) properties.attributes = {};
    for (const dots of this.shadowRoot.querySelectorAll('unclean-dots')) {
      properties.attributes[dots.getAttribute('name')] = dots.rating;
    }
  }
}

customElements.define('unclean-token', UncleanToken, {extends: 'div'});
customElements.define('unclean-nametag', UncleanNametag, {extends: 'input'});
customElements.define('unclean-dots', UncleanDots);
customElements.define('unclean-cofd-attributes', CofDAttributes);

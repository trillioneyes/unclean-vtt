class UncleanToken extends HTMLDivElement {
  constructor() {
    super();
    console.log('UncleanToken constructor');
    console.log(this);
    this.draggable = true;
    this.setAttribute('is', 'unclean-token');
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(
      document.getElementById('new-token').content.querySelector('div').cloneNode(true)
    );
  }

  connectedCallback() {
    this.addEventListener('dragstart', pickup);
    this.addEventListener('dragenter', noDragEnter);
    this.addEventListener('dragover', noDragEnter);
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
      circle.addEventListener('click', UncleanDots.handleDotClick)
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
        dots.classList.remove('filled');
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

customElements.define('unclean-token', UncleanToken, {extends: 'div'});
customElements.define('unclean-nametag', UncleanNametag, {extends: 'input'});
customElements.define('unclean-dots', UncleanDots);

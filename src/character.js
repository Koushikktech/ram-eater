/**
 * Ram Character Renderer & Animator using REAL official anime photos & renders
 * Features:
 * - Real official anime renders & Blu-Ray screenshots
 * - Expression switching based on user actions & memory consumption
 * - Real animated GIFs for El Fura wind magic & Clairvoyance
 * - Interactive anime photo reaction gallery
 * - Real RAM stick flight physics with crunch particle effects
 */

export class RamCharacter {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.currentExpression = 'smug';
    this.chewTimer = null;
    this.hornActive = false;

    this.onPoke = options.onPoke || null;
    this.onHornClick = options.onHornClick || null;
    this.onClipClick = options.onClipClick || null;

    // Real anime image paths
    this.images = {
      default: './assets/ram/ram-render.png',
      smug: './assets/ram/ram-bd-3.png',
      tea: './assets/ram/ram-bd-1.png',
      judging: './assets/ram/ram-bd-2.png',
      angry: './assets/ram/ram-bd-5.png',
      eating: './assets/ram/ram-bd-8.png',
      demon: './assets/ram/ram-bd-12.png',
      demonGif: './assets/ram/ram-el-fura.gif',
      potato: './assets/ram/ram-bd-10.png',
      clairvoyance: './assets/ram/ram-clairvoyance.gif',
      ep40: './assets/ram/ram-ep40.png',
      ep41: './assets/ram/ram-ep41.png',
      ep48: './assets/ram/ram-ep48.png',
      sideGlance: './assets/ram/ram-bd-4.png',
      closeUp: './assets/ram/ram-bd-6.png'
    };

    // Real computer RAM stick photos
    this.ramSticks = {
      ddr4: './assets/hardware/ddr4-transparent.png',
      viperRgb: './assets/hardware/viper-rgb.png',
      corsair: './assets/hardware/corsair-rgb.jpg',
      sodimm: './assets/hardware/sodimm-stick.jpg',
      ddr5: './assets/hardware/ddr5-stick.jpg',
      potato: './assets/hardware/sweet-potato.jpg'
    };

    this.render();
    this.initEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="ram-character-wrapper real-photo-stage" id="ramWrapper">
        <!-- Floating Demonic / Wind Magic Aura -->
        <div class="wind-aura" id="windAura"></div>

        <!-- Real Anime Photo Frame -->
        <div class="anime-photo-frame" id="photoFrame">
          <div class="demon-horn-overlay" id="demonHornOverlay"></div>
          <img 
            id="ramMainImage" 
            class="ram-main-img" 
            src="${this.images.default}" 
            alt="Ram from Re:Zero" 
            draggable="false"
          />
          <div class="anime-badge" id="photoCaption">🌸 Ram (ラム) • Re:Zero</div>
        </div>

        <!-- Real Anime Reaction Gallery Strip -->
        <div class="anime-reaction-strip" id="reactionStrip" title="Click to view Ram's real anime reactions!">
          <div class="strip-item active" data-expr="default" title="Normal Maid">
            <img src="${this.images.default}" alt="Default Ram" />
          </div>
          <div class="strip-item" data-expr="smug" title="Smug Smirk">
            <img src="${this.images.smug}" alt="Smug Ram" />
          </div>
          <div class="strip-item" data-expr="tea" title="Tea Drinking">
            <img src="${this.images.tea}" alt="Tea Ram" />
          </div>
          <div class="strip-item" data-expr="judging" title="Disgusted at Barusu">
            <img src="${this.images.judging}" alt="Judging Ram" />
          </div>
          <div class="strip-item" data-expr="angry" title="Angry Shout">
            <img src="${this.images.angry}" alt="Angry Ram" />
          </div>
          <div class="strip-item" data-expr="eating" title="Eating RAM">
            <img src="${this.images.eating}" alt="Eating Ram" />
          </div>
          <div class="strip-item" data-expr="demonGif" title="El Fura Wind Magic GIF">
            <img src="${this.images.demonGif}" alt="El Fura Magic" />
          </div>
          <div class="strip-item" data-expr="potato" title="Sweet Potato Smile">
            <img src="${this.images.potato}" alt="Smiling Ram" />
          </div>
        </div>

        <!-- Real RAM Stick Flight & Particles Stage -->
        <div class="ram-flying-stage" id="flyingStage"></div>
      </div>
    `;

    this.wrapper = this.container.querySelector('#ramWrapper');
    this.mainImage = this.container.querySelector('#ramMainImage');
    this.photoCaption = this.container.querySelector('#photoCaption');
    this.demonHornOverlay = this.container.querySelector('#demonHornOverlay');
    this.flyingStage = this.container.querySelector('#flyingStage');
    this.reactionStrip = this.container.querySelector('#reactionStrip');
  }

  initEvents() {
    // Poke the character on click
    if (this.mainImage) {
      this.mainImage.addEventListener('click', (e) => {
        e.stopPropagation();
        this.jiggle();
        if (this.onPoke) this.onPoke();
      });
    }

    // Reaction strip click events
    if (this.reactionStrip) {
      const items = this.reactionStrip.querySelectorAll('.strip-item');
      items.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const expr = item.getAttribute('data-expr');
          this.setExpression(expr, 4000);

          items.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        });
      });
    }
  }

  setExpression(expr, duration = 0) {
    this.currentExpression = expr;
    let targetSrc = this.images.default;
    let caption = "🌸 Ram (ラム) • Re:Zero";

    switch (expr) {
      case 'smug':
        targetSrc = this.images.smug;
        caption = "😏 Ram: Smug Smirk";
        break;
      case 'tea':
        targetSrc = this.images.tea;
        caption = "☕ Ram: Tea with Lord Roswaal";
        break;
      case 'judging':
        targetSrc = this.images.judging;
        caption = "😒 Ram: Judging Barusu";
        break;
      case 'angry':
        targetSrc = this.images.angry;
        caption = "💢 Ram: 'Insolent Barusu!'";
        break;
      case 'eating':
      case 'chewing':
        targetSrc = this.images.eating;
        caption = "🥢 Ram: Munching Physical RAM";
        break;
      case 'demon':
      case 'demonGif':
        targetSrc = this.images.demonGif;
        caption = "⚡ Ram: El Fura Demon Wind Magic";
        this.setHornPower(1.0);
        break;
      case 'potato':
        targetSrc = this.images.potato;
        caption = "🍠 Ram: Steamed Sweet Potato Bliss";
        break;
      case 'clairvoyance':
        targetSrc = this.images.clairvoyance;
        caption = "👁️ Ram: Clairvoyance Diagnostic";
        break;
      case 'spitting':
        targetSrc = this.images.judging;
        caption = "🤮 Ram: 'Disgusting Silicon!'";
        break;
      default:
        targetSrc = this.images.default;
        caption = "🌸 Ram (ラム) • Re:Zero";
        break;
    }

    if (this.mainImage) {
      this.mainImage.classList.add('img-swap-anim');
      this.mainImage.src = targetSrc;
      setTimeout(() => {
        if (this.mainImage) this.mainImage.classList.remove('img-swap-anim');
      }, 300);
    }

    if (this.photoCaption) {
      this.photoCaption.textContent = caption;
    }

    // Highlight active thumbnail in strip
    if (this.reactionStrip) {
      const items = this.reactionStrip.querySelectorAll('.strip-item');
      items.forEach(item => {
        if (item.getAttribute('data-expr') === expr) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    if (duration > 0) {
      clearTimeout(this.chewTimer);
      this.chewTimer = setTimeout(() => {
        this.setExpression('default');
      }, duration);
    }
  }

  // Animate a REAL photo of a computer RAM stick flying into Ram's mouth
  animateFeedRAM(sourceRect, mbAmount, isPotato = false) {
    if (!this.flyingStage) return;

    const stick = document.createElement('div');
    stick.className = isPotato ? 'flying-item flying-potato-real' : 'flying-item flying-ram-real';

    let imgSrc = this.ramSticks.viperRgb;
    if (isPotato) {
      imgSrc = this.ramSticks.potato;
    } else if (mbAmount <= 64) {
      imgSrc = this.ramSticks.sodimm;
    } else if (mbAmount <= 128) {
      imgSrc = this.ramSticks.ddr4;
    } else if (mbAmount <= 256) {
      imgSrc = this.ramSticks.viperRgb;
    } else {
      imgSrc = this.ramSticks.corsair;
    }

    stick.innerHTML = `
      <div class="real-ram-flyer">
        <img src="${imgSrc}" alt="${mbAmount}MB RAM" draggable="false" />
        <span class="real-ram-flyer-badge">${isPotato ? '🍠 Potato' : mbAmount + ' MB'}</span>
      </div>
    `;

    const mouthX = this.container.clientWidth / 2;
    const mouthY = this.container.clientHeight * 0.45;

    let startX = mouthX;
    let startY = this.container.clientHeight + 40;

    if (sourceRect) {
      const containerRect = this.container.getBoundingClientRect();
      startX = (sourceRect.left + sourceRect.width / 2) - containerRect.left;
      startY = (sourceRect.top + sourceRect.height / 2) - containerRect.top;
    }

    stick.style.left = `${startX}px`;
    stick.style.top = `${startY}px`;
    this.flyingStage.appendChild(stick);

    const anim = stick.animate([
      { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${mouthX - startX}px, ${mouthY - startY}px) scale(0.35) rotate(720deg)`, opacity: 0.95 }
    ], {
      duration: 520,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    });

    anim.onfinish = () => {
      stick.remove();
      this.triggerMouthNom(isPotato);
    };
  }

  triggerMouthNom(isPotato = false) {
    this.jiggle();
    this.createMunchParticles();

    if (isPotato) {
      this.setExpression('potato', 2500);
      return;
    }

    this.setExpression('eating', 1500);
  }

  createMunchParticles() {
    const count = 12;
    const mouthX = this.container.clientWidth / 2;
    const mouthY = this.container.clientHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const chip = document.createElement('div');
      chip.className = 'munch-particle-real';
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const dist = 35 + Math.random() * 60;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 25;

      chip.style.left = `${mouthX}px`;
      chip.style.top = `${mouthY}px`;
      this.flyingStage.appendChild(chip);

      const particleAnim = chip.animate([
        { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: 450 + Math.random() * 350,
        easing: 'ease-out'
      });

      particleAnim.onfinish = () => chip.remove();
    }
  }

  setHornPower(level) {
    const clamped = Math.max(0, Math.min(1, level));
    if (this.demonHornOverlay) {
      this.demonHornOverlay.style.opacity = (clamped * 0.85).toString();
    }
    if (this.wrapper) {
      if (clamped > 0.4) {
        this.wrapper.classList.add('demon-active');
      } else {
        this.wrapper.classList.remove('demon-active');
      }
    }
  }

  triggerHornPulse() {
    this.setHornPower(1.0);
    this.setExpression('demonGif', 3000);
    this.wrapper.classList.add('demon-flash');
    setTimeout(() => {
      this.wrapper.classList.remove('demon-flash');
      this.setHornPower(0.2);
    }, 1200);
  }

  jiggle() {
    if (!this.wrapper) return;
    this.wrapper.classList.remove('ram-jiggle');
    void this.wrapper.offsetWidth;
    this.wrapper.classList.add('ram-jiggle');
  }
}

/**
 * Ram's RAM Buffet Arcade Mini-Game using REAL PHOTOS
 * 60 FPS Canvas Catcher Game featuring real photos of Ram, falling DDR memory sticks,
 * and sweet potatoes!
 */

import { sound } from './sound-engine.js';
import confetti from 'canvas-confetti';

export class RamMinigame {
  constructor(canvasEl, options = {}) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.onScoreUpdate = options.onScoreUpdate || null;
    this.onGameOver = options.onGameOver || null;

    this.isPlaying = false;
    this.animationId = null;
    this.scoreMB = 0;
    this.lives = 3;
    this.timeLeft = 35;
    this.combo = 0;
    this.maxCombo = 0;
    this.feverTimer = 0;

    // Preload real photos
    this.assets = {
      ram: this.loadImage('./assets/ram/ram-render.png'),
      ramDemon: this.loadImage('./assets/ram/ram-bd-12.png'),
      ddr4: this.loadImage('./assets/hardware/ddr4-transparent.png'),
      viper: this.loadImage('./assets/hardware/viper-rgb.png'),
      corsair: this.loadImage('./assets/hardware/corsair-rgb.jpg'),
      potato: this.loadImage('./assets/hardware/sweet-potato.jpg')
    };

    // Player (Ram) state
    this.player = {
      x: 200,
      y: 0,
      width: 80,
      height: 90,
      targetX: 200,
      speed: 12
    };

    // Falling items
    this.items = [];
    this.particles = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 650;

    this.initEvents();
    this.resize();
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = Math.min(rect.width, 700);
    this.canvas.height = 460;
    this.player.y = this.canvas.height - 95;
    this.player.x = this.canvas.width / 2;
    this.player.targetX = this.player.x;
  }

  initEvents() {
    const handleMove = (clientX) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      this.player.targetX = (clientX - rect.left) * scaleX;
    };

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isPlaying) return;
      handleMove(e.clientX);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isPlaying || !e.touches[0]) return;
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (!this.isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.player.targetX = Math.max(40, this.player.x - 50);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.player.targetX = Math.min(this.canvas.width - 40, this.player.x + 50);
      }
    });

    window.addEventListener('resize', () => {
      if (this.isPlaying) this.resize();
    });
  }

  start() {
    this.resize();
    this.isPlaying = true;
    this.scoreMB = 0;
    this.lives = 3;
    this.timeLeft = 35;
    this.combo = 0;
    this.maxCombo = 0;
    this.feverTimer = 0;
    this.items = [];
    this.particles = [];
    this.lastSpawnTime = performance.now();

    sound.playWhoosh();

    if (this.gameTimer) clearInterval(this.gameTimer);
    this.gameTimer = setInterval(() => {
      if (!this.isPlaying) return;
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.endGame('TIME_UP');
      }
    }, 1000);

    let lastFrame = performance.now();
    const loop = (now) => {
      if (!this.isPlaying) return;
      const delta = (now - lastFrame) / 1000;
      lastFrame = now;

      this.update(now, delta);
      this.draw();

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    this.isPlaying = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.gameTimer) clearInterval(this.gameTimer);
  }

  spawnItem(now) {
    const isFever = this.feverTimer > 0;
    const types = [
      { type: 'ddr4', label: '16GB DDR4', mb: 64, img: this.assets.ddr4, weight: 35, isHazard: false },
      { type: 'viper', label: 'Viper RGB', mb: 128, img: this.assets.viper, weight: 30, isHazard: false },
      { type: 'corsair', label: 'Corsair RGB', mb: 256, img: this.assets.corsair, weight: 15, isHazard: false },
      { type: 'potato', label: 'Sweet Potato', mb: 384, img: this.assets.potato, weight: 12, isHazard: false },
      { type: 'tracksuit', label: 'Barusu Jersey', mb: -64, img: null, weight: 12, isHazard: true },
      { type: 'bsod', label: 'BSOD Crash', mb: -128, img: null, weight: 8, isHazard: true }
    ];

    let chosen;
    if (isFever) {
      chosen = Math.random() < 0.5 ? types[1] : types[3];
    } else {
      const totalWeight = types.reduce((acc, t) => acc + t.weight, 0);
      let rand = Math.random() * totalWeight;
      for (const t of types) {
        if (rand < t.weight) {
          chosen = t;
          break;
        }
        rand -= t.weight;
      }
    }

    if (!chosen) chosen = types[0];

    this.items.push({
      x: 40 + Math.random() * (this.canvas.width - 80),
      y: -40,
      width: 60,
      height: 28,
      speed: 130 + Math.random() * 90 + (35 - this.timeLeft) * 2.5,
      rotation: (Math.random() - 0.5) * 0.4,
      rotSpeed: (Math.random() - 0.5) * 2,
      ...chosen
    });
  }

  update(now, delta) {
    this.player.x += (this.player.targetX - this.player.x) * 0.22;
    this.player.x = Math.max(40, Math.min(this.canvas.width - 40, this.player.x));

    if (this.feverTimer > 0) {
      this.feverTimer -= delta;
    }

    const interval = this.feverTimer > 0 ? 300 : this.spawnInterval;
    if (now - this.lastSpawnTime > interval) {
      this.spawnItem(now);
      this.lastSpawnTime = now;
    }

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.speed * delta;
      item.rotation += item.rotSpeed * delta;

      const dx = Math.abs(item.x - this.player.x);
      const dy = Math.abs(item.y - this.player.y);

      if (dx < 45 && dy < 45) {
        this.catchItem(item);
        this.items.splice(i, 1);
        continue;
      }

      if (item.y > this.canvas.height + 40) {
        if (!item.isHazard && this.combo > 5) {
          this.combo = 0;
        }
        this.items.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.life -= delta * 2;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  catchItem(item) {
    if (item.isHazard) {
      sound.playPurge();
      this.lives--;
      this.combo = 0;
      this.scoreMB = Math.max(0, this.scoreMB + item.mb);
      this.addParticles(item.x, item.y, '#ef4444', 12);

      if (this.lives <= 0) {
        this.endGame('OUT_OF_LIVES');
      }
    } else {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      const multiplier = Math.min(4, 1 + Math.floor(this.combo / 4));
      const gained = item.mb * multiplier;
      this.scoreMB += gained;

      if (item.type === 'potato') {
        sound.playPotatoSound();
        this.addParticles(item.x, item.y, '#f59e0b', 18);
        this.feverTimer = 5.0;
        try {
          confetti({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.8 }
          });
        } catch(e) {}
      } else {
        sound.playCrunch();
        this.addParticles(item.x, item.y, '#ff70a6', 12);
      }

      if (this.combo > 0 && this.combo % 8 === 0) {
        sound.playLevelUp();
      }
    }

    if (this.onScoreUpdate) {
      this.onScoreUpdate({
        scoreMB: this.scoreMB,
        combo: this.combo,
        lives: this.lives,
        timeLeft: this.timeLeft
      });
    }
  }

  addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 130;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 4,
        life: 1.0
      });
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background gothic grid
    this.ctx.strokeStyle = 'rgba(255, 112, 166, 0.08)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    // Fever mode background glow
    if (this.feverTimer > 0) {
      this.ctx.fillStyle = 'rgba(255, 0, 85, 0.18)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#ff0055';
      this.ctx.font = 'bold 16px Outfit, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`⚡ FEVER DEMON HORN MODE! ⚡ (${this.feverTimer.toFixed(1)}s)`, this.canvas.width / 2, 35);
    }

    // Draw Falling Real Items
    for (const item of this.items) {
      this.ctx.save();
      this.ctx.translate(item.x, item.y);
      this.ctx.rotate(item.rotation);

      if (item.img && item.img.complete) {
        // Draw real photo of RAM stick or sweet potato
        if (item.type === 'potato') {
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
          this.ctx.clip();
          this.ctx.drawImage(item.img, -20, -20, 40, 40);
          this.ctx.restore();
          this.ctx.strokeStyle = '#ffd166';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
        } else {
          // Real RAM Stick module
          this.ctx.drawImage(item.img, -32, -14, 64, 28);
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          this.ctx.fillRect(-25, 12, 50, 12);
          this.ctx.fillStyle = '#ff70a6';
          this.ctx.font = 'bold 9px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.fillText(item.label, 0, 21);
        }
      } else if (item.type === 'tracksuit') {
        this.ctx.fillStyle = '#16a34a';
        this.ctx.fillRect(-18, -14, 36, 28);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-18, -3, 36, 6);
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SUBARU', 0, 8);
      } else if (item.type === 'bsod') {
        this.ctx.fillStyle = '#1d4ed8';
        this.ctx.fillRect(-20, -14, 40, 28);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(': ( BSOD', 0, 4);
      }

      this.ctx.restore();
    }

    // Draw Particles
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;

    // Draw Player (Real Ram Picture)
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);

    const playerImg = (this.feverTimer > 0 && this.assets.ramDemon.complete)
      ? this.assets.ramDemon
      : this.assets.ram;

    if (playerImg && playerImg.complete) {
      // Glow aura
      this.ctx.shadowColor = this.feverTimer > 0 ? '#ff0055' : '#ff70a6';
      this.ctx.shadowBlur = this.feverTimer > 0 ? 25 : 12;
      this.ctx.drawImage(playerImg, -35, -45, 70, 90);
      this.ctx.shadowBlur = 0;
    }

    this.ctx.restore();

    // Draw HUD
    this.ctx.font = 'bold 15px Outfit, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`Munched: ${(this.scoreMB >= 1024 ? (this.scoreMB / 1024).toFixed(2) + ' GB' : this.scoreMB + ' MB')}`, 15, 25);

    if (this.combo > 1) {
      this.ctx.fillStyle = '#ff70a6';
      this.ctx.fillText(`Combo: x${this.combo}`, 15, 48);
    }

    this.ctx.textAlign = 'right';
    let heartStr = '';
    for (let i = 0; i < this.lives; i++) heartStr += '❤️ ';
    this.ctx.fillText(heartStr, this.canvas.width - 15, 25);

    this.ctx.fillStyle = this.timeLeft <= 5 ? '#ef4444' : '#ffffff';
    this.ctx.fillText(`⏱️ ${this.timeLeft}s`, this.canvas.width - 15, 48);
  }

  endGame(reason) {
    this.stop();

    let rank = 'F';
    let remark = "Utterly pathetic, Barusu. Even a dead moth could catch more memory.";

    if (this.scoreMB >= 4096) {
      rank = 'S+';
      remark = "Magnificent! Over 4 Gigabytes of real RAM devoured! Lord Roswaal would acknowledge your service.";
    } else if (this.scoreMB >= 2500) {
      rank = 'S';
      remark = "Astonishing appetite! My demonic power is soaring. You are marginally useful, Barusu.";
    } else if (this.scoreMB >= 1500) {
      rank = 'A';
      remark = "Passable work. You kept me moderately fed with real DDR sticks.";
    } else if (this.scoreMB >= 800) {
      rank = 'B';
      remark = "Mediocre. Next time bring more steamed sweet potatoes and Viper RGBs.";
    } else if (this.scoreMB >= 300) {
      rank = 'C';
      remark = "Is this truly the best your reflexes can produce? Sister Rem would pity you.";
    }

    if (this.scoreMB >= 1500) {
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch(e) {}
    }

    if (this.onGameOver) {
      this.onGameOver({
        scoreMB: this.scoreMB,
        rank,
        remark,
        maxCombo: this.maxCombo,
        reason
      });
    }
  }
}

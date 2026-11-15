/**
 * RAM EATER - Main Application Entry
 * Orchestrates Character, Real Memory Allocator, Sound Engine, Roasting Chamber,
 * and Background Particle System.
 */

import { RamCharacter } from './character.js';
import { MemoryEngine } from './memory-engine.js';
import { sound } from './sound-engine.js';
import { roastEngine } from './roast-engine.js';
import { RamMinigame } from './minigame.js';
import confetti from 'canvas-confetti';

// State
let memoryEngine;
let ramCharacter;
let minigame;
let autoFeastInterval = null;
let graphCtx = null;
let lastMinigameScore = 0;

// Ambient Background Wind & Sparkle Particles
function initBackgroundParticles() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = 45;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.5 + Math.random() * 3,
      speedX: -0.8 - Math.random() * 1.5, // Wind blowing left
      speedY: 0.3 + Math.random() * 0.8,
      opacity: 0.15 + Math.random() * 0.45,
      isRune: Math.random() > 0.7,
      char: Math.random() > 0.5 ? '0' : '1'
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < -20) p.x = width + 20;
      if (p.y > height + 20) p.y = -20;

      ctx.save();
      ctx.globalAlpha = p.opacity;

      if (p.isRune) {
        ctx.fillStyle = '#ff70a6';
        ctx.font = '10px monospace';
        ctx.fillText(p.char, p.x, p.y);
      } else {
        // Floating petal / mana orb
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  render();
}

// Memory History Canvas Chart
function initMemoryGraph() {
  const canvas = document.getElementById('memoryGraphCanvas');
  if (!canvas) return;
  graphCtx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);
}

function drawMemoryGraph() {
  if (!graphCtx || !memoryEngine) return;
  const canvas = graphCtx.canvas;
  const ctx = graphCtx;
  const history = memoryEngine.history;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (history.length < 2) return;

  const maxVal = Math.max(1024, memoryEngine.peakMB * 1.25);
  const stepX = canvas.width / (memoryEngine.maxHistory - 1);

  // Draw gradient area
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);

  history.forEach((pt, i) => {
    const x = i * stepX;
    const y = canvas.height - (pt.allocatedMB / maxVal) * (canvas.height - 10);
    if (i === 0) ctx.lineTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.lineTo((history.length - 1) * stepX, canvas.height);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, 'rgba(255, 0, 85, 0.45)');
  grad.addColorStop(1, 'rgba(255, 0, 85, 0.02)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  history.forEach((pt, i) => {
    const x = i * stepX;
    const y = canvas.height - (pt.allocatedMB / maxVal) * (canvas.height - 10);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = '#ff70a6';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

// Update Dialogue Bubble & Voice
function setRamDialogue(text, mood = 'SMUG', playVoice = true) {
  const textEl = document.getElementById('dialogueText');
  const moodEl = document.getElementById('speakerMood');

  if (textEl) {
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = text;
      textEl.style.opacity = '1';
    }, 150);
  }

  if (moodEl) {
    moodEl.textContent = mood;
  }

  if (playVoice) {
    sound.speak(text);
  }
}

// Update Telemetry Display
function updateTelemetry(stats) {
  const allocatedEl = document.getElementById('allocatedMB');
  const allocatedSub = document.getElementById('allocatedSub');
  const peakEl = document.getElementById('peakMB');
  const heapUsedEl = document.getElementById('heapUsedMB');
  const heapLimitSub = document.getElementById('heapLimitSub');
  const hungerLevel = document.getElementById('hungerLevel');
  const demonStatus = document.getElementById('demonStatus');
  const pressureFill = document.getElementById('pressureFill');
  const pressurePct = document.getElementById('pressurePct');

  if (allocatedEl) allocatedEl.textContent = stats.allocatedMB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (allocatedSub) allocatedSub.textContent = `${stats.chunkCount} active memory chunk${stats.chunkCount === 1 ? '' : 's'}`;
  if (peakEl) peakEl.textContent = stats.peakMB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (heapUsedEl) heapUsedEl.textContent = stats.heapUsedMB.toLocaleString();
  if (heapLimitSub) heapLimitSub.textContent = `Limit: ${stats.heapLimitMB.toLocaleString()} MB`;

  // Demonic hunger gauge (0 - 100%)
  const hunger = Math.min(100, Math.round((stats.allocatedMB / 2048) * 100));
  if (hungerLevel) hungerLevel.textContent = hunger;

  if (demonStatus) {
    if (stats.allocatedMB === 0) demonStatus.textContent = 'Resting';
    else if (stats.allocatedMB < 500) demonStatus.textContent = 'Snacking';
    else if (stats.allocatedMB < 1500) demonStatus.textContent = 'Mana Surging';
    else demonStatus.textContent = 'DEMON HORN AWAKENED';
  }

  // Pressure bar
  const pct = Math.min(100, Math.round((stats.allocatedMB / (memoryEngine.maxSafetyLimitMB || 3072)) * 100));
  if (pressureFill) pressureFill.style.width = `${pct}%`;
  if (pressurePct) pressurePct.textContent = `${pct}%`;

  // Demon horn intensity on character
  const hornRatio = stats.allocatedMB / 2048;
  ramCharacter.setHornPower(hornRatio);

  drawMemoryGraph();
}

// Feed Ram action
function feedRam(mb, sourceRect, isPotato = false) {
  const success = isPotato ? true : memoryEngine.allocateMB(mb);

  if (!success && !isPotato) {
    setRamDialogue("Safety limit reached, Barusu! Even my demonic appetite has its limits unless you disable the safety cap.", "WARNING");
    sound.playRoastSound();
    return;
  }

  // Visual flight of RAM stick into Ram's mouth
  ramCharacter.animateFeedRAM(sourceRect, mb, isPotato);

  if (isPotato) {
    sound.playPotatoSound();
    const remark = roastEngine.getPotatoReaction();
    setRamDialogue(remark, "DELIGHTED");
    return;
  }

  // Sound & speech
  sound.playCrunch();

  const stats = memoryEngine.getStats();
  const remark = roastEngine.getFeedingReaction(stats.allocatedMB, memoryEngine.peakMB);
  const mood = stats.allocatedMB > 1500 ? "DEMONIC" : (stats.allocatedMB > 500 ? "AMUSED" : "SMUG");
  setRamDialogue(remark, mood);

  // If milestone reached
  if (stats.allocatedMB >= 1024 && stats.allocatedMB - mb < 1024) {
    sound.playHornCharge();
    ramCharacter.setExpression('demon', 2500);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch(e) {}
  }
}

// Emergency Purge ("SPIT IT OUT")
function purgeMemory() {
  const previousMB = memoryEngine.purge();

  if (autoFeastInterval) {
    clearInterval(autoFeastInterval);
    autoFeastInterval = null;
    const btn = document.getElementById('overloadBtn');
    if (btn) btn.classList.remove('active');
  }

  sound.playPurge();
  ramCharacter.setExpression('spitting', 2200);

  const remark = roastEngine.getPurgeReaction(previousMB);
  setRamDialogue(remark, "DISGUSTED");
}

// Setup Event Listeners
function initEventListeners() {
  // Feed Buttons
  const feedButtons = document.querySelectorAll('.feed-btn');
  feedButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mb = parseInt(btn.getAttribute('data-mb'), 10) || 64;
      const rect = btn.getBoundingClientRect();
      feedRam(mb, rect, false);
    });
  });

  // Potato Button
  const potatoBtn = document.getElementById('potatoBtn');
  if (potatoBtn) {
    potatoBtn.addEventListener('click', (e) => {
      const rect = potatoBtn.getBoundingClientRect();
      feedRam(256, rect, true);
    });
  }

  // Overload Auto-Feast
  const overloadBtn = document.getElementById('overloadBtn');
  if (overloadBtn) {
    overloadBtn.addEventListener('click', () => {
      if (autoFeastInterval) {
        clearInterval(autoFeastInterval);
        autoFeastInterval = null;
        overloadBtn.classList.remove('active');
        overloadBtn.innerHTML = '<span>⚡</span> BARUSU OVERLOAD (AUTO-FEAST)';
        setRamDialogue("Pah. Giving up already, Barusu? Weak as expected.", "SMUG");
      } else {
        overloadBtn.classList.add('active');
        overloadBtn.innerHTML = '<span>🛑</span> STOP OVERLOAD FEAST';
        sound.playHornCharge();
        ramCharacter.setExpression('demon');
        setRamDialogue("OVERLOAD COMMENCED! Watch your memory melt away, Barusu!", "DEMONIC");

        autoFeastInterval = setInterval(() => {
          const rect = overloadBtn.getBoundingClientRect();
          feedRam(128, rect, false);
          if (memoryEngine.getStats().allocatedMB >= memoryEngine.maxSafetyLimitMB && !memoryEngine.isUncapped) {
            clearInterval(autoFeastInterval);
            autoFeastInterval = null;
            overloadBtn.classList.remove('active');
            overloadBtn.innerHTML = '<span>⚡</span> BARUSU OVERLOAD (AUTO-FEAST)';
          }
        }, 750);
      }
    });
  }

  // Purge Button
  const purgeBtn = document.getElementById('purgeBtn');
  if (purgeBtn) {
    purgeBtn.addEventListener('click', purgeMemory);
  }

  // Roast Rig Button
  const roastBtn = document.getElementById('roastBtn');
  if (roastBtn) {
    roastBtn.addEventListener('click', () => {
      sound.playRoastSound();
      ramCharacter.setExpression('judging', 2500);
      const roast = roastEngine.getRoastForRig();
      setRamDialogue(roast, "SCATHING");
    });
  }

  // Sound Toggle
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      soundToggle.classList.toggle('active', !isMuted);
      soundToggle.innerHTML = `<span id="soundIcon">${isMuted ? '🔇' : '🔊'}</span> Sound: ${isMuted ? 'OFF' : 'ON'}`;
    });
  }

  // Speech Toggle
  const speechToggle = document.getElementById('speechToggle');
  if (speechToggle) {
    speechToggle.addEventListener('click', () => {
      const isEnabled = sound.toggleSpeech();
      speechToggle.classList.toggle('active', isEnabled);
      speechToggle.innerHTML = `<span>🗣️</span> Voice: ${isEnabled ? 'ON' : 'OFF'}`;
      if (isEnabled) {
        sound.speak("My voice is restored. Now pay attention, Barusu.");
      }
    });
  }

  // Safety Cap Toggle
  const safetyToggle = document.getElementById('safetyToggle');
  if (safetyToggle) {
    safetyToggle.addEventListener('click', () => {
      memoryEngine.isUncapped = !memoryEngine.isUncapped;
      if (memoryEngine.isUncapped) {
        safetyToggle.classList.remove('active');
        safetyToggle.innerHTML = `<span>⚠️</span> Cap: UNCAPPED`;
        setRamDialogue("Ho... removing the safety limiter? If your browser tab crashes, do not come weeping to Sister Rem.", "DEMONIC");
        sound.playHornCharge();
      } else {
        safetyToggle.classList.add('active');
        safetyToggle.innerHTML = `<span>🛡️</span> Cap: 3GB SAFE`;
        setRamDialogue("Re-enabling the safety cap. Prudent for someone as fragile as you, Barusu.", "SMUG");
      }
    });
  }

  // Mini-Game Modal
  const launchGameBtn = document.getElementById('launchGameBtn');
  const minigameModal = document.getElementById('minigameModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const restartGameBtn = document.getElementById('restartGameBtn');
  const applyMemoryBtn = document.getElementById('applyMemoryBtn');
  const gameOverCard = document.getElementById('gameOverCard');

  if (launchGameBtn && minigameModal) {
    launchGameBtn.addEventListener('click', () => {
      minigameModal.classList.add('open');
      gameOverCard.style.display = 'none';
      minigame.start();
    });
  }

  const closeModal = () => {
    if (minigame) minigame.stop();
    if (minigameModal) minigameModal.classList.remove('open');
  };

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  minigameModal.addEventListener('click', (e) => {
    if (e.target === minigameModal) closeModal();
  });

  if (restartGameBtn) {
    restartGameBtn.addEventListener('click', () => {
      gameOverCard.style.display = 'none';
      minigame.start();
    });
  }

  if (applyMemoryBtn) {
    applyMemoryBtn.addEventListener('click', () => {
      closeModal();
      if (lastMinigameScore > 0) {
        feedRam(Math.min(1024, lastMinigameScore), null, false);
      }
    });
  }

  // Konami Code Easter Egg (↑ ↑ ↓ ↓ ← → ← → B A)
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIdx = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === konami[konamiIdx].toLowerCase()) {
      konamiIdx++;
      if (konamiIdx === konami.length) {
        konamiIdx = 0;
        triggerTwinSisterMode();
      }
    } else {
      konamiIdx = 0;
    }
  });
}

function triggerTwinSisterMode() {
  sound.playHornCharge();
  ramCharacter.setExpression('demon', 4000);
  setRamDialogue("SECRET CODE DETECTED! 'Sister, Sister, this Barusu knows ancient cheat codes.' 'Ram, Ram, shall we consume his entire motherboard?'", "DEMONIC");
  try {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 }
    });
  } catch(e) {}
}

// Display detected hardware specs
function populateHardwareSpecs() {
  const { memoryGB, cores, gpu } = roastEngine.hardware;
  const ramEl = document.getElementById('specRam');
  const coresEl = document.getElementById('specCores');
  const gpuEl = document.getElementById('specGpu');

  if (ramEl) ramEl.textContent = `${memoryGB} GB RAM`;
  if (coresEl) coresEl.textContent = `${cores} Cores`;
  if (gpuEl) {
    const cleanGpu = gpu.replace(/ANGLE \(|,.*$/g, '').trim();
    gpuEl.textContent = cleanGpu.length > 22 ? cleanGpu.substring(0, 20) + '...' : cleanGpu;
    gpuEl.title = gpu;
  }
}

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  initBackgroundParticles();

  // Instantiate Memory Engine
  memoryEngine = new MemoryEngine({
    maxSafetyLimitMB: 3072
  });

  memoryEngine.onMemoryUpdate = updateTelemetry;
  memoryEngine.onOOM = (err) => {
    sound.playRoastSound();
    ramCharacter.setExpression('spitting', 4000);
    setRamDialogue(roastEngine.getOOMReaction(), "VICTORIOUS");
  };

  // Instantiate Ram Character
  const characterContainer = document.getElementById('characterContainer');
  ramCharacter = new RamCharacter(characterContainer, {
    onPoke: () => {
      sound.playPoke();
      ramCharacter.setExpression('judging', 1800);
      const pokeLine = roastEngine.getPokeReaction();
      setRamDialogue(pokeLine, "DISGUSTED");
    },
    onHornClick: () => {
      sound.playHornCharge();
      ramCharacter.setExpression('demon', 2000);
      const hornLine = roastEngine.getHornReaction();
      setRamDialogue(hornLine, "DEMONIC");
    },
    onClipClick: () => {
      sound.playPotatoSound();
      const potatoLine = roastEngine.getPotatoReaction();
      setRamDialogue(potatoLine, "DELIGHTED");
    }
  });

  // Instantiate Mini-Game
  const canvas = document.getElementById('minigameCanvas');
  minigame = new RamMinigame(canvas, {
    onGameOver: (result) => {
      lastMinigameScore = result.scoreMB;
      const card = document.getElementById('gameOverCard');
      const rankEl = document.getElementById('goRank');
      const remarkEl = document.getElementById('goRemark');
      if (card && rankEl && remarkEl) {
        rankEl.textContent = result.rank;
        remarkEl.textContent = `${result.remark} (Munched: ${result.scoreMB} MB | Max Combo: x${result.maxCombo})`;
        card.style.display = 'flex';
      }
    }
  });

  initMemoryGraph();
  initEventListeners();
  populateHardwareSpecs();

  // Initial telemetry read
  updateTelemetry(memoryEngine.getStats());

  // Periodically refresh telemetry
  setInterval(() => {
    if (memoryEngine) {
      updateTelemetry(memoryEngine.getStats());
    }
  }, 1000);
});

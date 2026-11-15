/**
 * Barusu Hardware Inspector & Roast Engine
 * Authentic Re:Zero Ram dialogue and hardware diagnostics.
 */

export class RoastEngine {
  constructor() {
    this.hardware = this.inspectHardware();
  }

  inspectHardware() {
    let gpu = 'Unknown GPU';
    let gpuVendor = 'Unknown';

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'WebGL Supported';
          gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
        }
      }
    } catch (e) {
      // Ignored
    }

    const memoryGB = navigator.deviceMemory || 8; // Default heuristic if hidden
    const cores = navigator.hardwareConcurrency || 4;
    const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent);
    const isWindows = /Win32|Win64|Windows/i.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const screenRes = `${window.screen.width * window.devicePixelRatio}x${window.screen.height * window.devicePixelRatio}`;

    return {
      memoryGB,
      cores,
      gpu,
      gpuVendor,
      isMac,
      isWindows,
      isMobile,
      screenRes,
      userAgent: navigator.userAgent
    };
  }

  getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  getRoastForRig() {
    const { memoryGB, cores, gpu, isMac, isWindows, isMobile } = this.hardware;
    const roasts = [];

    // Memory specific roasts
    if (memoryGB <= 4) {
      roasts.push("4 gigabytes of memory? Barusu, a common ground dragon has more cognitive retention than this electronic brick.");
      roasts.push("Your device struggles to remember what it rendered two seconds ago. How fitting for someone like you, Barusu.");
    } else if (memoryGB <= 8) {
      roasts.push("Only 8GB of RAM? How tragically mediocre. Even steamed sweet potatoes have more substance than your memory sticks.");
      roasts.push("8 gigabytes? Lord Roswaal's tea kettle exhibits more complex computing architecture.");
    } else if (memoryGB <= 16) {
      roasts.push("16GB of RAM. The quintessential average specification for an utterly unremarkable Barusu.");
      roasts.push("A modest 16GB. Adequate enough to feed me a light afternoon snack, but hardly worthy of pride.");
    } else {
      roasts.push(`${memoryGB}GB of RAM? Ho... trying to flaunt excessive memory, are we? It makes no difference—I will devour every single stick.`);
      roasts.push("Such gratuitous RAM capacity. And yet, the one operating the keyboard remains thoroughly hopeless.");
    }

    // CPU Cores roasts
    if (cores <= 4) {
      roasts.push(`A mere ${cores} CPU cores? I have seen sluggish earth mages cast spells with greater multi-threading.`);
    } else if (cores >= 12) {
      roasts.push(`${cores} processor cores, yet none of them are capable of preventing you from wasting time here with me.`);
    }

    // GPU roasts
    if (gpu.toLowerCase().includes('intel') || gpu.toLowerCase().includes('uhd')) {
      roasts.push("Integrated Intel graphics? Even Beatrice's library dust produces higher fidelity visuals than that sorry excuse for a chip.");
    } else if (gpu.toLowerCase().includes('apple')) {
      roasts.push("An Apple silicon chip? Sleek and pretentious on the outside, utterly helpless against my demonic appetite on the inside.");
    } else if (gpu.toLowerCase().includes('rtx') || gpu.toLowerCase().includes('nvidia')) {
      roasts.push("A dedicated graphics card? You bought that expensive ray-tracing silicon just to watch me chew your RAM? Truly, Barusu has no shame.");
    }

    // Platform roasts
    if (isMac) {
      roasts.push("A sleek Mac machine... Lord Roswaal values elegance, but your operating system's memory management won't save you from me.");
    } else if (isWindows) {
      roasts.push("Windows operating system? I can hear your background telemetry services gasping for air alongside me.");
    } else if (isMobile) {
      roasts.push("Accessing this from a mobile handset? One more gigabyte and your battery will combust like an El Fura spell.");
    }

    return this.getRandom(roasts);
  }

  getFeedingReaction(currentMB, totalMB) {
    if (currentMB < 100) {
      return this.getRandom([
        "A mere crumb. Barusu, are you trying to starve me?",
        "Hardly a mouthful. Don't be so stingy with your clock cycles.",
        "*Crunch*... Tastes like cheap DDR4. Bring me something with tighter timings."
      ]);
    } else if (currentMB < 500) {
      return this.getRandom([
        "Hmph. A respectable appetizer. Keep feeding, Barusu.",
        "Your browser tab is noticeably heavier. Excellent. Sister Rem would approve.",
        "*Munch munch*... At least this batch has decent RGB glow."
      ]);
    } else if (currentMB < 1500) {
      return this.getRandom([
        "Over a gigabyte devoured! My demonic power surges through your memory bus!",
        "Can you feel your cooling fans spinning, Barusu? That is the sound of my satisfaction.",
        "Your operating system is beginning to sweat. How delightful."
      ]);
    } else if (currentMB < 3000) {
      return this.getRandom([
        "Hahaha! Multiple gigabytes of physical RAM consumed! Lord Roswaal, witness this feast!",
        "Your device's memory pressure gauge is crying out in agony. Do not stop now, Barusu!",
        "El Fura! The sheer memory throughput is generating its own magical thermal wind!"
      ]);
    } else {
      return this.getRandom([
        "GLUTTONY DEMON HORN MODE! Your system's entire memory architecture now belongs to Ram!",
        "Impressive, Barusu. You actually provided enough memory to satisfy a demon maid. ...Now bring steamed sweet potatoes as dessert."
      ]);
    }
  }

  getPurgeReaction(freedMB) {
    return this.getRandom([
      `*BLEHHH!* ${freedMB}MB of chewed up silicon spat out! What disgusting, stale memory.`,
      `Pfft! There goes your ${freedMB}MB. Don't think for a moment that I'm thanking you, Barusu.`,
      `*Ptooey!* I have regurgitated your memory buffers. Clean up your own garbage collection, incompetent servant.`
    ]);
  }

  getPokeReaction() {
    return this.getRandom([
      "Don't touch me so casually, Barusu! Insolent fool!",
      "Hands off! Only Lord Roswaal is permitted to inspect my maid uniform!",
      "Poke me again and I will slice your CPU cache into pieces with El Fura.",
      "How vulgar. Keep your trembling fingers on the feed button instead.",
      "Sister Rem! Barusu is exhibiting his usual repulsive tendencies again!"
    ]);
  }

  getPotatoReaction() {
    return this.getRandom([
      "S-steamed sweet potatoes?! ...I-it's not like I'm happy or anything, Barusu! (Nom nom nom... so warm...)",
      "Lord Roswaal always praises my steamed sweet potatoes... You have passable taste for once, Barusu.",
      "*Gently savors potato* ...This is infinitely superior to cold silicon chips. Good work."
    ]);
  }

  getHornReaction() {
    return this.getRandom([
      "My broken horn... The phantom pain burns, but the memory power eases the strain.",
      "You dare gaze directly at my demon horn mana? Prepare to be blown away by El Fura!",
      "When my horn glows, not even the White Whale could withstand this memory bandwidth!"
    ]);
  }

  getOOMReaction() {
    return "HAHAHA! Your browser tab has hit its absolute memory boundary! You have officially been eaten out of house and RAM, Barusu!";
  }
}

export const roastEngine = new RoastEngine();

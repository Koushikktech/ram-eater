/**
 * Memory Consumption Engine for Ram Eater
 * Performs real, dirty physical memory allocations with safe boundaries,
 * OS page-touching, and garbage collection purging.
 */

export class MemoryEngine {
  constructor(options = {}) {
    this.allocatedChunks = [];
    this.totalAllocatedBytes = 0;
    this.peakAllocatedBytes = 0;
    this.maxSafetyLimitMB = options.maxSafetyLimitMB || 3072; // Default 3 GB safety cap
    this.isUncapped = false;
    this.onMemoryUpdate = null;
    this.onMilestone = null;
    this.onOOM = null;

    // Track historical usage for real-time charting
    this.history = [];
    this.maxHistory = 60;
  }

  // Check if performance.memory API is supported (Chromium)
  hasPerformanceMemory() {
    return typeof performance !== 'undefined' && !!performance.memory;
  }

  getSystemMemoryEstimate() {
    return {
      deviceMemoryGB: (navigator && navigator.deviceMemory) || 'Unknown',
      concurrency: (navigator && navigator.hardwareConcurrency) || 'Unknown'
    };
  }

  getStats() {
    let heapUsed = 0;
    let heapTotal = 0;
    let heapLimit = 0;

    if (this.hasPerformanceMemory()) {
      heapUsed = performance.memory.usedJSHeapSize;
      heapTotal = performance.memory.totalJSHeapSize;
      heapLimit = performance.memory.jsHeapSizeLimit;
    } else {
      // Estimated heap when performance.memory is blocked (Safari/Firefox)
      heapUsed = this.totalAllocatedBytes + 45 * 1024 * 1024;
      heapTotal = Math.max(heapUsed * 1.25, 120 * 1024 * 1024);
      heapLimit = 2048 * 1024 * 1024;
    }

    const allocatedMB = this.totalAllocatedBytes / (1024 * 1024);
    const peakMB = this.peakAllocatedBytes / (1024 * 1024);
    const heapUsedMB = heapUsed / (1024 * 1024);
    const heapTotalMB = heapTotal / (1024 * 1024);
    const heapLimitMB = heapLimit / (1024 * 1024);

    return {
      allocatedBytes: this.totalAllocatedBytes,
      allocatedMB: Math.round(allocatedMB * 100) / 100,
      peakMB: Math.round(peakMB * 100) / 100,
      chunkCount: this.allocatedChunks.length,
      heapUsedMB: Math.round(heapUsedMB * 10) / 10,
      heapTotalMB: Math.round(heapTotalMB * 10) / 10,
      heapLimitMB: Math.round(heapLimitMB * 10) / 10,
      percentOfLimit: Math.min(100, Math.round((heapUsed / heapLimit) * 100)) || 0,
      hasNativeTelemetry: this.hasPerformanceMemory()
    };
  }

  /**
   * Allocate real physical RAM
   * @param {number} megabytes Amount of RAM to allocate in MB
   * @returns {boolean} Success status
   */
  allocateMB(megabytes) {
    const bytesToAllocate = megabytes * 1024 * 1024;
    const currentAllocatedMB = this.totalAllocatedBytes / (1024 * 1024);

    // Safety guard
    if (!this.isUncapped && currentAllocatedMB + megabytes > this.maxSafetyLimitMB) {
      const allowed = this.maxSafetyLimitMB - currentAllocatedMB;
      if (allowed <= 10) {
        if (this.onMilestone) {
          this.onMilestone('SAFETY_CAP_REACHED', {
            limit: this.maxSafetyLimitMB,
            current: Math.round(currentAllocatedMB)
          });
        }
        return false;
      }
    }

    try {
      // Allocate actual Uint8Array buffer
      const buffer = new Uint8Array(bytesToAllocate);

      // Force dirty physical RAM pages: Touch one byte per 4096-byte memory page
      // This prevents the OS kernel from optimizing away zeroed memory pages!
      const pageSize = 4096;
      const seed = Math.floor(Math.random() * 255);
      for (let offset = 0; offset < bytesToAllocate; offset += pageSize) {
        buffer[offset] = (offset ^ seed) & 0xff;
      }
      // Also touch the boundary bytes
      buffer[0] = 0x52; // 'R'
      buffer[1] = 0x41; // 'A'
      buffer[2] = 0x4d; // 'M'
      buffer[bytesToAllocate - 1] = 0xff;

      this.allocatedChunks.push(buffer);
      this.totalAllocatedBytes += bytesToAllocate;
      if (this.totalAllocatedBytes > this.peakAllocatedBytes) {
        this.peakAllocatedBytes = this.totalAllocatedBytes;
      }

      this.recordHistory();
      if (this.onMemoryUpdate) {
        this.onMemoryUpdate(this.getStats());
      }
      return true;
    } catch (err) {
      console.warn('Memory allocation error (Tab memory ceiling hit):', err);
      if (this.onOOM) {
        this.onOOM(err);
      }
      return false;
    }
  }

  /**
   * Purge all allocated memory and trigger cleanup
   */
  purge() {
    const previousAllocatedMB = Math.round(this.totalAllocatedBytes / (1024 * 1024));

    // Release references to all byte arrays
    for (let i = 0; i < this.allocatedChunks.length; i++) {
      this.allocatedChunks[i] = null;
    }
    this.allocatedChunks = [];
    this.totalAllocatedBytes = 0;

    this.recordHistory();

    if (this.onMemoryUpdate) {
      this.onMemoryUpdate(this.getStats());
    }

    return previousAllocatedMB;
  }

  recordHistory() {
    const stats = this.getStats();
    this.history.push({
      time: Date.now(),
      allocatedMB: stats.allocatedMB,
      heapUsedMB: stats.heapUsedMB
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  setSafetyLimit(mb) {
    this.maxSafetyLimitMB = mb;
  }

  setUncapped(val) {
    this.isUncapped = !!val;
  }
}

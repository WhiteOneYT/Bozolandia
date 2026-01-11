// ============================================
// VIDEO EDITOR PRO v10 - ADVANCED FEATURES
// Proxy, Ducking, Advanced Color, Export Queue
// ============================================

console.log('📦 Loading app-v10-advanced.js...');

// Proxy Workflow
function toggleProxyMode() {
  editorState.proxyMode = !editorState.proxyMode;
  const btn = document.getElementById('proxyBtn');
  
  if (btn) {
    if (editorState.proxyMode) {
      btn.classList.add('active');
      btn.textContent = '⚡ Proxy ON';
    } else {
      btn.classList.remove('active');
      btn.textContent = '⚡ Proxy';
    }
  }
  
  // In real implementation, would switch to lower-res versions
  renderTimeline();
}

// ============================================
// ADJUSTMENT LAYER
// ============================================

function createAdjustmentLayer() {
  if (!editorState.activeSequence) return;
  
  const adjustmentFile = {
    id: Date.now() + Math.random(),
    name: 'Adjustment Layer',
    type: 'adjustment',
    duration: 5
  };
  
  const clip = new Clip(adjustmentFile, 'v3', editorState.currentTime);
  clip.duration = 5;
  clip.type = 'adjustment';
  
  editorState.activeSequence.clips.push(clip);
  renderTimeline();
  saveHistory();
}

// ============================================
// COMPOUND CLIP (NESTED SEQUENCES)
// ============================================

function createCompoundClip() {
  if (!editorState.selectedClip || !editorState.activeSequence) {
    alert('Select a clip first!');
    return;
  }
  
  const name = prompt('Compound clip name:', 'Compound Clip 1');
  if (!name) return;
  
  // Create new sequence with selected clip
  const nestedSequence = new Sequence(name);
  const originalClip = editorState.selectedClip;
  
  // Copy clip to new sequence
  const nestedClip = Object.assign({}, originalClip);
  nestedClip.id = Date.now() + Math.random();
  nestedClip.startTime = 0;
  nestedSequence.clips.push(nestedClip);
  
  editorState.sequences.push(nestedSequence);
  
  // Replace original with compound clip
  const compoundFile = {
    id: Date.now() + Math.random(),
    name: name,
    type: 'compound',
    duration: originalClip.duration,
    sequenceId: nestedSequence.id
  };
  
  originalClip.mediaFile = compoundFile;
  originalClip.isCompound = true;
  
  renderTimeline();
  updateSequenceSelector();
  saveHistory();
}

// ============================================
// AUDIO DUCKING
// ============================================

function openAudioDucking() {
  if (document.getElementById('duckingModal')) return;
  
  const modal = document.createElement('div');
  modal.id = 'duckingModal';
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    background: #1e293b;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 24px;
    z-index: 10000;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.9);
  `;
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <h3 style="margin: 0; color: #e2e8f0;">🎚️ Audio Ducking</h3>
      <button onclick="closeModal('duckingModal')" style="background: #ef4444; border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Close</button>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Dialog Track</label>
      <select id="duckingDialogTrack" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
        <option value="a1">Audio 1</option>
        <option value="a2">Audio 2</option>
      </select>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Music Track to Duck</label>
      <select id="duckingMusicTrack" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
        <option value="a1">Audio 1</option>
        <option value="a2" selected>Audio 2</option>
      </select>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Duck Amount: <span id="duckAmountVal">-12 dB</span></label>
      <input type="range" id="duckAmount" min="-40" max="0" value="-12" 
             oninput="document.getElementById('duckAmountVal').textContent = this.value + ' dB'"
             style="width: 100%;">
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Fade In (ms)</label>
        <input type="number" id="duckFadeIn" value="500" min="0" max="2000" step="100"
               style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
      </div>
      <div>
        <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Fade Out (ms)</label>
        <input type="number" id="duckFadeOut" value="500" min="0" max="2000" step="100"
               style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
      </div>
    </div>
    
    <button onclick="applyAudioDucking()" 
            style="width: 100%; padding: 12px; background: #22c55e; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
      Apply Ducking
    </button>
  `;
  
  document.body.appendChild(modal);
}

function applyAudioDucking() {
  const dialogTrack = document.getElementById('duckingDialogTrack').value;
  const musicTrack = document.getElementById('duckingMusicTrack').value;
  const amount = parseInt(document.getElementById('duckAmount').value);
  const fadeIn = parseInt(document.getElementById('duckFadeIn').value) / 1000;
  const fadeOut = parseInt(document.getElementById('duckFadeOut').value) / 1000;
  
  if (!editorState.activeSequence) return;
  
  // Get all dialog clips
  const dialogClips = editorState.activeSequence.clips.filter(c => c.trackId === dialogTrack);
  
  // For each dialog clip, duck music clips
  dialogClips.forEach(dialogClip => {
    const musicClips = editorState.activeSequence.clips.filter(c => 
      c.trackId === musicTrack &&
      c.startTime < dialogClip.startTime + dialogClip.duration &&
      c.startTime + c.duration > dialogClip.startTime
    );
    
    musicClips.forEach(musicClip => {
      // Add volume keyframes for ducking
      if (!musicClip.keyframes) musicClip.keyframes = [];
      
      const duckStart = Math.max(dialogClip.startTime, musicClip.startTime);
      const duckEnd = Math.min(dialogClip.startTime + dialogClip.duration, musicClip.startTime + musicClip.duration);
      
      // Keyframes: normal -> duck -> normal
      musicClip.keyframes.push(
        { time: duckStart - fadeIn, property: 'volume', value: 100 },
        { time: duckStart, property: 'volume', value: amount },
        { time: duckEnd, property: 'volume', value: amount },
        { time: duckEnd + fadeOut, property: 'volume', value: 100 }
      );
    });
  });
  
  closeModal('duckingModal');
  saveHistory();
  alert('Audio ducking applied!');
}

// ============================================
// LUMETRI COLOR PANEL
// ============================================

function openLumetriPanel() {
  if (document.getElementById('lumetriModal')) return;
  
  const modal = document.createElement('div');
  modal.id = 'lumetriModal';
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    max-height: 80vh;
    overflow-y: auto;
    background: #1e293b;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 24px;
    z-index: 10000;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.9);
  `;
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <h3 style="margin: 0; color: #e2e8f0;">🌈 Lumetri Color</h3>
      <button onclick="closeModal('lumetriModal')" style="background: #ef4444; border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Close</button>
    </div>
    
    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <h4 style="margin: 0 0 15px 0; color: #94a3b8; font-size: 13px;">Basic Correction</h4>
      ${createSlider('Exposure', 'exposure', -100, 100, 0)}
      ${createSlider('Contrast', 'contrast', -100, 100, 0)}
      ${createSlider('Highlights', 'highlights', -100, 100, 0)}
      ${createSlider('Shadows', 'shadows', -100, 100, 0)}
      ${createSlider('Whites', 'whites', -100, 100, 0)}
      ${createSlider('Blacks', 'blacks', -100, 100, 0)}
    </div>
    
    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <h4 style="margin: 0 0 15px 0; color: #94a3b8; font-size: 13px;">Creative</h4>
      ${createSlider('Temperature', 'temperature', -100, 100, 0)}
      ${createSlider('Tint', 'tint', -100, 100, 0)}
      ${createSlider('Vibrance', 'vibrance', -100, 100, 0)}
      ${createSlider('Saturation', 'saturation', -100, 100, 0)}
    </div>
    
    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px;">
      <h4 style="margin: 0 0 15px 0; color: #94a3b8; font-size: 13px;">Curves</h4>
      <canvas id="lumetriCurves" width="400" height="300" 
              style="width: 100%; background: #0f172a; border-radius: 6px; cursor: crosshair;"></canvas>
    </div>
  `;
  
  document.body.appendChild(modal);
  initLumetriCurves();
}

function createSlider(label, id, min, max, value) {
  return `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <label style="color: #94a3b8; font-size: 11px;">${label}</label>
        <span id="${id}Val" style="color: #64748b; font-size: 11px;">${value}</span>
      </div>
      <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" 
             oninput="document.getElementById('${id}Val').textContent = this.value; updatePreview();"
             style="width: 100%;">
    </div>
  `;
}

function initLumetriCurves() {
  const canvas = document.getElementById('lumetriCurves');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Draw grid
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 4; i++) {
    const x = (i / 4) * canvas.width;
    const y = (i / 4) * canvas.height;
    
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Draw diagonal line (identity curve)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(canvas.width, 0);
  ctx.stroke();
}

// ============================================
// BIN FOLDER MANAGEMENT
// ============================================

function createBinFolder() {
  const name = prompt('Folder name:', 'New Folder');
  if (!name) return;
  
  const folder = {
    id: Date.now() + Math.random(),
    name: name,
    parentId: editorState.currentFolder
  };
  
  editorState.binFolders.push(folder);
  renderProjectBin();
}

function toggleBinView() {
  // Toggle between grid and list view
  const bin = document.getElementById('projectBin');
  if (bin) {
    bin.classList.toggle('gridView');
  }
}

// ============================================
// EXPORT QUEUE
// ============================================

const exportQueue = [];

function openExportQueue() {
  if (document.getElementById('exportQueueModal')) return;
  
  const modal = document.createElement('div');
  modal.id = 'exportQueueModal';
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    max-height: 80vh;
    overflow-y: auto;
    background: #1e293b;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 24px;
    z-index: 10000;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.9);
  `;
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <h3 style="margin: 0; color: #e2e8f0;">📤 Export Queue</h3>
      <button onclick="closeModal('exportQueueModal')" style="background: #ef4444; border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Close</button>
    </div>
    
    <div style="margin-bottom: 20px;">
      <button onclick="addToExportQueue()" style="width: 100%; padding: 12px; background: #22c55e; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
        ➕ Add Current Sequence to Queue
      </button>
    </div>
    
    <div id="exportQueueList" style="max-height: 400px; overflow-y: auto;">
      ${exportQueue.length === 0 ? '<div style="text-align: center; color: #64748b; padding: 40px;">Queue is empty</div>' : ''}
    </div>
    
    <div style="margin-top: 20px; display: flex; gap: 10px;">
      <button onclick="processExportQueue()" style="flex: 1; padding: 12px; background: #3b82f6; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
        Start Export
      </button>
      <button onclick="clearExportQueue()" style="padding: 12px 20px; background: #ef4444; border: none; color: white; border-radius: 6px; cursor: pointer;">
        Clear Queue
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function addToExportQueue() {
  if (!editorState.activeSequence) return;
  
  const exportJob = {
    id: Date.now(),
    sequence: editorState.activeSequence,
    preset: '1080p',
    status: 'pending',
    progress: 0
  };
  
  exportQueue.push(exportJob);
  updateExportQueueList();
}

function updateExportQueueList() {
  const list = document.getElementById('exportQueueList');
  if (!list) return;
  
  list.innerHTML = exportQueue.map(job => `
    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #e2e8f0; font-weight: 600;">${job.sequence.name}</span>
        <span style="color: ${job.status === 'done' ? '#22c55e' : job.status === 'processing' ? '#f59e0b' : '#64748b'}; font-size: 11px;">
          ${job.status.toUpperCase()}
        </span>
      </div>
      <div style="background: #0f172a; height: 6px; border-radius: 3px; overflow: hidden;">
        <div style="width: ${job.progress}%; height: 100%; background: #3b82f6; transition: width 0.3s;"></div>
      </div>
    </div>
  `).join('');
}

function processExportQueue() {
  if (exportQueue.length === 0) {
    alert('Export queue is empty');
    return;
  }
  
  // Process first job in queue
  const job = exportQueue[0];
  job.status = 'processing';
  job.progress = 0;
  updateExportQueueList();
  
  // Close modal during export
  closeModal('exportQueueModal');
  
  // Show export progress in corner
  showExportProgress(job);
  
  // Start actual export
  exportSequence(job);
}

function showExportProgress(job) {
  // Remove old progress if exists
  const old = document.getElementById('exportProgress');
  if (old) old.remove();
  
  const div = document.createElement('div');
  div.id = 'exportProgress';
  div.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #1e293b;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    padding: 16px;
    min-width: 300px;
    z-index: 10000;
    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
  `;
  
  div.innerHTML = `
    <div style="color: #e2e8f0; font-weight: 600; margin-bottom: 8px;">
      📤 Exporting: ${job.sequence.name}
    </div>
    <div style="background: #0f172a; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
      <div id="exportProgressBar" style="width: 0%; height: 100%; background: #3b82f6; transition: width 0.3s;"></div>
    </div>
    <div id="exportProgressText" style="color: #94a3b8; font-size: 12px;">
      Initializing...
    </div>
  `;
  
  document.body.appendChild(div);
}

function updateExportProgress(progress, text) {
  const bar = document.getElementById('exportProgressBar');
  const textEl = document.getElementById('exportProgressText');
  if (bar) bar.style.width = progress + '%';
  if (textEl) textEl.textContent = text;
}

function closeExportProgress() {
  const div = document.getElementById('exportProgress');
  if (div) div.remove();
}

async function exportSequence(job) {
  console.log('📤 Starting video export with audio');
  
  const chunks = [];
  let recorder = null;
  let checkInterval = null;
  let audioContext = null;
  let audioDestination = null;
  
  try {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) {
      throw new Error('Canvas not found');
    }
    
    const sequence = job.sequence;
    const startTime = sequence.inPoint || 0;
    const endTime = sequence.outPoint || editorState.duration;
    const duration = endTime - startTime;
    
    if (duration <= 0) {
      throw new Error('Invalid export duration');
    }
    
    updateExportProgress(0, 'Preparing...');
    
    // Create hidden canvas for export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    
    // Setup audio context for mixing
    audioContext = new AudioContext();
    audioDestination = audioContext.createMediaStreamDestination();
    
    // Connect all video elements to audio mixer
    const videoElements = Object.values(editorState.videoElements || {});
    videoElements.forEach(video => {
      if (video && video.src) {
        try {
          const source = audioContext.createMediaElementSource(video);
          source.connect(audioDestination);
          source.connect(audioContext.destination); // Also play normally
        } catch (e) {
          // Already connected
        }
      }
    });
    
    updateExportProgress(5, 'Starting export...');
    
    // Start playback first
    editorState.currentTime = startTime;
    editorState.isPlaying = true;
    
    if (window.updatePreview) window.updatePreview();
    await new Promise(resolve => setTimeout(resolve, 100));
    if (window.startPlayback) window.startPlayback();
    
    // Copy canvas content continuously to hidden canvas
    const copyInterval = setInterval(() => {
      if (editorState.currentTime < endTime && editorState.isPlaying) {
        exportCtx.drawImage(canvas, 0, 0);
      }
    }, 33); // ~30 FPS
    
    // Create stream from hidden canvas + audio
    const videoStream = exportCanvas.captureStream(30);
    const audioStream = audioDestination.stream;
    
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks()
    ]);
    
    console.log('Tracks:', combinedStream.getTracks().map(t => t.kind).join(', '));
    
    // Create recorder
    const options = { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 2500000 };
    
    // Fallback if codec not supported
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }
    
    recorder = new MediaRecorder(combinedStream, options);
    
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
        console.log('Chunk:', e.data.size, 'bytes');
      }
    };
    
    recorder.onstop = () => {
      console.log('Recording stopped. Chunks:', chunks.length);
      
      clearInterval(copyInterval);
      if (checkInterval) clearInterval(checkInterval);
      if (audioContext) audioContext.close();
      
      editorState.isPlaying = false;
      if (window.stopPlayback) window.stopPlayback();
      
      if (chunks.length === 0) {
        alert('No data recorded');
        closeExportProgress();
        job.status = 'failed';
        return;
      }
      
      updateExportProgress(95, 'Creating file...');
      
      const blob = new Blob(chunks, { type: 'video/webm' });
      console.log('File size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      job.status = 'done';
      updateExportProgress(100, 'Done!');
      
      setTimeout(() => {
        closeExportProgress();
        editorState.currentTime = startTime;
        if (window.updatePreview) window.updatePreview();
      }, 2000);
    };
    
    recorder.onerror = (e) => {
      console.error('Recorder error:', e);
      clearInterval(copyInterval);
      if (checkInterval) clearInterval(checkInterval);
      if (audioContext) audioContext.close();
      editorState.isPlaying = false;
      if (window.stopPlayback) window.stopPlayback();
      alert('Recording failed');
      closeExportProgress();
      job.status = 'failed';
    };
    
    recorder.start(1000);
    console.log('Recording started');
    
    updateExportProgress(10, 'Recording...');
    
    // Monitor progress and stop at end
    checkInterval = setInterval(() => {
      const elapsed = editorState.currentTime - startTime;
      const progress = Math.min(90, 10 + (elapsed / duration) * 80);
      updateExportProgress(progress, `${elapsed.toFixed(1)}s / ${duration.toFixed(1)}s`);
      
      if (editorState.currentTime >= endTime - 0.05 || !editorState.isPlaying) {
        console.log('Stopping recording...');
        clearInterval(checkInterval);
        checkInterval = null;
        
        setTimeout(() => {
          if (recorder && recorder.state === 'recording') {
            recorder.stop();
          }
        }, 200);
      }
    }, 50);
    
  } catch (error) {
    console.error('Export error:', error);
    
    if (checkInterval) clearInterval(checkInterval);
    if (audioContext) audioContext.close();
    
    editorState.isPlaying = false;
    if (window.stopPlayback) window.stopPlayback();
    
    job.status = 'failed';
    updateExportProgress(0, 'Failed');
    setTimeout(() => closeExportProgress(), 3000);
    alert('Export failed: ' + error.message);
  }
}

function clearExportQueue() {
  exportQueue.length = 0;
  updateExportQueueList();
}

// Export functions for HTML onclick
window.toggleProxyMode = toggleProxyMode;
window.createAdjustmentLayer = createAdjustmentLayer;
window.createCompoundClip = createCompoundClip;
window.openAudioDucking = openAudioDucking;
window.applyAudioDucking = applyAudioDucking;
window.openLumetriPanel = openLumetriPanel;
window.initLumetriCurves = initLumetriCurves;
window.createBinFolder = createBinFolder;
window.toggleBinView = toggleBinView;
window.openExportQueue = openExportQueue;
window.addToExportQueue = addToExportQueue;
window.updateExportQueueList = updateExportQueueList;
window.processExportQueue = processExportQueue;
window.clearExportQueue = clearExportQueue;
window.showExportProgress = showExportProgress;
window.updateExportProgress = updateExportProgress;
window.closeExportProgress = closeExportProgress;
window.exportSequence = exportSequence;

console.log('✅ app-v10-advanced.js loaded. openExportQueue:', typeof window.openExportQueue);

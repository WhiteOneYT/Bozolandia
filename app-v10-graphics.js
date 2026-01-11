// ============================================
// VIDEO EDITOR PRO v10 - GRAPHICS & TEXT
// Essential Graphics Panel
// ============================================

// Source Monitor
let sourceMediaFile = null;
let sourceInPoint = null;
let sourceOutPoint = null;

function loadInSourceMonitor(mediaFile) {
  sourceMediaFile = mediaFile;
  sourceInPoint = 0;
  sourceOutPoint = mediaFile.duration;
  
  updateSourceCanvas();
  updateSourceTimecode();
}

function updateSourceCanvas() {
  const canvas = document.getElementById('sourceCanvas');
  if (!canvas || !sourceMediaFile) return;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Handle video/audio files
  if ((sourceMediaFile.type === 'video' || sourceMediaFile.type === 'audio') && sourceMediaFile.url) {
    // Create temporary video element for source
    let sourceVideo = document.getElementById('sourceVideo');
    if (!sourceVideo) {
      sourceVideo = document.createElement('video');
      sourceVideo.id = 'sourceVideo';
      sourceVideo.preload = 'metadata';
      sourceVideo.style.display = 'none';
      document.body.appendChild(sourceVideo);
    }
    
    sourceVideo.src = sourceMediaFile.url;
    sourceVideo.currentTime = 0;
    
    sourceVideo.onseeked = () => {
      if (sourceMediaFile.type === 'video' && sourceVideo.readyState >= 2) {
        ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
      }
    };
  }
  // Draw thumbnail or image
  else if (sourceMediaFile.thumbnail) {
    const img = new Image();
    img.src = sourceMediaFile.thumbnail;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }
}

function updateSourceTimecode() {
  const display = document.getElementById('sourceTimecode');
  if (display && sourceMediaFile) {
    const currentTC = formatTimecode(sourceCurrentTime);
    const inTC = sourceInPoint !== null ? formatTimecode(sourceInPoint) : '--:--:--';
    const outTC = sourceOutPoint !== null ? formatTimecode(sourceOutPoint) : '--:--:--';
    display.textContent = `${currentTC} | In: ${inTC} Out: ${outTC}`;
  }
}

function sourceSetIn() {
  sourceInPoint = sourceCurrentTime;
  updateSourceTimecode();
}

function sourceSetOut() {
  if (sourceMediaFile) {
    sourceOutPoint = sourceCurrentTime;
    updateSourceTimecode();
  }
}

// Source Monitor Playback
let sourcePlayInterval = null;
let sourceCurrentTime = 0;
let sourceIsPlaying = false;

function sourcePlayPause() {
  if (!sourceMediaFile) return;
  
  sourceIsPlaying = !sourceIsPlaying;
  const btn = document.getElementById('sourcePlayBtn');
  
  if (sourceIsPlaying) {
    btn.textContent = '⏸';
    // Start from In Point if set
    if (sourceInPoint !== null && sourceCurrentTime < sourceInPoint) {
      sourceCurrentTime = sourceInPoint;
    }
    sourcePlayInterval = setInterval(() => {
      sourceCurrentTime += 1/30;
      
      // Loop between In and Out points
      const endPoint = sourceOutPoint !== null ? sourceOutPoint : sourceMediaFile.duration;
      if (sourceCurrentTime >= endPoint) {
        sourceCurrentTime = sourceInPoint !== null ? sourceInPoint : 0;
      }
      
      updateSourcePreview();
    }, 1000/30);
  } else {
    btn.textContent = '▶';
    if (sourcePlayInterval) {
      clearInterval(sourcePlayInterval);
      sourcePlayInterval = null;
    }
    // Pause video element
    const sourceVideo = document.getElementById('sourceVideo');
    if (sourceVideo) {
      sourceVideo.pause();
    }
  }
}

function sourceStop() {
  sourceIsPlaying = false;
  sourceCurrentTime = 0;
  if (sourcePlayInterval) {
    clearInterval(sourcePlayInterval);
    sourcePlayInterval = null;
  }
  document.getElementById('sourcePlayBtn').textContent = '▶';
  
  // Stop and reset video
  const sourceVideo = document.getElementById('sourceVideo');
  if (sourceVideo) {
    sourceVideo.pause();
    sourceVideo.currentTime = 0;
  }
  
  updateSourcePreview();
}

function updateSourcePreview() {
  const canvas = document.getElementById('sourceCanvas');
  if (!canvas || !sourceMediaFile) return;
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Update timecode display
  updateSourceTimecode();
  
  // Handle video files
  if (sourceMediaFile.type === 'video' && sourceMediaFile.url) {
    let sourceVideo = document.getElementById('sourceVideo');
    if (!sourceVideo) {
      sourceVideo = document.createElement('video');
      sourceVideo.id = 'sourceVideo';
      sourceVideo.preload = 'auto';
      sourceVideo.style.display = 'none';
      document.body.appendChild(sourceVideo);
      sourceVideo.src = sourceMediaFile.url;
    }
    
    if (Math.abs(sourceVideo.currentTime - sourceCurrentTime) > 0.1) {
      sourceVideo.currentTime = sourceCurrentTime;
    }
    
    if (sourceIsPlaying && sourceVideo.paused) {
      sourceVideo.play().catch(() => {});
    } else if (!sourceIsPlaying && !sourceVideo.paused) {
      sourceVideo.pause();
    }
    
    if (sourceVideo.readyState >= 2) {
      ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
    }
  }
  // Handle audio files (MP3, etc.)
  else if (sourceMediaFile.type === 'audio' && sourceMediaFile.url) {
    let sourceVideo = document.getElementById('sourceVideo');
    if (!sourceVideo) {
      sourceVideo = document.createElement('video');
      sourceVideo.id = 'sourceVideo';
      sourceVideo.preload = 'auto';
      sourceVideo.style.display = 'none';
      document.body.appendChild(sourceVideo);
      sourceVideo.src = sourceMediaFile.url;
    }
    
    if (Math.abs(sourceVideo.currentTime - sourceCurrentTime) > 0.1) {
      sourceVideo.currentTime = sourceCurrentTime;
    }
    
    if (sourceIsPlaying && sourceVideo.paused) {
      sourceVideo.play().catch(() => {});
    } else if (!sourceIsPlaying && !sourceVideo.paused) {
      sourceVideo.pause();
    }
    
    // Draw audio waveform placeholder
    ctx.fillStyle = '#10b981';
    ctx.fillRect(20, canvas.height/2 - 40, canvas.width - 40, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 Audio: ' + sourceMediaFile.name, canvas.width/2, canvas.height/2);
  }
}

// Insert/Overwrite from Source
function insertToTimeline() {
  if (!sourceMediaFile || !editorState.activeSequence) return;
  
  const clip = new Clip(sourceMediaFile, 'v1', editorState.currentTime);
  clip.trimStart = sourceInPoint || 0;
  clip.trimEnd = sourceOutPoint || sourceMediaFile.duration;
  clip.duration = clip.trimEnd - clip.trimStart;
  
  // Insert mode: push existing clips forward
  editorState.activeSequence.clips.forEach(c => {
    if (c.startTime >= editorState.currentTime) {
      c.startTime += clip.duration;
    }
  });
  
  editorState.activeSequence.clips.push(clip);
  renderTimeline();
  updatePreview();
  saveHistory();
}

function overwriteToTimeline() {
  if (!sourceMediaFile || !editorState.activeSequence) return;
  
  const clip = new Clip(sourceMediaFile, 'v1', editorState.currentTime);
  clip.trimStart = sourceInPoint || 0;
  clip.trimEnd = sourceOutPoint || sourceMediaFile.duration;
  clip.duration = clip.trimEnd - clip.trimStart;
  
  // Overwrite mode: replace/trim overlapping clips
  const endTime = clip.startTime + clip.duration;
  
  editorState.activeSequence.clips = editorState.activeSequence.clips.filter(c => {
    // Remove clips completely covered
    if (c.startTime >= clip.startTime && c.startTime + c.duration <= endTime) {
      return false;
    }
    
    // Trim clips that partially overlap
    if (c.startTime < clip.startTime && c.startTime + c.duration > clip.startTime) {
      c.duration = clip.startTime - c.startTime;
    }
    
    if (c.startTime < endTime && c.startTime + c.duration > endTime) {
      const trimAmount = endTime - c.startTime;
      c.trimStart += trimAmount;
      c.duration -= trimAmount;
      c.startTime = endTime;
    }
    
    return true;
  });
  
  editorState.activeSequence.clips.push(clip);
  renderTimeline();
  updatePreview();
  saveHistory();
}

// ============================================
// ESSENTIAL GRAPHICS
// ============================================

function openEssentialGraphics() {
  if (document.getElementById('graphicsModal')) return;
  
  const modal = document.createElement('div');
  modal.id = 'graphicsModal';
  modal.className = 'modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    background: #1e293b;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 24px;
    z-index: 10000;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.9);
  `;
  
  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <h3 style="margin: 0; color: #e2e8f0;">✏️ Essential Graphics</h3>
      <button onclick="closeModal('graphicsModal')" style="background: #ef4444; border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Close</button>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Text</label>
      <input type="text" id="graphicsText" value="Enter Text" 
             style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Font Size</label>
        <input type="number" id="graphicsFontSize" value="48" min="12" max="200"
               style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
      </div>
      <div>
        <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Font Color</label>
        <input type="color" id="graphicsColor" value="#ffffff"
               style="width: 100%; height: 38px; padding: 2px; background: #0f172a; border: 1px solid #334155; border-radius: 6px;">
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Position X</label>
        <input type="number" id="graphicsX" value="50" min="0" max="100"
               style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
      </div>
      <div>
        <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Position Y</label>
        <input type="number" id="graphicsY" value="50" min="0" max="100"
               style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
      </div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display: block; color: #94a3b8; font-size: 12px; margin-bottom: 5px;">Template</label>
      <select id="graphicsTemplate" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;">
        <option value="simple">Simple Title</option>
        <option value="lower3rd">Lower Third</option>
        <option value="endscreen">End Screen</option>
        <option value="subtitle">Subtitle</option>
      </select>
    </div>
    
    <button onclick="applyGraphics()" 
            style="width: 100%; padding: 12px; background: #3b82f6; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 600;">
      Add to Timeline
    </button>
  `;
  
  document.body.appendChild(modal);
}

function addTextLayer(type) {
  const templates = {
    title: { text: 'Title', fontSize: 72, x: 50, y: 30 },
    lower3rd: { text: 'Name | Title', fontSize: 32, x: 10, y: 80 },
    endscreen: { text: 'Thank You!', fontSize: 64, x: 50, y: 50 }
  };
  
  const template = templates[type] || templates.title;
  
  const textFile = {
    id: Date.now() + Math.random(),
    name: `${type}.text`,
    type: 'text',
    duration: 5,
    textContent: template.text,
    fontSize: template.fontSize,
    fontColor: '#ffffff',
    positionX: template.x,
    positionY: template.y
  };
  
  const clip = new Clip(textFile, 'v3', editorState.currentTime);
  clip.duration = 5;
  
  if (editorState.activeSequence) {
    editorState.activeSequence.clips.push(clip);
    renderTimeline();
    saveHistory();
  }
}

function applyGraphics() {
  const text = document.getElementById('graphicsText').value;
  const fontSize = parseInt(document.getElementById('graphicsFontSize').value);
  const color = document.getElementById('graphicsColor').value;
  const x = parseInt(document.getElementById('graphicsX').value);
  const y = parseInt(document.getElementById('graphicsY').value);
  
  const textFile = {
    id: Date.now() + Math.random(),
    name: 'text.text',
    type: 'text',
    duration: 5,
    textContent: text,
    fontSize: fontSize,
    fontColor: color,
    positionX: x,
    positionY: y
  };
  
  const clip = new Clip(textFile, 'v3', editorState.currentTime);
  clip.duration = 5;
  
  if (editorState.activeSequence) {
    editorState.activeSequence.clips.push(clip);
    renderTimeline();
    saveHistory();
  }
  
  closeModal('graphicsModal');
}

// ============================================
// TABS & PANELS
// ============================================

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tabContent').forEach(tab => {
    tab.classList.remove('active');
  });
  
  document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  const tab = document.getElementById(`${tabName}Tab`);
  if (tab) tab.classList.add('active');
  
  const btn = event.target;
  if (btn) btn.classList.add('active');
}

// ============================================
// EFFECTS
// ============================================

function applyEffect(effectName) {
  if (!editorState.selectedClip) {
    alert('Select a clip first!');
    return;
  }
  
  const effect = {
    id: Date.now(),
    name: effectName,
    enabled: true,
    parameters: getEffectDefaults(effectName)
  };
  
  if (!editorState.selectedClip.effects) {
    editorState.selectedClip.effects = [];
  }
  
  editorState.selectedClip.effects.push(effect);
  updateEffectControls();
  saveHistory();
}

function getEffectDefaults(effectName) {
  const defaults = {
    crossDissolve: { duration: 1 },
    dip: { duration: 1, color: '#000000' },
    transform: { scale: 100, rotation: 0, x: 0, y: 0 },
    crop: { top: 0, bottom: 0, left: 0, right: 0 },
    speedRamp: { startSpeed: 1, endSpeed: 1 },
    timeRemapping: { keyframes: [] }
  };
  
  return defaults[effectName] || {};
}

function applyAudioEffect(effectName) {
  if (!editorState.selectedClip) {
    alert('Select a clip first!');
    return;
  }
  
  const effect = {
    id: Date.now(),
    name: effectName,
    enabled: true,
    parameters: getAudioEffectDefaults(effectName)
  };
  
  if (!editorState.selectedClip.audioEffects) {
    editorState.selectedClip.audioEffects = [];
  }
  
  editorState.selectedClip.audioEffects.push(effect);
  saveHistory();
}

function getAudioEffectDefaults(effectName) {
  const defaults = {
    eq: { low: 0, mid: 0, high: 0 },
    compressor: { threshold: -20, ratio: 4, attack: 10, release: 100 },
    reverb: { roomSize: 0.5, damping: 0.5, wetLevel: 0.3 },
    normalize: { target: -3 }
  };
  
  return defaults[effectName] || {};
}

// ============================================
// SCOPES & SAFE ZONES
// ============================================

function toggleScopes() {
  const overlay = document.getElementById('scopesOverlay');
  const btn = document.getElementById('scopesBtn');
  
  if (overlay) {
    const isVisible = overlay.style.display !== 'none';
    overlay.style.display = isVisible ? 'none' : 'block';
    if (btn) btn.classList.toggle('active');
  }
}

function toggleSafeZones() {
  const overlay = document.getElementById('safeZones');
  const btn = document.getElementById('safeZonesBtn');
  
  if (overlay) {
    const isVisible = overlay.style.display !== 'none';
    overlay.style.display = isVisible ? 'none' : 'block';
    if (btn) btn.classList.toggle('active');
  }
}

// ============================================
// UTILITY
// ============================================

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
}

// Export functions for HTML onclick
window.loadInSourceMonitor = loadInSourceMonitor;
window.updateSourceCanvas = updateSourceCanvas;
window.updateSourceTimecode = updateSourceTimecode;
window.sourceSetIn = sourceSetIn;
window.sourceSetOut = sourceSetOut;
window.sourcePlayPause = sourcePlayPause;
window.sourceStop = sourceStop;
window.insertToTimeline = insertToTimeline;
window.overwriteToTimeline = overwriteToTimeline;
window.openEssentialGraphics = openEssentialGraphics;
window.addTextLayer = addTextLayer;
window.applyGraphics = applyGraphics;
window.switchTab = switchTab;
window.applyEffect = applyEffect;
window.applyAudioEffect = applyAudioEffect;
window.toggleScopes = toggleScopes;
window.toggleSafeZones = toggleSafeZones;
window.closeModal = closeModal;

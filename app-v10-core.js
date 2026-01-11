// ============================================
// VIDEO EDITOR PRO v10 - CORE ENGINE
// Adobe Premiere Pro Professional Clone
// ============================================

// Global State Management
const editorState = {
  version: '10.0.0',
  projectName: 'Untitled Project',
  sequences: [],
  activeSequence: null,
  mediaFiles: [],
  binFolders: [],
  currentFolder: null,
  selectedClip: null,
  selectedTool: 'select', // select, razor, rate, slip
  snappingEnabled: true,
  proxyMode: false,
  currentTime: 0,
  duration: 60,
  frameRate: 30,
  playbackSpeed: 1,
  isPlaying: false,
  zoomLevel: 100,
  history: [],
  historyIndex: -1,
  maxHistory: 50,
  videoElements: {} // Map of clip.id -> video element for multi-clip playback
};

// Sequence Management
class Sequence {
  constructor(name, width = 1920, height = 1080, fps = 30) {
    this.id = Date.now() + Math.random();
    this.name = name;
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.tracks = this.initTracks();
    this.clips = [];
    this.markers = [];
    this.inPoint = null;
    this.outPoint = null;
  }
  
  initTracks() {
    return [
      { id: 'v3', type: 'video', name: 'Video 3', icon: '🎥', muted: false, solo: false, locked: false },
      { id: 'v2', type: 'video', name: 'Video 2', icon: '🎥', muted: false, solo: false, locked: false },
      { id: 'v1', type: 'video', name: 'Video 1', icon: '🎥', muted: false, solo: false, locked: false },
      { id: 'a1', type: 'audio', name: 'Audio 1', icon: '🔊', muted: false, solo: false, locked: false },
      { id: 'a2', type: 'audio', name: 'Audio 2', icon: '🔊', muted: false, solo: false, locked: false }
    ];
  }
}

// Clip Class
class Clip {
  constructor(mediaFile, trackId, startTime) {
    this.id = Date.now() + Math.random();
    this.mediaFile = mediaFile;
    this.trackId = trackId;
    this.startTime = startTime;
    this.duration = mediaFile.duration || 5;
    this.trimStart = 0;
    this.trimEnd = mediaFile.duration || 5;
    this.speed = 1;
    this.effects = [];
    this.keyframes = [];
    this.volume = 100;
    this.opacity = 100;
    this.position = { x: 0, y: 0 };
    this.scale = { x: 100, y: 100 };
    this.rotation = 0;
    this.type = mediaFile.type; // video, audio, image, text, adjustment
  }
}

// Media File Class
class MediaFile {
  constructor(file, type) {
    this.id = Date.now() + Math.random();
    this.name = file.name;
    this.type = type;
    this.url = URL.createObjectURL(file);
    this.file = file;
    this.duration = 0;
    this.width = 0;
    this.height = 0;
    this.fps = 30;
    this.thumbnail = null;
    this.folderId = editorState.currentFolder;
  }
}

// ============================================
// INITIALIZATION
// ============================================

function initEditor() {
  console.log('🎬 Video Editor Pro v10 initializing...');
  
  // Create default sequence
  createSequence();
  
  // Setup track headers
  renderTrackHeaders();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize canvases
  initCanvases();
  
  // Load saved project if exists
  loadAutoSave();
  
  // Setup auto-save
  setInterval(autoSave, 30000);
  
  console.log('✅ Editor initialized successfully');
}

function setupEventListeners() {
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
  
  // Timeline interactions
  const timeline = document.getElementById('timeline');
  if (timeline) {
    timeline.addEventListener('click', (e) => {
      // Check if clicking on timeline background (not on clip)
      if (e.target.id === 'timeline' || e.target === timeline) {
        // Calculate clicked time position
        const rect = timeline.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const zoom = editorState.zoomLevel / 100;
        const timelineWidth = Math.max(timeline.clientWidth, editorState.duration * 20 * zoom);
        const clickedTime = (x / timelineWidth) * editorState.duration;
        
        // Update current time
        editorState.currentTime = Math.max(0, Math.min(clickedTime, editorState.duration));
        editorState.selectedClip = null;
        
        updateTimecode();
        renderTimeline();
        updatePreview();
      }
    });
  }
  
  // Playback
  document.getElementById('playBtn')?.addEventListener('click', togglePlay);
  document.getElementById('stopBtn')?.addEventListener('click', () => {
    stopPlayback();
    editorState.currentTime = 0;
    updateTimecode();
    renderTimeline();
  });
  
  // Window resize
  window.addEventListener('resize', () => renderTimeline());
}

function handleKeyboard(e) {
  // Don't intercept if typing in input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  const key = e.key.toLowerCase();
  
  // Tool shortcuts
  if (key === 'v') selectTool('select');
  else if (key === 'c') selectTool('razor');
  else if (key === 'r') selectTool('rate');
  else if (key === 'y') selectTool('slip');
  
  // Playback
  else if (key === ' ') { e.preventDefault(); togglePlay(); }
  else if (key === 'arrowleft') { e.preventDefault(); e.shiftKey ? skipFrames(-10) : skipFrames(-1); }
  else if (key === 'arrowright') { e.preventDefault(); e.shiftKey ? skipFrames(10) : skipFrames(1); }
  else if (key === 'home') { e.preventDefault(); seekTo(0); }
  else if (key === 'end') { e.preventDefault(); seekTo(editorState.duration); }
  
  // Markers & Points
  else if (key === 'm') { e.preventDefault(); addMarker(); }
  else if (key === 'i') { e.preventDefault(); setInPoint(); }
  else if (key === 'o') { e.preventDefault(); setOutPoint(); }
  
  // Edit
  else if (key === 'delete' || key === 'backspace') { e.preventDefault(); deleteSelectedClip(); }
  else if (e.ctrlKey && key === 'c') { e.preventDefault(); copyClip(); }
  else if (e.ctrlKey && key === 'v') { e.preventDefault(); pasteClip(); }
  else if (e.ctrlKey && key === 'x') { e.preventDefault(); cutClip(); }
  else if (e.ctrlKey && key === 'z') { e.preventDefault(); undo(); }
  else if (e.ctrlKey && key === 'y') { e.preventDefault(); redo(); }
  else if (e.ctrlKey && key === 's') { e.preventDefault(); saveProject(); }
  
  // Insert shortcuts
  else if (key === ',') insertToTimeline();
  else if (key === '.') overwriteToTimeline();
}

// ============================================
// SEQUENCE MANAGEMENT
// ============================================

function createSequence() {
  const name = prompt('Sequence name:', `Sequence ${editorState.sequences.length + 1}`);
  if (!name) return;
  
  const sequence = new Sequence(name);
  editorState.sequences.push(sequence);
  editorState.activeSequence = sequence;
  
  updateSequenceSelector();
  renderTrackHeaders();
  renderTimeline();
}

function switchSequence() {
  const selector = document.getElementById('sequenceSelector');
  const sequenceId = parseFloat(selector.value);
  const sequence = editorState.sequences.find(s => s.id === sequenceId);
  
  if (sequence) {
    editorState.activeSequence = sequence;
    renderTrackHeaders();
    renderTimeline();
  }
}

function updateSequenceSelector() {
  const selector = document.getElementById('sequenceSelector');
  if (!selector) return;
  
  selector.innerHTML = '';
  editorState.sequences.forEach(seq => {
    const option = document.createElement('option');
    option.value = seq.id;
    option.textContent = seq.name;
    option.selected = seq === editorState.activeSequence;
    selector.appendChild(option);
  });
}

// ============================================
// TRACK MANAGEMENT
// ============================================

function renderTrackHeaders() {
  const container = document.getElementById('trackHeaders');
  if (!container || !editorState.activeSequence) return;
  
  container.innerHTML = '';
  
  editorState.activeSequence.tracks.forEach(track => {
    const header = document.createElement('div');
    header.className = 'trackHeader';
    header.innerHTML = `
      <span class="trackIcon">${track.icon}</span>
      <span class="trackName">${track.name}</span>
      <div class="trackToggle ${track.muted ? 'muted' : ''}" 
           onclick="toggleTrackMute('${track.id}')" 
           title="Mute">M</div>
      <div class="trackToggle ${track.solo ? 'solo' : ''}" 
           onclick="toggleTrackSolo('${track.id}')" 
           title="Solo">S</div>
      <div class="trackToggle ${track.locked ? 'locked' : ''}" 
           onclick="toggleTrackLock('${track.id}')" 
           title="Lock">L</div>
    `;
    container.appendChild(header);
  });
}

function toggleTrackMute(trackId) {
  if (!editorState.activeSequence) return;
  const track = editorState.activeSequence.tracks.find(t => t.id === trackId);
  if (track) {
    track.muted = !track.muted;
    renderTrackHeaders();
    saveHistory();
  }
}

function toggleTrackSolo(trackId) {
  if (!editorState.activeSequence) return;
  const track = editorState.activeSequence.tracks.find(t => t.id === trackId);
  if (track) {
    track.solo = !track.solo;
    renderTrackHeaders();
    saveHistory();
  }
}

function toggleTrackLock(trackId) {
  if (!editorState.activeSequence) return;
  const track = editorState.activeSequence.tracks.find(t => t.id === trackId);
  if (track) {
    track.locked = !track.locked;
    renderTrackHeaders();
    saveHistory();
  }
}

// ============================================
// TOOL SELECTION
// ============================================

function selectTool(tool) {
  editorState.selectedTool = tool;
  
  // Update button states
  ['select', 'razor', 'rate', 'slip'].forEach(t => {
    const btn = document.getElementById(`${t}Tool`);
    if (btn) {
      if (t === tool) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
  
  // Update cursor
  document.body.classList.remove('razor-active', 'rate-active', 'slip-active');
  if (tool === 'razor') document.body.classList.add('razor-active');
  else if (tool === 'rate') document.body.classList.add('rate-active');
  else if (tool === 'slip') document.body.classList.add('slip-active');
}

// ============================================
// MEDIA IMPORT
// ============================================

function importMedia() {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'video/*,audio/*,image/*';
  
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const type = file.type.startsWith('video') ? 'video' :
                   file.type.startsWith('audio') ? 'audio' :
                   file.type.startsWith('image') ? 'image' : 'unknown';
      
      const mediaFile = new MediaFile(file, type);
      
      // Get metadata
      if (type === 'video' || type === 'audio') {
        await loadMediaMetadata(mediaFile);
      } else if (type === 'image') {
        await loadImageMetadata(mediaFile);
      }
      
      editorState.mediaFiles.push(mediaFile);
    }
    
    renderProjectBin();
    updateBinStats();
  };
  
  input.click();
}

async function loadMediaMetadata(mediaFile) {
  return new Promise((resolve) => {
    const video = document.createElement(mediaFile.type === 'video' ? 'video' : 'audio');
    video.src = mediaFile.url;
    
    video.onloadedmetadata = () => {
      mediaFile.duration = video.duration;
      if (mediaFile.type === 'video') {
        mediaFile.width = video.videoWidth;
        mediaFile.height = video.videoHeight;
        generateThumbnail(mediaFile, video);
      }
      resolve();
    };
  });
}

async function loadImageMetadata(mediaFile) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = mediaFile.url;
    
    img.onload = () => {
      mediaFile.width = img.width;
      mediaFile.height = img.height;
      mediaFile.duration = 5; // Default 5 seconds for images
      mediaFile.thumbnail = mediaFile.url;
      resolve();
    };
  });
}

function generateThumbnail(mediaFile, video) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext('2d');
  
  video.currentTime = Math.min(1, video.duration / 2);
  video.onseeked = () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    mediaFile.thumbnail = canvas.toDataURL();
    renderProjectBin();
  };
}

// ============================================
// PROJECT BIN
// ============================================

function renderProjectBin() {
  const bin = document.getElementById('projectBin');
  if (!bin) return;
  
  bin.innerHTML = '';
  
  // Filter by current folder
  const files = editorState.mediaFiles.filter(f => 
    f.folderId === editorState.currentFolder
  );
  
  files.forEach(file => {
    const item = document.createElement('div');
    item.className = 'binItem';
    item.draggable = true;
    item.dataset.fileId = file.id;
    
    item.innerHTML = `
      <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 4px; overflow: hidden;">
        ${file.thumbnail ? `<img src="${file.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;">` : 
          `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 32px;">
            ${file.type === 'video' ? '🎥' : file.type === 'audio' ? '🎵' : '🖼️'}
          </div>`}
      </div>
      <div style="padding: 4px; font-size: 11px; color: #94a3b8;">
        <div style="font-weight: 600; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</div>
        <div style="color: #64748b;">${formatDuration(file.duration)}</div>
      </div>
    `;
    
    // Single click to load in Source Monitor
    item.addEventListener('click', () => {
      loadInSourceMonitor(file);
    });
    
    // Drag handlers
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('fileId', file.id);
    });
    
    // Double click to add to timeline at playhead
    item.addEventListener('dblclick', () => {
      if (!editorState.activeSequence) {
        alert('Create a sequence first!');
        return;
      }
      
      // Determine track based on media type
      let trackId = file.type === 'audio' ? 'a1' : 'v1';
      
      const clip = new Clip(file, trackId, editorState.currentTime);
      editorState.activeSequence.clips.push(clip);
      console.log('Added clip to timeline:', clip.id, file.name, 'at time:', editorState.currentTime);
      renderTimeline();
      updatePreview();
      saveHistory();
    });
    
    bin.appendChild(item);
  });
}

function updateBinStats() {
  const stats = document.getElementById('binStats');
  if (!stats) return;
  
  const count = editorState.mediaFiles.length;
  const totalDuration = editorState.mediaFiles.reduce((sum, f) => sum + (f.duration || 0), 0);
  
  stats.textContent = `${count} items | ${formatDuration(totalDuration)}`;
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================
// UTILITIES
// ============================================

function initCanvases() {
  const sourceCanvas = document.getElementById('sourceCanvas');
  const previewCanvas = document.getElementById('previewCanvas');
  
  if (sourceCanvas) {
    const ctx = sourceCanvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  }
  
  if (previewCanvas) {
    const ctx = previewCanvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  }
}

function handleResize() {
  // Adjust timeline and canvases on window resize
  renderTimeline();
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}

// Export globals
window.editorState = editorState;
window.Sequence = Sequence;
window.Clip = Clip;
window.MediaFile = MediaFile;

// Export functions for HTML onclick
window.initEditor = initEditor;
window.createSequence = createSequence;
window.updateSequenceSelector = updateSequenceSelector;
window.selectTool = selectTool;
window.importMedia = importMedia;
window.renderProjectBin = renderProjectBin;
window.updateBinStats = updateBinStats;
window.formatDuration = formatDuration;
window.renderTrackHeaders = renderTrackHeaders;
window.toggleTrackMute = toggleTrackMute;
window.toggleTrackSolo = toggleTrackSolo;
window.toggleTrackLock = toggleTrackLock;

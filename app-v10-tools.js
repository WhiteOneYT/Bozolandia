// ============================================
// VIDEO EDITOR PRO v10 - TOOLS & TIMELINE
// ============================================

// Helper function
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Timeline Rendering
function renderTimeline() {
  if (!editorState.activeSequence) return;
  
  const timeline = document.getElementById('timeline');
  if (!timeline) return;
  
  // Clear
  timeline.innerHTML = '';
  
  const duration = editorState.duration;
  const zoom = editorState.zoomLevel / 100;
  const timelineWidth = Math.max(timeline.clientWidth, duration * 20 * zoom);
  
  // Render clips
  editorState.activeSequence.clips.forEach(clip => {
    renderClip(clip, timeline, timelineWidth, duration);
  });
  
  // Render playhead
  renderPlayhead(timeline, timelineWidth, duration);
  
  // Render markers
  renderMarkers(timeline, timelineWidth, duration);
  
  // Render in/out points
  renderInOutPoints(timeline, timelineWidth, duration);
  
  // Render ruler
  renderTimelineRuler(timelineWidth, duration);
}

function renderClip(clip, timeline, timelineWidth, duration) {
  const track = editorState.activeSequence.tracks.find(t => t.id === clip.trackId);
  if (!track) return;
  
  const trackIndex = editorState.activeSequence.tracks.indexOf(track);
  
  const clipEl = document.createElement('div');
  clipEl.className = 'timelineClip';
  clipEl.dataset.clipId = clip.id;
  
  if (clip.type === 'adjustment') clipEl.classList.add('adjustmentLayer');
  if (clip.isCompound) clipEl.classList.add('compoundClip');
  if (clip === editorState.selectedClip) clipEl.classList.add('selected');
  
  const left = (clip.startTime / duration) * timelineWidth;
  const width = (clip.duration / duration) * timelineWidth;
  const top = trackIndex * 60;
  
  clipEl.style.cssText = `
    position: absolute;
    left: ${left}px;
    top: ${top}px;
    width: ${width}px;
    height: 58px;
    background: ${getClipColor(clip.mediaFile.type)};
    border: 1px solid ${getClipBorderColor(clip.mediaFile.type)};
    border-radius: 4px;
    overflow: hidden;
    cursor: ${getCursorForTool()};
  `;
  
  clipEl.innerHTML = `
    <div style="padding: 4px; color: #fff; font-size: 10px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
      ${clip.mediaFile.name}
    </div>
    <div style="padding: 0 4px; color: rgba(255,255,255,0.6); font-size: 9px;">
      ${formatDuration(clip.duration)}
    </div>
  `;
  
  // Event handlers
  clipEl.addEventListener('click', (e) => handleClipClick(e, clip));
  clipEl.addEventListener('mousedown', (e) => handleClipMouseDown(e, clip));
  
  timeline.appendChild(clipEl);
}

function getClipColor(type) {
  const colors = {
    video: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    audio: 'linear-gradient(135deg, #10b981, #059669)',
    image: 'linear-gradient(135deg, #f59e0b, #d97706)',
    text: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    adjustment: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.3))'
  };
  return colors[type] || colors.video;
}

function getClipBorderColor(type) {
  const colors = {
    video: '#1e40af',
    audio: '#047857',
    image: '#b45309',
    text: '#6d28d9',
    adjustment: '#a855f7'
  };
  return colors[type] || colors.video;
}

function getCursorForTool() {
  const cursors = {
    select: 'move',
    razor: 'crosshair',
    rate: 'ew-resize',
    slip: 'grab'
  };
  return cursors[editorState.selectedTool] || 'default';
}

// Timeline Ruler
function renderTimelineRuler(timelineWidth, duration) {
  const ruler = document.getElementById('timelineRuler');
  if (!ruler) return;
  
  ruler.innerHTML = '';
  ruler.style.width = timelineWidth + 'px';
  
  const secondsInterval = duration > 300 ? 10 : duration > 60 ? 5 : 1;
  
  for (let sec = 0; sec <= duration; sec += secondsInterval) {
    const mark = document.createElement('div');
    mark.style.cssText = `
      position: absolute;
      left: ${(sec / duration) * timelineWidth}px;
      top: 0;
      width: 1px;
      height: 12px;
      background: #64748b;
    `;
    ruler.appendChild(mark);
    
    const label = document.createElement('div');
    label.textContent = formatTimecode(sec);
    label.style.cssText = `
      position: absolute;
      left: ${(sec / duration) * timelineWidth}px;
      top: 14px;
      font-size: 10px;
      color: #94a3b8;
      transform: translateX(-50%);
      white-space: nowrap;
    `;
    ruler.appendChild(label);
  }
}

function formatTimecode(seconds) {
  const fps = editorState.frameRate;
  const totalFrames = Math.floor(seconds * fps);
  const hrs = Math.floor(totalFrames / (fps * 3600));
  const mins = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
  const secs = Math.floor((totalFrames % (fps * 60)) / fps);
  const frames = totalFrames % fps;
  
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

// Playhead
function updatePlayheadOnly() {
  const timeline = document.getElementById('timeline');
  if (!timeline || !editorState.activeSequence) return;
  
  let playhead = timeline.querySelector('.playhead');
  if (!playhead) {
    renderTimeline();
    return;
  }
  
  const duration = editorState.duration;
  const zoom = editorState.zoomLevel / 100;
  const timelineWidth = Math.max(timeline.clientWidth, duration * 20 * zoom);
  const left = (editorState.currentTime / duration) * timelineWidth;
  playhead.style.left = left + 'px';
}

function renderPlayhead(timeline, timelineWidth, duration) {
  const playhead = document.createElement('div');
  playhead.className = 'playhead';
  playhead.id = 'playhead';
  playhead.style.cssText = `
    position: absolute;
    left: ${(editorState.currentTime / duration) * timelineWidth}px;
    top: -30px;
    width: 2px;
    height: calc(100% + 30px);
    background: #ef4444;
    z-index: 1000;
    pointer-events: none;
  `;
  
  const playheadHandle = document.createElement('div');
  playheadHandle.style.cssText = `
    position: absolute;
    top: 0;
    left: -6px;
    width: 14px;
    height: 14px;
    background: #ef4444;
    border-radius: 2px;
    cursor: pointer;
    pointer-events: all;
  `;
  
  playheadHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    handlePlayheadDrag(e, timeline, timelineWidth, duration);
  });
  
  playhead.appendChild(playheadHandle);
  timeline.appendChild(playhead);
}

function handlePlayheadDrag(startEvent, timeline, timelineWidth, duration) {
  startEvent.preventDefault();
  
  const onMove = (e) => {
    const rect = timeline.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, timelineWidth));
    const time = (x / timelineWidth) * duration;
    
    editorState.currentTime = time;
    updateTimecode();
    updatePlayheadOnly();
    updatePreview();
  };
  
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// Clip Interactions
function handleClipClick(e, clip) {
  e.stopPropagation();
  
  if (editorState.selectedTool === 'razor') {
    razorCut(clip, e);
  } else {
    editorState.selectedClip = clip;
    renderTimeline();
    updateEffectControls();
  }
}

function handleClipMouseDown(e, clip) {
  if (editorState.selectedTool !== 'select') return;
  
  // Check if track is locked
  if (editorState.activeSequence) {
    const track = editorState.activeSequence.tracks.find(t => t.id === clip.trackId);
    if (track && track.locked) {
      console.log('Track is locked, cannot move clip');
      return;
    }
  }
  
  e.stopPropagation();
  
  const timeline = document.getElementById('timeline');
  const rect = timeline.getBoundingClientRect();
  const startX = e.clientX;
  const startY = e.clientY;
  const startTime = clip.startTime;
  const originalTrackId = clip.trackId;
  
  const onMove = (e) => {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    const timelineWidth = timeline.scrollWidth;
    const deltaTime = (deltaX / timelineWidth) * editorState.duration;
    
    // Update time position
    clip.startTime = Math.max(0, startTime + deltaTime);
    
    // Snapping
    if (editorState.snappingEnabled) {
      clip.startTime = snapToGrid(clip.startTime);
    }
    
    // Track switching based on vertical movement
    const trackHeight = 60;
    const trackDelta = Math.round(deltaY / trackHeight);
    
    if (editorState.activeSequence) {
      const tracks = editorState.activeSequence.tracks;
      const originalIndex = tracks.findIndex(t => t.id === originalTrackId);
      const newIndex = originalIndex + trackDelta;
      
      // Check if new index is valid
      if (newIndex >= 0 && newIndex < tracks.length) {
        const newTrack = tracks[newIndex];
        
        // Check if new track is locked
        if (newTrack.locked) {
          clip.trackId = originalTrackId;
          renderTimeline();
          return;
        }
        
        // Check if track types match
        const clipType = clip.mediaFile.type;
        const isAudioClip = clipType === 'audio';
        const isAudioTrack = newTrack.id.startsWith('a');
        
        // Only allow matching types
        if (isAudioClip === isAudioTrack) {
          clip.trackId = newTrack.id;
        } else {
          // Reset to original if types don't match
          clip.trackId = originalTrackId;
        }
      } else {
        // Reset if out of bounds
        clip.trackId = originalTrackId;
      }
    }
    
    renderTimeline();
  };
  
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    saveHistory();
    saveHistory();
  };
  
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function handleTimelineClick(e) {
  const timeline = document.getElementById('timeline');
  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const time = (x / timeline.scrollWidth) * editorState.duration;
  
  editorState.currentTime = time;
  updateTimecode();
  renderTimeline();
  updatePreview();
}

function handleTimelineMouseDown(e) {
  if (e.target.id !== 'timeline') return;
  editorState.selectedClip = null;
  renderTimeline();
}

// Razor Tool
function razorCut(clip, e) {
  const timeline = document.getElementById('timeline');
  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const cutTime = (x / timeline.scrollWidth) * editorState.duration;
  
  // Calculate cut point relative to clip
  const clipCutTime = cutTime - clip.startTime;
  
  if (clipCutTime <= 0 || clipCutTime >= clip.duration) return;
  
  // Create second clip
  const newClip = Object.assign({}, clip);
  newClip.id = Date.now() + Math.random();
  newClip.startTime = cutTime;
  newClip.duration = clip.duration - clipCutTime;
  newClip.trimStart = clip.trimStart + clipCutTime;
  
  // Adjust original clip
  clip.duration = clipCutTime;
  clip.trimEnd = clip.trimStart + clipCutTime;
  
  editorState.activeSequence.clips.push(newClip);
  renderTimeline();
  saveHistory();
}

// Snapping
function snapToGrid(time) {
  const snapInterval = 1 / editorState.frameRate; // Snap to frames
  return Math.round(time / snapInterval) * snapInterval;
}

function toggleSnapping() {
  editorState.snappingEnabled = !editorState.snappingEnabled;
  const btn = document.getElementById('snapBtn');
  if (btn) {
    if (editorState.snappingEnabled) btn.classList.add('active');
    else btn.classList.remove('active');
  }
}

// Timeline Zoom
function zoomTimeline(value) {
  editorState.zoomLevel = parseInt(value);
  document.getElementById('zoomLevel').textContent = value + '%';
  renderTimeline();
}

// Playback
function togglePlay() {
  try {
    console.log('=== togglePlay called ===');
    console.log('Current isPlaying:', editorState.isPlaying);
    console.log('Active sequence:', editorState.activeSequence);
    console.log('Button element:', document.getElementById('playBtn'));
    
    editorState.isPlaying = !editorState.isPlaying;
    const btn = document.getElementById('playBtn');
    
    if (!btn) {
      console.error('playBtn not found!');
      return;
    }
    
    if (editorState.isPlaying) {
      console.log('Starting playback...');
      btn.textContent = '⏸ Pause';
      startPlayback();
    } else {
      console.log('Stopping playback...');
      btn.textContent = '▶ Play';
      stopPlayback();
    }
  } catch (error) {
    console.error('Error in togglePlay:', error);
  }
}

function startPlayback() {
  console.log('startPlayback called, fps:', editorState.frameRate, 'speed:', editorState.playbackSpeed);
  const fps = editorState.frameRate;
  const interval = 1000 / fps;
  
  let frameCount = 0;
  
  window.playbackInterval = setInterval(() => {
    editorState.currentTime += (1 / fps) * editorState.playbackSpeed;
    
    if (editorState.currentTime >= editorState.duration) {
      editorState.currentTime = 0;
    }
    
    updateTimecode();
    updatePlayheadOnly();
    
    // Update preview every frame for normal speed, every other frame for high speed
    frameCount++;
    if (editorState.playbackSpeed <= 1 || frameCount % 2 === 0) {
      updatePreview();
    }
  }, interval);
}

function stopPlayback() {
  if (window.playbackInterval) {
    clearInterval(window.playbackInterval);
    window.playbackInterval = null;
  }
  editorState.isPlaying = false;
  document.getElementById('playBtn').textContent = '▶ Play';
  
  // Pause all video elements
  Object.values(editorState.videoElements).forEach(video => {
    video.pause();
  });
  
  // Pause all active video elements
  Object.values(editorState.videoElements).forEach(video => {
    video.pause();
  });
}

function seekTo(time) {
  editorState.currentTime = Math.max(0, Math.min(time, editorState.duration));
  updateTimecode();
  renderTimeline();
  updatePreview();
}

function gotoStart() {
  stopPlayback();
  editorState.currentTime = 0;
  updateTimecode();
  renderTimeline();
  updatePreview();
}

function skipFrames(frames) {
  const frameTime = 1 / editorState.frameRate;
  seekTo(editorState.currentTime + frames * frameTime);
}

function setPlaybackSpeed(speed) {
  editorState.playbackSpeed = speed;
  
  // Update playbackRate on all active video elements
  Object.values(editorState.videoElements).forEach(video => {
    video.playbackRate = speed;
  });
}

// Timecode Display
function updateTimecode() {
  const display = document.getElementById('currentTimecode');
  if (display) {
    display.textContent = formatTimecode(editorState.currentTime);
  }
  
  const frameDisplay = document.getElementById('frameDisplay');
  if (frameDisplay) {
    const currentFrame = Math.floor(editorState.currentTime * editorState.frameRate);
    const totalFrames = Math.floor(editorState.duration * editorState.frameRate);
    frameDisplay.textContent = `Frame: ${currentFrame} / ${totalFrames}`;
  }
}

// Get or create video element for clip
function getVideoElementForClip(clip) {
  console.log('getVideoElementForClip:', clip.id, clip.mediaFile.name);
  if (!editorState.videoElements[clip.id]) {
    console.log('Creating new video element');
    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = clip.mediaFile.url;
    video.playbackRate = editorState.playbackSpeed;
    const container = document.getElementById('hiddenVideoElements');
    if (container) {
      container.appendChild(video);
    }
    editorState.videoElements[clip.id] = video;
  }
  return editorState.videoElements[clip.id];
}

// Preview Update
function updatePreview() {
  const canvas = document.getElementById('previewCanvas');
  if (!canvas) {
    console.warn('Preview canvas not found');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (!editorState.activeSequence) {
    console.warn('No active sequence');
    return;
  }
  
  // Get active clips at current time
  const activeClips = editorState.activeSequence.clips.filter(clip => 
    editorState.currentTime >= clip.startTime && 
    editorState.currentTime < clip.startTime + clip.duration
  );
  
  // Pause all video elements that are NOT in active clips
  editorState.activeSequence.clips.forEach(clip => {
    if (!activeClips.includes(clip)) {
      const video = editorState.videoElements[clip.id];
      if (video && !video.paused) {
        video.pause();
      }
    }
  });
  
  console.log('updatePreview - time:', editorState.currentTime.toFixed(2), 'clips:', activeClips.length);
  
  // Render active clips with their own video elements
  activeClips.forEach(clip => {
    const mediaFile = clip.mediaFile;
    
    // Check if track is muted or if other tracks are soloed
    const track = editorState.activeSequence.tracks.find(t => t.id === clip.trackId);
    if (!track) return;
    
    const soloTracks = editorState.activeSequence.tracks.filter(t => t.solo && t.type === track.type);
    const shouldMute = track.muted || (soloTracks.length > 0 && !track.solo);
    
    // Handle video and audio clips with dedicated video elements
    if ((mediaFile.type === 'video' || mediaFile.type === 'audio') && mediaFile.url) {
      const video = getVideoElementForClip(clip);
      
      const clipTime = editorState.currentTime - clip.startTime + (clip.trimStart || 0);
      
      // Check if we're within trim range
      const trimEnd = clip.trimEnd || clip.mediaFile.duration;
      const clipLocalTime = editorState.currentTime - clip.startTime;
      const isWithinTrim = clipLocalTime >= 0 && clipLocalTime < (trimEnd - (clip.trimStart || 0));
      
      if (!isWithinTrim) {
        // Outside trim range - pause and skip
        if (!video.paused) {
          video.pause();
        }
        return;
      }
      
      // Set playback rate FIRST
      video.playbackRate = editorState.playbackSpeed;
      
      // Sync video time only when necessary (larger tolerance for high speed)
      const tolerance = editorState.playbackSpeed > 1 ? 0.5 : 0.1;
      const timeDiff = Math.abs(video.currentTime - clipTime);
      
      // Only sync if video is paused or difference is too large
      if (!editorState.isPlaying || timeDiff > tolerance) {
        video.currentTime = clipTime;
      }
      
      // Control playback
      if (editorState.isPlaying && video.paused) {
        video.play().catch(() => {});
      } else if (!editorState.isPlaying && !video.paused) {
        video.pause();
      }
      
      // Apply volume (with mute)
      video.volume = shouldMute ? 0 : ((clip.volume || 100) / 100);
      
      // Draw video frame if it's a video type (not audio-only)
      if (mediaFile.type === 'video' && video.readyState >= 2) {
        const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        const w = video.videoWidth * scale * (clip.scale?.x || 100) / 100;
        const h = video.videoHeight * scale * (clip.scale?.y || 100) / 100;
        const x = (canvas.width - w) / 2 + (clip.position?.x || 0);
        const y = (canvas.height - h) / 2 + (clip.position?.y || 0);
        
        ctx.save();
        ctx.globalAlpha = (clip.opacity || 100) / 100;
        
        if (clip.rotation) {
          ctx.translate(x + w/2, y + h/2);
          ctx.rotate(clip.rotation * Math.PI / 180);
          ctx.translate(-(x + w/2), -(y + h/2));
        }
        
        ctx.drawImage(video, x, y, w, h);
        ctx.restore();
      }
    }
  });
}

// History Management
function saveHistory() {
  const state = JSON.parse(JSON.stringify({
    sequences: editorState.sequences,
    currentTime: editorState.currentTime
  }));
  
  editorState.history = editorState.history.slice(0, editorState.historyIndex + 1);
  editorState.history.push(state);
  
  if (editorState.history.length > editorState.maxHistory) {
    editorState.history.shift();
  } else {
    editorState.historyIndex++;
  }
}

function undo() {
  if (editorState.historyIndex <= 0) return;
  
  editorState.historyIndex--;
  const state = editorState.history[editorState.historyIndex];
  
  editorState.sequences = JSON.parse(JSON.stringify(state.sequences));
  editorState.currentTime = state.currentTime;
  editorState.activeSequence = editorState.sequences[0];
  
  renderTimeline();
  updateTimecode();
}

function redo() {
  if (editorState.historyIndex >= editorState.history.length - 1) return;
  
  editorState.historyIndex++;
  const state = editorState.history[editorState.historyIndex];
  
  editorState.sequences = JSON.parse(JSON.stringify(state.sequences));
  editorState.currentTime = state.currentTime;
  editorState.activeSequence = editorState.sequences[0];
  
  renderTimeline();
  updateTimecode();
}

// Clip Operations
function deleteSelectedClip() {
  if (!editorState.selectedClip || !editorState.activeSequence) return;
  
  const index = editorState.activeSequence.clips.indexOf(editorState.selectedClip);
  if (index !== -1) {
    editorState.activeSequence.clips.splice(index, 1);
    editorState.selectedClip = null;
    renderTimeline();
    saveHistory();
  }
}

let clipboardClip = null;

function copyClip() {
  if (editorState.selectedClip) {
    clipboardClip = JSON.parse(JSON.stringify(editorState.selectedClip));
  }
}

function pasteClip() {
  if (!clipboardClip || !editorState.activeSequence) return;
  
  const newClip = JSON.parse(JSON.stringify(clipboardClip));
  newClip.id = Date.now() + Math.random();
  newClip.startTime = editorState.currentTime;
  
  editorState.activeSequence.clips.push(newClip);
  renderTimeline();
  saveHistory();
}

function cutClip() {
  copyClip();
  deleteSelectedClip();
}

// Markers
function addMarker() {
  if (!editorState.activeSequence) return;
  
  const marker = {
    id: Date.now(),
    time: editorState.currentTime,
    label: `Marker ${editorState.activeSequence.markers.length + 1}`,
    color: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][editorState.activeSequence.markers.length % 5]
  };
  
  editorState.activeSequence.markers.push(marker);
  renderTimeline();
  saveHistory();
}

function renderMarkers(timeline, timelineWidth, duration) {
  if (!editorState.activeSequence) return;
  
  editorState.activeSequence.markers.forEach(marker => {
    const markerEl = document.createElement('div');
    markerEl.className = 'timelineMarker';
    markerEl.style.cssText = `
      position: absolute;
      left: ${(marker.time / duration) * timelineWidth}px;
      top: -30px;
      width: 3px;
      height: calc(100% + 30px);
      background: ${marker.color};
      cursor: pointer;
      z-index: 999;
      box-shadow: 0 0 8px ${marker.color};
    `;
    markerEl.title = marker.label;
    
    markerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      seekTo(marker.time);
    });
    
    timeline.appendChild(markerEl);
  });
}

// In/Out Points
function setInPoint() {
  if (!editorState.activeSequence) {
    console.warn('No active sequence');
    return;
  }
  editorState.activeSequence.inPoint = editorState.currentTime;
  renderTimeline();
}

function setOutPoint() {
  if (!editorState.activeSequence) return;
  editorState.activeSequence.outPoint = editorState.currentTime;
  renderTimeline();
}

function clearInOut() {
  if (!editorState.activeSequence) return;
  editorState.activeSequence.inPoint = null;
  editorState.activeSequence.outPoint = null;
  renderTimeline();
}

function renderInOutPoints(timeline, timelineWidth, duration) {
  if (!editorState.activeSequence) return;
  
  if (editorState.activeSequence.inPoint !== null) {
    const marker = document.createElement('div');
    marker.style.cssText = `
      position: absolute;
      left: ${(editorState.activeSequence.inPoint / duration) * timelineWidth}px;
      top: 5px;
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 12px solid #10b981;
      z-index: 998;
    `;
    timeline.appendChild(marker);
  }
  
  if (editorState.activeSequence.outPoint !== null) {
    const marker = document.createElement('div');
    marker.style.cssText = `
      position: absolute;
      left: ${(editorState.activeSequence.outPoint / duration) * timelineWidth}px;
      bottom: 0;
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 12px solid #ef4444;
      z-index: 998;
    `;
    timeline.appendChild(marker);
  }
}

// Effect Controls
function updateEffectControls() {
  const panel = document.getElementById('effectControlsList');
  if (!panel) return;
  
  if (!editorState.selectedClip) {
    panel.innerHTML = '<div style="color: #64748b; font-size: 11px; padding: 8px;">No clip selected</div>';
    return;
  }
  
  panel.innerHTML = `
    <div style="margin-bottom: 8px;">
      <label style="font-size: 10px; color: #94a3b8;">Opacity</label>
      <input type="range" min="0" max="100" value="${editorState.selectedClip.opacity}" 
             onchange="editorState.selectedClip.opacity = this.value; updatePreview();" 
             style="width: 100%;">
    </div>
    <div style="margin-bottom: 8px;">
      <label style="font-size: 10px; color: #94a3b8;">Volume</label>
      <input type="range" min="0" max="100" value="${editorState.selectedClip.volume}" 
             oninput="editorState.selectedClip.volume = this.value; updatePreview();" 
             style="width: 100%;">
    </div>
    <div style="margin-bottom: 8px;">
      <label style="font-size: 10px; color: #94a3b8;">Speed</label>
      <input type="number" min="0.1" max="10" step="0.1" value="${editorState.selectedClip.speed}" 
             onchange="editorState.selectedClip.speed = parseFloat(this.value); editorState.selectedClip.duration = (editorState.selectedClip.mediaFile.duration || 5) / editorState.selectedClip.speed; renderTimeline();" 
             style="width: 100%; background: #1e293b; color: #e2e8f0; border: 1px solid #334155; padding: 4px;">
    </div>
  `;
}

// Auto-save
function autoSave() {
  const projectData = {
    version: editorState.version,
    projectName: editorState.projectName,
    sequences: editorState.sequences,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem('videoEditor_autoSave', JSON.stringify(projectData));
    console.log('✅ Project auto-saved');
  } catch (e) {
    console.error('❌ Auto-save failed:', e);
  }
}

function loadAutoSave() {
  try {
    const saved = localStorage.getItem('videoEditor_autoSave');
    if (saved) {
      const data = JSON.parse(saved);
      if (confirm(`Load auto-saved project "${data.projectName}"?`)) {
        editorState.sequences = data.sequences;
        editorState.projectName = data.projectName;
        editorState.activeSequence = editorState.sequences[0];
        updateSequenceSelector();
        renderTimeline();
        renderTrackHeaders();
      }
    }
  } catch (e) {
    console.error('❌ Failed to load auto-save:', e);
  }
}

function saveProject() {
  const projectData = {
    version: editorState.version,
    projectName: editorState.projectName,
    sequences: editorState.sequences,
    mediaFiles: editorState.mediaFiles.map(f => ({
      ...f,
      file: undefined // Can't serialize File objects
    })),
    timestamp: Date.now()
  };
  
  const json = JSON.stringify(projectData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${editorState.projectName}.vep`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function newProject() {
  if (confirm('Create new project? Unsaved changes will be lost.')) {
    editorState.sequences = [];
    editorState.mediaFiles = [];
    editorState.projectName = 'Untitled Project';
    createSequence();
    renderProjectBin();
    updateBinStats();
  }
}

// Export functions for HTML onclick
window.renderTimeline = renderTimeline;
window.updatePlayheadOnly = updatePlayheadOnly;
window.togglePlay = togglePlay;
window.stopPlayback = stopPlayback;
window.seekTo = seekTo;
window.gotoStart = gotoStart;
window.skipFrames = skipFrames;
window.updateTimecode = updateTimecode;
window.updatePreview = updatePreview;
window.saveHistory = saveHistory;
window.undo = undo;
window.redo = redo;
window.deleteSelectedClip = deleteSelectedClip;
window.copyClip = copyClip;
window.pasteClip = pasteClip;
window.cutClip = cutClip;
window.addMarker = addMarker;
window.setInPoint = setInPoint;
window.setOutPoint = setOutPoint;
window.clearInOut = clearInOut;
window.updateEffectControls = updateEffectControls;
window.autoSave = autoSave;
window.loadAutoSave = loadAutoSave;
window.saveProject = saveProject;
window.newProject = newProject;
window.toggleSnapping = toggleSnapping;
window.zoomTimeline = zoomTimeline;
window.setPlaybackSpeed = setPlaybackSpeed;
window.getVideoElementForClip = getVideoElementForClip;

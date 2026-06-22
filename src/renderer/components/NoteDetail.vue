<template>
  <div class="detail-container">
    <div class="detail-header">
      <div class="drag-handle">
        <svg viewBox="0 0 24 24" width="12" height="12">
          <circle cx="8" cy="5" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="16" cy="5" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="8" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="16" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="8" cy="19" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="16" cy="19" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
      <input
        v-model="note.title"
        @input="debouncedUpdate"
        class="detail-title-input"
        placeholder="标题..."
      />
      <div class="detail-controls">
        <div class="opacity-wrap" title="透明度">
          <svg viewBox="0 0 24 24" width="12" height="12">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
            <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" opacity="0.5"/>
          </svg>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.1"
            v-model.number="note.opacity"
            @change="updateNote"
            class="opacity-slider"
          />
        </div>
        <button @click="toggleAlwaysOnTop" class="icon-btn" :class="{ active: note.alwaysOnTop }" title="置顶">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" :fill="note.alwaysOnTop ? 'var(--accent)' : 'currentColor'" opacity="0.6"/>
          </svg>
        </button>
        <button @click="updateNote" class="icon-btn save" :class="{ saved: saved }" title="保存">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" :fill="saved ? '#4caf50' : 'currentColor'" opacity="0.6"/>
          </svg>
        </button>
        <button @click="closeNote" class="icon-btn close" title="关闭">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" opacity="0.5"/>
          </svg>
        </button>
      </div>
    </div>
    <textarea
      v-model="note.content"
      @input="debouncedUpdate"
      class="detail-textarea"
      placeholder="输入便签内容..."
    ></textarea>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  noteId: {
    type: String,
    required: true
  }
})

const note = ref({
  id: props.noteId,
  title: '',
  content: '',
  opacity: 0.95,
  alwaysOnTop: false
})

const saved = ref(false)
let debounceTimer = null
let saveTimer = null

function updateNote() {
  if (window.electronAPI) {
    window.electronAPI.updateNote(props.noteId, {
      title: note.value.title,
      content: note.value.content,
      opacity: note.value.opacity,
      alwaysOnTop: note.value.alwaysOnTop
    })
    saved.value = true
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saved.value = false }, 1500)
  }
}

function debouncedUpdate() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(updateNote, 500)
}

function toggleAlwaysOnTop() {
  note.value.alwaysOnTop = !note.value.alwaysOnTop
  updateNote()
}

function closeNote() {
  window.close()
}

onMounted(() => {
  if (window.electronAPI) {
    const notes = window.electronAPI.getNotes()
    if (notes[props.noteId]) {
      note.value = { ...note.value, ...notes[props.noteId] }
    }
  }
})

onUnmounted(() => {
  clearTimeout(debounceTimer)
  clearTimeout(saveTimer)
})
</script>

<style scoped>
.detail-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-bg, #f1f8e9);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  background: var(--header-bg, #dcedc8);
  border-bottom: 1px solid var(--card-border, #c5e1a5);
  gap: 6px;
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  cursor: grab;
  opacity: 0.4;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.drag-handle:hover {
  opacity: 0.8;
}

.detail-title-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #33691e);
  outline: none;
  -webkit-app-region: no-drag;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.detail-title-input:hover {
  background: var(--accent-light, rgba(0,0,0,0.04));
}

.detail-title-input:focus {
  background: var(--accent-light, rgba(0,0,0,0.06));
}

.detail-title-input::placeholder {
  color: var(--text-muted, #9ccc65);
  font-weight: 400;
}

.detail-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  -webkit-app-region: no-drag;
  flex-shrink: 0;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
  color: var(--text, #33691e);
}

.icon-btn:hover {
  background: var(--accent-light, rgba(0,0,0,0.08));
}

.icon-btn.active {
  background: var(--accent-light, rgba(245,166,35,0.15));
}

.icon-btn.save:hover {
  background: rgba(76,175,80,0.15);
}

.icon-btn.save.saved {
  background: rgba(76,175,80,0.2);
}

.icon-btn.close:hover {
  background: rgba(244,67,54,0.15);
}

.opacity-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
}

.opacity-slider {
  width: 40px;
  height: 3px;
  cursor: pointer;
  accent-color: var(--accent, #8bc34a);
}

.detail-textarea {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 14px;
  resize: none;
  font-size: 14px;
  color: var(--text, #33691e);
  line-height: 1.7;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.detail-textarea::placeholder {
  color: var(--text-muted, #aed581);
}

.detail-textarea:focus {
  background: var(--accent-light, rgba(255,255,255,0.3));
}
</style>

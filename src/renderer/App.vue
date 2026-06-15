<template>
  <div v-if="pageType === 'note' || pageType === 'view'" class="note-container">
    <NoteDetail :noteId="noteId" />
  </div>
  <div v-else class="manager-container">
    <div class="titlebar" @dblclick="toggleMaximize">
      <div class="titlebar-drag">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path d="M12 2C8.5 2 6 4.5 6 7c0 2 1 3.5 2.5 4.5-.5 1.5-1.5 3-1.5 5 0 2.5 2 4 5 4s5-1.5 5-4c0-2-1-3.5-1.5-5C17 10.5 18 9 18 7c0-2.5-2.5-5-6-5z" fill="#fff"/>
          <circle cx="10" cy="8" r="1.2" fill="#ffb74d"/>
          <circle cx="14" cy="8" r="1.2" fill="#ffb74d"/>
          <circle cx="12" cy="10.5" r="1.8" fill="#ffb74d"/>
        </svg>
        <span class="titlebar-text">爪印</span>
      </div>
      <div class="titlebar-controls">
        <button class="ctrl-btn pin" :class="{ pinned: isPinned }" @click="togglePin" :title="isPinned ? '取消置顶' : '置顶'">
          <svg viewBox="0 0 24 24" width="11" height="11">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" :fill="isPinned ? '#f5a623' : '#666'"/>
          </svg>
        </button>
        <div class="dropdown-wrap">
          <button class="ctrl-btn" @click.stop="toggleMenu" title="设置">
            <svg viewBox="0 0 24 24" width="11" height="11"><path d="M7 10l5 5 5-5z" fill="#666"/></svg>
          </button>
          <div v-if="showMenu" class="dropdown-menu" @click.stop>
            <div class="menu-section">
              <div class="menu-label">主题</div>
              <div class="menu-options">
                <button
                  v-for="t in themes"
                  :key="t.value"
                  class="menu-opt"
                  :class="{ active: theme === t.value }"
                  @click="setTheme(t.value)"
                >{{ t.label }}</button>
              </div>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-section">
              <div class="menu-label">窗口透明度</div>
              <div class="opacity-menu">
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="#999" stroke-width="1.5"/>
                  <path d="M12 2a10 10 0 0 1 0 20z" fill="#999"/>
                </svg>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.1"
                  v-model.number="mainOpacity"
                  @input="setMainOpacity"
                  class="opacity-slider-menu"
                />
                <span class="opacity-val">{{ Math.round(mainOpacity * 100) }}%</span>
              </div>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-section">
              <div class="menu-label">主题色</div>
              <div class="color-options">
                <button
                  v-for="c in colors"
                  :key="c.value"
                  class="color-btn"
                  :class="{ active: accentColor === c.value }"
                  :style="{ background: c.value }"
                  @click="setColor(c.value)"
                  :title="c.label"
                ></button>
              </div>
            </div>
          </div>
        </div>
        <button class="ctrl-btn minimize" @click="minimize" title="最小化">
          <svg viewBox="0 0 24 24" width="11" height="11"><path d="M6 12h12" stroke="#666" stroke-width="2" fill="none"/></svg>
        </button>
        <button class="ctrl-btn maximize" @click="toggleMaximize" title="最大化">
          <svg viewBox="0 0 24 24" width="11" height="11"><rect x="5" y="5" width="14" height="14" rx="1" stroke="#666" stroke-width="2" fill="none"/></svg>
        </button>
        <button class="ctrl-btn close" @click="closeWindow" title="关闭">
          <svg viewBox="0 0 24 24" width="11" height="11"><path d="M6 6l12 12M18 6L6 18" stroke="#666" stroke-width="2" fill="none"/></svg>
        </button>
      </div>
    </div>

    <div class="toolbar">
      <button @click="createNote" class="create-btn">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#fff"/>
        </svg>
        新建爪印
      </button>
      <button @click="toggleSort" class="sort-btn" :title="sortOrder === 'desc' ? '倒序（最新在前）' : '正序（最早在前）'">
        <svg v-if="sortOrder === 'desc'" viewBox="0 0 24 24" width="14" height="14">
          <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" fill="#fff"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="14" height="14">
          <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" fill="#fff" transform="rotate(180 12 12)"/>
        </svg>
      </button>
    </div>

    <div v-if="hasNotes" class="note-list">
      <div
        v-for="(note, id) in sortedNotes"
        :key="id"
        class="note-card"
        :class="{ pinned: note.alwaysOnTop, completed: note.completed }"
        :data-note-id="id"
      >
        <div class="card-header">
          <div class="card-check" @click="toggleComplete(id, note)">
            <svg v-if="note.completed" viewBox="0 0 24 24" width="14" height="14">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="var(--accent, #66bb6a)"/>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#fff"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="14" height="14">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="#ccc" stroke-width="2"/>
            </svg>
          </div>
          <input
            :value="note.title"
            @input="updateField(id, 'title', $event.target.value)"
            @blur="onNoteBlur(id, note.title, note.content)"
            class="card-title-input"
            placeholder="标题..."
          />
          <div class="card-actions">
            <button @click="viewNote(id)" class="action-btn view" title="查看详情">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#666"/>
              </svg>
            </button>
            <button @click="toggleNotePin(id, note)" class="action-btn pin" :class="{ pinned: note.alwaysOnTop }" title="置顶">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" :fill="note.alwaysOnTop ? '#f5a623' : '#999'"/>
              </svg>
            </button>
            <button @click="deleteNote(id)" class="action-btn delete" title="删除">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M6 19c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        <textarea
          :value="note.content"
          @input="autoResize($event); updateField(id, 'content', $event.target.value)"
          @blur="onNoteBlur(id, note.title, note.content)"
          class="card-content-input"
          placeholder="输入内容..."
          rows="1"
        ></textarea>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-text">还没有爪印</div>
      <div class="empty-hint">点击上方按钮或按 Ctrl+N 创建</div>
    </div>

    <div class="footer">
      <span class="note-count">{{ noteCount }} 条爪印</span>
      <span class="shortcut-tip">Ctrl+N 新建 | Ctrl+Shift+S 显示</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import NoteDetail from './components/NoteDetail.vue'

const pageType = new URLSearchParams(window.location.search).get('type') || 'manager'
const noteId = new URLSearchParams(window.location.search).get('id')
const notes = ref({})
const isPinned = ref(false)
const mainOpacity = ref(1)
const showMenu = ref(false)
const theme = ref('light')
const accentColor = ref('#66bb6a')
const sortOrder = ref('desc')
const newNoteId = ref(null)

const themes = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' }
]

const colors = [
  { label: '绿色', value: '#66bb6a' },
  { label: '蓝色', value: '#42a5f5' },
  { label: '紫色', value: '#ab47bc' },
  { label: '橙色', value: '#ffa726' },
  { label: '红色', value: '#ef5350' },
  { label: '粉色', value: '#ec407a' }
]
let debounceTimers = {}

const hasNotes = computed(() => Object.keys(notes.value).length > 0)
const noteCount = computed(() => Object.keys(notes.value).length)

const sortedNotes = computed(() => {
  let entries = Object.entries(notes.value)
  const getTime = (id) => parseInt(id.split('-')[1]) || 0
  const dir = sortOrder.value === 'desc' ? -1 : 1

  if (newNoteId.value) {
    entries = entries.filter(([id]) => id !== newNoteId.value)
  }

  const pinned = entries.filter(([, n]) => n.alwaysOnTop && !n.completed)
  const unpinned = entries.filter(([, n]) => !n.alwaysOnTop && !n.completed)
  const completed = entries.filter(([, n]) => n.completed)

  pinned.sort((a, b) => dir * (getTime(a[0]) - getTime(b[0])))
  unpinned.sort((a, b) => dir * (getTime(a[0]) - getTime(b[0])))
  completed.sort((a, b) => dir * (getTime(a[0]) - getTime(b[0])))

  const sorted = [...pinned, ...unpinned, ...completed]

  if (newNoteId.value) {
    const newNote = notes.value[newNoteId.value]
    if (newNote) {
      if (newNote.alwaysOnTop) {
        sorted.unshift([newNoteId.value, newNote])
      } else {
        if (sortOrder.value === 'desc') {
          sorted.splice(pinned.length, 0, [newNoteId.value, newNote])
        } else {
          sorted.splice(pinned.length + unpinned.length, 0, [newNoteId.value, newNote])
        }
      }
    }
  }

  return Object.fromEntries(sorted)
})

function refreshNotes() {
  if (window.electronAPI) {
    notes.value = window.electronAPI.getNotes()
    nextTick(resizeAllTextareas)
  }
}

function resizeAllTextareas() {
  document.querySelectorAll('.card-content-input').forEach(el => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  })
}

function createNote() {
  if (window.electronAPI) {
    const noteId = `note-${Date.now()}`
    notes.value[noteId] = {
      id: noteId,
      title: '',
      content: '',
      opacity: 0.95,
      alwaysOnTop: false,
      completed: false
    }
    newNoteId.value = noteId
    nextTick(() => {
      const input = document.querySelector(`[data-note-id="${noteId}"] .card-title-input`)
      if (input) input.focus()
    })
  }
}

function saveNewNote(id) {
  if (newNoteId.value === id) {
    const note = notes.value[id]
    window.electronAPI?.saveNote(id, {
      title: note.title,
      content: note.content,
      opacity: note.opacity,
      alwaysOnTop: note.alwaysOnTop
    })
    newNoteId.value = null
  }
}

function discardNewNote(id) {
  if (newNoteId.value === id) {
    delete notes.value[id]
    newNoteId.value = null
  }
}

function onNoteBlur(id, title, content) {
  if (newNoteId.value === id && !title && !content) {
    setTimeout(() => {
      if (newNoteId.value === id) {
        const card = document.querySelector(`[data-note-id="${id}"]`)
        if (card && !card.contains(document.activeElement)) {
          discardNewNote(id)
        }
      }
    }, 200)
  } else if (newNoteId.value === id && (title || content)) {
    saveNewNote(id)
  }
}

function viewNote(id) {
  if (window.electronAPI) {
    window.electronAPI.createNote({ id })
  }
}

function updateField(id, field, value) {
  notes.value[id][field] = value
  if (newNoteId.value === id) {
    if (field === 'title' || field === 'content') {
      if (value) saveNewNote(id)
    }
    return
  }
  if (debounceTimers[id]) {
    clearTimeout(debounceTimers[id])
  }
  debounceTimers[id] = setTimeout(() => {
    if (window.electronAPI) {
      window.electronAPI.updateNote(id, { [field]: value })
    }
  }, 500)
}

function deleteNote(id) {
  if (confirm('确定要删除这个爪印吗？')) {
    if (window.electronAPI) {
      window.electronAPI.deleteNote(id)
      refreshNotes()
    }
  }
}

function toggleNotePin(id, note) {
  if (window.electronAPI) {
    window.electronAPI.updateNote(id, { alwaysOnTop: !note.alwaysOnTop })
    refreshNotes()
  }
}

function toggleComplete(id, note) {
  const completed = !note.completed
  notes.value[id].completed = completed
  if (newNoteId.value !== id) {
    window.electronAPI?.updateNote(id, { completed })
  }
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function minimize() {
  window.electronAPI?.windowMinimize()
}

function toggleMaximize() {
  window.electronAPI?.windowMaximize()
}

function closeWindow() {
  window.electronAPI?.windowClose()
}

function togglePin() {
  isPinned.value = !isPinned.value
  window.electronAPI?.windowSetAlwaysOnTop(isPinned.value)
}

function setMainOpacity() {
  window.electronAPI?.windowSetOpacity(mainOpacity.value)
}

function setTheme(val) {
  theme.value = val
  document.documentElement.setAttribute('data-theme', val)
  window.electronAPI?.saveSetting('theme', val)
  showMenu.value = false
}

function setColor(val) {
  accentColor.value = val
  document.documentElement.style.setProperty('--accent', val)
  document.documentElement.style.setProperty('--accent-light', val + '20')
  window.electronAPI?.saveSetting('accentColor', val)
  showMenu.value = false
}

function toggleSort() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  window.electronAPI?.saveSetting('sortOrder', sortOrder.value)
}

function closeMenu(e) {
  if (e && e.type === 'click') {
    const wrap = document.querySelector('.dropdown-wrap')
    if (wrap && !wrap.contains(e.target)) {
      showMenu.value = false
    }
  } else {
    showMenu.value = false
  }
}

function toggleMenu(e) {
  e.stopPropagation()
  showMenu.value = !showMenu.value
}

function loadSettings() {
  if (window.electronAPI) {
    const settings = window.electronAPI.getSettings()
    if (settings.theme) {
      theme.value = settings.theme
      document.documentElement.setAttribute('data-theme', settings.theme)
    }
    if (settings.accentColor) {
      accentColor.value = settings.accentColor
      document.documentElement.style.setProperty('--accent', settings.accentColor)
      document.documentElement.style.setProperty('--accent-light', settings.accentColor + '20')
    }
    if (settings.sortOrder) {
      sortOrder.value = settings.sortOrder
    }
    if (settings.mainWindowPinned) {
      isPinned.value = settings.mainWindowPinned
    }
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
  window.addEventListener('blur', closeMenu)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu()
  })
  if (pageType === 'manager') {
    loadSettings()
    refreshNotes()
    window.addEventListener('focus', refreshNotes)
    if (window.electronAPI) {
      window.electronAPI.onNotesChanged(refreshNotes)
      window.electronAPI.onShortcutCreateNote(() => {
        if (pageType === 'manager') createNote()
      })
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
  window.removeEventListener('blur', closeMenu)
  window.removeEventListener('focus', refreshNotes)
  Object.values(debounceTimers).forEach(clearTimeout)
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  overflow: hidden;
}

.manager-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  background: var(--accent);
  padding: 0 4px;
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.titlebar-drag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 4px;
}

.titlebar-text {
  font-size: 11px;
  font-weight: 500;
  color: #fff;
}

.titlebar-controls {
  display: flex;
  align-items: center;
  gap: 0;
  -webkit-app-region: no-drag;
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
  padding: 0;
}

.ctrl-btn:hover {
  background: rgba(0,0,0,0.1);
}

.ctrl-btn.pin.pinned {
  background: rgba(245,166,35,0.2);
}

.ctrl-btn.close:hover {
  background: #e53935;
}

.ctrl-btn.close:hover svg path {
  stroke: #fff;
}

.dropdown-wrap {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 160px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  padding: 8px 0;
  z-index: 100;
}

.menu-section {
  padding: 4px 12px;
}

.menu-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 6px;
}

.menu-options {
  display: flex;
  gap: 4px;
}

.menu-opt {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.menu-opt:hover {
  border-color: #bbb;
}

.menu-opt.active {
  background: var(--accent, #66bb6a);
  color: #fff;
  border-color: var(--accent, #66bb6a);
}

.menu-divider {
  height: 1px;
  background: #eee;
  margin: 8px 0;
}

.color-options {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.color-btn:hover {
  transform: scale(1.15);
}

.color-btn.active {
  border-color: #333;
  box-shadow: 0 0 0 2px #fff;
}

.opacity-menu {
  display: flex;
  align-items: center;
  gap: 6px;
}

.opacity-slider-menu {
  flex: 1;
  height: 3px;
  cursor: pointer;
  accent-color: var(--accent, #66bb6a);
}

.opacity-val {
  font-size: 11px;
  color: #666;
  min-width: 28px;
  text-align: right;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  background: var(--accent);
  opacity: 0.85;
  flex-shrink: 0;
  border-bottom: 1px solid var(--card-border);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 6px 0;
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: 1px dashed rgba(255,255,255,0.5);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
  gap: 4px;
}

.create-btn:hover {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.7);
}

.create-btn:active {
  transform: scale(0.98);
}

.sort-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 26px;
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: 1px dashed rgba(255,255,255,0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.sort-btn:hover {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.7);
}

.opacity-wrap {
  display: flex;
  align-items: center;
  gap: 3px;
}

.opacity-slider {
  width: 45px;
  height: 3px;
  cursor: pointer;
  accent-color: #fff;
}

.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.note-card {
  background: var(--card-bg);
  border-radius: 6px;
  border: 1px solid var(--card-border);
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.15s;
}

.note-card.pinned {
  border-left: 3px solid var(--accent, #66bb6a);
  background: var(--accent-light, #66bb6a20);
}

.note-card.completed {
  opacity: 0.6;
}

.note-card.completed .card-title-input {
  text-decoration: line-through;
  color: var(--text-muted);
}

.note-card.completed .card-content-input {
  text-decoration: line-through;
  color: var(--text-muted);
}

.card-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  flex-shrink: 0;
  cursor: pointer;
}

.card-check:hover {
  opacity: 0.8;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 5px 8px;
  gap: 4px;
  border-bottom: 1px solid var(--card-border);
}

.card-title-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  outline: none;
  padding: 2px 4px;
  border-radius: 3px;
  min-width: 0;
}

.card-title-input:hover {
  background: var(--accent-light);
}

.card-title-input:focus {
  background: var(--accent-light);
}

.card-title-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.card-actions {
  display: flex;
  gap: 1px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.note-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.action-btn:hover {
  background: rgba(0,0,0,0.08);
}

.action-btn.view:hover {
  background: rgba(33,150,243,0.15);
}

.action-btn.pin.pinned {
  opacity: 1;
}

.action-btn.pin:hover {
  background: rgba(245,166,35,0.2);
}

.action-btn.delete {
  color: #ef5350;
}

.action-btn.delete:hover {
  background: rgba(244,67,54,0.15);
}

.card-content-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 4px 8px;
  resize: none;
  font-size: 11px;
  color: var(--text);
  line-height: 1.4;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-y: auto;
  max-height: 36px;
}

.card-content-input::-webkit-scrollbar {
  width: 3px;
}

.card-content-input::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 2px;
}

.card-content-input::placeholder {
  color: var(--text-muted);
}

.card-content-input:focus {
  background: var(--accent-light);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--text-light);
}

.empty-hint {
  font-size: 12px;
  color: var(--text-muted);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--accent-light);
  border-top: 1px solid var(--card-border);
  flex-shrink: 0;
}

.note-count {
  font-size: 11px;
  color: var(--accent);
  font-weight: 500;
}

.shortcut-tip {
  font-size: 10px;
  color: var(--text-muted);
}

.note-container {
  width: 100%;
  height: 100vh;
}
</style>

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {

  // 拖动功能
  startDrag: () => {
    ipcRenderer.send('drag:start');
  },

  moveDrag: () => {
    ipcRenderer.send('drag:move');
  },

  endDrag: () => {
    return ipcRenderer.invoke('drag:end');
  },

  // 鼠标穿透
  setIgnoreMouseEvents: (ignore) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  },

  parseTaskText: (text) => {
    return ipcRenderer.invoke('task:parse-text', text);
  },

  // -------------------------
  // Task database API
  // -------------------------

  addTask: (task) => {
    return ipcRenderer.invoke('task:add', task);
  },

  getTasks: () => {
    return ipcRenderer.invoke('task:get-all');
  },

  openTasksWindow: () => {
    return ipcRenderer.invoke('task:open-window');
  },

  updateTask: (task) => {
    return ipcRenderer.invoke('task:update', task);
  },

  completeTask: (id) => {
    return ipcRenderer.invoke('task:complete', id);
  },

  deleteTask: (id) => {
    return ipcRenderer.invoke('task:delete', id);
  }

});
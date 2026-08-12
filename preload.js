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
  },

  // -------------------------
  // Reminder database API
  // -------------------------

  addReminder: (reminder) => {
    return ipcRenderer.invoke('reminder:add', reminder);
  },

  getPendingReminders: () => {
    return ipcRenderer.invoke('reminder:get-pending');
  },

  getReminderForTask: (taskId) => {
    return ipcRenderer.invoke(
      'reminder:get-for-task',
      taskId
    );
  },

  updateReminder: (reminder) => {
    return ipcRenderer.invoke(
      'reminder:update',
      reminder
    );
  },

  deleteReminder: (id) => {
    return ipcRenderer.invoke(
      'reminder:delete',
      id
    );
  },

  markReminderFired: (id) => {
    return ipcRenderer.invoke('reminder:mark-fired', id);
  },

  snoozeReminder: (reminder) => {
    return ipcRenderer.invoke(
      'reminder:snooze',
      reminder
    );
  },

  // Main process → pet reminder
  onReminderDue: (callback) => {

    ipcRenderer.on(
      'reminder:due',
      (_event, reminder) => {

        callback(reminder);
      }
    );
  }

  });
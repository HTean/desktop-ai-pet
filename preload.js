const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {

  startDrag: () => {
    ipcRenderer.send('drag:start');
  },

  moveDrag: () => {
    ipcRenderer.send('drag:move');
  },

  endDrag: () => {
    return ipcRenderer.invoke('drag:end');
  },

  setIgnoreMouseEvents: (ignore) => {
  ipcRenderer.send('set-ignore-mouse-events', ignore);
}

});
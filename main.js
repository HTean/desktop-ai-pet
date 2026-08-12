// Electron import
const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu
} = require('electron');

// Database imports
const {
  initDatabase,

  addTask,
  getTasks,
  updateTask,
  completeTask,
  deleteTask,

  addReminder,
  getPendingReminders,
  getReminderForTask,
  updateReminder,
  deleteReminder,
  markReminderFired,
  snoozeReminder
} = require('./database');

const { parseTaskText } = require('./taskParser');
const path = require('path');

const appIcon = path.join(
    __dirname,
    'assets',
    'app',
    'icon.png'
  );

let win;

// Separate task management window
let taskWindow = null;

// -------------------------
// System tray
// -------------------------

let tray = null;

let reminderCheckTimer = null;
const activeReminderIds = new Set();
let dragOffset = null;
let dragStartMouse = null;
let lastMouse = null;
let didMove = false;

function createWindow() {
  win = new BrowserWindow({
    width: 300,
    height: 330,

    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,

    icon: appIcon,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.center();
}

// =====================================================
// Create Tasks window
// =====================================================

function createTaskWindow() {

  // If it already exists, just bring it back
  if (taskWindow) {

    taskWindow.show();
    taskWindow.focus();

    return;
  }


  taskWindow = new BrowserWindow({
    width: 550,
    height: 650,

    title: 'Desktop AI Pet - Tasks',
    icon: appIcon,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });


  taskWindow.loadFile('tasks.html');


  // Allow it to be created again after closing
  taskWindow.on('closed', () => {
    taskWindow = null;
  });
}

// -------------------------
// 创建 Windows 系统托盘
// -------------------------

function createTray() {

  // 目前先使用桌宠 idle 图片作为托盘图标
  const trayIcon = path.join(
    __dirname,
    'assets',
    'pet',
    'idle.png'
  );

  tray = new Tray(trayIcon);


  // 右键菜单
  const contextMenu = Menu.buildFromTemplate([

    {
      label: 'Tasks',

      click: () => {
        createTaskWindow();
      }
    },

    {
      label: 'Show Pet',

      click: () => {
        win.show();
      }
    },

    {
      label: 'Hide Pet',

      click: () => {
        win.hide();
      }
    },

    {
      type: 'separator'
    },

    {
      label: 'Quit',

      click: () => {
        app.quit();
      }
    }

  ]);


  // 鼠标放到托盘图标上显示的文字
  tray.setToolTip('AI Desktop Pet');


  // 设置右键菜单
  tray.setContextMenu(contextMenu);


  // 左键点击托盘图标：显示宠物
  tray.on('click', () => {
    win.show();
  });
}

// Mouse go through
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  if (ignore) {
    win.setIgnoreMouseEvents(true, { forward: true });
  } else {
    win.setIgnoreMouseEvents(false);
  }
});

// 开始拖动
ipcMain.on('drag:start', () => {

  const mouse = screen.getCursorScreenPoint();
  const [windowX, windowY] = win.getPosition();

  dragStartMouse = mouse;
  lastMouse = mouse;

  dragOffset = {
    x: mouse.x - windowX,
    y: mouse.y - windowY
  };

  didMove = false;
});


// 拖动
ipcMain.on('drag:move', () => {

  if (!dragOffset) return;

  const mouse = screen.getCursorScreenPoint();

  // 鼠标实际上没动 → 什么都不做
  if (
    mouse.x === lastMouse.x &&
    mouse.y === lastMouse.y
  ) {
    return;
  }

  // 判断是否真的发生拖动
  const dx = mouse.x - dragStartMouse.x;
  const dy = mouse.y - dragStartMouse.y;

  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    didMove = true;
  }

  const newX = mouse.x - dragOffset.x;
  const newY = mouse.y - dragOffset.y;

  const [currentX, currentY] = win.getPosition();

  // 目标位置真的变化才移动窗口
  if (newX !== currentX || newY !== currentY) {
    win.setPosition(newX, newY);
  }

  lastMouse = mouse;
});


// 松开
ipcMain.handle('drag:end', () => {

  const result = didMove;

  dragOffset = null;
  dragStartMouse = null;
  lastMouse = null;
  didMove = false;

  return result;
});

// =====================================================
// Open Tasks window from pet chat
// =====================================================

ipcMain.handle('task:open-window', () => {
  createTaskWindow();
});

// =====================================================
// Parse natural-language task
// =====================================================

ipcMain.handle('task:parse-text', (event, text) => {
  return parseTaskText(text);
});

// =====================================================
// Task database IPC
// =====================================================

// Add task
ipcMain.handle('task:add', (event, task) => {
  return addTask(
    task.title,
    task.description,
    task.dueAt,
    task.priority,
    task.recurrence || 'none'
  );
});


// Get all tasks
ipcMain.handle('task:get-all', () => {
  return getTasks();
});

// Update task
ipcMain.handle('task:update', (event, task) => {

  return updateTask(
    task.id,
    task.title,
    task.description,
    task.dueAt,
    task.priority,
    task.recurrence || 'none'
  );
});

// Complete task
ipcMain.handle('task:complete', (event, id) => {
  return completeTask(id);
});


// Delete task
ipcMain.handle('task:delete', (event, id) => {
  return deleteTask(id);
});

// =====================================================
// Reminder database IPC
// =====================================================

// Add reminder
ipcMain.handle('reminder:add', (event, reminder) => {

  return addReminder(
    reminder.taskId,
    reminder.remindAt
  );
});


// Get pending reminders
ipcMain.handle('reminder:get-pending', () => {
  return getPendingReminders();
});

// Get reminder for one task
ipcMain.handle('reminder:get-for-task', (event, taskId) => {

  return getReminderForTask(taskId);
});


// Update reminder
ipcMain.handle('reminder:update', (event, reminder) => {

  return updateReminder(
    reminder.id,
    reminder.remindAt
  );
});


// Delete reminder
ipcMain.handle('reminder:delete', (event, id) => {

  return deleteReminder(id);
});

// Mark reminder fired
ipcMain.handle('reminder:mark-fired', (event, id) => {

  const result =
    markReminderFired(id);

  if (result) {
    activeReminderIds.delete(
      Number(id)
    );
  }

  return result;
});


// Snooze reminder
ipcMain.handle('reminder:snooze', (event, reminder) => {

  const result =
    snoozeReminder(
      reminder.id,
      reminder.remindAt
    );

  if (result) {
    activeReminderIds.delete(
      Number(reminder.id)
    );
  }

  return result;
});

// =====================================================
// Reminder checker
// =====================================================

function checkDueReminders() {

  // Pet window is not ready yet
  if (
    !win ||
    win.isDestroyed() ||
    win.webContents.isLoading()
  ) {
    return;
  }


  const reminders =
    getPendingReminders();

  const now =
    new Date();


  reminders.forEach((reminder) => {

    const reminderId =
      Number(reminder.id);

    const remindAt =
      new Date(reminder.remind_at);


    // Invalid date
    if (
      Number.isNaN(remindAt.getTime())
    ) {
      return;
    }


    // Not due yet
    if (remindAt > now) {
      return;
    }


    // Already shown and waiting for user action
    if (
      activeReminderIds.has(
        reminderId
      )
    ) {
      return;
    }


    activeReminderIds.add(
      reminderId
    );


    try {

      // If pet was hidden, bring it back
      // without stealing keyboard focus
      if (!win.isVisible()) {
        win.showInactive();
      }


      // Send reminder to pet renderer
      win.webContents.send(
        'reminder:due',
        {
          id: reminderId,

          task_id:
            Number(reminder.task_id),

          task_title:
            reminder.task_title,

          task_description:
            reminder.task_description || '',

          remind_at:
            reminder.remind_at
        }
      );

    } catch (error) {

      activeReminderIds.delete(
        reminderId
      );

      console.error(
        'Failed to show pet reminder:',
        error
      );
    }
  });
}

// =====================================================
// Start reminder checker
// =====================================================

function startReminderChecker() {

  // Check immediately
  checkDueReminders();


  // Then check every 10 seconds
  reminderCheckTimer =
    setInterval(
      checkDueReminders,
      10 * 1000
    );
}

app.whenReady().then(() => {

  // Initialize local SQLite database
  initDatabase(app.getPath('userData'));

  // 创建桌宠窗口
  createWindow();

  // 创建系统托盘
  createTray();
  // Start reminder checker
  startReminderChecker();


  // -------------------------
  // Windows 开机自动启动
  // -------------------------

  app.setLoginItemSettings({
    openAtLogin: true
  });

});

app.on('window-all-closed', () => {
  app.quit();
});
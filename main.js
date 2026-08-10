const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu
} = require('electron');
const path = require('path');

let win;

// -------------------------
// System tray
// -------------------------

let tray = null;

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

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
  win.center();
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

app.whenReady().then(() => {

  // 创建桌宠窗口
  createWindow();

  // 创建系统托盘
  createTray();


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
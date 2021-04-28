const {app, BrowserWindow, ipcMain} = require('electron');

const path = require('path');

function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        show: false
    });

    const htmlPath = path.join('file://', __dirname, 'html/mainWindow.html');
    window.maximize();
    window.loadURL(htmlPath);

}

app.whenReady()
   .then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    }
);

ipcMain.handle('get-directory-path', (event, fileName) => {
    return app.getPath('userData');
});

ipcMain.handle('show-dialog', (event, options) => {
    const {dialog} = require('electron');

    dialog.showMessageBox(options)
          .then();
});

ipcMain.handle('firebase-auth', () => {
    return require('firebase')
        .auth();
});

//TODO remove this, its for hot reloading
try {
    require('electron-reloader')(module)
} catch (_) {

}


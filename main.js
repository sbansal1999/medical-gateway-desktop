const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const isMac = process.platform === "darwin";

const path = require('path');

function createWindow() {
    const window = new BrowserWindow({
        // width: 1440,
        // height: 900,
        webPreferences: {
            nodeIntegration: true
        },
        show: false,
        resizable: false
    });
    window.maximize();

    // //Creating Custom Menu
    // const template = Menu.buildFromTemplate([{
    //     label: 'Manage',
    //     submenu: [
    //         {label: 'Logout'},
    //         {label: 'Exit'},
    //     ]
    // }])
    //
    // Menu.setApplicationMenu(template);

    const htmlPath = path.join('file://', __dirname, 'html/mainWindow.html');


    window.loadURL(htmlPath);
    window.show();

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


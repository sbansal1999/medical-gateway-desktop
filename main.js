const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const isMac = process.platform === "darwin";

const path = require('path');
const fs = require('fs');

function createWindow() {
    const window = new BrowserWindow({
        width: 1440,
        height: 900,
        webPreferences: {
            nodeIntegration: true
        },
        show: false,
        resizable: false
    });

    // //Creating Custom Menu
    // const template = Menu.buildFromTemplate([{
    //     label: 'Manage',
    //     submenu: [
    //         {
    //             label: 'Logout', id: 'logout', click() {
    //
    //                 const dir = path.resolve();
    //                 const filePath = path.join(dir + '/assets/login');
    //
    //                 fs.unlink(filePath, (err) => {
    //                     if (err) {
    //                         console.log(err);
    //                     }
    //                     const htmlPath = path.join('file://', __dirname, 'html/mainWindow.html');
    //
    //                     window.loadURL(htmlPath)
    //                         .then();
    //                     window.show();
    //                 });
    //             }
    //         },
    //         {
    //             label: 'Exit', click() {
    //                 app.quit();
    //             }
    //         },
    //     ]
    // }]);
    //
    // Menu.setApplicationMenu(template);

    const htmlPath = path.join('file://', __dirname, 'html/mainWindow.html');

    window.loadURL(htmlPath)
        .then();
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

ipcMain.handle('show-dialog', async (event, options) => {
    const {dialog} = require('electron');
    let result;

    await dialog.showMessageBox(options)
        .then((r) => {
            result = r.response;
        });
    return result;
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


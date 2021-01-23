const {app, BrowserWindow} = require('electron');
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
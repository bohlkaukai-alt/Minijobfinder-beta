const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 400,
        minHeight: 500,
        title: 'MiniJob Finder',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        checkForUpdates();
    });

    mainWindow.setMenu(null);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function checkForUpdates() {
    autoUpdater.checkForUpdates().catch(() => {});

    autoUpdater.on('update-available', (info) => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update verfügbar',
            message: `Eine neue Version (v${info.version}) ist verfügbar.`,
            detail: 'Möchtest du sie jetzt herunterladen und installieren?',
            buttons: ['Jetzt aktualisieren', 'Später'],
            defaultId: 0,
            cancelId: 1
        }).then(({ response }) => {
            if (response === 0) {
                autoUpdater.downloadUpdate();
                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Update wird heruntergeladen...',
                    message: 'Das Update wird im Hintergrund heruntergeladen. Die App startet danach neu.',
                    buttons: ['OK']
                });
            }
        });
    });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update bereit',
            message: 'Das Update wurde heruntergeladen.',
            detail: 'Die App wird jetzt neu gestartet und installiert das Update.',
            buttons: ['Neu starten', 'Später']
        }).then(({ response }) => {
            if (response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on('error', () => {});
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

const { app, BrowserWindow, screen, globalShortcut, clipboard, ipcMain, Menu, Tray } = require('electron');
require('electron-reload')(__dirname);
const fs = require('fs');
const homedir = require('os').homedir();

const notesFile = homedir + '/.quicli-notes';

const clipboardListener = require('clipboard-event');
clipboardListener.startListening();

const createWindow = () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    winHeight = height / 5;

    window = new BrowserWindow({
        x: 0,
        y: height - winHeight,
        width: width,
        height: winHeight,
        webPreferences: {
            nodeIntegration: true
        },
        frame: false,
        alwaysOnTop: true,
    });

    window.loadFile('public/index.html');
    window.on('show', () => {
        globalShortcut.register('Esc', () => window.hide());
    });
    window.on('hide', () => {
        globalShortcut.unregister('Esc');
    });
    window.once('show', () => {
        loadNotes(notes => {
            ipcMain.once('ready-to-receive-saved-notes', () => {
                window.webContents.send('saved-notes-loaded', notes)
            });
        });
    });

    globalShortcut.register('Alt+z', () => {
        window.show();
    });

    clipboardListener.on('change', () => {
        window.webContents.send('clipboard-changed', clipboard.readText());
    });

    createSystemTray(() => window.show());

    window.show();
};

let window = null;

app.whenReady().then(createWindow);

app.on('window-all-closed', exit);

ipcMain.on('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
    window.hide();
});

ipcMain.on('save-notes', (event, notes) => {
    fs.writeFile(notesFile, JSON.stringify(notes), err => {
        if (err) {
            console.log(err);
        }
    });
});

function exit() {
    clipboardListener.stopListening();
    globalShortcut.unregisterAll();
    app.quit();
}

function createSystemTray(onShow) {
    tray = new Tray('public/favicon.png');
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Show', click: onShow },
        { label: '-', type: 'separator' },
        {
            label: 'Quit', click: () => {
                tray.destroy();
                exit();
            }
        }
    ]));
}

function loadNotes(callback) {
    fs.readFile(notesFile, function (err, data) {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log(`WARN: notes file not found at ${err.path}`)
            } else {
                console.log('loadNotes error:', err);
            }
            return;
        }
        const notes = JSON.parse(data.toString() || '[]');
        callback(notes);
    });
}
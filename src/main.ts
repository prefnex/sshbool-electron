import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { Client } from 'ssh2';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow;

// SSH connection management
interface SSHConnection {
  id: string;
  client: Client;
  shell: any;
  isConnected: boolean;
  lastActivity: Date;
}

const sshConnections: Map<string, SSHConnection> = new Map();

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    show: false,
    frame: false, // Remove window frame for custom title bar
    backgroundColor: '#1a1a1a', // Dark background to prevent white flash
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window maximize/unmaximize events
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximize-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximize-changed', false);
  });

  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

// IPC Handlers for window controls
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-unmaximize', () => {
  if (mainWindow) {
    mainWindow.unmaximize();
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// SSH IPC Handlers
ipcMain.handle('ssh-connect', async (event, connectionConfig) => {
  return new Promise((resolve, reject) => {
    const client = new Client();
    const connectionId = connectionConfig.id;

    client.on('ready', () => {
      const sshConnection: SSHConnection = {
        id: connectionId,
        client,
        shell: null,
        isConnected: true,
        lastActivity: new Date()
      };

      sshConnections.set(connectionId, sshConnection);

      // Send welcome message
      mainWindow.webContents.send('ssh-output', {
        connectionId,
        data: `✅ Connected to ${connectionConfig.host} as ${connectionConfig.username}\r\n`,
        type: 'info',
        timestamp: new Date()
      });

      resolve(true);
    });

    client.on('error', (err) => {
      mainWindow.webContents.send('ssh-output', {
        connectionId,
        data: `❌ Connection failed: ${err.message}\r\n`,
        type: 'error',
        timestamp: new Date()
      });
      reject(err);
    });

    client.on('close', () => {
      sshConnections.delete(connectionId);
      mainWindow.webContents.send('ssh-output', {
        connectionId,
        data: `🔌 Connection to ${connectionConfig.host} closed\r\n`,
        type: 'info',
        timestamp: new Date()
      });
    });

    // Connect with proper configuration
    const connectConfig: any = {
      host: connectionConfig.host,
      port: connectionConfig.port,
      username: connectionConfig.username,
      readyTimeout: 30000,
      keepaliveInterval: 30000,
    };

    if (connectionConfig.connectionType === 'password' && connectionConfig.password) {
      connectConfig.password = connectionConfig.password;
    } else if (connectionConfig.connectionType === 'privateKey' && connectionConfig.privateKey) {
      connectConfig.privateKey = connectionConfig.privateKey;
    } else {
      reject(new Error('No authentication method provided'));
      return;
    }

    client.connect(connectConfig);
  });
});

ipcMain.handle('ssh-start-shell', async (event, connectionId) => {
  const connection = sshConnections.get(connectionId);
  if (!connection || !connection.isConnected) return false;

  return new Promise((resolve, reject) => {
    connection.client.shell((err, shell) => {
      if (err) {
        reject(err);
        return;
      }

      connection.shell = shell;
      sshConnections.set(connectionId, connection);

      // Send welcome message after a short delay to ensure terminal is ready
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.webContents.send('ssh-output', {
            connectionId,
            data: '\r\n',
            type: 'info',
            timestamp: new Date()
          });
        }
      }, 100);

      // Handle shell output
      let outputBuffer = '';
      let bufferTimeout: NodeJS.Timeout | null = null;
      
      const sendBufferedOutput = () => {
        if (outputBuffer && mainWindow) {
          mainWindow.webContents.send('ssh-output', {
            connectionId,
            data: outputBuffer,
            type: 'stdout',
            timestamp: new Date()
          });
          outputBuffer = '';
        }
      };
      
      shell.on('data', (data: Buffer) => {
        outputBuffer += data.toString();
        
        // Clear existing timeout
        if (bufferTimeout) {
          clearTimeout(bufferTimeout);
        }
        
        // Set new timeout to send buffered data
        bufferTimeout = setTimeout(() => {
          sendBufferedOutput();
          bufferTimeout = null;
        }, 10); // Send after 10ms of no new data
      });

      shell.stderr.on('data', (data: Buffer) => {
        mainWindow.webContents.send('ssh-output', {
          connectionId,
          data: data.toString(),
          type: 'stderr',
          timestamp: new Date()
        });
      });

      shell.on('close', () => {
        mainWindow.webContents.send('ssh-output', {
          connectionId,
          data: '\r\n💀 Shell session ended\r\n',
          type: 'info',
          timestamp: new Date()
        });
      });

      resolve(true);
    });
  });
});

ipcMain.handle('ssh-send-input', async (event, connectionId, input) => {
  const connection = sshConnections.get(connectionId);
  if (!connection || !connection.isConnected || !connection.shell) return;

  try {
    // Send input directly to shell without any buffering
    connection.shell.write(input);
    
    // Update last activity
    connection.lastActivity = new Date();
    sshConnections.set(connectionId, connection);
  } catch (error) {
    console.error('Failed to send input:', error);
    mainWindow.webContents.send('ssh-output', {
      connectionId,
      data: `❌ Failed to send command: ${error.message}\r\n`,
      type: 'error',
      timestamp: new Date()
    });
  }
});

ipcMain.handle('ssh-disconnect', async (event, connectionId) => {
  const connection = sshConnections.get(connectionId);
  if (!connection) return;

  try {
    if (connection.shell) {
      connection.shell.end();
    }
    connection.client.end();
    sshConnections.delete(connectionId);
  } catch (error) {
    console.error('Failed to disconnect:', error);
  }
});

ipcMain.handle('ssh-start-sftp', async (event, connectionId) => {
  const connection = sshConnections.get(connectionId);
  if (!connection || !connection.isConnected) return null;

  return new Promise((resolve, reject) => {
    connection.client.sftp((err, sftp) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(true);
    });
  });
});

ipcMain.handle('ssh-upload-file', async (event, connectionId, localPath, remotePath) => {
  const connection = sshConnections.get(connectionId);
  if (!connection || !connection.isConnected) return false;

  return new Promise((resolve, reject) => {
    connection.client.sftp((err, sftp) => {
      if (err) {
        reject(err);
        return;
      }

      sftp.fastPut(localPath, remotePath, (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  });
});

ipcMain.handle('ssh-download-file', async (event, connectionId, remotePath, localPath) => {
  const connection = sshConnections.get(connectionId);
  if (!connection || !connection.isConnected) return false;

  return new Promise((resolve, reject) => {
    connection.client.sftp((err, sftp) => {
      if (err) {
        reject(err);
        return;
      }

      sftp.fastGet(remotePath, localPath, (err: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  });
});

ipcMain.handle('ssh-list-directory', async (event, connectionId, remotePath) => {
  const connection = sshConnections.get(connectionId);
  if (!connection || !connection.isConnected) return [];

  return new Promise((resolve, reject) => {
    connection.client.sftp((err, sftp) => {
      if (err) {
        reject(err);
        return;
      }

      sftp.readdir(remotePath, (err: any, list: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(list || []);
      });
    });
  });
});

ipcMain.handle('ssh-is-connected', async (event, connectionId) => {
  const connection = sshConnections.get(connectionId);
  return connection ? connection.isConnected : false;
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

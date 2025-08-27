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
  keepAliveInterval?: NodeJS.Timeout | null;
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

// Add connection status check handler
ipcMain.handle('ssh-is-connected', async (event, connectionId) => {
  const connection = sshConnections.get(connectionId);
  return connection ? connection.isConnected : false;
});

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

  // Connection health monitoring with improved keep-alive
  const connectionHealthCheck = setInterval(() => {
    for (const [connectionId, connection] of sshConnections.entries()) {
      if (connection.isConnected) {
        const timeSinceLastActivity = Date.now() - connection.lastActivity.getTime();

        // More frequent keep-alive to prevent disconnection
        if (timeSinceLastActivity > 30000) { // Reduced from 60 to 30 seconds
          try {
            if (connection.shell) {
              // Send a subtle keep-alive that doesn't interrupt the session
              connection.shell.write(''); // Empty string instead of null byte
              connection.lastActivity = new Date();
            }
          } catch (error) {
            console.error(`Keep-alive failed for connection ${connectionId}:`, error);
            // Don't immediately mark as disconnected, retry first
            if (connection.shell) {
              try {
                // Try to restore shell if connection is still alive
                connection.client.shell((err, shell) => {
                  if (!err && shell) {
                    connection.shell = shell;
                    connection.lastActivity = new Date();
                    sshConnections.set(connectionId, connection);
                  }
                });
              } catch (restoreError) {
                connection.isConnected = false;
                mainWindow.webContents.send('ssh-output', {
                  connectionId,
                  data: `⚠️  Connection lost. Session will be restored automatically...\r\n`,
                  type: 'info',
                  timestamp: new Date()
                });
              }
            }
          }
        }
      }
    }
  }, 10000); // Check every 10 seconds for better responsiveness

// SSH IPC Handlers
ipcMain.handle('ssh-connect', async (event, connectionConfig) => {
  return new Promise((resolve, reject) => {
    const client = new Client();
    const connectionId = connectionConfig.id;
    let connectionAttempts = 0;
    const maxRetries = 3;

    const attemptConnection = () => {
      connectionAttempts++;

      client.on('ready', () => {
        const sshConnection: SSHConnection = {
          id: connectionId,
          client,
          shell: null,
          isConnected: true,
          lastActivity: new Date(),
          keepAliveInterval: null
        };

        sshConnections.set(connectionId, sshConnection);

        // Set up keep-alive mechanism
        const keepAlive = setInterval(() => {
          const conn = sshConnections.get(connectionId);
          if (conn && conn.isConnected) {
            // Send a keep-alive signal
            conn.lastActivity = new Date();
            sshConnections.set(connectionId, conn);
          } else {
            clearInterval(keepAlive);
          }
        }, 20000); // Every 20 seconds

        sshConnection.keepAliveInterval = keepAlive;

        // Send welcome message
        mainWindow.webContents.send('ssh-output', {
          data: `✅ Connected to ...`,
          type: 'info'
        })
        resolve(true)
      });

      client.on('error', (err) => {
        mainWindow.webContents.send('ssh-output', {
          connectionId,
          data: `❌ Connection failed: ${err.message}\r\n`,
          type: 'error',
          timestamp: new Date()
        });

        // Retry connection if it's a recoverable error
        if (connectionAttempts < maxRetries && (err.message.includes('ECONNREFUSED') || err.message.includes('timeout'))) {
          mainWindow.webContents.send('ssh-output', {
            connectionId,
            data: `🔄 Retrying connection (${connectionAttempts}/${maxRetries})...\r\n`,
            type: 'info',
            timestamp: new Date()
          });
          setTimeout(attemptConnection, 2000);
        } else {
          reject(err);
        }
      });

      client.on('close', (hadError) => {
        const connection = sshConnections.get(connectionId);
        if (connection) {
          connection.isConnected = false;
          connection.shell = null;
          // Clear keep-alive interval if exists
          if (connection.keepAliveInterval) {
            clearInterval(connection.keepAliveInterval);
          }
          sshConnections.set(connectionId, connection);
        }

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ssh-output', {
            connectionId,
            data: `🔌 Connection to ${connectionConfig.host} closed${hadError ? ' due to error' : ''}\r\n`,
            type: 'info',
            timestamp: new Date()
          });
        }
      });

      // Handle timeout
      client.on('timeout', () => {
        console.log('SSH connection timeout');
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ssh-output', {
            connectionId,
            data: '\r\n⚠️ Connection timeout - attempting to reconnect...\r\n',
            type: 'info',
            timestamp: new Date()
          });
        }
      });

      // Connect with improved configuration
      const connectConfig: any = {
        host: connectionConfig.host,
        port: connectionConfig.port,
        username: connectionConfig.username,
        readyTimeout: 60000, // Increased timeout
        keepaliveInterval: 5000, // More frequent keep-alive to prevent disconnection
        keepaliveCountMax: 10, // More retries before giving up
        algorithms: {
          // Add more robust algorithms for better compatibility
          kex: ['ecdh-sha2-nistp256', 'ecdh-sha2-nistp384', 'ecdh-sha2-nistp521', 'diffie-hellman-group14-sha256'],
          cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr', 'aes128-gcm', 'aes256-gcm'],
          serverHostKey: ['rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa', 'ecdsa-sha2-nistp256', 'ssh-ed25519'],
          hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1']
        }
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
    };

    attemptConnection();
  });
});

ipcMain.handle('ssh-start-shell', async (event, connectionId) => {
  const connection = sshConnections.get(connectionId)
  if (!connection || !connection.isConnected) return false

  // ✅ إذا كان لديه shell موجود ونشط، لا تعيد إنشاءه
  if (connection.shell && !connection.shell.destroyed) {
    connection.lastActivity = new Date()
    sshConnections.set(connectionId, connection)
    return true
  }

  // ✅ أغلق أي shell قديم فقط إذا كان موجود ومدمر
  if (connection.shell) {
    try { 
      if (!connection.shell.destroyed) {
        connection.shell.end() 
      }
    } catch {}
    connection.shell = null
  }

  return new Promise((resolve, reject) => {
    connection.client.shell((err, shell) => {
      if (err) {
        reject(err)
        return
      }

      connection.shell = shell
      sshConnections.set(connectionId, connection)

      // إرسال رسالة ترحيب فقط عند إنشاء shell جديد
      const isFirstTime = !connection.lastActivity || 
        (Date.now() - connection.lastActivity.getTime()) > 300000 // 5 minutes

      if (isFirstTime) {
        mainWindow.webContents.send('ssh-output', {
          connectionId,
          data: '🚀 Interactive shell started. Ready for commands...\r\n',
          type: 'info',
          timestamp: new Date()
        })
      }

      shell.on('data', (data: Buffer) => {
        connection.lastActivity = new Date()
        const outputData = data.toString()
        
        // تجنب إرسال البيانات المكررة أو المطالبات الزائدة
        if (!outputData.includes('ubuntu@ubutnu:~$ ubuntu@ubutnu:~$')) {
          mainWindow.webContents.send('ssh-output', {
            connectionId,
            data: outputData,
            type: 'stdout',
            timestamp: new Date()
          })
        }
      })

      shell.stderr.on('data', (data: Buffer) => {
        mainWindow.webContents.send('ssh-output', {
          connectionId,
          data: data.toString(),
          type: 'stderr',
          timestamp: new Date()
        })
      })

      shell.on('close', () => {
        // فقط أرسل رسالة الإغلاق إذا كان الإغلاق غير متوقع
        if (connection.isConnected) {
          mainWindow.webContents.send('ssh-output', {
            connectionId,
            data: '\r\n💀 Shell session ended unexpectedly. Reconnecting...\r\n',
            type: 'info',
            timestamp: new Date()
          })
          
          // محاولة إعادة إنشاء الـ shell تلقائياً
          setTimeout(() => {
            if (connection.isConnected) {
              connection.client.shell((err, newShell) => {
                if (!err && newShell) {
                  connection.shell = newShell
                  sshConnections.set(connectionId, connection)
                }
              })
            }
          }, 1000)
        }
      })

      resolve(true)
    })
  })
});

ipcMain.handle('ssh-send-input', async (event, connectionId, input) => {
  const connection = sshConnections.get(connectionId);
  if (!connection || !connection.isConnected || !connection.shell) return;

  try {
    // Send input as-is without modification
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

// ipcMain.handle('ssh-is-connected', async (event, connectionId) => {
//   const connection = sshConnections.get(connectionId);
//   return connection ? connection.isConnected : false;
// });

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

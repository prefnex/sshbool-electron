import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  unmaximize: () => ipcRenderer.invoke('window-unmaximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window-maximize-changed', (_, isMaximized) => callback(isMaximized))
  },
  
  // SSH functionality
  ssh: {
    connect: (connectionConfig: any) => ipcRenderer.invoke('ssh-connect', connectionConfig),
    startShell: (connectionId: string) => ipcRenderer.invoke('ssh-start-shell', connectionId),
    sendInput: (connectionId: string, input: string) => ipcRenderer.invoke('ssh-send-input', connectionId, input),
    disconnect: (connectionId: string) => ipcRenderer.invoke('ssh-disconnect', connectionId),
    startSFTP: (connectionId: string) => ipcRenderer.invoke('ssh-start-sftp', connectionId),
    uploadFile: (connectionId: string, localPath: string, remotePath: string) => 
      ipcRenderer.invoke('ssh-upload-file', connectionId, localPath, remotePath),
    downloadFile: (connectionId: string, remotePath: string, localPath: string) => 
      ipcRenderer.invoke('ssh-download-file', connectionId, remotePath, localPath),
    listDirectory: (connectionId: string, remotePath: string) => 
      ipcRenderer.invoke('ssh-list-directory', connectionId, remotePath),
    isConnected: (connectionId: string) => ipcRenderer.invoke('ssh-is-connected', connectionId),
    onOutput: (callback: (output: any) => void) => {
      ipcRenderer.on('ssh-output', (_, output) => callback(output))
    },
    removeOutputListener: (callback: (output: any) => void) => {
      ipcRenderer.removeListener('ssh-output', callback)
    }
  }
})

export interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
  
  ssh: {
    connect: (connectionConfig: any) => Promise<boolean>;
    startShell: (connectionId: string) => Promise<boolean>;
    sendInput: (connectionId: string, input: string) => Promise<void>;
    disconnect: (connectionId: string) => Promise<void>;
    startSFTP: (connectionId: string) => Promise<boolean>;
    uploadFile: (connectionId: string, localPath: string, remotePath: string) => Promise<boolean>;
    downloadFile: (connectionId: string, remotePath: string, localPath: string) => Promise<boolean>;
    listDirectory: (connectionId: string, remotePath: string) => Promise<any[]>;
    isConnected: (connectionId: string) => Promise<boolean>;
    onOutput: (callback: (output: any) => void) => void;
    removeOutputListener: (callback: (output: any) => void) => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
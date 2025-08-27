import { Connection } from '../store/terminal-store'

export interface SSHOutput {
  data: string
  type: 'stdout' | 'stderr' | 'info' | 'error'
  timestamp: Date
}

export interface SSHConnection {
  id: string
  connection: Connection
  isConnected: boolean
  lastActivity: Date
}

class SSHService {
  private connections: Map<string, SSHConnection> = new Map()
  private outputCallbacks: Map<string, (output: SSHOutput) => void> = new Map()
  private outputHandler: (output: any) => void

  constructor() {
    // Set up the output handler to route messages to the correct connection
    this.outputHandler = (output: any) => {
      const callback = this.outputCallbacks.get(output.connectionId)
      if (callback) {
        callback({
          data: output.data,
          type: output.type,
          timestamp: new Date(output.timestamp)
        })
      }
    }

    // Register the output handler if electron API is available
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.ssh.onOutput(this.outputHandler)
    }
  }

  async connect(connection: Connection, onOutput: (output: SSHOutput) => void): Promise<boolean> {
    try {
      // Store output callback
      this.outputCallbacks.set(connection.id, onOutput)

      // Connect using electron SSH API
      const success = await window.electron.ssh.connect({
        id: connection.id,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        connectionType: connection.connectionType,
        password: connection.password,
        privateKey: connection.privateKey
      })

      if (success) {
        const sshConnection: SSHConnection = {
          id: connection.id,
          connection,
          isConnected: true,
          lastActivity: new Date()
        }

        this.connections.set(connection.id, sshConnection)
      }

      return success
    } catch (error) {
      console.error('SSH connection failed:', error)
      return false
    }
  }

  async startShell(connectionId: string): Promise<boolean> {
    console.log("starting shell for connection:", connectionId)
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return false

    try {
      const success = await window.electron.ssh.startShell(connectionId)
      return success
    } catch (error) {
      console.error('Failed to start shell:', error)
      return false
    }
  }

  async sendInput(connectionId: string, input: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return

    try {
      await window.electron.ssh.sendInput(connectionId, input)
      
      // Update last activity
      connection.lastActivity = new Date()
      this.connections.set(connectionId, connection)
    } catch (error) {
      console.error('Failed to send input:', error)
      const onOutput = this.outputCallbacks.get(connectionId)
      if (onOutput) {
        onOutput({
          data: `❌ Failed to send command: ${error.message}\r\n`,
          type: 'error',
          timestamp: new Date()
        })
      }
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      await window.electron.ssh.disconnect(connectionId)
      this.connections.delete(connectionId)
      this.outputCallbacks.delete(connectionId)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  getConnection(connectionId: string): SSHConnection | undefined {
    return this.connections.get(connectionId)
  }

  getAllConnections(): SSHConnection[] {
    return Array.from(this.connections.values())
  }

  async isConnected(connectionId: string): Promise<boolean> {
    try {
      return await window.electron.ssh.isConnected(connectionId)
    } catch (error) {
      console.error('Failed to check connection status:', error)
      return false
    }
  }

  // File transfer methods for SFTP
  async startSFTP(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return false

    try {
      return await window.electron.ssh.startSFTP(connectionId)
    } catch (error) {
      console.error('Failed to start SFTP:', error)
      return false
    }
  }

  async uploadFile(connectionId: string, localPath: string, remotePath: string): Promise<boolean> {
    try {
      return await window.electron.ssh.uploadFile(connectionId, localPath, remotePath)
    } catch (error) {
      console.error('File upload failed:', error)
      return false
    }
  }

  async downloadFile(connectionId: string, remotePath: string, localPath: string): Promise<boolean> {
    try {
      return await window.electron.ssh.downloadFile(connectionId, remotePath, localPath)
    } catch (error) {
      console.error('File download failed:', error)
      return false
    }
  }

  async listDirectory(connectionId: string, remotePath: string): Promise<any[]> {
    try {
      return await window.electron.ssh.listDirectory(connectionId, remotePath)
    } catch (error) {
      console.error('Directory listing failed:', error)
      return []
    }
  }

  // Cleanup method to remove event listeners
  destroy(): void {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.ssh.removeOutputListener(this.outputHandler)
    }
  }
}

export const sshService = new SSHService()

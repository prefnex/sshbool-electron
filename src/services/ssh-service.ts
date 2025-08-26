import { Connection } from '../store/terminal-store'
import { Client } from 'ssh2'

export interface SSHOutput {
  data: string
  type: 'stdout' | 'stderr' | 'info' | 'error'
  timestamp: Date
}

export interface SSHConnection {
  id: string
  connection: Connection
  client: Client
  shell: any
  isConnected: boolean
  lastActivity: Date
}

class SSHService {
  private connections: Map<string, SSHConnection> = new Map()
  private outputCallbacks: Map<string, (output: SSHOutput) => void> = new Map()

  async connect(connection: Connection, onOutput: (output: SSHOutput) => void): Promise<boolean> {
    try {
      // Store output callback
      this.outputCallbacks.set(connection.id, onOutput)

      // Create SSH client
      const client = new Client()
      
      return new Promise((resolve, reject) => {
        client.on('ready', () => {
          const sshConnection: SSHConnection = {
            id: connection.id,
            connection,
            client,
            shell: null,
            isConnected: true,
            lastActivity: new Date()
          }

          this.connections.set(connection.id, sshConnection)

          // Send welcome message
          onOutput({
            data: `✅ Connected to ${connection.host} as ${connection.username}\r\n`,
            type: 'info',
            timestamp: new Date()
          })

          resolve(true)
        })

        client.on('error', (err) => {
          onOutput({
            data: `❌ Connection failed: ${err.message}\r\n`,
            type: 'error',
            timestamp: new Date()
          })
          reject(err)
        })

        client.on('close', () => {
          this.connections.delete(connection.id)
          onOutput({
            data: `🔌 Connection to ${connection.host} closed\r\n`,
            type: 'info',
            timestamp: new Date()
          })
        })

        // Connect with proper configuration
        const connectConfig: any = {
          host: connection.host,
          port: connection.port,
          username: connection.username,
          readyTimeout: 30000,
          keepaliveInterval: 30000,
        }

        if (connection.connectionType === 'password' && connection.password) {
          connectConfig.password = connection.password
        } else if (connection.connectionType === 'privateKey' && connection.privateKey) {
          connectConfig.privateKey = connection.privateKey
        } else {
          reject(new Error('No authentication method provided'))
          return
        }

        client.connect(connectConfig)
      })
    } catch (error) {
      console.error('SSH connection failed:', error)
      return false
    }
  }

  async startShell(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return false

    try {
      return new Promise((resolve, reject) => {
        connection.client.shell((err, shell) => {
          if (err) {
            reject(err)
            return
          }

          connection.shell = shell
          this.connections.set(connectionId, connection)

          const onOutput = this.outputCallbacks.get(connectionId)
          if (onOutput) {
            onOutput({
              data: '🚀 Interactive shell started. Ready for commands...\r\n',
              type: 'info',
              timestamp: new Date()
            })

            // Handle shell output
            shell.on('data', (data: Buffer) => {
              onOutput({
                data: data.toString(),
                type: 'stdout',
                timestamp: new Date()
              })
            })

            shell.stderr.on('data', (data: Buffer) => {
              onOutput({
                data: data.toString(),
                type: 'stderr',
                timestamp: new Date()
              })
            })

            shell.on('close', () => {
              onOutput({
                data: '\r\n💀 Shell session ended\r\n',
                type: 'info',
                timestamp: new Date()
              })
            })
          }

          resolve(true)
        })
      })
    } catch (error) {
      console.error('Failed to start shell:', error)
      return false
    }
  }

  async sendInput(connectionId: string, input: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected || !connection.shell) return

    try {
      // Add newline if not present
      const command = input.endsWith('\n') || input.endsWith('\r\n') ? input : input + '\r\n'
      connection.shell.write(command)
      
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
      if (connection.shell) {
        connection.shell.end()
      }
      connection.client.end()
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

  isConnected(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    return connection ? connection.isConnected : false
  }

  // File transfer methods for SFTP
  async startSFTP(connectionId: string): Promise<any> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return null

    return new Promise((resolve, reject) => {
      connection.client.sftp((err, sftp) => {
        if (err) {
          reject(err)
          return
        }
        resolve(sftp)
      })
    })
  }

  async uploadFile(connectionId: string, localPath: string, remotePath: string): Promise<boolean> {
    try {
      const sftp = await this.startSFTP(connectionId)
      if (!sftp) return false

      return new Promise((resolve, reject) => {
        sftp.fastPut(localPath, remotePath, (err: any) => {
          if (err) {
            reject(err)
            return
          }
          resolve(true)
        })
      })
    } catch (error) {
      console.error('File upload failed:', error)
      return false
    }
  }

  async downloadFile(connectionId: string, remotePath: string, localPath: string): Promise<boolean> {
    try {
      const sftp = await this.startSFTP(connectionId)
      if (!sftp) return false

      return new Promise((resolve, reject) => {
        sftp.fastGet(remotePath, localPath, (err: any) => {
          if (err) {
            reject(err)
            return
          }
          resolve(true)
        })
      })
    } catch (error) {
      console.error('File download failed:', error)
      return false
    }
  }

  async listDirectory(connectionId: string, remotePath: string): Promise<any[]> {
    try {
      const sftp = await this.startSFTP(connectionId)
      if (!sftp) return []

      return new Promise((resolve, reject) => {
        sftp.readdir(remotePath, (err: any, list: any[]) => {
          if (err) {
            reject(err)
            return
          }
          resolve(list || [])
        })
      })
    } catch (error) {
      console.error('Directory listing failed:', error)
      return []
    }
  }
}

export const sshService = new SSHService()

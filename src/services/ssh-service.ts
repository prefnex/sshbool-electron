import { Connection } from '../store/terminal-store'

export interface SSHOutput {
  data: string
  type: 'stdout' | 'stderr' | 'info'
  timestamp: Date
}

export interface SSHConnection {
  id: string
  connection: Connection
  client: any
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

      // Simulate SSH connection (in real implementation, this would use ssh2 library)
      await this.simulateConnection(connection)

      const sshConnection: SSHConnection = {
        id: connection.id,
        connection,
        client: {}, // Mock client
        shell: {}, // Mock shell
        isConnected: true,
        lastActivity: new Date()
      }

      this.connections.set(connection.id, sshConnection)

      // Send welcome message
      onOutput({
        data: `Connected to ${connection.host} as ${connection.username}`,
        type: 'info',
        timestamp: new Date()
      })

      return true
    } catch (error) {
      console.error('SSH connection failed:', error)
      return false
    }
  }

  private async simulateConnection(connection: Connection): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Simulate connection success/failure
    if (Math.random() < 0.1) { // 10% failure rate for demo
      throw new Error('Connection refused by server')
    }
  }

  async startShell(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    try {
      // Simulate shell startup
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const onOutput = this.outputCallbacks.get(connectionId)
      if (onOutput) {
        onOutput({
          data: 'Interactive shell started. Type your commands below.',
          type: 'info',
          timestamp: new Date()
        })
      }

      return true
    } catch (error) {
      console.error('Failed to start shell:', error)
      return false
    }
  }

  async sendInput(connectionId: string, input: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return

    try {
      // Simulate command execution
      const output = await this.simulateCommandExecution(input)
      
      const onOutput = this.outputCallbacks.get(connectionId)
      if (onOutput) {
        onOutput({
          data: output,
          type: 'stdout',
          timestamp: new Date()
        })
      }

      connection.lastActivity = new Date()
    } catch (error) {
      console.error('Failed to send input:', error)
    }
  }

  private async simulateCommandExecution(command: string): Promise<string> {
    // Simulate command execution with realistic output
    const cmd = command.trim().toLowerCase()
    
    if (cmd === 'ls' || cmd === 'ls -la') {
      return `total 32
drwxr-xr-x  5 user  staff   160 Dec 20 10:30 .
drwxr-xr-x  3 user  staff    96 Dec 20 10:30 ..
-rw-r--r--  1 user  staff   123 Dec 20 10:30 README.md
-rw-r--r--  1 user  staff  2048 Dec 20 10:30 config.json
drwxr-xr-x  2 user  staff    64 Dec 20 10:30 logs
drwxr-xr-x  2 user  staff    64 Dec 20 10:30 data
-rw-r--r--  1 user  staff   456 Dec 20 10:30 package.json`
    } else if (cmd === 'pwd') {
      return '/home/user/project'
    } else if (cmd === 'whoami') {
      return 'user'
    } else if (cmd === 'date') {
      return new Date().toLocaleString()
    } else if (cmd === 'ps aux') {
      return `  PID TTY           TIME CMD
  1234 ttys000    0:00.01 /bin/bash
  1235 ttys000    0:00.00 ps aux`
    } else if (cmd === 'df -h') {
      return `Filesystem      Size   Used  Avail Capacity  Mounted on
/dev/disk1s1   500Gi  200Gi  300Gi      40%    /
/dev/disk1s2   500Gi  100Gi  400Gi      20%    /Users`
    } else if (cmd === 'top') {
      return `Processes: 123 total, 2 running, 121 sleeping
CPU usage: 15.2% user, 8.1% sys, 76.7% idle
Load Avg: 1.23, 1.45, 1.67
MemRegions: 12345 total, 0 resident, 0 private, 0 shared
PhysMem: 16G used (5G wired), 0 unused
VM: 256G vsize, 0 framework, 0(0) swapins, 0(0) swapouts`
    } else if (cmd === 'netstat -an') {
      return `Active Internet connections (including servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
tcp        0      0 127.0.0.1:631           0.0.0.0:*               LISTEN
tcp        0      0 0.0.0.0:8080            0.0.0.0:*               LISTEN`
    } else if (cmd === 'docker ps') {
      return `CONTAINER ID   IMAGE     COMMAND   CREATED         STATUS         PORTS     NAMES
abc123def456   nginx     "nginx"    2 hours ago   Up 2 hours     0.0.0.0:80->80/tcp   web-server
def456ghi789   redis     "redis"    1 hour ago    Up 1 hour      6379/tcp            cache`
    } else if (cmd === 'git status') {
      return `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/components/TerminalTab.tsx

no changes added to commit (use "git add" and/or "git commit -a")`
    } else if (cmd === 'npm list') {
      return `project@1.0.0 /home/user/project
├── @radix-ui/react-dialog@1.1.2
├── @radix-ui/react-label@2.1.2
├── @radix-ui/react-slot@1.1.2
├── class-variance-authority@0.7.1
├── clsx@2.1.1
├── framer-motion@11.10.16
├── lucide-react@0.541.0
├── react@18.2.0
├── react-dom@18.2.0
├── tailwind-merge@3.3.1
└── zustand@5.0.8`
    } else if (cmd === 'help' || cmd === '--help') {
      return `Available commands:
  ls, pwd, whoami, date, ps, df, top, netstat
  docker, git, npm, help
  
For more information on a command, type 'man <command>'`
    } else if (cmd === 'clear' || cmd === 'cls') {
      return '' // Clear command returns empty output
    } else if (cmd === '') {
      return '' // Empty command returns nothing
    } else {
      // Simulate command not found
      return `bash: ${command.trim()}: command not found`
    }
  }

  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    try {
      // Cleanup connection
      connection.isConnected = false
      this.connections.delete(connectionId)
      this.outputCallbacks.delete(connectionId)

      console.log(`Disconnected from ${connection.connection.host}`)
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  async listConnections(): Promise<SSHConnection[]> {
    return Array.from(this.connections.values())
  }

  async getConnectionStatus(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    return connection?.isConnected || false
  }

  async executeCommand(connectionId: string, command: string): Promise<string> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) {
      throw new Error('Connection not available')
    }

    return await this.simulateCommandExecution(command)
  }

  async uploadFile(connectionId: string, localPath: string, remotePath: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return false

    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const onOutput = this.outputCallbacks.get(connectionId)
      if (onOutput) {
        onOutput({
          data: `File uploaded: ${localPath} -> ${remotePath}`,
          type: 'info',
          timestamp: new Date()
        })
      }

      return true
    } catch (error) {
      console.error('File upload failed:', error)
      return false
    }
  }

  async downloadFile(connectionId: string, remotePath: string, localPath: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return false

    try {
      // Simulate file download
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const onOutput = this.outputCallbacks.get(connectionId)
      if (onOutput) {
        onOutput({
          data: `File downloaded: ${remotePath} -> ${localPath}`,
          type: 'info',
          timestamp: new Date()
        })
      }

      return true
    } catch (error) {
      console.error('File download failed:', error)
      return false
    }
  }

  async getFileList(connectionId: string, path = '.'): Promise<string[]> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return []

    try {
      // Simulate file listing
      await new Promise(resolve => setTimeout(resolve, 200))
      
      return [
        'README.md',
        'config.json',
        'logs/',
        'data/',
        'package.json',
        'src/',
        'node_modules/',
        '.git/',
        '.env'
      ]
    } catch (error) {
      console.error('Failed to get file list:', error)
      return []
    }
  }

  async createDirectory(connectionId: string, path: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return false

    try {
      // Simulate directory creation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const onOutput = this.outputCallbacks.get(connectionId)
      if (onOutput) {
        onOutput({
          data: `Directory created: ${path}`,
          type: 'info',
          timestamp: new Date()
        })
      }

      return true
    } catch (error) {
      console.error('Failed to create directory:', error)
      return false
    }
  }

  async deleteFile(connectionId: string, path: string): Promise<boolean> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return false

    try {
      // Simulate file deletion
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const onOutput = this.outputCallbacks.get(connectionId)
      if (onOutput) {
        onOutput({
          data: `File deleted: ${path}`,
          type: 'info',
          timestamp: new Date()
        })
      }

      return true
    } catch (error) {
      console.error('Failed to delete file:', error)
      return false
    }
  }

  async getSystemInfo(connectionId: string): Promise<any> {
    const connection = this.connections.get(connectionId)
    if (!connection || !connection.isConnected) return null

    try {
      // Simulate system info
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        hostname: connection.connection.host,
        os: 'Linux Ubuntu 22.04.3 LTS',
        kernel: '5.15.0-88-generic',
        architecture: 'x86_64',
        cpu: 'Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz',
        memory: '32GB',
        uptime: '15 days, 8 hours, 23 minutes',
        loadAverage: [1.23, 1.45, 1.67],
        diskUsage: '45%',
        networkInterfaces: ['eth0', 'lo', 'docker0']
      }
    } catch (error) {
      console.error('Failed to get system info:', error)
      return null
    }
  }

  async pingHost(host: string): Promise<number> {
    try {
      // Simulate ping
      const latency = Math.random() * 50 + 10 // 10-60ms
      await new Promise(resolve => setTimeout(resolve, latency))
      return Math.round(latency)
    } catch (error) {
      console.error('Ping failed:', error)
      return -1
    }
  }

  async checkPort(host: string, port: number): Promise<boolean> {
    try {
      // Simulate port check
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Simulate some ports as open/closed
      const openPorts = [22, 80, 443, 8080, 3306, 5432]
      return openPorts.includes(port)
    } catch (error) {
      console.error('Port check failed:', error)
      return false
    }
  }

  // Cleanup method
  cleanup(): void {
    this.connections.clear()
    this.outputCallbacks.clear()
  }
}

export const sshService = new SSHService()

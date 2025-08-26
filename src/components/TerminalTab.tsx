import React, { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { SearchAddon } from '@xterm/addon-search'
import '@xterm/xterm/css/xterm.css'
import { motion } from 'framer-motion'
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  Upload,
  Download
} from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { sshService, SSHOutput } from '../services/ssh-service'
import { getThemeById, getDefaultTheme } from '../lib/terminal-themes'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import toast from 'react-hot-toast'

interface TerminalTabProps {
  terminalId: string
  isActive: boolean
  onClose: () => void
}

const TerminalTab: React.FC<TerminalTabProps> = ({ terminalId, isActive, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentCommand, setCurrentCommand] = useState('')
  
  const { terminals, connections, terminalTheme, updateTerminalActivity, setTerminalUnread } = useTerminalStore()
  
  const terminal = terminals.find(t => t.id === terminalId)
  const connection = terminal ? connections.find(c => c.id === terminal.connectionId) : null

  // Initialize terminal once on mount or when terminalId changes
  useEffect(() => {
    if (!terminalRef.current || !terminal || !connection) return

    // Get current theme
    const currentTheme = getThemeById(terminalTheme) || getDefaultTheme()

    // Initialize xterm.js
    const xterm = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 15,
      fontFamily: 'JetBrains Mono, Fira Code, Consolas, "Courier New", monospace',
      fontWeight: 500,
      theme: currentTheme.colors,
      allowTransparency: false,
      convertEol: true,
      scrollback: 5000,
      tabStopWidth: 4,
      rows: 30,
      cols: 100
    })

    // Add addons
    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    const searchAddon = new SearchAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    xterm.loadAddon(searchAddon)

    // Store references
    xtermRef.current = xterm
    fitAddonRef.current = fitAddon
    searchAddonRef.current = searchAddon

    // Open terminal
    xterm.open(terminalRef.current)
    fitAddon.fit()

    // Welcome message
    xterm.writeln('🚀 \x1b[1;34mFlyTerm - Modern SSH Terminal\x1b[0m')
    xterm.writeln(`📡 Connecting to \x1b[1;32m${connection.username}@${connection.host}:${connection.port}\x1b[0m`)
    xterm.writeln('')

    // Auto-copy on selection
    xterm.onSelectionChange(() => {
      const selection = xterm.getSelection()
      if (selection && selection.length > 0) {
        try {
          navigator.clipboard.writeText(selection).then(() => {
            console.log('Text copied to clipboard:', selection)
            // Show a subtle toast notification
            toast.success(`📋 Copied: ${selection.length > 30 ? selection.substring(0, 30) + '...' : selection}`, {
              duration: 2000,
              style: {
                background: '#0a0a0a',
                color: '#00ff88',
                border: '1px solid #00ff88',
                fontSize: '12px'
              }
            })
          }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = selection
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            console.log('Text copied to clipboard (fallback):', selection)
            toast.success(`📋 Copied: ${selection.length > 30 ? selection.substring(0, 30) + '...' : selection}`, {
              duration: 2000,
              style: {
                background: '#0a0a0a',
                color: '#00ff88',
                border: '1px solid #00ff88',
                fontSize: '12px'
              }
            })
          })
        } catch (error) {
          console.error('Failed to copy text to clipboard:', error)
          toast.error('فشل في نسخ النص', {
            duration: 2000,
            style: {
              background: '#0a0a0a',
              color: '#ff6b6b',
              border: '1px solid #ff6b6b',
              fontSize: '12px'
            }
          })
        }
      }
    })

    // Handle input
    let inputBuffer = ''
    xterm.onData((data) => {
      if (!isConnected) return

      // Handle special keys
      const code = data.charCodeAt(0)
      
      if (code === 13) { // Enter
        xterm.write('\r\n')
        if (inputBuffer.trim()) {
          // Add to history
          setCommandHistory(prev => [...prev, inputBuffer.trim()])
          setHistoryIndex(-1)
          setCurrentCommand('')
          
          // Send command with newline
          sshService.sendInput(connection.id, inputBuffer + '\n')
        } else {
          // Send empty line
          sshService.sendInput(connection.id, '\n')
        }
        inputBuffer = ''
      } else if (code === 127) { // Backspace
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1)
          xterm.write('\b \b')
        }
      } else if (code === 9) { // Tab
        // Send tab for autocomplete
        sshService.sendInput(connection.id, data)
      } else if (code === 27) { // Escape sequences (arrow keys, etc.)
        // Handle arrow keys for history
        if (data === '\x1b[A') { // Up arrow
          if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
            if (historyIndex === -1) {
              setCurrentCommand(inputBuffer)
            }
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            const cmd = commandHistory[commandHistory.length - 1 - newIndex]
            
            // Clear current line and write command
            xterm.write('\x1b[2K\r')
            xterm.write(cmd)
            inputBuffer = cmd
          }
        } else if (data === '\x1b[B') { // Down arrow
          if (historyIndex > -1) {
            const newIndex = historyIndex - 1
            setHistoryIndex(newIndex)
            const cmd = newIndex === -1 ? currentCommand : commandHistory[commandHistory.length - 1 - newIndex]
            
            // Clear current line and write command
            xterm.write('\x1b[2K\r')
            xterm.write(cmd)
            inputBuffer = cmd
          }
        } else {
          // Pass other escape sequences to SSH
          sshService.sendInput(connection.id, data)
        }
      } else if (code === 3) { // Ctrl+C
        xterm.write('^C\r\n')
        sshService.sendInput(connection.id, '\x03')
        inputBuffer = ''
      } else if (code === 4) { // Ctrl+D
        sshService.sendInput(connection.id, '\x04')
      } else if (code === 12) { // Ctrl+L (clear screen)
        xterm.clear()
        inputBuffer = ''
      } else if (code >= 32 && code <= 126) { // Printable ASCII characters
        inputBuffer += data
        xterm.write(data)
      } else if (code === 8) { // Another backspace variant
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1)
          xterm.write('\b \b')
        }
      }
      
      updateTerminalActivity(terminalId)
    })

    // Handle resize
    const handleResize = () => {
      if (fitAddon) {
        try {
          fitAddon.fit()
        } catch (error) {
          console.error('Failed to fit terminal:', error)
        }
      }
    }

    // Set up resize observer
    if (terminalRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize)
      resizeObserverRef.current.observe(terminalRef.current)
    }

    // Connect to SSH
    connectToSSH()

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (xtermRef.current) {
        xtermRef.current.dispose()
      }
      if (isConnected) {
        sshService.disconnect(connection.id)
      }
    }
  }, [terminalId])

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (fitAddonRef.current && isActive) {
        setTimeout(() => {
          try {
            fitAddonRef.current?.fit()
          } catch (error) {
            console.error('Failed to fit terminal on window resize:', error)
          }
        }, 100)
      }
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [isActive])

  // Fit terminal when becoming active
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit()
        } catch (error) {
          console.error('Failed to fit terminal when becoming active:', error)
        }
      }, 100)
    }
  }, [isActive])

  const connectToSSH = async () => {
    if (!connection) return

    setIsConnecting(true)
    setConnectionError(null)

    try {
      const success = await sshService.connect(connection, handleSSHOutput)
      
      if (success) {
        setIsConnected(true)
        setConnectionError(null)
        
        // Start shell
        await sshService.startShell(connection.id)
        
        toast.success(`Connected to ${connection.host}`)
      } else {
        setConnectionError('Failed to connect')
        toast.error('SSH connection failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConnectionError(errorMessage)
      toast.error(`Connection failed: ${errorMessage}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSSHOutput = (output: SSHOutput) => {
    if (!xtermRef.current) return

    // Update activity
    updateTerminalActivity(terminalId)
    
    // Mark as unread if not active
    if (!isActive) {
      setTerminalUnread(terminalId, true)
    }

    // Write output to terminal with appropriate styling
    switch (output.type) {
      case 'stdout':
        xtermRef.current.write(output.data)
        break
      case 'stderr':
        xtermRef.current.write(`\x1b[91m${output.data}\x1b[0m`) // Red for errors
        break
      case 'info':
        xtermRef.current.write(`\x1b[94m${output.data}\x1b[0m`) // Blue for info
        break
      case 'error':
        xtermRef.current.write(`\x1b[91m${output.data}\x1b[0m`) // Red for errors
        break
    }
  }

  const handleReconnect = () => {
    if (connection) {
      connectToSSH()
    }
  }

  const handleSearch = () => {
    if (!searchAddonRef.current || !searchTerm) return
    
    searchAddonRef.current.findNext(searchTerm)
  }

  const handleClearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear()
    }
  }

  const handleUploadFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || !connection) return

      for (const file of Array.from(files)) {
        try {
          const remotePath = `/tmp/${file.name}`
          const localPath = file.path || `/tmp/${file.name}`
          
          toast.info(`Uploading ${file.name}...`)
          const success = await sshService.uploadFile(connection.id, localPath, remotePath)
          
          if (success) {
            toast.success(`${file.name} uploaded successfully`)
            if (xtermRef.current) {
              xtermRef.current.write(`\r\n📁 Uploaded: ${file.name} -> ${remotePath}\r\n`)
            }
          } else {
            toast.error(`Failed to upload ${file.name}`)
          }
        } catch (error) {
          toast.error(`Upload failed: ${error.message}`)
        }
      }
    }
    input.click()
  }

  const handleDownloadFile = () => {
    const fileName = prompt('Enter file path to download:')
    if (!fileName || !connection) return

    const downloadFile = async () => {
      try {
        const localPath = `/tmp/${fileName.split('/').pop()}`
        
        toast.info(`Downloading ${fileName}...`)
        const success = await sshService.downloadFile(connection.id, fileName, localPath)
        
        if (success) {
          toast.success(`File downloaded successfully`)
          if (xtermRef.current) {
            xtermRef.current.write(`\r\n📁 Downloaded: ${fileName} -> ${localPath}\r\n`)
          }
        } else {
          toast.error(`Failed to download file`)
        }
      } catch (error) {
        toast.error(`Download failed: ${error.message}`)
      }
    }

    downloadFile()
  }

  if (!terminal || !connection) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Terminal not found</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col bg-background"
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="font-medium text-sm">{terminal.title}</span>
          </div>
          
          <Badge 
            variant={isConnected ? "default" : "destructive"} 
            className="text-xs"
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          
          {connectionError && (
            <Badge variant="destructive" className="text-xs">
              {connectionError}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {showSearch && (
            <div className="flex items-center gap-2 mr-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-8 w-32 text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearch}
                className="h-8 w-8 p-0"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSearch(!showSearch)}>
                <Search className="w-4 h-4 mr-2" />
                {showSearch ? 'Hide Search' : 'Show Search'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearTerminal}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Terminal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleUploadFile}>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadFile}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!isConnected && (
                <DropdownMenuItem onClick={handleReconnect}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconnect
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 relative overflow-hidden">
        {!isConnected && !isConnecting && connectionError && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
            <Card className="w-96">
              <CardHeader>
                <h3 className="text-lg font-semibold text-destructive">Connection Failed</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{connectionError}</p>
                <Button onClick={handleReconnect} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Connection
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div 
          ref={terminalRef} 
          className={cn(
            "w-full h-full p-2",
            !isActive && "opacity-50"
          )}
        />
      </div>
    </motion.div>
  )
}

export default TerminalTab

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Terminal, 
  X, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Copy, 
  Paste,
  Download,
  Upload,
  Trash2,
  Play,
  Square,
  RotateCcw
} from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { sshService } from '../services/ssh-service'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Card, CardContent } from './ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import toast from 'react-hot-toast'

interface TerminalTabProps {
  terminal: any
  onClose: (terminalId: string) => void
  onMaximize: (terminalId: string) => void
  isMaximized: boolean
}

const TerminalTab: React.FC<TerminalTabProps> = ({ 
  terminal, 
  onClose, 
  onMaximize,
  isMaximized 
}) => {
  const { connections, activeTerminalId, setActiveTerminal } = useTerminalStore()
  const [inputValue, setInputValue] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const connection = connections.find(c => c.id === terminal.connectionId)
  const isActive = activeTerminalId === terminal.id

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    if (connection) {
      connectToServer()
    }
  }, [connection])

  const connectToServer = async () => {
    if (!connection) return

    setIsLoading(true)
    try {
      const success = await sshService.connect(connection, handleOutput)
      setIsConnected(success)
      
      if (success) {
        addOutput(`Connected to ${connection.host} as ${connection.username}`, 'info')
        await sshService.startShell(connection.id)
      } else {
        addOutput(`Failed to connect to ${connection.host}`, 'error')
      }
    } catch (error) {
      console.error('Connection error:', error)
      addOutput(`Connection error: ${error}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOutput = (sshOutput: any) => {
    addOutput(sshOutput.data, sshOutput.type)
  }

  const addOutput = (text: string, type: 'stdout' | 'stderr' | 'info' | 'error' = 'stdout') => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'info' ? 'ℹ️' : type === 'error' ? '❌' : type === 'stderr' ? '⚠️' : '➜'
    
    setOutput(prev => [...prev, `[${timestamp}] ${prefix} ${text}`])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setCursorPosition(e.target.selectionStart || 0)
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await executeCommand()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Handle tab completion
      setInputValue(prev => prev + '  ')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      // Handle command history (up arrow)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      // Handle command history (down arrow)
    }
  }

  const executeCommand = async () => {
    if (!inputValue.trim() || !connection || !isConnected) return

    const command = inputValue.trim()
    addOutput(`$ ${command}`, 'stdout')
    setInputValue('')

    try {
      await sshService.sendInput(connection.id, command)
    } catch (error) {
      addOutput(`Error executing command: ${error}`, 'error')
    }
  }

  const handleCopy = () => {
    if (output.length > 0) {
      navigator.clipboard.writeText(output.join('\n'))
      toast.success('Terminal output copied to clipboard')
    }
  }

  const handleClear = () => {
    setOutput([])
  }

  const handleDisconnect = async () => {
    if (!connection) return

    try {
      await sshService.disconnect(connection.id)
      setIsConnected(false)
      addOutput('Disconnected from server', 'info')
    } catch (error) {
      addOutput(`Error disconnecting: ${error}`, 'error')
    }
  }

  const handleReconnect = () => {
    if (connection) {
      connectToServer()
    }
  }

  const getStatusColor = () => {
    if (isLoading) return 'bg-yellow-500'
    if (isConnected) return 'bg-green-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    if (isLoading) return 'Connecting...'
    if (isConnected) return 'Connected'
    return 'Disconnected'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "h-full flex flex-col bg-background border border-border rounded-lg overflow-hidden",
        isActive && "ring-2 ring-primary ring-opacity-50"
      )}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm truncate">
              {terminal.title || `Terminal ${terminal.id}`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
            <span className="text-xs text-muted-foreground">
              {getStatusText()}
            </span>
          </div>
          
          {connection && (
            <Badge variant="outline" className="text-xs">
              {connection.host}:{connection.port}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Terminal Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Output
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Output
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDisconnect} disabled={!isConnected}>
                <Square className="w-4 h-4 mr-2" />
                Disconnect
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReconnect} disabled={isLoading}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-4" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMaximize(terminal.id)}
            className="h-8 w-8 p-0"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClose(terminal.id)}
            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={outputRef}
          className="h-full p-4 font-mono text-sm overflow-y-auto bg-black/90 text-green-400"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {output.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Connecting to server...
                </div>
              ) : !isConnected ? (
                <div className="text-center">
                  <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Terminal ready</p>
                  <p className="text-xs text-muted-foreground">
                    {connection ? `Will connect to ${connection.host}` : 'No connection configured'}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>Connected and ready</p>
                  <p className="text-xs text-muted-foreground">Type your commands below</p>
                </div>
              )}
            </div>
          ) : (
            output.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap break-words">
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Terminal Input */}
      <div className="p-3 bg-muted/30 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm">
            {connection?.username || 'user'}@{connection?.host || 'localhost'}:~$
          </span>
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Enter command..." : "Connecting..."}
            disabled={!isConnected || isLoading}
            className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-sm placeholder:text-green-400/50"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />
          
          {isConnected && inputValue && (
            <Button
              size="sm"
              onClick={executeCommand}
              className="h-6 px-2 text-xs"
            >
              <Play className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default TerminalTab

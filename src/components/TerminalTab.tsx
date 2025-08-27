import React, { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { SearchAddon } from '@xterm/addon-search'
import '@xterm/xterm/css/xterm.css'
import { motion } from 'framer-motion'
import {
  X,
  Settings,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  Upload,
  Download,
  FolderOpen
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
import SftpManager from './SftpManager'
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
  const [showSftpManager, setShowSftpManager] = useState(false)
  const [connectionCheckInterval, setConnectionCheckInterval] = useState<NodeJS.Timeout | null>(null)

  const { terminals, connections, terminalTheme, updateTerminalActivity, setTerminalUnread } = useTerminalStore()

  const terminal = terminals.find(t => t.id === terminalId)
  const connection = terminal ? connections.find(c => c.id === terminal.connectionId) : null

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || !terminal || !connection) return
    const currentTheme = getThemeById(terminalTheme) || getDefaultTheme()

    const xterm = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 15,
      fontFamily: 'JetBrains Mono, Fira Code, Consolas, "Courier New", monospace',
      fontWeight: 500,
      theme: currentTheme.colors,
      convertEol: true,
      scrollback: 10000,
      tabStopWidth: 4,
      rows: 30,
      cols: 100,
      fastScrollModifier: 'alt',
      fastScrollSensitivity: 5,
      scrollSensitivity: 3,
      disableStdin: false,
      windowsMode: false,
      macOptionIsMeta: true,
      minimumContrastRatio: 1,
      smoothScrollDuration: 125,
      altClickMovesCursor: false,
      rightClickSelectsWord: false
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    const searchAddon = new SearchAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    xterm.loadAddon(searchAddon)

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon
    searchAddonRef.current = searchAddon

    xterm.open(terminalRef.current)
    fitAddon.fit()

    // Welcome message
    xterm.writeln('🚀 \x1b[1;34mFlyTerm - Modern SSH Terminal\x1b[0m')
    xterm.writeln(`📡 Connecting to \x1b[1;32m${connection.username}@${connection.host}:${connection.port}\x1b[0m`)
    xterm.writeln('')

    // Copy on select
    let selectionTimer: NodeJS.Timeout | null = null
    xterm.onSelectionChange(() => {
      const selection = xterm.getSelection()
      if (selection && selection.length > 0) {
        if (selectionTimer) clearTimeout(selectionTimer)
        selectionTimer = setTimeout(() => {
          navigator.clipboard.writeText(selection).then(() => {
            toast.success(`📋 Copied: ${selection.length > 30 ? selection.substring(0, 30) + '...' : selection}`, {
              duration: 1500,
              style: { background: '#0a0a0a', color: '#00ff88', border: '1px solid #00ff88', fontSize: '12px' }
            })
          }).catch(() => {
            console.error('Clipboard copy failed')
          })
        }, 100)
      }
    })

    // Input handling (fixed)
    xterm.onData((data) => {
      if (!connection) return
      sshService.sendInput(connection.id, data)
      updateTerminalActivity(terminalId)
    })

    // Resize handling
    const handleResize = () => {
      try { fitAddon.fit() } catch (e) { console.error('Fit error:', e) }
    }
    if (terminalRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize)
      resizeObserverRef.current.observe(terminalRef.current)
    }

    // Connect SSH
    connectToSSH()

    // Health check
    const checkConnectionHealth = setInterval(async () => {
      if (connection) {
        const stillConnected = await sshService.isConnected(connection.id)
        setIsConnected(stillConnected)
        if (!stillConnected && !connectionError) {
          setConnectionError('Connection lost')
        }
      }
    }, 5000)
    setConnectionCheckInterval(checkConnectionHealth)

    return () => {
      if (selectionTimer) clearTimeout(selectionTimer)
      if (checkConnectionHealth) clearInterval(checkConnectionHealth)
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect()
      if (xtermRef.current) xtermRef.current.dispose()
      // if (isConnected && connection) sshService.disconnect(connection.id)
    }
  }, [terminalId])

  // Window resize
  useEffect(() => {
    const handleWindowResize = () => {
      if (fitAddonRef.current && isActive) {
        setTimeout(() => {
          try { fitAddonRef.current?.fit() } catch (e) {}
        }, 100)
      }
    }
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [isActive])

  // Fit on active
  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => {
        try { fitAddonRef.current?.fit() } catch (e) {}
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
        await new Promise(resolve => setTimeout(resolve, 100))
        await sshService.startShell(connection.id)
      } else {
        setConnectionError('Failed to connect')
        toast.error('❌ SSH connection failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConnectionError(errorMessage)
      toast.error(`❌ Connection failed: ${errorMessage}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSSHOutput = (output: SSHOutput) => {
    if (!xtermRef.current) return
    updateTerminalActivity(terminalId)
    if (!isActive) setTerminalUnread(terminalId, true)

    switch (output.type) {
      case 'stdout':
        xtermRef.current.write(output.data)
        break
      case 'stderr':
        xtermRef.current.write(`\x1b[91m${output.data}\x1b[0m`)
        break
      case 'info':
        if (!output.data.includes('Interactive shell started')) {
          xtermRef.current.write(`\x1b[94m${output.data}\x1b[0m`)
        }
        break
      case 'error':
        xtermRef.current.write(`\x1b[91m${output.data}\x1b[0m`)
        setIsConnected(false)
        setConnectionError('Connection closed')
        break
    }
  }

  const handleReconnect = () => {
    if (connection) connectToSSH()
  }

  const handleSearch = () => {
    if (!searchAddonRef.current || !searchTerm) return
    searchAddonRef.current.findNext(searchTerm)
  }

  const handleClearTerminal = () => {
    xtermRef.current?.clear()
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
          toast.info(`Uploading ${file.name}...`)
          const success = await sshService.uploadFile(connection.id, file.path || `/tmp/${file.name}`, remotePath)
          if (success) {
            toast.success(`${file.name} uploaded`)
            xtermRef.current?.write(`\r\n📁 Uploaded: ${file.name} -> ${remotePath}\r\n`)
          } else {
            toast.error(`Failed to upload ${file.name}`)
          }
        } catch (e: any) {
          toast.error(`Upload failed: ${e.message}`)
        }
      }
    }
    input.click()
  }

  const handleDownloadFile = () => {
    const fileName = prompt('Enter file path to download:')
    if (!fileName || !connection) return
    ;(async () => {
      try {
        const localPath = `/tmp/${fileName.split('/').pop()}`
        toast.info(`Downloading ${fileName}...`)
        const success = await sshService.downloadFile(connection.id, fileName, localPath)
        if (success) {
          toast.success(`Downloaded successfully`)
          xtermRef.current?.write(`\r\n📁 Downloaded: ${fileName} -> ${localPath}\r\n`)
        } else {
          toast.error(`Failed to download file`)
        }
      } catch (e: any) {
        toast.error(`Download failed: ${e.message}`)
      }
    })()
  }

  if (!terminal || !connection) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Terminal not found</p></div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <span className="font-medium text-sm">{terminal.title}</span>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          {connectionError && <Badge variant="destructive" className="text-xs">{connectionError}</Badge>}
        </div>
        <div className="flex items-center gap-1">
          {showSearch && (
            <div className="flex items-center gap-2 mr-2">
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="h-8 w-32 text-xs" />
              <Button variant="ghost" size="sm" onClick={handleSearch} className="h-8 w-8 p-0"><Search className="w-4 h-4" /></Button>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Settings className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSearch(!showSearch)}><Search className="w-4 h-4 mr-2" />{showSearch ? 'Hide Search' : 'Show Search'}</DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearTerminal}><RefreshCw className="w-4 h-4 mr-2" />Clear Terminal</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSftpManager(true)}><FolderOpen className="w-4 h-4 mr-2" />SFTP File Manager</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleUploadFile}><Upload className="w-4 h-4 mr-2" />Upload File</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadFile}><Download className="w-4 h-4 mr-2" />Download File</DropdownMenuItem>
              <DropdownMenuSeparator />
              {!isConnected && <DropdownMenuItem onClick={handleReconnect}><RefreshCw className="w-4 h-4 mr-2" />Reconnect</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white"><X className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 relative overflow-hidden">
        {!isConnected && !isConnecting && connectionError && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
            <Card className="w-96">
              <CardHeader><h3 className="text-lg font-semibold text-destructive">Connection Failed</h3></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{connectionError}</p>
                <Button onClick={handleReconnect} className="w-full"><RefreshCw className="w-4 h-4 mr-2" />Retry Connection</Button>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={terminalRef} className={cn("w-full h-full p-2 terminal-scroll", !isActive && "opacity-50")} />
      </div>

      {/* SFTP Manager */}
      {connection && (
        <SftpManager connectionId={connection.id} isOpen={showSftpManager} onClose={() => setShowSftpManager(false)} />
      )}
    </motion.div>
  )
}

export default TerminalTab

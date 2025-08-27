import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Terminal,
  X,
  Maximize2,
  Minimize2,
  Split,
  Grid3X3,
  Settings,
  Zap,
  Copy,
  Clipboard,
  RotateCcw,
  Palette,
  FolderOpen
} from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Card, CardContent } from './ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import TerminalTab from './TerminalTab'
import SftpTab from './SftpTab'
import WelcomeScreen from './WelcomeScreen'
import toast from 'react-hot-toast'

const TerminalArea: React.FC = () => {
  const {
    terminals,
    activeTerminalId,
    setActiveTerminal,
    addTerminal,
    removeTerminal,
    connections,
    sftpTabs,
    activeSftpId,
    addSftpTab,
    removeSftpTab,
    setActiveSftp
  } = useTerminalStore()

  const [layout, setLayout] = useState<'single' | 'split' | 'grid'>('single')
  const [maximizedTerminal, setMaximizedTerminal] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())
  const [activeTabType, setActiveTabType] = useState<'terminal' | 'sftp'>('terminal')

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleNewTerminal = () => {
    if (connections.length === 0) {
      toast.error('Please create a connection first before opening a new terminal', {
        duration: 3000,
        style: {
          background: 'hsl(var(--destructive))',
          color: 'hsl(var(--destructive-foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
        }
      })
      return
    }

    // Use the first available connection
    const connection = connections[0]
    try {
      addTerminal({
        connectionId: connection.id,
        title: `${connection.name} - ${connection.host}`,
      })

      toast.success(`New terminal created for connection: ${connection.name}`, {
        duration: 2000,
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--success))',
        }
      })
    } catch (error) {
      console.error('Failed to create new terminal:', error)
      toast.error('Failed to create new terminal')
    }
  }

  const handleCloseTerminal = (terminalId: string) => {
    removeTerminal(terminalId)
    if (maximizedTerminal === terminalId) {
      setMaximizedTerminal(null)
    }
    toast.success('Terminal closed')
  }

  const handleMaximizeTerminal = (terminalId: string) => {
    if (maximizedTerminal === terminalId) {
      setMaximizedTerminal(null)
    } else {
      setMaximizedTerminal(terminalId)
    }
  }

  const handleTerminalClick = (terminalId: string) => {
    setActiveTerminal(terminalId)
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case 'split':
        return 'grid grid-cols-2 gap-2'
      case 'grid':
        return 'grid grid-cols-2 grid-rows-2 gap-2'
      default:
        return 'flex flex-col'
    }
  }

  const renderTerminals = () => {
    // Show SFTP tab if one is active
    if (activeTabType === 'sftp' && sftpTabs.length > 0) {
      const activeSftp = sftpTabs.find(s => s.id === activeSftpId) || sftpTabs[0]
      return (
        <SftpTab
          key={activeSftp.id}
          sftpId={activeSftp.id}
          isActive={true}
          onClose={() => removeSftpTab(activeSftp.id)}
        />
      )
    }

    if (terminals.length === 0 && sftpTabs.length === 0) {
      return <WelcomeScreen onNewTerminal={handleNewTerminal} />
    }

    if (terminals.length === 0 && sftpTabs.length > 0) {
      // Switch to SFTP view if no terminals but SFTP tabs exist
      setActiveTabType('sftp')
      return null
    }

    if (maximizedTerminal) {
      const terminal = terminals.find(t => t.id === maximizedTerminal)
      if (!terminal) return null

      return (
        <TerminalTab
          key={terminal.id}
          terminalId={terminal.id}
          isActive={true}
          onClose={() => handleCloseTerminal(terminal.id)}
        />
      )
    }

    // For single layout (default), show only the active terminal (tab-style)
    if (layout === 'single') {
      const activeTerminal = terminals.find(t => t.id === activeTerminalId) || terminals[0]

      return (
        <motion.div
          key={activeTerminal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <TerminalTab
            terminalId={activeTerminal.id}
            isActive={true}
            onClose={() => handleCloseTerminal(activeTerminal.id)}
          />
        </motion.div>
      )
    }

    // For split and grid layouts, show multiple terminals
    return (
      <div className={cn("h-full", getLayoutClasses())}>
        {terminals.map((terminal, index) => (
          <motion.div
            key={terminal.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "h-full",
              layout === 'split' && index >= 2 && "hidden",
              layout === 'grid' && index >= 4 && "hidden"
            )}
          >
            <TerminalTab
              terminalId={terminal.id}
              isActive={activeTerminalId === terminal.id}
              onClose={() => handleCloseTerminal(terminal.id)}
            />
          </motion.div>
        ))}
      </div>
    )
  }

  const getActiveTerminal = () => {
    return terminals.find(t => t.id === activeTerminalId)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Terminal Toolbar */}
      {terminals.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Terminals</span>
              <Badge variant="secondary">{terminals.length}</Badge>
            </div>

            <Separator orientation="vertical" className="h-4" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Layout:</span>
              <Button
                variant={layout === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayout('single')}
                className="h-7 px-2"
              >
                Single
              </Button>
              <Button
                variant={layout === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayout('split')}
                className="h-7 px-2"
                disabled={terminals.length < 2}
              >
                <Split className="w-3 h-3" />
              </Button>
              <Button
                variant={layout === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayout('grid')}
                className="h-7 px-2"
                disabled={terminals.length < 2}
              >
                <Grid3X3 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {maximizedTerminal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMaximizedTerminal(null)}
                className="h-7 px-2"
              >
                <Minimize2 className="w-3 h-3 mr-1" />
                Exit Fullscreen
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2">
                  <Settings className="w-3 h-3 mr-1" />
                  Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleNewTerminal}
                  disabled={connections.length === 0}
                  className={connections.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  New Terminal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLayout('single')}>
                  Single Layout
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLayout('split')}
                  disabled={terminals.length < 2}
                >
                  Split Layout
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLayout('grid')}
                  disabled={terminals.length < 2}
                >
                  Grid Layout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              {/* SFTP Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (connections.length === 0) {
                    toast.error('Please create a connection first', {
                      duration: 3000
                    })
                    return
                  }
                  const connection = connections[0]
                  addSftpTab({
                    connectionId: connection.id,
                    title: `SFTP - ${connection.name}`,
                    currentPath: '/'
                  })
                  setActiveTabType('sftp')
                  toast.success(`📁 SFTP tab opened for ${connection.name}`)
                }}
                className="h-7 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30"
                title="Open SFTP Manager"
                disabled={connections.length === 0}
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                SFTP
              </Button>

              {/* Quick Actions */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Clear all terminals
                  terminals.forEach(t => {
                    const termElement = document.querySelector(`[data-terminal-id="${t.id}"] .xterm`)
                    if (termElement) {
                      const xterm = (termElement as any)._xterm
                      if (xterm) xterm.clear()
                    }
                  })
                  toast.success('🧹 All terminals cleared!')
                }}
                className="h-7 px-2"
                title="Clear All Terminals"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('📋 App URL copied to clipboard!')
                }}
                className="h-7 px-2"
                title="Copy App URL"
              >
                <Copy className="w-3 h-3" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('⚡ Quick tip: Use Ctrl+Shift+T for new terminal!')}
                className="h-7 px-2"
                title="Quick Actions"
              >
                <Zap className="w-3 h-3" />
              </Button>

              <Button
                onClick={handleNewTerminal}
                variant="default"
                size="sm"
                className="h-7 px-3 btn-gradient hover:scale-105 transition-transform"
                disabled={connections.length === 0}
                title={connections.length === 0 ? 'Please create a connection first' : 'Create new terminal'}
              >
                <Plus className="w-3 h-3 mr-1" />
                New Terminal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal and SFTP Tabs */}
      {(terminals.length > 0 || sftpTabs.length > 0) && !maximizedTerminal && (
        <div className="flex items-center gap-1 p-2 bg-muted/20 border-b border-border overflow-x-auto">
          {/* Terminal Tabs */}
          {terminals.map((terminal) => {
            const connection = connections.find(c => c.id === terminal.connectionId)
            const isActive = activeTerminalId === terminal.id && activeTabType === 'terminal'

            return (
              <motion.div
                key={terminal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-shrink-0"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setActiveTabType('terminal')
                        handleTerminalClick(terminal.id)
                      }}
                      className={cn("h-8 px-3 text-xs font-medium", isActive && "bg-secondary text-secondary-foreground")}
                    >
                      <Terminal className="w-3 h-3 mr-1" />
                      {terminal.title}
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCloseTerminal(terminal.id)
                        }}
                        className="ml-2 h-5 w-5 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (connection) {
                          // Create new terminal with same connection
                          const newTerminalId = `terminal-${Date.now()}`
                          addTerminal({
                            id: newTerminalId,
                            title: `${connection.name} (${terminals.length + 1})`,
                            connectionId: connection.id,
                            createdAt: new Date(),
                            lastActivity: new Date(),
                            isActive: false,
                            unread: false
                          })
                          setActiveTabType('terminal')
                          setActiveTerminal(newTerminalId)
                          toast.success(`🌐 New SSH session opened for ${connection.name}`)
                        }
                      }}
                    >
                      <Terminal className="w-4 h-4 mr-2" />
                      New SSH Session
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (connection) {
                          // Create new SFTP tab
                          const newSftpId = `sftp-${Date.now()}`
                          addSftpTab({
                            id: newSftpId,
                            title: `SFTP: ${connection.name}`,
                            connectionId: connection.id
                          })
                          setActiveTabType('sftp')
                          setActiveSftp(newSftpId)
                          toast.success(`📁 SFTP opened for ${connection.name}`)
                        }
                      }}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Open SFTP
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleMaximizeTerminal(terminal.id)
                        toast.success(maximizedTerminal === terminal.id ? '📺 Exited fullscreen' : '📺 Entered fullscreen')
                      }}
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      {maximizedTerminal === terminal.id ? 'Exit Fullscreen' : 'Fullscreen'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Clear terminal using a more reliable method
                        const terminalTab = document.querySelector(`[data-terminal-id="${terminal.id}"]`)
                        if (terminalTab) {
                          // Send clear command instead of using xterm API
                          const connection = connections.find(c => c.id === terminal.connectionId)
                          if (connection) {
                            window.electron.ssh.sendInput(connection.id, 'clear\r')
                            toast.success('🧹 Terminal cleared!')
                          }
                        }
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear Terminal
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Copy terminal output
                        const terminalTab = document.querySelector(`[data-terminal-id="${terminal.id}"] .xterm-screen`)
                        if (terminalTab) {
                          const text = terminalTab.textContent || ''
                          navigator.clipboard.writeText(text)
                          toast.success('📋 Terminal output copied!')
                        }
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All Output
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Paste from clipboard
                        navigator.clipboard.readText().then(text => {
                          const connection = connections.find(c => c.id === terminal.connectionId)
                          if (connection && text) {
                            window.electron.ssh.sendInput(connection.id, text)
                            toast.success('📋 Text pasted!')
                          }
                        })
                      }}
                    >
                      <Clipboard className="w-4 h-4 mr-2" />
                      Paste
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCloseTerminal(terminal.id)
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close Terminal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )
          })}

          {/* SFTP Tabs */}
          {sftpTabs.map((sftpTab) => {
            const connection = connections.find(c => c.id === sftpTab.connectionId)
            const isActive = activeSftpId === sftpTab.id && activeTabType === 'sftp'

            return (
              <motion.div
                key={sftpTab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-shrink-0"
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setActiveTabType('sftp')
                    setActiveSftp(sftpTab.id)
                  }}
                  className={cn(
                    "h-8 px-3 text-xs font-medium",
                    isActive && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {sftpTab.title || `SFTP ${sftpTab.id.slice(-4)}`}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSftpTab(sftpTab.id)
                    }}
                    className="ml-2 h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden p-2">
        <div className="native-terminal h-full">
          <AnimatePresence mode="wait">
            {renderTerminals()}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Status Bar */}
      {(terminals.length > 0 || sftpTabs.length > 0) && (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-muted/20 to-muted/10 border-t border-border text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">
                {activeTabType === 'terminal'
                  ? (getActiveTerminal()?.title || 'No Active Terminal')
                  : (sftpTabs.find(s => s.id === activeSftpId)?.title || 'SFTP Manager')}
              </span>
            </div>
            <span className="text-muted-foreground">Layout: {layout}</span>
            {maximizedTerminal && (
              <span className="text-yellow-400 font-medium">📺 Fullscreen</span>
            )}
            <span className="text-muted-foreground">
              Mode: {activeTabType === 'terminal' ? '🖥️ Terminal' : '📁 SFTP'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span>🔗 {connections.length} Connections</span>
            <span>🖥️ {terminals.length} Terminals</span>
            <span>📁 {sftpTabs.length} SFTP</span>
            <span className="text-primary font-medium">
              {currentTime}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default TerminalArea

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
  RotateCcw,
  Palette
} from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Card, CardContent } from './ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import TerminalTab from './TerminalTab'
import WelcomeScreen from './WelcomeScreen'
import toast from 'react-hot-toast'

const TerminalArea: React.FC = () => {
  const { 
    terminals, 
    activeTerminalId, 
    setActiveTerminal, 
    addTerminal, 
    removeTerminal,
    connections 
  } = useTerminalStore()
  
  const [layout, setLayout] = useState<'single' | 'split' | 'grid'>('single')
  const [maximizedTerminal, setMaximizedTerminal] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString())

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const handleNewTerminal = () => {
    if (connections.length === 0) {
      toast.error('Please create a connection first')
      return
    }
    
    // Use the first available connection
    const connection = connections[0]
    addTerminal({
      connectionId: connection.id,
      title: `${connection.name} - ${connection.host}`,
    })
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
    if (terminals.length === 0) {
      return <WelcomeScreen onNewTerminal={handleNewTerminal} />
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
                <DropdownMenuItem onClick={handleNewTerminal}>
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
                className="h-7 px-3 btn-gradient"
              >
                <Plus className="w-3 h-3 mr-1" />
                New Terminal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Tabs */}
      {terminals.length > 0 && !maximizedTerminal && (
        <div className="flex items-center gap-1 p-2 bg-muted/20 border-b border-border overflow-x-auto">
          {terminals.map((terminal) => {
            const connection = connections.find(c => c.id === terminal.connectionId)
            const isActive = activeTerminalId === terminal.id
            
            return (
              <motion.div
                key={terminal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-shrink-0"
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleTerminalClick(terminal.id)}
                  className={cn(
                    "h-8 px-3 text-xs font-medium",
                    isActive && "bg-secondary text-secondary-foreground"
                  )}
                >
                  <Terminal className="w-3 h-3 mr-1" />
                  {terminal.title || `Terminal ${terminal.id.slice(-4)}`}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCloseTerminal(terminal.id)
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
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {renderTerminals()}
        </AnimatePresence>
      </div>

      {/* Enhanced Status Bar */}
      {terminals.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-muted/20 to-muted/10 border-t border-border text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">
                {getActiveTerminal()?.title || 'No Active Terminal'}
              </span>
            </div>
            <span className="text-muted-foreground">Layout: {layout}</span>
            {maximizedTerminal && (
              <span className="text-yellow-400 font-medium">📺 Fullscreen</span>
            )}
                                  </div>
            
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>🔗 {connections.length} Connections</span>
              <span>🖥️ {terminals.length} Terminals</span>
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

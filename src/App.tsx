import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { Terminal, Settings, X, Minimize2, Maximize2, Square } from 'lucide-react'
import { useTerminalStore } from './store/terminal-store'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import Sidebar from './components/Sidebar'
import TerminalArea from './components/TerminalArea'
import SettingsModal from './components/SettingsModal'
import './index.css'

// Extend Window interface for Electron
declare global {
  interface Window {
    electron?: {
      minimize?: () => void
      maximize?: () => void
      unmaximize?: () => void
      close?: () => void
      isMaximized?: () => Promise<boolean>
      onMaximizeChange?: (callback: (isMaximized: boolean) => void) => void
    }
  }
}

const App: React.FC = () => {
  const { connections, terminals } = useTerminalStore()
  const [showSettings, setShowSettings] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check initial maximize state
    if (window.electron?.isMaximized) {
      window.electron.isMaximized().then(setIsMaximized)
    }

    // Listen for maximize state changes
    if (window.electron?.onMaximizeChange) {
      window.electron.onMaximizeChange(setIsMaximized)
    }

    // Hide loading screen after a short delay to ensure everything is ready
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleMinimize = () => {
    if (window.electron) {
      window.electron.minimize()
    }
  }

  const handleMaximize = () => {
    if (window.electron) {
      window.electron.maximize()
    }
  }

  const handleClose = () => {
    if (window.electron) {
      window.electron.close()
    }
  }

  if (isLoading) {
    return (
      <div className="startup-loading">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
            <Terminal className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">FlyTerm</h1>
            <p className="text-muted-foreground">Starting up...</p>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden animate-fade-in dark">
      {/* Custom Title Bar */}
      <div className="h-12 bg-muted/30 border-b border-border flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <Terminal className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">FlyTerm</span>
            <Badge variant="outline" className="text-xs">
              v1.0.0
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicators */}
          <div className="flex items-center gap-3 mr-4">
            {connections.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{connections.length} Connection{connections.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            {terminals.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{terminals.length} Terminal{terminals.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaximize}
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              {isMaximized ? <Square className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-red-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-3rem)]">
        <AnimatePresence mode="wait">
          <motion.div
            key="sidebar"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Sidebar />
          </motion.div>
        </AnimatePresence>

        <div className="flex-1">
          <TerminalArea />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: 'hsl(var(--success))',
              secondary: 'hsl(var(--success-foreground))',
            },
          },
          error: {
            iconTheme: {
              primary: 'hsl(var(--destructive))',
              secondary: 'hsl(var(--destructive-foreground))',
            },
          },
        }}
      />
    </div>
  )
}

export default App

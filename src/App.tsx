import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { Terminal, Settings, X, Minimize2, Maximize2, Square, User, LogOut, Lock } from 'lucide-react'
import { ThemeProvider } from './contexts/ThemeContext'
import { I18nProvider, useTranslation } from './contexts/I18nContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useTerminalStore } from './store/terminal-store'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu'
import Sidebar from './components/Sidebar'
import TerminalArea from './components/TerminalArea'
import EnhancedSettingsModal from './components/EnhancedSettingsModal'
import ThemeSwitcher from './components/ThemeSwitcher'
import LanguageSelector from './components/LanguageSelector'
import AuthModal from './components/AuthModal'
import { useShortcuts } from './hooks/useShortcuts'
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

const AppContent: React.FC = () => {
  const { connections, terminals, addTerminal, cleanupDuplicateConnections } = useTerminalStore()
  const { t } = useTranslation()
  const { isAuthenticated, isLocked, user, logout, lock } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Clean up duplicate connections on startup
    cleanupDuplicateConnections()
    
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

  // Keyboard shortcuts
  useShortcuts([
    {
      key: 't',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        if (connections.length > 0) {
          const connection = connections[0]
          addTerminal({
            connectionId: connection.id,
            title: `${connection.name} - ${connection.host}`,
          })
        }
      },
      description: 'New Terminal'
    },
    {
      key: ',',
      ctrlKey: true,
      action: () => setShowSettings(true),
      description: 'Open Settings'
    },
    {
      key: 'w',
      ctrlKey: true,
      action: () => {
        if (window.electron) {
          window.electron.close()
        }
      },
      description: 'Close Window'
    }
  ])

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
            <h1 className="text-2xl font-bold text-foreground">{t('app.title')}</h1>
            <p className="text-muted-foreground">{t('app.startingUp')}</p>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden animate-fade-in">
      {/* Custom Title Bar */}
      <div className="h-12 title-bar flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <Terminal className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{t('app.title')}</span>
            <Badge variant="outline" className="text-xs">
              {t('app.version')} 1.0.0
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicators */}
          <div className="flex items-center gap-3 mr-4">
            {connections.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full status-indicator"></div>
                <span>{connections.length} {t('sidebar.connections')}</span>
              </div>
            )}
            
            {terminals.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full status-indicator"></div>
                <span>{terminals.length} {t('sidebar.terminals')}</span>
              </div>
            )}
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1">
            <LanguageSelector />
            <ThemeSwitcher />
            
            {/* User Menu */}
            {isAuthenticated && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user.username}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={lock} className="cursor-pointer">
                    <Lock className="w-4 h-4 mr-2" />
                    قفل التطبيق
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="h-8 w-8 p-0 hover:bg-accent native-button"
              title="فتح الإعدادات"
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
      <EnhancedSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={!isAuthenticated || isLocked} 
        mode={isLocked ? 'unlock' : 'login'} 
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

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App

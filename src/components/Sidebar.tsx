import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Server, 
  Settings, 
  FileText, 
  History, 
  BookOpen, 
  FolderOpen,
  ChevronRight,
  MoreVertical,
  Key,
  Wifi,
  Monitor,
  Zap
} from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { connectionStorage } from '../services/connection-storage'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import ConnectionModal from './ConnectionModal'
import SettingsModal from './SettingsModal'
import FileManager from './FileManager'
import CommandHistory from './CommandHistory'
import Documentation from './Documentation'
import SftpManager from './SftpManager'
import toast from 'react-hot-toast'

const Sidebar: React.FC = () => {
  const { 
    connections, 
    addConnection, 
    updateConnection, 
    deleteConnection,
    addTerminal
  } = useTerminalStore()
  
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [editingConnection, setEditingConnection] = useState<any>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showFileManager, setShowFileManager] = useState(false)
  const [showCommandHistory, setShowCommandHistory] = useState(false)
  const [showDocumentation, setShowDocumentation] = useState(false)
  const [showSftpManager, setShowSftpManager] = useState(false)
  const [selectedSftpConnection, setSelectedSftpConnection] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    connections: true,
    tools: true
  })
  
  const connectionsLoadedRef = useRef(false)

  // Load saved connections on mount and cleanup duplicates
  useEffect(() => {
    if (connectionsLoadedRef.current) return
    
    const loadSavedConnections = async () => {
      try {
        // First cleanup duplicates and demo data
        const cleanupResults = await connectionStorage.cleanupConnections()
        if (cleanupResults.duplicatesRemoved > 0 || cleanupResults.demoRemoved > 0) {
          toast.success(`Cleaned up ${cleanupResults.duplicatesRemoved} duplicates and ${cleanupResults.demoRemoved} demo connections`)
        }

        const savedConnections = await connectionStorage.loadConnections()
        if (savedConnections.length > 0) {
          // Add saved connections to store
          savedConnections.forEach(conn => {
            if (!connections.find(c => c.id === conn.id)) {
              addConnection(conn)
            }
          })
        }
        connectionsLoadedRef.current = true
      } catch (error) {
        console.error('Failed to load saved connections:', error)
        toast.error('Failed to load saved connections')
        connectionsLoadedRef.current = true
      }
    }

    loadSavedConnections()
  }, [addConnection, connections])

  const handleNewConnection = () => {
    setShowConnectionModal(true)
  }

  const handleEditConnection = (connection: any) => {
    setEditingConnection(connection)
    setShowConnectionModal(true)
  }

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      // Remove from store first
      deleteConnection(connectionId)
      
      // Then remove from storage
      await connectionStorage.deleteConnection(connectionId)
      
      toast.success('Connection deleted successfully')
    } catch (error) {
      console.error('Failed to delete connection:', error)
      toast.error('Failed to delete connection')
    }
  }

  const handleConnectionClick = (connection: any) => {
    // Create a new terminal for this connection
    const newTerminal = {
      connectionId: connection.id,
      title: `${connection.name} - ${connection.host}`
    }
    
    // Add terminal to store
    addTerminal(newTerminal)
    
    toast.success(`Connected to ${connection.name}`)
  }

  const handleConnectionModalClose = () => {
    setShowConnectionModal(false)
    setEditingConnection(null)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getConnectionStatus = (connection: any) => {
    // TODO: Implement real connection status checking
    return 'disconnected'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <>
      <div className="w-80 native-sidebar flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Server className="w-4 h-4 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground">FlyTerm</h2>
            </div>
            <Badge variant="outline" className="text-xs bg-background/50">
              v1.0.0 Pro
            </Badge>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleNewConnection}
              variant="default"
              size="sm"
              className="w-full btn-gradient shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Connection
            </Button>
            
            {/* Quick Stats */}
            <div className="flex gap-2 text-xs">
              <div className="flex-1 bg-background/30 rounded-lg p-2 text-center">
                <div className="font-bold text-primary">{connections.length}</div>
                <div className="text-muted-foreground">Connections</div>
              </div>
              <div className="flex-1 bg-background/30 rounded-lg p-2 text-center">
                <div className="font-bold text-green-500">0</div>
                <div className="text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 optimized-scroll p-4 space-y-6">
          {/* Connections Section */}
          <div>
            <button
              onClick={() => toggleSection('connections')}
              className="flex items-center justify-between w-full text-left font-medium text-foreground mb-3 hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span>Connections</span>
                <Badge variant="secondary" className="text-xs">
                  {connections.length}
                </Badge>
              </div>
              <ChevronRight 
                className={cn(
                  "w-4 h-4 transition-transform",
                  expandedSections.connections && "rotate-90"
                )} 
              />
            </button>

            <AnimatePresence>
              {expandedSections.connections && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  {connections.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No connections yet
                    </div>
                  ) : (
                    connections.map((connection) => {
                      const status = getConnectionStatus(connection)
                      const isActive = false // TODO: Implement active connection tracking
                      
                      return (
                        <motion.div
                          key={connection.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="group"
                        >
                          <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer",
                            isActive 
                              ? "bg-primary/10 border-primary/30 text-primary" 
                              : "bg-card/50 border-border/50 hover:bg-card hover:border-border"
                          )}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="relative">
                                <div 
                                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: connection.color || '#3B82F6' }}
                                >
                                  {connection.name.charAt(0).toUpperCase()}
                                </div>
                                <div className={cn(
                                  "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                                  getStatusColor(status)
                                )} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-sm truncate">
                                    {connection.name}
                                  </div>
                                  {connection.connectionType === 'privateKey' && (
                                    <Key className="w-3 h-3 text-yellow-500" />
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {connection.username}@{connection.host}:{connection.port}
                                </div>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleConnectionClick(connection)}>
                                  <Server className="w-4 h-4 mr-2" />
                                  Connect
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditConnection(connection)}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteConnection(connection.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Tools Section */}
          <div>
            <button
              onClick={() => toggleSection('tools')}
              className="flex items-center justify-between w-full text-left font-medium text-foreground mb-3 hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Tools</span>
              </div>
              <ChevronRight 
                className={cn(
                  "w-4 h-4 transition-transform",
                  expandedSections.tools && "rotate-90"
                )} 
              />
            </button>

            <AnimatePresence>
              {expandedSections.tools && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFileManager(true)}
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <FolderOpen className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">File Manager</span>
                    <Badge variant="outline" className="text-xs">Pro</Badge>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (connections.length === 0) {
                        toast.error('يرجى إنشاء اتصال أولاً لاستخدام SFTP')
                        return
                      }
                      setSelectedSftpConnection(connections[0].id)
                      setShowSftpManager(true)
                    }}
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                    disabled={connections.length === 0}
                  >
                    <Server className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">SFTP Manager</span>
                    <Badge variant="secondary" className="text-xs">نقل الملفات</Badge>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCommandHistory(true)}
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <History className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">Command History</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.success('🔄 Network Monitor - Coming Soon!')}
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Wifi className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">Network Monitor</span>
                    <Badge variant="secondary" className="text-xs">New</Badge>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.success('⚡ Performance Monitor - Coming Soon!')}
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Monitor className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">System Monitor</span>
                    <Badge variant="secondary" className="text-xs">New</Badge>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDocumentation(true)}
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <BookOpen className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">Documentation</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">Settings</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="space-y-3">
            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">System Online</span>
            </div>
            
            {/* Info */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span>Made with ❤️</span>
              </div>
              <div className="font-bold text-primary">FlyTerm Pro</div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 h-8 text-xs hover:bg-primary/10"
                onClick={() => toast.success('⚡ Quick tips: Use Ctrl+C, Ctrl+L, Tab for autocomplete!')}
              >
                Tips
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 h-8 text-xs hover:bg-primary/10"
                onClick={() => toast.success('🆘 Help: Check documentation for guides!')}
              >
                Help
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConnectionModal 
        isOpen={showConnectionModal}
        onClose={handleConnectionModalClose}
        editConnection={editingConnection}
      />

      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <FileManager 
        isOpen={showFileManager}
        onClose={() => setShowFileManager(false)}
      />

      <CommandHistory 
        isOpen={showCommandHistory}
        onClose={() => setShowCommandHistory(false)}
      />

      <Documentation 
        isOpen={showDocumentation}
        onClose={() => setShowDocumentation(false)}
      />

      {/* SFTP Manager */}
      {selectedSftpConnection && (
        <SftpManager
          connectionId={selectedSftpConnection}
          isOpen={showSftpManager}
          onClose={() => {
            setShowSftpManager(false)
            setSelectedSftpConnection(null)
          }}
        />
      )}
    </>
  )
}

export default Sidebar

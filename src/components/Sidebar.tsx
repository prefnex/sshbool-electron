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
  MoreVertical
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
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showFileManager, setShowFileManager] = useState(false)
  const [showCommandHistory, setShowCommandHistory] = useState(false)
  const [showDocumentation, setShowDocumentation] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    connections: true,
    tools: true
  })
  
  const connectionsLoadedRef = useRef(false)

  // Load saved connections on mount
  useEffect(() => {
    if (connectionsLoadedRef.current) return
    
    const loadSavedConnections = async () => {
      try {
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
    // TODO: Implement edit functionality
    console.log('Edit connection:', connection)
    toast.success('Edit functionality coming soon')
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
      <div className="w-80 bg-muted/30 border-r border-border flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">FlyTerm</h2>
            <Badge variant="outline" className="text-xs">
              v1.0.0
            </Badge>
          </div>
          
          <Button
            onClick={handleNewConnection}
            variant="default"
            size="sm"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Connection
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                getStatusColor(status)
                              )} />
                              
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {connection.name}
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
                    className="w-full justify-start"
                  >
                    <FolderOpen className="w-4 h-4 mr-3" />
                    File Manager
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCommandHistory(true)}
                    className="w-full justify-start"
                  >
                    <History className="w-4 h-4 mr-3" />
                    Command History
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDocumentation(true)}
                    className="w-full justify-start"
                  >
                    <BookOpen className="w-4 h-4 mr-3" />
                    Documentation
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full justify-start"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <div className="mb-2">Made with ❤️</div>
            <div>FlyTerm Terminal</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConnectionModal />

      <SettingsModal />

      <FileManager />

      <CommandHistory />

      <Documentation />
    </>
  )
}

export default Sidebar

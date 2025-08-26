import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, 
  Search, 
  Play, 
  Copy, 
  Trash2, 
  Clock, 
  Terminal,
  X,
  Filter
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { useTerminalStore } from '../store/terminal-store'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

interface CommandEntry {
  id: string
  command: string
  output: string
  timestamp: Date
  connectionId: string
  success: boolean
  executionTime: number
}

const CommandHistory: React.FC = () => {
  const { activeTerminalId, terminals, connections } = useTerminalStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'failed'>('all')
  const [selectedCommands, setSelectedCommands] = useState<Set<string>>(new Set())

  // Mock command history data
  const [commandHistory, setCommandHistory] = useState<CommandEntry[]>([
    {
      id: '1',
      command: 'ls -la',
      output: 'total 32\ndrwxr-xr-x  5 user  staff   160 Dec 20 10:30 .\ndrwxr-xr-x  3 user  staff    96 Dec 20 10:30 ..',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      connectionId: 'demo-1',
      success: true,
      executionTime: 0.2
    },
    {
      id: '2',
      command: 'pwd',
      output: '/home/user/project',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      connectionId: 'demo-1',
      success: true,
      executionTime: 0.1
    },
    {
      id: '3',
      command: 'git status',
      output: 'On branch main\nYour branch is up to date with \'origin/main\'.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      connectionId: 'demo-1',
      success: true,
      executionTime: 0.5
    },
    {
      id: '4',
      command: 'invalid_command',
      output: 'bash: invalid_command: command not found',
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      connectionId: 'demo-1',
      success: false,
      executionTime: 0.0
    },
    {
      id: '5',
      command: 'docker ps',
      output: 'CONTAINER ID   IMAGE     COMMAND   CREATED         STATUS         PORTS     NAMES',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      connectionId: 'demo-2',
      success: true,
      executionTime: 0.8
    }
  ])

  const activeTerminal = terminals.find(t => t.id === activeTerminalId)
  const connection = activeTerminal ? connections.find(c => c.id === activeTerminal.connectionId) : null

  const filteredCommands = commandHistory.filter(cmd => {
    const matchesSearch = cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cmd.output.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterSuccess === 'all' || 
                         (filterSuccess === 'success' && cmd.success) ||
                         (filterSuccess === 'failed' && !cmd.success)
    return matchesSearch && matchesFilter
  })

  const handleCommandSelect = (commandId: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedCommands(prev => {
        const newSet = new Set(prev)
        if (newSet.has(commandId)) {
          newSet.delete(commandId)
        } else {
          newSet.add(commandId)
        }
        return newSet
      })
    } else {
      setSelectedCommands(new Set([commandId]))
    }
  }

  const handleReuseCommand = (command: string) => {
    if (connection) {
      // In a real implementation, this would send the command to the active terminal
      toast.success(`Command copied: ${command}`)
      navigator.clipboard.writeText(command)
    } else {
      toast.error('No active connection')
    }
  }

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
    toast.success('Command copied to clipboard')
  }

  const handleDeleteCommands = () => {
    if (selectedCommands.size === 0) return

    if (confirm(`Are you sure you want to delete ${selectedCommands.size} selected command(s)?`)) {
      setCommandHistory(prev => prev.filter(cmd => !selectedCommands.has(cmd.id)))
      setSelectedCommands(new Set())
      toast.success('Commands deleted successfully')
    }
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all command history?')) {
      setCommandHistory([])
      setSelectedCommands(new Set())
      toast.success('Command history cleared')
    }
  }

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getConnectionName = (connectionId: string): string => {
    const conn = connections.find(c => c.id === connectionId)
    return conn ? conn.name : 'Unknown'
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="w-full justify-start h-auto p-3"
      >
        <History className="w-4 h-4 mr-3" />
        History
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-border/50 bg-card/95 backdrop-blur-md h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Command History</CardTitle>
                  <CardDescription>
                    View and reuse previously executed commands
                  </CardDescription>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search commands or output..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={filterSuccess === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuccess('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterSuccess === 'success' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuccess('success')}
                >
                  Success
                </Button>
                <Button
                  variant={filterSuccess === 'failed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuccess('failed')}
                >
                  Failed
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteCommands}
                  disabled={selectedCommands.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearHistory}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            {/* Command List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-1">Select</div>
                <div className="col-span-3">Command</div>
                <div className="col-span-2">Connection</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Actions</div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className={cn(
                      "px-4 py-3 grid grid-cols-12 gap-4 text-sm hover:bg-accent/50 border-b border-border/50",
                      selectedCommands.has(cmd.id) && "bg-primary/10 border-primary/20"
                    )}
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedCommands.has(cmd.id)}
                        onChange={() => handleCommandSelect(cmd.id, true)}
                        className="rounded"
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <div className="font-mono text-xs bg-muted/50 p-2 rounded border">
                        {cmd.command}
                      </div>
                    </div>
                    
                    <div className="col-span-2 text-muted-foreground">
                      {getConnectionName(cmd.connectionId)}
                    </div>
                    
                    <div className="col-span-2">
                      <Badge variant={cmd.success ? "success" : "destructive"}>
                        {cmd.success ? 'Success' : 'Failed'}
                      </Badge>
                      {cmd.executionTime > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {cmd.executionTime}s
                        </div>
                      )}
                    </div>
                    
                    <div className="col-span-2 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(cmd.timestamp)}
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReuseCommand(cmd.command)}
                        disabled={!connection}
                        title="Reuse command"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCommand(cmd.command)}
                        title="Copy command"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredCommands.length === 0 && (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    {searchQuery || filterSuccess !== 'all' 
                      ? 'No commands found matching your criteria' 
                      : 'No command history yet'
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                {selectedCommands.size > 0 ? (
                  <span>{selectedCommands.size} command(s) selected</span>
                ) : (
                  <span>{filteredCommands.length} command(s) in history</span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <span>Active connection: {connection ? connection.name : 'None'}</span>
                <Badge variant="outline">
                  {commandHistory.filter(cmd => cmd.success).length} successful, 
                  {commandHistory.filter(cmd => !cmd.success).length} failed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default CommandHistory

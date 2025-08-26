import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Upload,
  Download,
  Folder,
  File,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Home,
  Search,
  Plus,
  MoreVertical,
  Copy,
  Move,
  Edit3,
  X
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Progress } from './ui/progress'
import { sshService } from '../services/ssh-service'
import { useTerminalStore } from '../store/terminal-store'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

interface SftpFile {
  name: string
  type: 'file' | 'directory'
  size: number
  modified: Date
  permissions: string
  owner: string
  group: string
}

interface SftpTabProps {
  sftpId: string
  isActive: boolean
  onClose: () => void
}

const SftpTab: React.FC<SftpTabProps> = ({ sftpId, isActive, onClose }) => {
  const { connections, sftpTabs, updateSftpPath } = useTerminalStore()
  const sftpTab = sftpTabs.find(s => s.id === sftpId)
  const connection = sftpTab ? connections.find(c => c.id === sftpTab.connectionId) : null

  const [remoteFiles, setRemoteFiles] = useState<SftpFile[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [transferProgress, setTransferProgress] = useState<{ [key: string]: number }>({})
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [pathHistory, setPathHistory] = useState<string[]>([])

  const currentPath = sftpTab?.currentPath || '/'

  useEffect(() => {
    if (isActive && sftpTab && connection) {
      loadDirectory(currentPath)
    }
  }, [isActive, sftpTab, connection, currentPath])

  const loadDirectory = async (path: string) => {
    if (!connection || !sftpTab) return

    setLoading(true)
    try {
      const files = await sshService.listDirectory(sftpTab.connectionId, path)
      
      const sftpFiles: SftpFile[] = files.map(file => ({
        name: file.filename,
        type: (file.attrs.mode & 0o040000) ? 'directory' : 'file',
        size: file.attrs.size || 0,
        modified: new Date((file.attrs.mtime || Date.now() / 1000) * 1000),
        permissions: file.attrs.mode ? file.attrs.mode.toString(8) : '644',
        owner: file.attrs.uid?.toString() || 'unknown',
        group: file.attrs.gid?.toString() || 'unknown'
      }))

      setRemoteFiles(sftpFiles)
    } catch (error) {
      console.error('Failed to load directory:', error)
      toast.error(`Failed to load directory: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const navigateToPath = (path: string) => {
    if (path !== currentPath && sftpTab) {
      setPathHistory(prev => [...prev, currentPath])
      updateSftpPath(sftpTab.id, path)
    }
  }

  const goBack = () => {
    if (pathHistory.length > 0 && sftpTab) {
      const previousPath = pathHistory[pathHistory.length - 1]
      setPathHistory(prev => prev.slice(0, -1))
      updateSftpPath(sftpTab.id, previousPath)
    }
  }

  const goToParent = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    navigateToPath(parentPath)
  }

  const handleFileClick = (file: SftpFile) => {
    if (file.type === 'directory') {
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`
      navigateToPath(newPath)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const filteredFiles = remoteFiles
    .filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'date':
          comparison = a.modified.getTime() - b.modified.getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (!sftpTab || !connection) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">SFTP tab not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background mat-card">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Folder className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">SFTP File Manager</CardTitle>
              <p className="text-sm text-muted-foreground">
                {connection.username}@{connection.host}:{currentPath}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={pathHistory.length === 0}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToParent}
              disabled={currentPath === '/'}
            >
              <Home className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDirectory(currentPath)}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            
            <Select value={sortBy} onValueChange={(value: 'name' | 'size' | 'date') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolder(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Folder
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.click()
              }}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto max-h-[60vh] pr-2">
            <div className="grid gap-1">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No files in this directory
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors mat-ripple",
                      selectedFiles.has(file.name) && "bg-primary/10 border border-primary/20"
                    )}
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      {file.type === 'directory' ? (
                        <Folder className="w-5 h-5 text-blue-500" />
                      ) : (
                        <File className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {file.type === 'file' && formatFileSize(file.size)}
                        {file.type === 'file' && ' • '}
                        {formatDate(file.modified)}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {file.type === 'file' && (
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Move className="w-4 h-4 mr-2" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm mt-4">
          <div>
            {filteredFiles.length} items • {selectedFiles.size} selected
          </div>
          <div className="text-muted-foreground">
            {connection.host}:{currentPath}
          </div>
        </div>
      </CardContent>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowNewFolder(false)
                  setNewFolderName('')
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowNewFolder(false)
              setNewFolderName('')
            }} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SftpTab
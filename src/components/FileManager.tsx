import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Home,
  ArrowUp,
  Search,
  MoreVertical,
  X
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { sshService } from '../services/ssh-service'
import { useTerminalStore } from '../store/terminal-store'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

interface FileItem {
  name: string
  isDirectory: boolean
  size?: number
  modified?: Date
  permissions?: string
}

const FileManager: React.FC = () => {
  const { activeTerminalId, terminals, connections } = useTerminalStore()
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isOpen, setIsOpen] = useState(false)

  const activeTerminal = terminals.find(t => t.id === activeTerminalId)
  const connection = activeTerminal ? connections.find(c => c.id === activeTerminal.connectionId) : null

  useEffect(() => {
    if (isOpen && connection) {
      loadFiles()
    }
  }, [isOpen, currentPath, connection])

  const loadFiles = async () => {
    if (!connection) return

    setIsLoading(true)
    try {
      const fileList = await sshService.getFileList(connection.id, currentPath)
      const fileItems: FileItem[] = fileList.map(name => ({
        name,
        isDirectory: name.endsWith('/'),
        size: Math.floor(Math.random() * 1000000), // Mock size
        modified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Mock date
        permissions: '-rw-r--r--' // Mock permissions
      }))
      setFiles(fileItems)
    } catch (error) {
      console.error('Failed to load files:', error)
      toast.error('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileClick = (file: FileItem) => {
    if (file.isDirectory) {
      setCurrentPath(prev => prev.endsWith('/') ? prev + file.name : prev + '/' + file.name)
    }
  }

  const handleFileSelect = (fileName: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        if (newSet.has(fileName)) {
          newSet.delete(fileName)
        } else {
          newSet.add(fileName)
        }
        return newSet
      })
    } else {
      setSelectedFiles(new Set([fileName]))
    }
  }

  const handleUpload = async () => {
    if (!connection || selectedFiles.size === 0) return

    // Mock file upload
    toast.success(`Uploading ${selectedFiles.size} file(s)...`)
    setSelectedFiles(new Set())
  }

  const handleDownload = async () => {
    if (!connection || selectedFiles.size === 0) return

    // Mock file download
    toast.success(`Downloading ${selectedFiles.size} file(s)...`)
    setSelectedFiles(new Set())
  }

  const handleDelete = async () => {
    if (!connection || selectedFiles.size === 0) return

    if (confirm(`Are you sure you want to delete ${selectedFiles.size} selected item(s)?`)) {
      try {
        for (const fileName of selectedFiles) {
          await sshService.deleteFile(connection.id, currentPath + '/' + fileName)
        }
        toast.success('Files deleted successfully')
        setSelectedFiles(new Set())
        loadFiles()
      } catch (error) {
        toast.error('Failed to delete files')
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!connection) return

    const folderName = prompt('Enter folder name:')
    if (folderName) {
      try {
        await sshService.createDirectory(connection.id, currentPath + '/' + folderName)
        toast.success('Folder created successfully')
        loadFiles()
      } catch (error) {
        toast.error('Failed to create folder')
      }
    }
  }

  const navigateUp = () => {
    if (currentPath === '/') return
    const newPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    setCurrentPath(newPath)
  }

  const navigateHome = () => {
    setCurrentPath('/home/' + (connection?.username || 'user'))
  }

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="w-full justify-start h-auto p-3"
      >
        <Folder className="w-4 h-4 mr-3" />
        File Manager
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
                  <Folder className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">File Manager</CardTitle>
                  <CardDescription>
                    {connection ? `Connected to ${connection.host}` : 'No active connection'}
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
            {/* Navigation Bar */}
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateHome}
                disabled={!connection}
              >
                <Home className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateUp}
                disabled={currentPath === '/'}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex-1 px-2 py-1 bg-background rounded border text-sm font-mono">
                {currentPath}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={loadFiles}
                disabled={!connection || isLoading}
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateFolder}
                  disabled={!connection}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpload}
                  disabled={!connection || selectedFiles.size === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!connection || selectedFiles.size === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={!connection || selectedFiles.size === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* File List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Modified</div>
                <div className="col-span-2">Permissions</div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredFiles.map((file, index) => (
                  <div
                    key={index}
                    className={cn(
                      "px-4 py-2 grid grid-cols-12 gap-4 text-sm hover:bg-accent/50 cursor-pointer border-b border-border/50",
                      selectedFiles.has(file.name) && "bg-primary/10 border-primary/20"
                    )}
                    onClick={() => handleFileClick(file)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      handleFileSelect(file.name, true)
                    }}
                  >
                    <div className="col-span-6 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.name)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleFileSelect(file.name, true)
                        }}
                        className="rounded"
                      />
                      {file.isDirectory ? (
                        <Folder className="w-4 h-4 text-blue-500" />
                      ) : (
                        <File className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={cn(
                        "truncate",
                        file.isDirectory && "font-medium text-blue-600"
                      )}>
                        {file.name}
                      </span>
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {file.isDirectory ? '--' : formatFileSize(file.size || 0)}
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {file.modified ? formatDate(file.modified) : '--'}
                    </div>
                    <div className="col-span-2 text-muted-foreground font-mono text-xs">
                      {file.permissions || '--'}
                    </div>
                  </div>
                ))}
                
                {filteredFiles.length === 0 && !isLoading && (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    {searchQuery ? 'No files found matching your search' : 'No files in this directory'}
                  </div>
                )}
                
                {isLoading && (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading files...
                  </div>
                )}
              </div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                {selectedFiles.size > 0 ? (
                  <span>{selectedFiles.size} item(s) selected</span>
                ) : (
                  <span>{filteredFiles.length} item(s)</span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <span>Current path: {currentPath}</span>
                {connection && (
                  <Badge variant="outline">
                    Connected to {connection.host}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default FileManager

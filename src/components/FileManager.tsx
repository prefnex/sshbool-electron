import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FolderOpen, 
  File, 
  Upload, 
  Download, 
  RefreshCw, 
  ArrowLeft,
  Search,
  Grid,
  List,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  X,
  Folder,
  FileText,
  Image,
  Archive,
  Code,
  Database
} from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { sshService } from '../services/ssh-service'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import toast from 'react-hot-toast'

interface FileItem {
  name: string
  type: 'file' | 'directory'
  size: number
  modified: Date
  permissions: string
  owner: string
  group: string
}

interface FileManagerProps {
  isOpen: boolean
  onClose: () => void
}

const FileManager: React.FC<FileManagerProps> = ({ isOpen, onClose }) => {
  const { connections, activeTerminalId, terminals } = useTerminalStore()
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const activeTerminal = terminals.find(t => t.id === activeTerminalId)
  const connection = activeTerminal ? connections.find(c => c.id === activeTerminal.connectionId) : null

  useEffect(() => {
    if (isOpen && connection) {
      loadDirectory(currentPath)
    }
  }, [isOpen, connection, currentPath])

  const loadDirectory = async (path: string) => {
    if (!connection) return

    setIsLoading(true)
    try {
      const items = await sshService.listDirectory(connection.id, path)
      const formattedFiles: FileItem[] = items.map(item => ({
        name: item.filename,
        type: item.attrs.isDirectory() ? 'directory' : 'file',
        size: item.attrs.size || 0,
        modified: new Date(item.attrs.mtime * 1000),
        permissions: item.attrs.mode ? item.attrs.mode.toString(8) : '0755',
        owner: 'user',
        group: 'user'
      }))
      
      // Sort: directories first, then files, alphabetically
      formattedFiles.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      setFiles(formattedFiles)
    } catch (error) {
      console.error('Failed to load directory:', error)
      toast.error(`Failed to load directory: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNavigate = (itemName: string) => {
    if (itemName === '..') {
      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
      setCurrentPath(parentPath)
    } else {
      const newPath = currentPath === '/' ? `/${itemName}` : `${currentPath}/${itemName}`
      setCurrentPath(newPath)
    }
  }

  const handleFileSelect = (fileName: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName)
    } else {
      newSelected.add(fileName)
    }
    setSelectedFiles(newSelected)
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || !connection) return

    for (const file of Array.from(files)) {
      try {
        const remotePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`
        
        // Create a temporary local file path (in real implementation, use proper file handling)
        const localPath = `/tmp/${file.name}`
        
        toast.info(`Uploading ${file.name}...`)
        const success = await sshService.uploadFile(connection.id, localPath, remotePath)
        
        if (success) {
          toast.success(`${file.name} uploaded successfully`)
        } else {
          toast.error(`Failed to upload ${file.name}`)
        }
      } catch (error) {
        toast.error(`Upload failed: ${error.message}`)
      }
    }

    // Reload directory
    loadDirectory(currentPath)
    event.target.value = '' // Reset input
  }

  const handleDownload = async (fileName: string) => {
    if (!connection) return

    try {
      const remotePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
      const localPath = `/tmp/${fileName}` // In real implementation, use proper download location
      
      toast.info(`Downloading ${fileName}...`)
      const success = await sshService.downloadFile(connection.id, remotePath, localPath)
      
      if (success) {
        toast.success(`${fileName} downloaded successfully`)
      } else {
        toast.error(`Failed to download ${fileName}`)
      }
    } catch (error) {
      toast.error(`Download failed: ${error.message}`)
    }
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <Folder className="w-5 h-5 text-blue-500" />
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'txt':
      case 'md':
      case 'log':
        return <FileText className="w-5 h-5 text-gray-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="w-5 h-5 text-green-500" />
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'html':
      case 'css':
        return <Code className="w-5 h-5 text-purple-500" />
      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
      case '7z':
        return <Archive className="w-5 h-5 text-orange-500" />
      case 'sql':
      case 'db':
      case 'sqlite':
        return <Database className="w-5 h-5 text-cyan-500" />
      default:
        return <File className="w-5 h-5 text-gray-400" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Add parent directory entry if not at root
  const displayFiles = currentPath !== '/' ? 
    [{ name: '..', type: 'directory' as const, size: 0, modified: new Date(), permissions: '', owner: '', group: '' }, ...filteredFiles] :
    filteredFiles

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-6xl h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">SFTP File Manager</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {connection ? `${connection.username}@${connection.host}` : 'No connection'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Navigation and Actions */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => currentPath !== '/' && handleNavigate('..')}
                    disabled={currentPath === '/' || isLoading}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex-1 max-w-md">
                    <Input
                      placeholder="Current path"
                      value={currentPath}
                      onChange={(e) => setCurrentPath(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadDirectory(currentPath)}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadDirectory(currentPath)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </Button>

                  <input
                    type="file"
                    multiple
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={!connection}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading directory...</p>
                  </div>
                </div>
              ) : !connection ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Connection</h3>
                    <p className="text-muted-foreground">Please connect to a server first</p>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  {viewMode === 'list' ? (
                    <div className="space-y-1">
                      {displayFiles.map((file, index) => (
                        <motion.div
                          key={file.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer group",
                            selectedFiles.has(file.name) && "bg-accent"
                          )}
                          onClick={() => file.type === 'directory' ? handleNavigate(file.name) : handleFileSelect(file.name)}
                        >
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.type === 'file' && `${formatFileSize(file.size)} • `}
                              {formatDate(file.modified)}
                            </p>
                          </div>
                          
                          {file.type === 'file' && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleDownload(file.name)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Path
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {displayFiles.map((file, index) => (
                        <motion.div
                          key={file.name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "p-3 rounded-lg border border-border hover:bg-accent cursor-pointer text-center",
                            selectedFiles.has(file.name) && "bg-accent border-primary"
                          )}
                          onClick={() => file.type === 'directory' ? handleNavigate(file.name) : handleFileSelect(file.name)}
                        >
                          <div className="flex justify-center mb-2">
                            {getFileIcon(file)}
                          </div>
                          <p className="text-sm font-medium truncate mb-1">{file.name}</p>
                          {file.type === 'file' && (
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {displayFiles.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Empty Directory</h3>
                        <p className="text-muted-foreground">No files or folders found</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FileManager

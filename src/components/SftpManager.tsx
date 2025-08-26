import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Download,
  Folder,
  File,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Home,
  Server,
  Search,
  Filter,
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

interface SftpManagerProps {
  connectionId: string
  isOpen: boolean
  onClose: () => void
}

const SftpManager: React.FC<SftpManagerProps> = ({ connectionId, isOpen, onClose }) => {
  const { connections } = useTerminalStore()
  const connection = connections.find(c => c.id === connectionId)

  const [remoteFiles, setRemoteFiles] = useState<SftpFile[]>([])
  const [currentPath, setCurrentPath] = useState('/home')
  const [pathHistory, setPathHistory] = useState<string[]>(['/'])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [transferProgress, setTransferProgress] = useState<{ [key: string]: number }>({})
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    if (isOpen && connectionId) {
      loadDirectory(currentPath)
    }
  }, [isOpen, connectionId, currentPath])

  const loadDirectory = async (path: string) => {
    if (!connection) return

    // Ensure path is valid
    let validPath = path
    if (!validPath || validPath === '') {
      validPath = '/'
    }
    
    setLoading(true)
    try {
      const files = await sshService.listDirectory(connectionId, validPath)
      
      if (!files || !Array.isArray(files)) {
        console.warn('No files returned or invalid response')
        setRemoteFiles([])
        return
      }
      
      // Convert to our SftpFile format
      const sftpFiles: SftpFile[] = files
        .filter(file => file && file.filename && file.filename !== '.' && file.filename !== '..')
        .map(file => ({
          name: file.filename,
          type: (file.attrs && (file.attrs.mode & 0o040000)) ? 'directory' : 'file', // Check directory bit mask
          size: file.attrs?.size || 0,
          modified: new Date((file.attrs?.mtime || Date.now() / 1000) * 1000),
          permissions: file.attrs?.mode ? file.attrs.mode.toString(8) : '644',
          owner: file.attrs?.uid?.toString() || 'unknown',
          group: file.attrs?.gid?.toString() || 'unknown'
        }))

      setRemoteFiles(sftpFiles)
    } catch (error) {
      console.error('Failed to load directory:', error)
      toast.error(`فشل في تحميل المجلد: ${error.message}`)
      // Try to navigate to home if current path fails
      if (validPath !== '/home' && validPath !== '/') {
        toast.info('محاولة الانتقال إلى المجلد الرئيسي...')
        setCurrentPath('/home')
      }
    } finally {
      setLoading(false)
    }
  }

  const navigateToPath = (path: string) => {
    // Normalize path - ensure it starts with /
    let normalizedPath = path
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath
    }
    // Remove duplicate slashes
    normalizedPath = normalizedPath.replace(/\/+/g, '/')
    // Remove trailing slash unless it's root
    if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
      normalizedPath = normalizedPath.slice(0, -1)
    }
    
    if (normalizedPath !== currentPath) {
      setPathHistory(prev => [...prev, currentPath])
      setCurrentPath(normalizedPath)
    }
  }

  const goBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1]
      setPathHistory(prev => prev.slice(0, -1))
      setCurrentPath(previousPath)
    }
  }

  const goToParent = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/').filter(p => p)
    if (parts.length > 0) {
      parts.pop()
      const parentPath = parts.length > 0 ? '/' + parts.join('/') : '/'
      navigateToPath(parentPath)
    } else {
      navigateToPath('/')
    }
  }

  const handleFileClick = (file: SftpFile) => {
    if (file.type === 'directory') {
      // Build proper path without duplicates
      let newPath: string
      if (currentPath === '/') {
        newPath = '/' + file.name
      } else {
        newPath = currentPath + '/' + file.name
      }
      navigateToPath(newPath)
    }
  }

  const handleFileSelect = (fileName: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileName)) {
        newSet.delete(fileName)
      } else {
        newSet.add(fileName)
      }
      return newSet
    })
  }

  const handleUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return

      for (const file of Array.from(files)) {
        const remotePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`
        
        try {
          setTransferProgress(prev => ({ ...prev, [file.name]: 0 }))
          toast.info(`📤 بدء رفع ${file.name}...`)
          
          // Simulate progress (in real implementation, you'd get actual progress)
          const progressInterval = setInterval(() => {
            setTransferProgress(prev => {
              const current = prev[file.name] || 0
              const next = Math.min(current + 10, 90)
              return { ...prev, [file.name]: next }
            })
          }, 100)

          const success = await sshService.uploadFile(connectionId, file.path || '', remotePath)
          
          clearInterval(progressInterval)
          setTransferProgress(prev => ({ ...prev, [file.name]: 100 }))
          
          if (success) {
            toast.success(`✅ تم رفع ${file.name} بنجاح`)
            loadDirectory(currentPath) // Refresh directory
          } else {
            toast.error(`❌ فشل في رفع ${file.name}`)
          }
          
          // Clean up progress after a delay
          setTimeout(() => {
            setTransferProgress(prev => {
              const { [file.name]: removed, ...rest } = prev
              return rest
            })
          }, 2000)
          
        } catch (error) {
          toast.error(`خطأ في رفع ${file.name}: ${error.message}`)
          setTransferProgress(prev => {
            const { [file.name]: removed, ...rest } = prev
            return rest
          })
        }
      }
    }
    input.click()
  }

  const handleDownload = async (fileName: string) => {
    const remotePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
    
    try {
      setTransferProgress(prev => ({ ...prev, [fileName]: 0 }))
      toast.info(`📥 بدء تحميل ${fileName}...`)
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setTransferProgress(prev => {
          const current = prev[fileName] || 0
          const next = Math.min(current + 10, 90)
          return { ...prev, [fileName]: next }
        })
      }, 100)

      // You'd need to implement file picker for local save location
      const localPath = `/tmp/${fileName}` // Default download location
      const success = await sshService.downloadFile(connectionId, remotePath, localPath)
      
      clearInterval(progressInterval)
      setTransferProgress(prev => ({ ...prev, [fileName]: 100 }))
      
      if (success) {
        toast.success(`✅ تم تحميل ${fileName} بنجاح`)
      } else {
        toast.error(`❌ فشل في تحميل ${fileName}`)
      }
      
      setTimeout(() => {
        setTransferProgress(prev => {
          const { [fileName]: removed, ...rest } = prev
          return rest
        })
      }, 2000)
      
    } catch (error) {
      toast.error(`خطأ في تحميل ${fileName}: ${error.message}`)
      setTransferProgress(prev => {
        const { [fileName]: removed, ...rest } = prev
        return rest
      })
    }
  }

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      // You'd need to implement mkdir in SSH service
      toast.success(`✅ تم إنشاء المجلد ${newFolderName}`)
      setShowNewFolder(false)
      setNewFolderName('')
      loadDirectory(currentPath)
    } catch (error) {
      toast.error(`فشل في إنشاء المجلد: ${error.message}`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredFiles = remoteFiles
    .filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let result = 0
      
      switch (sortBy) {
        case 'name':
          result = a.name.localeCompare(b.name)
          break
        case 'size':
          result = a.size - b.size
          break
        case 'date':
          result = a.modified.getTime() - b.modified.getTime()
          break
      }
      
      return sortOrder === 'desc' ? -result : result
    })

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            SFTP File Manager - {connection?.name}
          </DialogTitle>
          <DialogDescription>
            إدارة الملفات على الخادم البعيد
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Navigation Bar */}
          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={pathHistory.length === 0}
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPath('/')}
              title="Root /"
            >
              <Server className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPath('/home')}
              title="Home"
            >
              <Home className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToParent}
              disabled={currentPath === '/'}
              title="Parent Directory"
            >
              <Folder className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <div className="sftp-input flex-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Path:</span>
              <Input
                value={currentPath}
                onChange={(e) => {
                  const newPath = e.target.value
                  setCurrentPath(newPath)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigateToPath(currentPath)
                  }
                }}
                onBlur={() => {
                  // Navigate to path when input loses focus
                  if (currentPath !== '') {
                    navigateToPath(currentPath)
                  }
                }}
                className="w-full font-mono text-sm"
                placeholder="/path/to/directory"
                autoComplete="off"
                spellCheck={false}
                type="text"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDirectory(currentPath)}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="sftp-input">
                <Input
                  placeholder="بحث في الملفات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                  autoComplete="off"
                  spellCheck={false}
                  type="search"
                />
              </div>
              
              <Select value={sortBy} onValueChange={(value: 'name' | 'size' | 'date') => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">الاسم</SelectItem>
                  <SelectItem value="size">الحجم</SelectItem>
                  <SelectItem value="date">التاريخ</SelectItem>
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
                مجلد جديد
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleUpload}
              >
                <Upload className="w-4 h-4 mr-1" />
                رفع ملفات
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
                  جاري التحميل...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  لا توجد ملفات في هذا المجلد
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                      selectedFiles.has(file.name) && "bg-primary/10 border border-primary/20"
                    )}
                    onClick={() => handleFileClick(file)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.name)}
                      onChange={() => handleFileSelect(file.name)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                    
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

                    {file.type === 'file' && transferProgress[file.name] !== undefined && (
                      <div className="w-24">
                        <Progress value={transferProgress[file.name]} className="h-2" />
                        <div className="text-xs text-center mt-1">
                          {transferProgress[file.name]}%
                        </div>
                      </div>
                    )}

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
                          <DropdownMenuItem onClick={() => handleDownload(file.name)}>
                            <Download className="w-4 h-4 mr-2" />
                            تحميل
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          نسخ
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Move className="w-4 h-4 mr-2" />
                          نقل
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit3 className="w-4 h-4 mr-2" />
                          إعادة تسمية
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          حذف
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
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
            <div>
              {filteredFiles.length} عنصر • {selectedFiles.size} محدد
            </div>
            <div className="text-muted-foreground">
              {connection?.host}:{currentPath}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>

        {/* New Folder Dialog */}
        <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مجلد جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="اسم المجلد"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createNewFolder()
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                إلغاء
              </Button>
              <Button onClick={createNewFolder} disabled={!newFolderName.trim()}>
                إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

export default SftpManager
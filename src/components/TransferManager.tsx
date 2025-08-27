import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Upload,
  Download,
  Pause,
  Play,
  Square,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  File,
  Zap
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { useTransferStore, TransferTask } from '../store/transfer-store'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

interface TransferManagerProps {
  isOpen: boolean
  onClose: () => void
}

const TransferManager: React.FC<TransferManagerProps> = ({ isOpen, onClose }) => {
  const { 
    tasks, 
    activeTasks, 
    updateTaskStatus, 
    removeTask, 
    clearCompletedTasks, 
    clearAllTasks,
    pauseTask,
    resumeTask,
    cancelTask
  } = useTransferStore()

  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all')

  const getStatusIcon = (status: TransferTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'in-progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TransferTask['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'cancelled':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number) => {
    return formatFileSize(bytesPerSecond) + '/s'
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const duration = (endTime || new Date()).getTime() - startTime.getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'active':
        return task.status === 'pending' || task.status === 'in-progress'
      case 'completed':
        return task.status === 'completed'
      case 'failed':
        return task.status === 'failed'
      default:
        return true
    }
  })

  const activeTasksCount = tasks.filter(t => t.status === 'in-progress').length
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length
  const failedTasksCount = tasks.filter(t => t.status === 'failed').length

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-border/50 bg-card/95 backdrop-blur-md h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Transfer Manager</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Manage file uploads and downloads
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompletedTasks}
                  disabled={completedTasksCount === 0}
                >
                  Clear Completed
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllTasks}
                  disabled={tasks.length === 0}
                >
                  Clear All
                </Button>
                
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                  {activeTasksCount} Active
                </Badge>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  {completedTasksCount} Completed
                </Badge>
                {failedTasksCount > 0 && (
                  <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                    {failedTasksCount} Failed
                  </Badge>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-4">
              {['all', 'active', 'completed', 'failed'].map((filterOption) => (
                <Button
                  key={filterOption}
                  variant={filter === filterOption ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(filterOption as any)}
                  className="capitalize"
                >
                  {filterOption}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto space-y-2">
              <AnimatePresence>
                {filteredTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-muted-foreground"
                  >
                    <Zap className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No transfers found</p>
                    <p className="text-sm">Start uploading or downloading files to see them here</p>
                  </motion.div>
                ) : (
                  filteredTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {task.type === 'upload' ? (
                                <Upload className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Download className="w-4 h-4 text-green-500" />
                              )}
                              {getStatusIcon(task.status)}
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <File className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium truncate">{task.fileName}</span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getStatusColor(task.status))}
                                >
                                  {task.status}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{task.connectionName}</span>
                                <span>•</span>
                                <span>{formatFileSize(task.size)}</span>
                                {task.status === 'in-progress' && (
                                  <>
                                    <span>•</span>
                                    <span>{formatSpeed(task.speed)}</span>
                                  </>
                                )}
                                <span>•</span>
                                <span>{formatDuration(task.startTime, task.endTime)}</span>
                              </div>

                              {task.status === 'in-progress' && (
                                <div className="mt-2">
                                  <Progress value={task.progress} className="h-2" />
                                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>{formatFileSize(task.transferredSize)} / {formatFileSize(task.size)}</span>
                                    <span>{Math.round(task.progress)}%</span>
                                  </div>
                                </div>
                              )}

                              {task.error && (
                                <div className="mt-2 text-xs text-red-500 bg-red-500/10 p-2 rounded">
                                  {task.error}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-4">
                            {task.status === 'in-progress' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => pauseTask(task.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pause className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => cancelTask(task.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                >
                                  <Square className="w-4 h-4" />
                                </Button>
                              </>
                            )}

                            {task.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resumeTask(task.id)}
                                className="h-8 w-8 p-0 text-green-500 hover:text-green-600"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTask(task.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default TransferManager
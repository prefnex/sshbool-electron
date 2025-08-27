import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TransferTask {
  id: string
  type: 'upload' | 'download'
  fileName: string
  localPath: string
  remotePath: string
  connectionId: string
  connectionName: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  size: number
  transferredSize: number
  speed: number // bytes per second
  startTime: Date
  endTime?: Date
  error?: string
}

export interface TransferState {
  tasks: TransferTask[]
  activeTasks: Set<string>
  
  // Actions
  addTask: (task: Omit<TransferTask, 'id' | 'startTime' | 'progress' | 'transferredSize' | 'speed'>) => string
  updateTaskProgress: (id: string, progress: number, transferredSize: number, speed: number) => void
  updateTaskStatus: (id: string, status: TransferTask['status'], error?: string) => void
  removeTask: (id: string) => void
  clearCompletedTasks: () => void
  clearAllTasks: () => void
  pauseTask: (id: string) => void
  resumeTask: (id: string) => void
  cancelTask: (id: string) => void
}

export const useTransferStore = create<TransferState>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeTasks: new Set(),

      addTask: (taskData) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const task: TransferTask = {
          ...taskData,
          id,
          startTime: new Date(),
          progress: 0,
          transferredSize: 0,
          speed: 0
        }

        set(state => ({
          tasks: [task, ...state.tasks],
          activeTasks: new Set([...state.activeTasks, id])
        }))

        return id
      },

      updateTaskProgress: (id, progress, transferredSize, speed) => {
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id
              ? { ...task, progress, transferredSize, speed }
              : task
          )
        }))
      },

      updateTaskStatus: (id, status, error) => {
        set(state => {
          const newActiveTasks = new Set(state.activeTasks)
          if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            newActiveTasks.delete(id)
          }

          return {
            tasks: state.tasks.map(task =>
              task.id === id
                ? { 
                    ...task, 
                    status, 
                    error,
                    endTime: status === 'completed' || status === 'failed' || status === 'cancelled' 
                      ? new Date() 
                      : task.endTime
                  }
                : task
            ),
            activeTasks: newActiveTasks
          }
        })
      },

      removeTask: (id) => {
        set(state => {
          const newActiveTasks = new Set(state.activeTasks)
          newActiveTasks.delete(id)
          
          return {
            tasks: state.tasks.filter(task => task.id !== id),
            activeTasks: newActiveTasks
          }
        })
      },

      clearCompletedTasks: () => {
        set(state => ({
          tasks: state.tasks.filter(task => 
            task.status !== 'completed' && task.status !== 'failed'
          )
        }))
      },

      clearAllTasks: () => {
        set({ tasks: [], activeTasks: new Set() })
      },

      pauseTask: (id) => {
        // Implementation would depend on the actual transfer service
        set(state => {
          const newActiveTasks = new Set(state.activeTasks)
          newActiveTasks.delete(id)
          
          return {
            activeTasks: newActiveTasks,
            tasks: state.tasks.map(task =>
              task.id === id ? { ...task, status: 'pending' as const } : task
            )
          }
        })
      },

      resumeTask: (id) => {
        set(state => ({
          activeTasks: new Set([...state.activeTasks, id]),
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, status: 'in-progress' as const } : task
          )
        }))
      },

      cancelTask: (id) => {
        set(state => {
          const newActiveTasks = new Set(state.activeTasks)
          newActiveTasks.delete(id)
          
          return {
            activeTasks: newActiveTasks,
            tasks: state.tasks.map(task =>
              task.id === id 
                ? { ...task, status: 'cancelled' as const, endTime: new Date() }
                : task
            )
          }
        })
      }
    }),
    {
      name: 'flyterm-transfers',
      partialize: (state) => ({
        tasks: state.tasks.filter(task => 
          task.status === 'completed' || task.status === 'failed'
        ) // Only persist completed/failed tasks for history
      })
    }
  )
)
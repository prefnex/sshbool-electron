import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Connection {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  connectionType: 'password' | 'privateKey'
  lastConnected?: Date
  isConnected: boolean
  color: string
}

export interface Terminal {
  id: string
  connectionId: string
  title: string
  isActive: boolean
  hasUnreadOutput: boolean
  lastActivity: Date
}

export interface TerminalState {
  connections: Connection[]
  terminals: Terminal[]
  activeTerminalId: string | null
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  terminalTheme: string
  fontSize: number
  fontFamily: string
  showLineNumbers: boolean
  showStatusBar: boolean
  
  // Actions
  addConnection: (connection: Omit<Connection, 'id' | 'isConnected'>) => void
  updateConnection: (id: string, updates: Partial<Connection>) => void
  deleteConnection: (id: string) => void
  setConnectionStatus: (id: string, isConnected: boolean) => void
  
  addTerminal: (terminal: Omit<Terminal, 'id' | 'isActive' | 'hasUnreadOutput' | 'lastActivity'>) => void
  removeTerminal: (id: string) => void
  setActiveTerminal: (id: string) => void
  updateTerminalActivity: (id: string) => void
  setTerminalUnread: (id: string, hasUnread: boolean) => void
  
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setTerminalTheme: (themeId: string) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  toggleLineNumbers: () => void
  toggleStatusBar: () => void
}

const defaultConnections: Connection[] = []

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      connections: defaultConnections,
      terminals: [],
      activeTerminalId: null,
      sidebarCollapsed: false,
      theme: 'dark',
      terminalTheme: 'flyterm-pro',
      fontSize: 15,
      fontFamily: 'JetBrains Mono',
      showLineNumbers: true,
      showStatusBar: true,

      addConnection: (connection) => set((state) => {
        const newConnection = {
          ...connection,
          id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isConnected: false
        }
        return {
          connections: [...state.connections, newConnection]
        }
      }),

      updateConnection: (id, updates) => set((state) => ({
        connections: state.connections.map(conn =>
          conn.id === id ? { ...conn, ...updates } : conn
        )
      })),

      deleteConnection: (id) => set((state) => ({
        connections: state.connections.filter(conn => conn.id !== id),
        terminals: state.terminals.filter(term => term.connectionId !== id)
      })),

      setConnectionStatus: (id, isConnected) => set((state) => ({
        connections: state.connections.map(conn =>
          conn.id === id ? { ...conn, isConnected, lastConnected: isConnected ? new Date() : undefined } : conn
        )
      })),

      addTerminal: (terminal) => set((state) => {
        const newTerminal: Terminal = {
          ...terminal,
          id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isActive: false,
          hasUnreadOutput: false,
          lastActivity: new Date()
        }
        
        return {
          terminals: [...state.terminals, newTerminal],
          activeTerminalId: newTerminal.id
        }
      }),

      removeTerminal: (id) => set((state) => {
        const newTerminals = state.terminals.filter(term => term.id !== id)
        let newActiveTerminalId = state.activeTerminalId
        
        if (state.activeTerminalId === id) {
          newActiveTerminalId = newTerminals.length > 0 ? newTerminals[0].id : null
        }
        
        return {
          terminals: newTerminals,
          activeTerminalId: newActiveTerminalId
        }
      }),

      setActiveTerminal: (id) => set((state) => ({
        terminals: state.terminals.map(term => ({
          ...term,
          isActive: term.id === id,
          hasUnreadOutput: term.id === id ? false : term.hasUnreadOutput
        })),
        activeTerminalId: id
      })),

      updateTerminalActivity: (id) => set((state) => ({
        terminals: state.terminals.map(term =>
          term.id === id ? { ...term, lastActivity: new Date() } : term
        )
      })),

      setTerminalUnread: (id, hasUnread) => set((state) => ({
        terminals: state.terminals.map(term =>
          term.id === id ? { ...term, hasUnreadOutput: hasUnread } : term
        )
      })),

      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),

      setTheme: (theme) => set({ theme }),
      setTerminalTheme: (terminalTheme) => set({ terminalTheme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      toggleLineNumbers: () => set((state) => ({ showLineNumbers: !state.showLineNumbers })),
      toggleStatusBar: () => set((state) => ({ showStatusBar: !state.showStatusBar }))
    }),
    {
      name: 'flyterm-storage',
      partialize: (state) => ({
        connections: state.connections,
        theme: state.theme,
        terminalTheme: state.terminalTheme,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        showLineNumbers: state.showLineNumbers,
        showStatusBar: state.showStatusBar
      })
    }
  )
)

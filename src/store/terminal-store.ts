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

export interface SftpTab {
  id: string
  connectionId: string
  title: string
  currentPath: string
  isActive: boolean
  lastActivity: Date
  isConnected: boolean
  pathHistory: string[]
  sessionData?: any // For storing SFTP session data
}

export interface TerminalState {
  connections: Connection[]
  terminals: Terminal[]
  sftpTabs: SftpTab[]
  activeTerminalId: string | null
  activeSftpId: string | null
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  terminalTheme: string
  fontSize: number
  fontFamily: string
  showLineNumbers: boolean
  showStatusBar: boolean
  language: 'en' | 'ar'
  
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
  
  addSftpTab: (sftpTab: Omit<SftpTab, 'id' | 'isActive' | 'lastActivity' | 'isConnected' | 'pathHistory'>) => void
  removeSftpTab: (id: string) => void
  setActiveSftp: (id: string) => void
  updateSftpPath: (id: string, path: string) => void
  setSftpConnectionStatus: (id: string, isConnected: boolean) => void
  updateSftpPathHistory: (id: string, pathHistory: string[]) => void
  
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setTerminalTheme: (themeId: string) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  toggleLineNumbers: () => void
  toggleStatusBar: () => void
  cleanupDuplicateConnections: () => void
  setLanguage: (language: 'en' | 'ar') => void
}

const defaultConnections: Connection[] = []

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      connections: defaultConnections,
      terminals: [],
      sftpTabs: [],
      activeTerminalId: null,
      activeSftpId: null,
      sidebarCollapsed: false,
      theme: 'dark',
      terminalTheme: 'flyterm-pro',
      fontSize: 15,
      fontFamily: 'JetBrains Mono',
      showLineNumbers: true,
      showStatusBar: true,
      language: 'en',

      addConnection: (connection) => set((state) => {
        // Check for duplicates based on host, port, and username
        const existing = state.connections.find(c => 
          c.host === connection.host && 
          c.port === connection.port && 
          c.username === connection.username
        )
        
        if (existing) {
          console.log('Connection already exists, updating instead of adding duplicate')
          return {
            connections: state.connections.map(c => 
              c.id === existing.id ? { ...c, ...connection, id: existing.id, isConnected: false } : c
            )
          }
        }
        
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
        terminals: state.terminals.filter(term => term.connectionId !== id),
        sftpTabs: state.sftpTabs.filter(sftp => sftp.connectionId !== id)
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
      toggleStatusBar: () => set((state) => ({ showStatusBar: !state.showStatusBar })),
      
      addSftpTab: (sftpTab) => set((state) => {
        const newSftpTab: SftpTab = {
          ...sftpTab,
          id: `sftp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isActive: false,
          lastActivity: new Date(),
          isConnected: false,
          pathHistory: [],
          currentPath: sftpTab.currentPath || '/'
        }
        
        return {
          sftpTabs: [...state.sftpTabs, newSftpTab],
          activeSftpId: newSftpTab.id
        }
      }),

      removeSftpTab: (id) => set((state) => {
        const newSftpTabs = state.sftpTabs.filter(sftp => sftp.id !== id)
        let newActiveSftpId = state.activeSftpId
        
        if (state.activeSftpId === id) {
          newActiveSftpId = newSftpTabs.length > 0 ? newSftpTabs[0].id : null
        }
        
        return {
          sftpTabs: newSftpTabs,
          activeSftpId: newActiveSftpId
        }
      }),

      setActiveSftp: (id) => set((state) => ({
        sftpTabs: state.sftpTabs.map(sftp => ({
          ...sftp,
          isActive: sftp.id === id
        })),
        activeSftpId: id
      })),

      updateSftpPath: (id, path) => set((state) => ({
        sftpTabs: state.sftpTabs.map(sftp =>
          sftp.id === id ? { ...sftp, currentPath: path, lastActivity: new Date() } : sftp
        )
      })),

      setSftpConnectionStatus: (id, isConnected) => set((state) => ({
        sftpTabs: state.sftpTabs.map(sftp =>
          sftp.id === id ? { ...sftp, isConnected, lastActivity: new Date() } : sftp
        )
      })),

      updateSftpPathHistory: (id, pathHistory) => set((state) => ({
        sftpTabs: state.sftpTabs.map(sftp =>
          sftp.id === id ? { ...sftp, pathHistory, lastActivity: new Date() } : sftp
        )
      })),
      
      cleanupDuplicateConnections: () => set((state) => {
        const seen = new Set<string>()
        const uniqueConnections: Connection[] = []
        
        for (const conn of state.connections) {
          const key = `${conn.host}:${conn.port}:${conn.username}`
          if (!seen.has(key)) {
            seen.add(key)
            uniqueConnections.push(conn)
          }
        }
        
        console.log(`Cleaned up ${state.connections.length - uniqueConnections.length} duplicate connections`)
        return { connections: uniqueConnections }
      }),
      
      setLanguage: (language) => set({ language })
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
        showStatusBar: state.showStatusBar,
        language: state.language
      })
    }
  )
)

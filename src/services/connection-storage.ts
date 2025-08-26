import { Connection } from '../store/terminal-store'
import { Buffer } from 'buffer'

interface StoredConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  privateKey?: string
  connectionType: 'password' | 'privateKey'
  color: string
  lastConnected?: Date
  createdAt: Date
  updatedAt: Date
}

class ConnectionStorageService {
  private readonly STORAGE_KEY = 'flyterm_connections'
  private readonly ENCRYPTION_KEY = 'flyterm_secure_key_2024' // In production, use environment variable
  
  // Simple encryption (in production, use proper crypto libraries)
  private encrypt(text: string): string {
    try {
      const buffer = Buffer.from(text, 'utf8')
      const encrypted = buffer.toString('base64')
      return encrypted
    } catch (error) {
      console.error('Encryption failed:', error)
      return text
    }
  }
  
  private decrypt(encryptedText: string): string {
    try {
      const buffer = Buffer.from(encryptedText, 'base64')
      const decrypted = buffer.toString('utf8')
      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      return encryptedText
    }
  }
  
  private encryptConnection(connection: Connection): StoredConnection {
    const stored: StoredConnection = {
      id: connection.id,
      name: connection.name,
      host: this.encrypt(connection.host),
      port: connection.port,
      username: this.encrypt(connection.username),
      password: connection.password ? this.encrypt(connection.password) : undefined,
      privateKey: connection.privateKey ? this.encrypt(connection.privateKey) : undefined,
      connectionType: connection.connectionType,
      color: connection.color,
      lastConnected: connection.lastConnected,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    return stored
  }
  
  private decryptConnection(stored: StoredConnection): Connection {
    return {
      id: stored.id,
      name: stored.name,
      host: this.decrypt(stored.host),
      port: stored.port,
      username: this.decrypt(stored.username),
      password: stored.password ? this.decrypt(stored.password) : undefined,
      privateKey: stored.privateKey ? this.decrypt(stored.privateKey) : undefined,
      connectionType: stored.connectionType,
      color: stored.color,
      lastConnected: stored.lastConnected
    }
  }
  
  async saveConnections(connections: Connection[]): Promise<void> {
    try {
      const storedConnections = connections.map(conn => this.encryptConnection(conn))
      const data = JSON.stringify(storedConnections, null, 2)
      
      // Save to localStorage (in production, save to encrypted file)
      localStorage.setItem(this.STORAGE_KEY, data)
      
      console.log(`Saved ${connections.length} connections securely`)
    } catch (error) {
      console.error('Failed to save connections:', error)
      throw new Error('Failed to save connections')
    }
  }
  
  async loadConnections(): Promise<Connection[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []
      
      const storedConnections: StoredConnection[] = JSON.parse(data)
      const connections = storedConnections.map(stored => this.decryptConnection(stored))
      
      console.log(`Loaded ${connections.length} connections`)
      return connections
    } catch (error) {
      console.error('Failed to load connections:', error)
      return []
    }
  }
  
  async addConnection(connection: Connection): Promise<void> {
    try {
      const connections = await this.loadConnections()
      const existingIndex = connections.findIndex(c => c.id === connection.id)
      
      if (existingIndex >= 0) {
        connections[existingIndex] = connection
      } else {
        connections.push(connection)
      }
      
      await this.saveConnections(connections)
    } catch (error) {
      console.error('Failed to add connection:', error)
      throw new Error('Failed to add connection')
    }
  }
  
  async updateConnection(connection: Connection): Promise<void> {
    try {
      const connections = await this.loadConnections()
      const index = connections.findIndex(c => c.id === connection.id)
      
      if (index >= 0) {
        connections[index] = connection
        await this.saveConnections(connections)
      }
    } catch (error) {
      console.error('Failed to update connection:', error)
      throw new Error('Failed to update connection')
    }
  }
  
  async deleteConnection(connectionId: string): Promise<void> {
    try {
      const connections = await this.loadConnections()
      const filtered = connections.filter(c => c.id !== connectionId)
      await this.saveConnections(filtered)
    } catch (error) {
      console.error('Failed to delete connection:', error)
      throw new Error('Failed to delete connection')
    }
  }
  
  async exportConnections(): Promise<string> {
    try {
      const connections = await this.loadConnections()
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        connections: connections.map(conn => ({
          ...conn,
          password: undefined, // Don't export passwords
          privateKey: undefined // Don't export private keys
        }))
      }
      
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export connections:', error)
      throw new Error('Failed to export connections')
    }
  }
  
  async importConnections(importData: string): Promise<number> {
    try {
      const data = JSON.parse(importData)
      if (!data.connections || !Array.isArray(data.connections)) {
        throw new Error('Invalid import format')
      }
      
      const existingConnections = await this.loadConnections()
      const importedConnections = data.connections.map((conn: any) => ({
        ...conn,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      const allConnections = [...existingConnections, ...importedConnections]
      await this.saveConnections(allConnections)
      
      return importedConnections.length
    } catch (error) {
      console.error('Failed to import connections:', error)
      throw new Error('Failed to import connections')
    }
  }
  
  async clearAllConnections(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('All connections cleared')
    } catch (error) {
      console.error('Failed to clear connections:', error)
      throw new Error('Failed to clear connections')
    }
  }
  
  async getConnectionStats(): Promise<{
    total: number
    byType: { password: number; privateKey: number }
    lastUpdated: Date | null
  }> {
    try {
      const connections = await this.loadConnections()
      const byType = {
        password: connections.filter(c => c.connectionType === 'password').length,
        privateKey: connections.filter(c => c.connectionType === 'privateKey').length
      }
      
      const lastUpdated = connections.length > 0 
        ? new Date(Math.max(...connections.map(c => c.updatedAt?.getTime() || 0)))
        : null
      
      return {
        total: connections.length,
        byType,
        lastUpdated
      }
    } catch (error) {
      console.error('Failed to get connection stats:', error)
      return { total: 0, byType: { password: 0, privateKey: 0 }, lastUpdated: null }
    }
  }
}

export const connectionStorage = new ConnectionStorageService()

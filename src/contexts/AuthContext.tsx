import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Buffer } from 'buffer'

interface User {
  id: string
  username: string
  email?: string
  createdAt: Date
  lastLogin: Date
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  register: (username: string, password: string, email?: string) => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  deleteAccount: (password: string) => Promise<boolean>
  isLocked: boolean
  unlock: (password: string) => boolean
  lock: () => void
  autoLockEnabled: boolean
  setAutoLockEnabled: (enabled: boolean) => void
  lockTimeout: number
  setLockTimeout: (timeout: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Simple encryption for demonstration (in production, use proper crypto)
const encrypt = (text: string, key: string): string => {
  try {
    const combined = text + '|' + key
    return Buffer.from(combined).toString('base64')
  } catch {
    return text
  }
}

const decrypt = (encrypted: string, key: string): string => {
  try {
    const decoded = Buffer.from(encrypted, 'base64').toString('utf8')
    const [text] = decoded.split('|')
    return text
  } catch {
    return ''
  }
}

const hashPassword = (password: string): string => {
  // Simple hash (in production, use bcrypt or similar)
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [autoLockEnabled, setAutoLockEnabled] = useState(false)
  const [lockTimeout, setLockTimeout] = useState(30) // minutes
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Auto-lock timer
  useEffect(() => {
    if (!autoLockEnabled || !user || isLocked) return

    const checkAutoLock = () => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity
      const timeoutMs = lockTimeout * 60 * 1000

      if (timeSinceLastActivity > timeoutMs) {
        lock()
      }
    }

    const interval = setInterval(checkAutoLock, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [autoLockEnabled, lockTimeout, lastActivity, user, isLocked])

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now())
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
    }
  }, [])

  // Load user from storage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('flyterm-auth-user')
    const savedSession = localStorage.getItem('flyterm-auth-session')
    
    if (savedUser && savedSession) {
      try {
        const userData = JSON.parse(savedUser)
        setUser({
          ...userData,
          createdAt: new Date(userData.createdAt),
          lastLogin: new Date(userData.lastLogin)
        })
      } catch (error) {
        console.error('Failed to load user data:', error)
        localStorage.removeItem('flyterm-auth-user')
        localStorage.removeItem('flyterm-auth-session')
      }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const savedCredentials = localStorage.getItem(`flyterm-auth-${username}`)
      
      if (!savedCredentials) {
        return false // User doesn't exist
      }

      const credentials = JSON.parse(savedCredentials)
      const hashedPassword = hashPassword(password)

      if (credentials.password !== hashedPassword) {
        return false // Wrong password
      }

      const userData: User = {
        id: credentials.id,
        username,
        email: credentials.email,
        createdAt: new Date(credentials.createdAt),
        lastLogin: new Date()
      }

      setUser(userData)
      setIsLocked(false)
      
      // Save session
      localStorage.setItem('flyterm-auth-user', JSON.stringify(userData))
      localStorage.setItem('flyterm-auth-session', Date.now().toString())
      
      // Update last login
      localStorage.setItem(`flyterm-auth-${username}`, JSON.stringify({
        ...credentials,
        lastLogin: new Date().toISOString()
      }))

      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const register = async (username: string, password: string, email?: string): Promise<boolean> => {
    try {
      // Check if user already exists
      const existingUser = localStorage.getItem(`flyterm-auth-${username}`)
      if (existingUser) {
        return false // User already exists
      }

      const hashedPassword = hashPassword(password)
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const credentials = {
        id: userId,
        password: hashedPassword,
        email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }

      localStorage.setItem(`flyterm-auth-${username}`, JSON.stringify(credentials))

      // Auto-login after registration
      await login(username, password)
      
      return true
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setIsLocked(false)
    localStorage.removeItem('flyterm-auth-user')
    localStorage.removeItem('flyterm-auth-session')
  }

  const lock = () => {
    setIsLocked(true)
  }

  const unlock = (password: string): boolean => {
    if (!user) return false
    
    try {
      const savedCredentials = localStorage.getItem(`flyterm-auth-${user.username}`)
      if (!savedCredentials) return false

      const credentials = JSON.parse(savedCredentials)
      const hashedPassword = hashPassword(password)

      if (credentials.password === hashedPassword) {
        setIsLocked(false)
        setLastActivity(Date.now())
        return true
      }
      
      return false
    } catch {
      return false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false

    try {
      const savedCredentials = localStorage.getItem(`flyterm-auth-${user.username}`)
      if (!savedCredentials) return false

      const credentials = JSON.parse(savedCredentials)
      const currentHashedPassword = hashPassword(currentPassword)

      if (credentials.password !== currentHashedPassword) {
        return false // Wrong current password
      }

      const newHashedPassword = hashPassword(newPassword)
      const updatedCredentials = {
        ...credentials,
        password: newHashedPassword
      }

      localStorage.setItem(`flyterm-auth-${user.username}`, JSON.stringify(updatedCredentials))
      return true
    } catch (error) {
      console.error('Password change failed:', error)
      return false
    }
  }

  const deleteAccount = async (password: string): Promise<boolean> => {
    if (!user) return false

    try {
      const savedCredentials = localStorage.getItem(`flyterm-auth-${user.username}`)
      if (!savedCredentials) return false

      const credentials = JSON.parse(savedCredentials)
      const hashedPassword = hashPassword(password)

      if (credentials.password !== hashedPassword) {
        return false // Wrong password
      }

      // Delete all user data
      localStorage.removeItem(`flyterm-auth-${user.username}`)
      logout()
      
      return true
    } catch (error) {
      console.error('Account deletion failed:', error)
      return false
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !isLocked,
    login,
    logout,
    register,
    changePassword,
    deleteAccount,
    isLocked,
    unlock,
    lock,
    autoLockEnabled,
    setAutoLockEnabled,
    lockTimeout,
    setLockTimeout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Server, User, Lock, Key, Eye, EyeOff, Palette } from 'lucide-react'
import { useTerminalStore } from '../store/terminal-store'
import { connectionStorage } from '../services/connection-storage'
import { cn } from '../lib/utils'
import { isValidHostname, isValidPort, generateId } from '../lib/utils'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import toast from 'react-hot-toast'

interface ConnectionFormData {
  name: string
  host: string
  port: string
  username: string
  password: string
  privateKey: string
  connectionType: 'password' | 'privateKey'
  color: string
}

const ConnectionModal: React.FC = () => {
  const { addConnection } = useTerminalStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    host: '',
    port: '22',
    username: '',
    password: '',
    privateKey: '',
    connectionType: 'password',
    color: '#3B82F6'
  })

  const [errors, setErrors] = useState<Partial<ConnectionFormData>>({})

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'
  ]

  const validateForm = (): boolean => {
    const newErrors: Partial<ConnectionFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Connection name is required'
    }

    if (!formData.host.trim()) {
      newErrors.host = 'Host is required'
    } else if (!isValidHostname(formData.host)) {
      newErrors.host = 'Invalid hostname format'
    }

    if (!formData.port) {
      newErrors.port = 'Port is required'
    } else if (!isValidPort(formData.port)) {
      newErrors.port = 'Port must be between 1 and 65535'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }

    if (formData.connectionType === 'password' && !formData.password) {
      newErrors.password = 'Password is required for password authentication'
    }

    if (formData.connectionType === 'privateKey' && !formData.privateKey.trim()) {
      newErrors.privateKey = 'Private key is required for key-based authentication'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const newConnection = {
        name: formData.name.trim(),
        host: formData.host.trim(),
        port: parseInt(formData.port),
        username: formData.username.trim(),
        password: formData.connectionType === 'password' ? formData.password : undefined,
        privateKey: formData.connectionType === 'privateKey' ? formData.privateKey.trim() : undefined,
        connectionType: formData.connectionType,
        color: formData.color
      }

      // Add to store
      addConnection(newConnection)

      // Also save to persistent storage
      const connectionWithId = {
        ...newConnection,
        id: `conn-${Date.now()}`,
        isConnected: false
      }
      await connectionStorage.addConnection(connectionWithId)

      toast.success('Connection added successfully!')
      handleClose()
    } catch (error) {
      toast.error('Failed to add connection')
      console.error('Error adding connection:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setFormData({
      name: '',
      host: '',
      port: '22',
      username: '',
      password: '',
      privateKey: '',
      connectionType: 'password',
      color: '#3B82F6'
    })
    setErrors({})
  }

  const handleInputChange = (field: keyof ConnectionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="gradient"
        size="sm"
      >
        <Server className="w-4 h-4 mr-2" />
        New Connection
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="border-border/50 bg-card/95 backdrop-blur-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                      <Server className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">New Connection</CardTitle>
                      <CardDescription>Add a new SSH connection</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Connection Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Connection Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={cn(
                          errors.name && "border-destructive focus:border-destructive focus:ring-destructive"
                        )}
                        placeholder="My Server"
                      />
                      {errors.name && (
                        <p className="text-destructive text-xs">{errors.name}</p>
                      )}
                    </div>

                    {/* Host and Port */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="host">Host</Label>
                        <Input
                          id="host"
                          type="text"
                          value={formData.host}
                          onChange={(e) => handleInputChange('host', e.target.value)}
                          className={cn(
                            errors.host && "border-destructive focus:border-destructive focus:ring-destructive"
                          )}
                          placeholder="example.com"
                        />
                        {errors.host && (
                          <p className="text-destructive text-xs">{errors.host}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          type="number"
                          value={formData.port}
                          onChange={(e) => handleInputChange('port', e.target.value)}
                          className={cn(
                            errors.port && "border-destructive focus:border-destructive focus:ring-destructive"
                          )}
                          placeholder="22"
                          min="1"
                          max="65535"
                        />
                        {errors.port && (
                          <p className="text-destructive text-xs">{errors.port}</p>
                        )}
                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className={cn(
                            "pl-10",
                            errors.username && "border-destructive focus:border-destructive focus:ring-destructive"
                          )}
                          placeholder="root"
                        />
                      </div>
                      {errors.username && (
                        <p className="text-destructive text-xs">{errors.username}</p>
                      )}
                    </div>

                    {/* Authentication Type */}
                    <div className="space-y-2">
                      <Label>Authentication Method</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.connectionType === 'password' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleInputChange('connectionType', 'password')}
                          className="flex-1"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Password
                        </Button>
                        
                        <Button
                          type="button"
                          variant={formData.connectionType === 'privateKey' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleInputChange('connectionType', 'privateKey')}
                          className="flex-1"
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Private Key
                        </Button>
                      </div>
                    </div>

                    {/* Password or Private Key */}
                    {formData.connectionType === 'password' ? (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={cn(
                              "pl-10 pr-10",
                              errors.password && "border-destructive focus:border-destructive focus:ring-destructive"
                            )}
                            placeholder="Enter password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        {errors.password && (
                          <p className="text-destructive text-xs">{errors.password}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="privateKey">Private Key</Label>
                        <Textarea
                          id="privateKey"
                          value={formData.privateKey}
                          onChange={(e) => handleInputChange('privateKey', e.target.value)}
                          className={cn(
                            "h-24 resize-none",
                            errors.privateKey && "border-destructive focus:border-destructive focus:ring-destructive"
                          )}
                          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                        />
                        {errors.privateKey && (
                          <p className="text-destructive text-xs">{errors.privateKey}</p>
                        )}
                      </div>
                    )}

                    {/* Color Picker */}
                    <div className="space-y-2">
                      <Label>Connection Color</Label>
                      <div className="flex gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleInputChange('color', color)}
                            className={cn(
                              "w-8 h-8 rounded-lg border-2 transition-all duration-200",
                              formData.color === color
                                ? "border-foreground scale-110"
                                : "border-border hover:border-foreground/40"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full mt-6 btn-gradient"
                    >
                      Add Connection
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ConnectionModal

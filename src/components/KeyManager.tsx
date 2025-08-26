import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  Shield,
  Lock,
  Unlock,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Edit3
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

interface SSHKey {
  id: string
  name: string
  type: 'rsa' | 'ed25519' | 'ecdsa' | 'dsa'
  publicKey: string
  privateKey?: string
  fingerprint: string
  comment: string
  createdAt: Date
  isEncrypted: boolean
  keySize?: number
}

interface KeyManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectKey?: (key: SSHKey) => void
}

const KeyManager: React.FC<KeyManagerProps> = ({ isOpen, onClose, onSelectKey }) => {
  const [keys, setKeys] = useState<SSHKey[]>([])
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showKeyDetails, setShowKeyDetails] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<SSHKey | null>(null)
  const [showPrivateKey, setShowPrivateKey] = useState<{ [key: string]: boolean }>({})

  // New key form
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    type: 'ed25519' as const,
    keySize: 2048,
    comment: '',
    passphrase: '',
    confirmPassphrase: ''
  })

  // Import key form
  const [importForm, setImportForm] = useState({
    name: '',
    publicKey: '',
    privateKey: '',
    passphrase: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadKeys()
    }
  }, [isOpen])

  const loadKeys = async () => {
    // Load keys from localStorage for now
    // In real implementation, this would be from a secure store
    try {
      const storedKeys = localStorage.getItem('ssh-keys')
      if (storedKeys) {
        const parsedKeys = JSON.parse(storedKeys).map((key: any) => ({
          ...key,
          createdAt: new Date(key.createdAt)
        }))
        setKeys(parsedKeys)
      }
    } catch (error) {
      console.error('Failed to load keys:', error)
      toast.error('فشل في تحميل المفاتيح')
    }
  }

  const saveKeys = (updatedKeys: SSHKey[]) => {
    try {
      localStorage.setItem('ssh-keys', JSON.stringify(updatedKeys))
      setKeys(updatedKeys)
    } catch (error) {
      console.error('Failed to save keys:', error)
      toast.error('فشل في حفظ المفاتيح')
    }
  }

  const generateKey = async () => {
    if (!newKeyForm.name.trim()) {
      toast.error('يرجى إدخال اسم للمفتاح')
      return
    }

    if (newKeyForm.passphrase !== newKeyForm.confirmPassphrase) {
      toast.error('كلمات المرور غير متطابقة')
      return
    }

    try {
      // In real implementation, this would use a cryptographic library
      // For demo purposes, we'll create a mock key
      const newKey: SSHKey = {
        id: `key-${Date.now()}`,
        name: newKeyForm.name,
        type: newKeyForm.type,
        publicKey: generateMockPublicKey(newKeyForm.type, newKeyForm.keySize),
        privateKey: generateMockPrivateKey(newKeyForm.type, newKeyForm.keySize),
        fingerprint: generateMockFingerprint(),
        comment: newKeyForm.comment || `${newKeyForm.name}@flyterm`,
        createdAt: new Date(),
        isEncrypted: !!newKeyForm.passphrase,
        keySize: newKeyForm.keySize
      }

      const updatedKeys = [...keys, newKey]
      saveKeys(updatedKeys)
      
      setShowNewKeyDialog(false)
      setNewKeyForm({
        name: '',
        type: 'ed25519',
        keySize: 2048,
        comment: '',
        passphrase: '',
        confirmPassphrase: ''
      })
      
      toast.success(`✅ تم إنشاء المفتاح ${newKey.name} بنجاح`)
    } catch (error) {
      toast.error('فشل في إنشاء المفتاح')
    }
  }

  const importKey = async () => {
    if (!importForm.name.trim() || !importForm.publicKey.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      const keyType = detectKeyType(importForm.publicKey)
      const fingerprint = generateFingerprintFromKey(importForm.publicKey)

      const newKey: SSHKey = {
        id: `imported-${Date.now()}`,
        name: importForm.name,
        type: keyType,
        publicKey: importForm.publicKey,
        privateKey: importForm.privateKey || undefined,
        fingerprint,
        comment: extractCommentFromKey(importForm.publicKey) || `${importForm.name}@imported`,
        createdAt: new Date(),
        isEncrypted: !!importForm.passphrase && !!importForm.privateKey
      }

      const updatedKeys = [...keys, newKey]
      saveKeys(updatedKeys)
      
      setShowImportDialog(false)
      setImportForm({
        name: '',
        publicKey: '',
        privateKey: '',
        passphrase: ''
      })
      
      toast.success(`✅ تم استيراد المفتاح ${newKey.name} بنجاح`)
    } catch (error) {
      toast.error('فشل في استيراد المفتاح')
    }
  }

  const deleteKey = (keyId: string) => {
    const updatedKeys = keys.filter(key => key.id !== keyId)
    saveKeys(updatedKeys)
    toast.success('تم حذف المفتاح')
  }

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`تم نسخ ${description}`)
    } catch (error) {
      toast.error('فشل في النسخ')
    }
  }

  const exportKey = (key: SSHKey, type: 'public' | 'private') => {
    const content = type === 'public' ? key.publicKey : key.privateKey
    if (!content) {
      toast.error('المفتاح غير متوفر')
      return
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${key.name}_${type}.key`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(`تم تصدير المفتاح ${type === 'public' ? 'العام' : 'الخاص'}`)
  }

  // Helper functions for mock key generation
  const generateMockPublicKey = (type: string, keySize: number) => {
    const mockKey = 'AAAAB3NzaC1yc2EAAAADAQABAAACAQC7vbqm...' // Mock key
    return `ssh-${type} ${mockKey}`
  }

  const generateMockPrivateKey = (type: string, keySize: number) => {
    return `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAFwAAAAdzc2gtcn
NhAAAAAwEAAQAAAQEAu726qp...
-----END OPENSSH PRIVATE KEY-----`
  }

  const generateMockFingerprint = () => {
    const chars = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < 32; i++) {
      if (i > 0 && i % 2 === 0) result += ':'
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  }

  const detectKeyType = (publicKey: string): 'rsa' | 'ed25519' | 'ecdsa' | 'dsa' => {
    if (publicKey.includes('ssh-rsa')) return 'rsa'
    if (publicKey.includes('ssh-ed25519')) return 'ed25519'
    if (publicKey.includes('ecdsa-sha2')) return 'ecdsa'
    if (publicKey.includes('ssh-dss')) return 'dsa'
    return 'rsa'
  }

  const generateFingerprintFromKey = (publicKey: string) => {
    // Mock fingerprint generation
    return generateMockFingerprint()
  }

  const extractCommentFromKey = (publicKey: string) => {
    const parts = publicKey.trim().split(' ')
    return parts.length > 2 ? parts.slice(2).join(' ') : null
  }

  const getKeyTypeColor = (type: string) => {
    switch (type) {
      case 'ed25519': return 'bg-green-500'
      case 'rsa': return 'bg-blue-500'
      case 'ecdsa': return 'bg-purple-500'
      case 'dsa': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getKeyTypeIcon = (type: string) => {
    switch (type) {
      case 'ed25519': return <Shield className="w-4 h-4" />
      case 'rsa': return <Key className="w-4 h-4" />
      case 'ecdsa': return <Lock className="w-4 h-4" />
      case 'dsa': return <Unlock className="w-4 h-4" />
      default: return <Key className="w-4 h-4" />
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            SSH Key Manager
          </DialogTitle>
          <DialogDescription>
            إدارة مفاتيح SSH للاتصالات الآمنة
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {keys.length} مفتاح
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="w-4 h-4 mr-1" />
                استيراد مفتاح
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowNewKeyDialog(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                إنشاء مفتاح جديد
              </Button>
            </div>
          </div>

          {/* Keys List */}
          <div className="flex-1 overflow-auto">
            {keys.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا توجد مفاتيح</h3>
                <p className="text-sm">ابدأ بإنشاء مفتاح SSH جديد أو استيراد مفتاح موجود</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {keys.map((key) => (
                  <motion.div
                    key={key.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", getKeyTypeColor(key.type))}>
                            {getKeyTypeIcon(key.type)}
                          </div>
                          
                          <div>
                            <h3 className="font-medium">{key.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="secondary" className="text-xs">
                                {key.type.toUpperCase()}
                              </Badge>
                              {key.keySize && (
                                <span>{key.keySize} bits</span>
                              )}
                              {key.isEncrypted && (
                                <Badge variant="outline" className="text-xs">
                                  <Lock className="w-3 h-3 mr-1" />
                                  مشفر
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">البصمة:</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {key.fingerprint}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(key.fingerprint, 'البصمة')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">التعليق:</span>
                            <span className="text-xs">{key.comment}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                            <span className="text-xs">{key.createdAt.toLocaleDateString('ar')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.publicKey, 'المفتاح العام')}
                          title="نسخ المفتاح العام"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportKey(key, 'public')}
                          title="تصدير المفتاح العام"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        {key.privateKey && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportKey(key, 'private')}
                            title="تصدير المفتاح الخاص"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKeyDetails(key.id)}
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {onSelectKey && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              onSelectKey(key)
                              onClose()
                            }}
                          >
                            اختيار
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteKey(key.id)}
                          className="text-destructive hover:text-destructive"
                          title="حذف المفتاح"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>

        {/* New Key Dialog */}
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء مفتاح SSH جديد</DialogTitle>
              <DialogDescription>
                أنشئ زوج مفاتيح SSH جديد للاتصالات الآمنة
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">اسم المفتاح</Label>
                <Input
                  id="keyName"
                  placeholder="مثل: server-production"
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keyType">نوع المفتاح</Label>
                <Select value={newKeyForm.type} onValueChange={(value: any) => setNewKeyForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ed25519">Ed25519 (مُوصى به)</SelectItem>
                    <SelectItem value="rsa">RSA</SelectItem>
                    <SelectItem value="ecdsa">ECDSA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newKeyForm.type === 'rsa' && (
                <div className="space-y-2">
                  <Label htmlFor="keySize">حجم المفتاح</Label>
                  <Select value={newKeyForm.keySize.toString()} onValueChange={(value) => setNewKeyForm(prev => ({ ...prev, keySize: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2048">2048 bits</SelectItem>
                      <SelectItem value="3072">3072 bits</SelectItem>
                      <SelectItem value="4096">4096 bits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="comment">التعليق (اختياري)</Label>
                <Input
                  id="comment"
                  placeholder="user@hostname"
                  value={newKeyForm.comment}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, comment: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passphrase">كلمة المرور (اختياري)</Label>
                <Input
                  id="passphrase"
                  type="password"
                  placeholder="لحماية إضافية للمفتاح الخاص"
                  value={newKeyForm.passphrase}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, passphrase: e.target.value }))}
                />
              </div>
              
              {newKeyForm.passphrase && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassphrase">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassphrase"
                    type="password"
                    value={newKeyForm.confirmPassphrase}
                    onChange={(e) => setNewKeyForm(prev => ({ ...prev, confirmPassphrase: e.target.value }))}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={generateKey}>
                إنشاء المفتاح
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Key Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>استيراد مفتاح SSH</DialogTitle>
              <DialogDescription>
                استورد مفتاح SSH موجود من ملف أو نص
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="importName">اسم المفتاح</Label>
                <Input
                  id="importName"
                  placeholder="اسم وصفي للمفتاح"
                  value={importForm.name}
                  onChange={(e) => setImportForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="publicKeyImport">المفتاح العام *</Label>
                <Textarea
                  id="publicKeyImport"
                  placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAC..."
                  value={importForm.publicKey}
                  onChange={(e) => setImportForm(prev => ({ ...prev, publicKey: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="privateKeyImport">المفتاح الخاص (اختياري)</Label>
                <Textarea
                  id="privateKeyImport"
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                  value={importForm.privateKey}
                  onChange={(e) => setImportForm(prev => ({ ...prev, privateKey: e.target.value }))}
                  rows={4}
                />
              </div>
              
              {importForm.privateKey && (
                <div className="space-y-2">
                  <Label htmlFor="importPassphrase">كلمة مرور المفتاح الخاص</Label>
                  <Input
                    id="importPassphrase"
                    type="password"
                    placeholder="إذا كان المفتاح الخاص محمي بكلمة مرور"
                    value={importForm.passphrase}
                    onChange={(e) => setImportForm(prev => ({ ...prev, passphrase: e.target.value }))}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={importKey}>
                استيراد المفتاح
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Key Details Dialog */}
        {showKeyDetails && (
          <Dialog open={!!showKeyDetails} onOpenChange={() => setShowKeyDetails(null)}>
            <DialogContent className="max-w-3xl">
              {(() => {
                const key = keys.find(k => k.id === showKeyDetails)
                if (!key) return null
                
                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getKeyTypeIcon(key.type)}
                        تفاصيل المفتاح: {key.name}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>النوع</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{key.type.toUpperCase()}</Badge>
                            {key.keySize && <span className="text-sm text-muted-foreground">{key.keySize} bits</span>}
                          </div>
                        </div>
                        
                        <div>
                          <Label>الحالة</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {key.isEncrypted ? (
                              <Badge variant="outline" className="text-green-600">
                                <Lock className="w-3 h-3 mr-1" />
                                محمي
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600">
                                <Unlock className="w-3 h-3 mr-1" />
                                غير محمي
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>البصمة</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{key.fingerprint}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(key.fingerprint, 'البصمة')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <Label>المفتاح العام</Label>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(key.publicKey, 'المفتاح العام')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportKey(key, 'public')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={key.publicKey}
                          readOnly
                          rows={3}
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                      
                      {key.privateKey && (
                        <div>
                          <div className="flex items-center justify-between">
                            <Label>المفتاح الخاص</Label>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPrivateKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                              >
                                {showPrivateKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportKey(key, 'private')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <Textarea
                            value={showPrivateKey[key.id] ? key.privateKey : '••••••••••••••••••••••••••••••••'}
                            readOnly
                            rows={6}
                            className="mt-1 font-mono text-xs"
                          />
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowKeyDetails(null)}>
                        إغلاق
                      </Button>
                    </DialogFooter>
                  </>
                )
              })()}
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default KeyManager
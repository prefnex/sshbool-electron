import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  LogIn,
  Terminal,
  Mail
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from '../contexts/I18nContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Switch } from './ui/switch'
import toast from 'react-hot-toast'

interface AuthModalProps {
  isOpen: boolean
  mode: 'login' | 'unlock'
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode }) => {
  const { login, register, unlock, user, autoLockEnabled, setAutoLockEnabled } = useAuth()
  const { t } = useTranslation()
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      toast.error(t('errors.invalidInput'))
      return
    }

    setIsLoading(true)
    try {
      const success = await login(formData.username, formData.password)
      if (success) {
        toast.success(t('success.connectionEstablished'))
        setFormData({ username: '', password: '', email: '', confirmPassword: '' })
      } else {
        toast.error(t('errors.authenticationFailed'))
      }
    } catch (error) {
      toast.error(t('errors.unknownError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!formData.username || !formData.password) {
      toast.error(t('errors.invalidInput'))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة')
      return
    }

    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setIsLoading(true)
    try {
      const success = await register(formData.username, formData.password, formData.email)
      if (success) {
        toast.success('تم إنشاء الحساب بنجاح')
        setFormData({ username: '', password: '', email: '', confirmPassword: '' })
      } else {
        toast.error('اسم المستخدم موجود بالفعل')
      }
    } catch (error) {
      toast.error(t('errors.unknownError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!formData.password) {
      toast.error(t('errors.invalidInput'))
      return
    }

    setIsLoading(true)
    try {
      const success = unlock(formData.password)
      if (success) {
        toast.success('تم إلغاء القفل بنجاح')
        setFormData({ username: '', password: '', email: '', confirmPassword: '' })
      } else {
        toast.error('كلمة مرور خاطئة')
      }
    } catch (error) {
      toast.error(t('errors.unknownError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'unlock') {
      handleUnlock()
    } else if (activeTab === 'login') {
      handleLogin()
    } else {
      handleRegister()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-primary/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mx-auto">
              {mode === 'unlock' ? (
                <Lock className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Terminal className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            
            <div>
              <CardTitle className="text-2xl font-bold">
                {mode === 'unlock' ? 'إلغاء القفل' : t('app.title')}
              </CardTitle>
              <CardDescription className="mt-2">
                {mode === 'unlock' 
                  ? `مرحباً ${user?.username}, يرجى إدخال كلمة المرور لإلغاء القفل`
                  : 'قم بتسجيل الدخول أو إنشاء حساب جديد'
                }
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'unlock' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="أدخل كلمة المرور"
                        className="pr-10"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-lock"
                      checked={autoLockEnabled}
                      onCheckedChange={setAutoLockEnabled}
                    />
                    <Label htmlFor="auto-lock" className="text-sm">
                      تفعيل القفل التلقائي
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full btn-gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        إلغاء القفل
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                    <TabsTrigger value="register">حساب جديد</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">اسم المستخدم</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder="أدخل اسم المستخدم"
                          className="pr-10"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="أدخل كلمة المرور"
                          className="pr-10 pl-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-gradient"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          تسجيل الدخول
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">اسم المستخدم</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="new-username"
                          type="text"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder="اختر اسم المستخدم"
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="أدخل البريد الإلكتروني"
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="أدخل كلمة المرور"
                          className="pr-10 pl-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="أعد إدخال كلمة المرور"
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-gradient"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          إنشاء حساب
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default AuthModal
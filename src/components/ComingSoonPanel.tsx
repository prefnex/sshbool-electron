import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Zap,
  Rocket,
  Star,
  Clock,
  ArrowRight,
  Code,
  Database,
  Cloud,
  Smartphone,
  Shield,
  Globe,
  Bot,
  Palette,
  Layers,
  GitBranch,
  Terminal,
  FileCode,
  Monitor,
  Wifi,
  Lock,
  Settings,
  Users,
  MessageSquare,
  Bell,
  Calendar,
  X
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

interface ComingSoonFeature {
  id: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  icon: React.ElementType
  status: 'planned' | 'development' | 'testing' | 'soon'
  progress: number
  priority: 'high' | 'medium' | 'low'
  category: 'core' | 'ui' | 'security' | 'integration' | 'advanced'
  estimatedRelease: string
  votes: number
}

interface ComingSoonPanelProps {
  isOpen: boolean
  onClose: () => void
}

const ComingSoonPanel: React.FC<ComingSoonPanelProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())

  const features: ComingSoonFeature[] = [
    {
      id: 'ai-assistant',
      title: 'AI Terminal Assistant',
      titleAr: 'مساعد Terminal الذكي',
      description: 'AI-powered command suggestions and auto-completion',
      descriptionAr: 'اقتراحات أوامر ذكية وإكمال تلقائي بالذكاء الاصطناعي',
      icon: Bot,
      status: 'development',
      progress: 75,
      priority: 'high',
      category: 'core',
      estimatedRelease: 'Q2 2024',
      votes: 342
    },
    {
      id: 'cloud-sync',
      title: 'Cloud Synchronization',
      titleAr: 'المزامنة السحابية',
      description: 'Sync settings and connections across devices',
      descriptionAr: 'مزامنة الإعدادات والاتصالات عبر الأجهزة',
      icon: Cloud,
      status: 'planned',
      progress: 25,
      priority: 'high',
      category: 'integration',
      estimatedRelease: 'Q3 2024',
      votes: 289
    },
    {
      id: 'mobile-app',
      title: 'Mobile Companion App',
      titleAr: 'تطبيق الهاتف المحمول',
      description: 'Control your desktop terminals from mobile',
      descriptionAr: 'التحكم في terminals المكتب من الهاتف',
      icon: Smartphone,
      status: 'planned',
      progress: 10,
      priority: 'medium',
      category: 'integration',
      estimatedRelease: 'Q4 2024',
      votes: 156
    },
    {
      id: 'advanced-scripting',
      title: 'Advanced Scripting Engine',
      titleAr: 'محرك البرمجة المتقدم',
      description: 'Automate terminal tasks with custom scripts',
      descriptionAr: 'أتمتة مهام Terminal بـ scripts مخصصة',
      icon: Code,
      status: 'development',
      progress: 60,
      priority: 'medium',
      category: 'advanced',
      estimatedRelease: 'Q2 2024',
      votes: 198
    },
    {
      id: 'collaboration',
      title: 'Real-time Collaboration',
      titleAr: 'التعاون في الوقت الفعلي',
      description: 'Share terminal sessions with team members',
      descriptionAr: 'مشاركة جلسات Terminal مع أعضاء الفريق',
      icon: Users,
      status: 'planned',
      progress: 15,
      priority: 'medium',
      category: 'integration',
      estimatedRelease: 'Q3 2024',
      votes: 234
    },
    {
      id: 'advanced-security',
      title: 'Advanced Security Features',
      titleAr: 'ميزات الأمان المتقدمة',
      description: 'Hardware security key support and audit logs',
      descriptionAr: 'دعم مفاتيح الأمان وسجلات المراجعة',
      icon: Shield,
      status: 'testing',
      progress: 85,
      priority: 'high',
      category: 'security',
      estimatedRelease: 'Q1 2024',
      votes: 178
    },
    {
      id: 'git-integration',
      title: 'Git Integration',
      titleAr: 'تكامل Git',
      description: 'Built-in git operations and repository management',
      descriptionAr: 'عمليات git مدمجة وإدارة المستودعات',
      icon: GitBranch,
      status: 'development',
      progress: 45,
      priority: 'medium',
      category: 'integration',
      estimatedRelease: 'Q2 2024',
      votes: 267
    },
    {
      id: 'docker-support',
      title: 'Docker Container Support',
      titleAr: 'دعم Docker Containers',
      description: 'Manage and connect to Docker containers',
      descriptionAr: 'إدارة والاتصال بـ Docker containers',
      icon: Layers,
      status: 'planned',
      progress: 20,
      priority: 'medium',
      category: 'integration',
      estimatedRelease: 'Q3 2024',
      votes: 145
    },
    {
      id: 'advanced-monitoring',
      title: 'System Monitoring Dashboard',
      titleAr: 'لوحة مراقبة النظام',
      description: 'Real-time system metrics and alerts',
      descriptionAr: 'مقاييس النظام والتنبيهات في الوقت الفعلي',
      icon: Monitor,
      status: 'planned',
      progress: 5,
      priority: 'low',
      category: 'advanced',
      estimatedRelease: 'Q4 2024',
      votes: 123
    },
    {
      id: 'plugin-system',
      title: 'Plugin System',
      titleAr: 'نظام الإضافات',
      description: 'Extend functionality with custom plugins',
      descriptionAr: 'توسيع الوظائف بإضافات مخصصة',
      icon: Settings,
      status: 'development',
      progress: 55,
      priority: 'high',
      category: 'core',
      estimatedRelease: 'Q2 2024',
      votes: 312
    },
    {
      id: 'notifications',
      title: 'Smart Notifications',
      titleAr: 'الإشعارات الذكية',
      description: 'Contextual notifications for important events',
      descriptionAr: 'إشعارات ذكية للأحداث المهمة',
      icon: Bell,
      status: 'soon',
      progress: 95,
      priority: 'medium',
      category: 'ui',
      estimatedRelease: 'Q1 2024',
      votes: 189
    },
    {
      id: 'session-recording',
      title: 'Session Recording',
      titleAr: 'تسجيل الجلسات',
      description: 'Record and playback terminal sessions',
      descriptionAr: 'تسجيل وإعادة تشغيل جلسات Terminal',
      icon: FileCode,
      status: 'development',
      progress: 40,
      priority: 'medium',
      category: 'core',
      estimatedRelease: 'Q3 2024',
      votes: 201
    }
  ]

  const categories = [
    { key: 'all', label: 'الكل', labelEn: 'All', icon: Sparkles },
    { key: 'core', label: 'الأساسية', labelEn: 'Core', icon: Terminal },
    { key: 'ui', label: 'واجهة المستخدم', labelEn: 'UI', icon: Palette },
    { key: 'security', label: 'الأمان', labelEn: 'Security', icon: Shield },
    { key: 'integration', label: 'التكامل', labelEn: 'Integration', icon: Globe },
    { key: 'advanced', label: 'متقدمة', labelEn: 'Advanced', icon: Zap }
  ]

  const statusInfo = {
    planned: { 
      label: 'مخطط', 
      labelEn: 'Planned', 
      color: 'bg-gray-500', 
      textColor: 'text-gray-100' 
    },
    development: { 
      label: 'قيد التطوير', 
      labelEn: 'In Development', 
      color: 'bg-blue-500', 
      textColor: 'text-blue-100' 
    },
    testing: { 
      label: 'قيد الاختبار', 
      labelEn: 'Testing', 
      color: 'bg-orange-500', 
      textColor: 'text-orange-100' 
    },
    soon: { 
      label: 'قريباً', 
      labelEn: 'Coming Soon', 
      color: 'bg-green-500', 
      textColor: 'text-green-100' 
    }
  }

  const priorityInfo = {
    high: { label: 'عالية', color: 'border-red-500 text-red-600' },
    medium: { label: 'متوسطة', color: 'border-yellow-500 text-yellow-600' },
    low: { label: 'منخفضة', color: 'border-green-500 text-green-600' }
  }

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory)

  const sortedFeatures = filteredFeatures.sort((a, b) => {
    // Sort by status priority, then by votes
    const statusPriority = { soon: 4, testing: 3, development: 2, planned: 1 }
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[b.status] - statusPriority[a.status]
    }
    return b.votes - a.votes
  })

  const handleVote = (featureId: string) => {
    if (userVotes.has(featureId)) {
      toast.error('لقد صوتت بالفعل لهذه الميزة!')
      return
    }

    setUserVotes(prev => new Set([...prev, featureId]))
    
    // Update the feature votes (in real app, this would be API call)
    const feature = features.find(f => f.id === featureId)
    if (feature) {
      feature.votes += 1
      toast.success(`✅ شكراً لتصويتك لـ "${feature.titleAr}"!`)
    }
  }

  const getOverallProgress = () => {
    const totalProgress = features.reduce((sum, feature) => sum + feature.progress, 0)
    return Math.round(totalProgress / features.length)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-border/50 bg-card/95 backdrop-blur-md h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      ميزات قادمة
                    </CardTitle>
                    <CardDescription>اكتشف الميزات الجديدة المثيرة قيد التطوير</CardDescription>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Overall Progress */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">التقدم العام للمشروع</span>
                  <span className="text-sm text-muted-foreground">{getOverallProgress()}%</span>
                </div>
                <Progress value={getOverallProgress()} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {features.filter(f => f.status === 'soon').length} ميزة جاهزة قريباً • 
                  {features.filter(f => f.status === 'development').length} قيد التطوير • 
                  {features.filter(f => f.status === 'planned').length} مخططة
                </p>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden">
              {/* Category Filters */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  const isSelected = selectedCategory === category.key
                  
                  return (
                    <Button
                      key={category.key}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.key)}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <Icon className="w-4 h-4" />
                      {category.label}
                    </Button>
                  )
                })}
              </div>

              {/* Features Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 overflow-y-auto">
                {sortedFeatures.map((feature, index) => {
                  const Icon = feature.icon
                  const status = statusInfo[feature.status]
                  const priority = priorityInfo[feature.priority]
                  const hasVoted = userVotes.has(feature.id)
                  
                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                status.color
                              )}>
                                <Icon className={cn("w-5 h-5", status.textColor)} />
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-sm leading-tight">
                                  {feature.titleAr}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-xs", priority.color)}
                                  >
                                    {priority.label}
                                  </Badge>
                                  <Badge 
                                    variant="secondary" 
                                    className={cn("text-xs", status.color, status.textColor)}
                                  >
                                    {status.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {feature.descriptionAr}
                          </p>
                          
                          <div className="space-y-3">
                            {/* Progress */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">التقدم</span>
                                <span className="text-xs font-medium">{feature.progress}%</span>
                              </div>
                              <Progress value={feature.progress} className="h-1.5" />
                            </div>
                            
                            {/* Release Date */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>متوقع: {feature.estimatedRelease}</span>
                            </div>
                            
                            {/* Votes */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="w-3 h-3" />
                                <span>{feature.votes} صوت</span>
                              </div>
                              
                              <Button
                                variant={hasVoted ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => handleVote(feature.id)}
                                disabled={hasVoted}
                                className="text-xs h-7"
                              >
                                {hasVoted ? (
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                ) : (
                                  <Star className="w-3 h-3 mr-1" />
                                )}
                                {hasVoted ? 'صوتت' : 'صوت'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              {/* Stats */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span>📊 إجمالي الميزات: {features.length}</span>
                    <span>🚀 جاهزة قريباً: {features.filter(f => f.status === 'soon').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-muted-foreground">شاركنا اقتراحاتك!</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ComingSoonPanel
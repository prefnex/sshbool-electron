import React from 'react'
import { motion } from 'framer-motion'
import { 
  Terminal, 
  Server, 
  Settings, 
  Sparkles, 
  ArrowRight,
  Zap,
  Shield,
  Palette,
  Command,
  Globe,
  Database,
  Lock,
  Rocket
} from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'
import ComingSoonPanel from './ComingSoonPanel'

interface WelcomeScreenProps {
  onNewTerminal: () => void
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewTerminal }) => {
  const [showComingSoon, setShowComingSoon] = React.useState(false)
  const features = [
    {
      icon: Shield,
      title: 'Secure SSH',
      description: 'Encrypted connections with key-based authentication',
      gradient: 'from-green-500 to-emerald-600',
      color: 'text-green-500'
    },
    {
      icon: Command,
      title: 'Smart Terminal',
      description: 'Intelligent command suggestions and history',
      gradient: 'from-blue-500 to-cyan-600',
      color: 'text-blue-500'
    },
    {
      icon: Database,
      title: 'File Manager',
      description: 'Browse and manage remote files seamlessly',
      gradient: 'from-purple-500 to-pink-600',
      color: 'text-purple-500'
    },
    {
      icon: Palette,
      title: 'Beautiful UI',
      description: 'Modern design with customizable themes',
      gradient: 'from-orange-500 to-red-600',
      color: 'text-orange-500'
    },
    {
      icon: Globe,
      title: 'Multi-Connection',
      description: 'Manage multiple servers simultaneously',
      gradient: 'from-indigo-500 to-blue-600',
      color: 'text-indigo-500'
    },
    {
      icon: Zap,
      title: 'Fast & Lightweight',
      description: 'Optimized performance for smooth operation',
      gradient: 'from-yellow-500 to-orange-600',
      color: 'text-yellow-500'
    }
  ]

  const quickActions = [
    {
      icon: Server,
      title: 'New Connection',
      description: 'Connect to a remote server',
      action: () => {
        // This will be handled by the parent component
        onNewTerminal()
      },
      gradient: 'from-primary to-primary/80'
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Customize your experience',
      action: () => {
        // TODO: Open settings modal
        console.log('Open settings')
      },
      gradient: 'from-secondary to-secondary/80'
    },
    {
      icon: Terminal,
      title: 'Quick Test',
      description: 'Test ls command after connection',
      action: () => {
        // This will run ls command automatically after connection
        onNewTerminal()
        // TODO: Auto-run ls command
      },
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: Rocket,
      title: 'Coming Soon',
      description: 'Discover upcoming features',
      action: () => {
        setShowComingSoon(true)
      },
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-6xl w-full"
      >
        {/* Hero Section */}
        <div className="mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-32 h-32 bg-gradient-to-br from-primary via-purple-600 to-cyan-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl"
          >
            <Terminal className="w-16 h-16 text-primary-foreground" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-5xl md:text-6xl font-bold text-foreground mb-6"
          >
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              FlyTerm
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            A beautiful, modern terminal application with advanced SSH capabilities, 
            file management, and a stunning user interface
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={onNewTerminal}
              variant="gradient"
              size="lg"
              className="text-lg px-8 py-4 h-14"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4 h-14"
            >
              <Lock className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Unlimited Terminals</div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-500 mb-2">🔒</div>
              <div className="text-sm text-muted-foreground">Secure SSH</div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-500 mb-2">📁</div>
              <div className="text-sm text-muted-foreground">File Manager</div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-cyan-500 mb-2">🎨</div>
              <div className="text-sm text-muted-foreground">Beautiful UI</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Core Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Core Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 hover:shadow-lg group">
                  <CardHeader className="text-center pb-3">
                    <div className={cn(
                      "w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br",
                      feature.gradient
                    )}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.8 + index * 0.1 }}
              >
                <Card 
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 hover:shadow-lg cursor-pointer group"
                  onClick={action.action}
                >
                  <CardHeader className="text-center pb-3">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br",
                      action.gradient
                    )}>
                      <action.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.0 }}
          className="mt-12 pt-8 border-t border-border/50"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                v1.0.0
              </Badge>
              <span>Built with React & Electron</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span>Made with ❤️</span>
              <span>•</span>
              <span>Open Source</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Coming Soon Panel */}
      <ComingSoonPanel
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
      />
    </div>
  )
}

export default WelcomeScreen

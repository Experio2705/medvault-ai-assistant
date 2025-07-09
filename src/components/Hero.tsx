
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Upload, Brain, Activity, Lock, Users, Sparkles, ArrowRight } from "lucide-react";

interface HeroProps {
  onLogin: () => void;
}

const Hero = ({ onLogin }: HeroProps) => {
  const features = [
    {
      icon: Upload,
      title: "Smart File Upload",
      description: "Upload prescriptions, reports, and medical documents with AI-powered text extraction"
    },
    {
      icon: Brain,
      title: "AI Health Assistant",
      description: "Get intelligent insights, symptom analysis, and specialist recommendations"
    },
    {
      icon: Activity,
      title: "Health Timeline",
      description: "Track your health journey with visual timelines and trend analysis"
    },
    {
      icon: Lock,
      title: "Military-Grade Security",
      description: "Your medical data is encrypted and secured with AES-256 encryption"
    },
    {
      icon: Users,
      title: "Easy Sharing",
      description: "Securely share records with healthcare providers using time-limited links"
    },
    {
      icon: Sparkles,
      title: "Voice Logging",
      description: "Log symptoms using voice commands for quick and convenient entry"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-green-600/20" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">MedVault</h1>
          </div>
          <Button 
            variant="outline" 
            className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
            onClick={onLogin}
          >
            Sign In
          </Button>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm mb-6">
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Medical Records Management
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your Health,
            <br />
            <span className="bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent">
              Simplified
            </span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Securely store, analyze, and share your medical records with AI-powered insights. 
            Take control of your healthcare journey with MedVault.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-white/90 font-semibold px-8 py-3 text-lg group"
              onClick={onLogin}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 px-8 py-3 text-lg"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/15 transition-all duration-300 hover:scale-105"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-semibold text-white mb-4">Trusted by Healthcare Professionals</h3>
          <div className="flex items-center justify-center space-x-8 text-white/70">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>10,000+ Users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

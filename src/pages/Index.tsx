
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Upload, Mic, Brain, Activity, Share, FileText, Clock, Users, User, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Hero from "@/components/Hero";
import Dashboard from "@/components/Dashboard";
import FileUpload from "@/components/FileUpload";
import SymptomLogger from "@/components/SymptomLogger";
import HealthTimeline from "@/components/HealthTimeline";
import ShareRecords from "@/components/ShareRecords";
import ProfileForm from "@/components/ProfileForm";
import HealthAnalytics from "@/components/HealthAnalytics";
import ConversationalHealthAssistant from "@/components/ConversationalHealthAssistant";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-green-500 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading MedVault...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Hero onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              MedVault
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Welcome, {user.user_metadata?.first_name || user.email}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={signOut}
              className="border-blue-200 hover:bg-blue-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-white/60 backdrop-blur-sm shadow-lg border-0 sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Navigation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { id: "dashboard", label: "Dashboard", icon: Activity },
                  { id: "profile", label: "Profile", icon: User },
                  { id: "analytics", label: "Health Analytics", icon: BarChart3 },
                  { id: "conversational-ai", label: "Conversational AI", icon: Brain },
                  { id: "upload", label: "Upload Files", icon: Upload },
                  { id: "symptoms", label: "Log Symptoms", icon: Mic },
                  { id: "timeline", label: "Health Timeline", icon: Clock },
                  { id: "share", label: "Share Records", icon: Share },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "default" : "ghost"}
                      className={`w-full justify-start transition-all duration-200 ${
                        activeSection === item.id
                          ? "bg-gradient-to-r from-blue-600 to-green-500 text-white shadow-md"
                          : "hover:bg-blue-50 text-gray-700"
                      }`}
                      onClick={() => setActiveSection(item.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {activeSection === "dashboard" && <Dashboard onNavigate={setActiveSection} />}
              {activeSection === "profile" && <ProfileForm />}
              {activeSection === "analytics" && <HealthAnalytics />}
              {activeSection === "conversational-ai" && <ConversationalHealthAssistant />}
              {activeSection === "upload" && <FileUpload />}
              {activeSection === "symptoms" && <SymptomLogger />}
              {activeSection === "timeline" && <HealthTimeline />}
              {activeSection === "share" && <ShareRecords />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

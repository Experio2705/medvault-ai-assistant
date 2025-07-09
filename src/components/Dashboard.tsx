
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Activity, Brain, Calendar, TrendingUp, Upload, Mic, Share } from "lucide-react";

const Dashboard = () => {
  const quickStats = [
    { label: "Medical Files", value: "12", icon: FileText, color: "text-blue-600" },
    { label: "Symptom Logs", value: "8", icon: Activity, color: "text-green-600" },
    { label: "AI Insights", value: "3", icon: Brain, color: "text-purple-600" },
    { label: "Shared Records", value: "2", icon: Share, color: "text-orange-600" },
  ];

  const recentActivity = [
    { type: "upload", title: "Blood Test Results", date: "2 hours ago", status: "processed" },
    { type: "symptom", title: "Headache logged", date: "1 day ago", status: "analyzed" },
    { type: "share", title: "Shared with Dr. Smith", date: "3 days ago", status: "viewed" },
    { type: "insight", title: "AI Health Summary", date: "1 week ago", status: "available" },
  ];

  const quickActions = [
    { icon: Upload, label: "Upload Document", action: "upload", color: "bg-blue-100 hover:bg-blue-200 text-blue-700" },
    { icon: Mic, label: "Log Symptoms", action: "symptoms", color: "bg-green-100 hover:bg-green-200 text-green-700" },
    { icon: Brain, label: "AI Analysis", action: "analyze", color: "bg-purple-100 hover:bg-purple-200 text-purple-700" },
    { icon: Share, label: "Share Records", action: "share", color: "bg-orange-100 hover:bg-orange-200 text-orange-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back to MedVault</h2>
        <p className="text-blue-100">Your health dashboard is ready. Here's what's happening with your medical records.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={`w-full justify-start h-12 ${action.color} transition-all duration-200`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {action.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Your latest medical record activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'processed' ? 'bg-green-500' :
                  activity.status === 'analyzed' ? 'bg-blue-500' :
                  activity.status === 'viewed' ? 'bg-orange-500' : 'bg-purple-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.date}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.status === 'processed' ? 'bg-green-100 text-green-700' :
                  activity.status === 'analyzed' ? 'bg-blue-100 text-blue-700' :
                  activity.status === 'viewed' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Health Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-700">
            <Brain className="h-5 w-5" />
            <span>AI Health Insights</span>
          </CardTitle>
          <CardDescription>Personalized recommendations based on your medical data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white/60 rounded-lg border border-purple-100">
            <h4 className="font-semibold text-purple-800 mb-2">🎯 Recommendation</h4>
            <p className="text-gray-700">Based on your recent blood test, consider scheduling a follow-up with your cardiologist within the next 2 weeks.</p>
          </div>
          <div className="p-4 bg-white/60 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-2">📊 Pattern Detected</h4>
            <p className="text-gray-700">Your symptom logs show a pattern of headaches occurring on weekdays. Consider tracking stress levels and sleep quality.</p>
          </div>
          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            View Detailed Analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

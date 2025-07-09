
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Activity, Brain, Calendar, TrendingUp, Upload, Mic, Share } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  medicalFiles: number;
  symptomLogs: number;
  aiInsights: number;
  sharedRecords: number;
}

interface RecentActivity {
  type: string;
  title: string;
  date: string;
  status: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    medicalFiles: 0,
    symptomLogs: 0,
    aiInsights: 0,
    sharedRecords: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch counts for each data type
      const [medicalRecordsResponse, symptomsResponse, healthMetricsResponse] = await Promise.all([
        supabase.from('medical_records').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('symptoms').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('health_metrics').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      // Get recent activities
      const [recentMedicalRecords, recentSymptoms] = await Promise.all([
        supabase.from('medical_records').select('title, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('symptoms').select('symptom_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      ]);

      // Update stats
      setStats({
        medicalFiles: medicalRecordsResponse.count || 0,
        symptomLogs: symptomsResponse.count || 0,
        aiInsights: (symptomsResponse.count || 0) > 0 ? Math.ceil((symptomsResponse.count || 0) / 3) : 0, // Mock AI insights based on symptoms
        sharedRecords: 0 // This would need a separate sharing system
      });

      // Combine and format recent activities
      const activities: RecentActivity[] = [];
      
      if (recentMedicalRecords.data) {
        recentMedicalRecords.data.forEach(record => {
          activities.push({
            type: 'upload',
            title: record.title,
            date: new Date(record.created_at!).toLocaleDateString(),
            status: 'processed'
          });
        });
      }

      if (recentSymptoms.data) {
        recentSymptoms.data.forEach(symptom => {
          activities.push({
            type: 'symptom',
            title: `${symptom.symptom_name} logged`,
            date: new Date(symptom.created_at!).toLocaleDateString(),
            status: 'analyzed'
          });
        });
      }

      // Sort activities by date and take the most recent 4
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 4));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const quickStats = [
    { label: "Medical Files", value: loading ? "..." : stats.medicalFiles.toString(), icon: FileText, color: "text-blue-600" },
    { label: "Symptom Logs", value: loading ? "..." : stats.symptomLogs.toString(), icon: Activity, color: "text-green-600" },
    { label: "AI Insights", value: loading ? "..." : stats.aiInsights.toString(), icon: Brain, color: "text-purple-600" },
    { label: "Shared Records", value: loading ? "..." : stats.sharedRecords.toString(), icon: Share, color: "text-orange-600" },
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
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-3 bg-gray-50/50 rounded-lg">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
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
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>No recent activity</p>
                <p className="text-sm">Start by uploading a medical record or logging symptoms</p>
              </div>
            )}
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
          {stats.symptomLogs > 0 || stats.medicalFiles > 0 ? (
            <>
              <div className="p-4 bg-white/60 rounded-lg border border-purple-100">
                <h4 className="font-semibold text-purple-800 mb-2">🎯 Getting Started</h4>
                <p className="text-gray-700">
                  {stats.medicalFiles === 0 
                    ? "Upload your first medical record to get personalized AI insights."
                    : stats.symptomLogs === 0
                    ? "Log your symptoms to get AI-powered health recommendations."
                    : "Great! You have medical data. Use the AI Assistant for personalized insights."
                  }
                </p>
              </div>
              {stats.symptomLogs > 2 && (
                <div className="p-4 bg-white/60 rounded-lg border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-2">📊 Pattern Analysis</h4>
                  <p className="text-gray-700">You have logged {stats.symptomLogs} symptoms. Visit the AI Assistant to analyze patterns and get recommendations.</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-white/60 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-800 mb-2">🚀 Welcome to MedVault</h4>
              <p className="text-gray-700">Start by uploading medical records or logging symptoms to unlock AI-powered health insights.</p>
            </div>
          )}
          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            View AI Assistant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

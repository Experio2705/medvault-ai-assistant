
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, FileText, Mic, Brain, Calendar, TrendingUp, Download } from "lucide-react";

const HealthTimeline = () => {
  const timelineData = [
    {
      id: 1,
      date: "2024-01-15",
      type: "lab_report",
      title: "Blood Test Results",
      description: "Complete blood count and lipid panel",
      status: "normal",
      details: "All values within normal range. Cholesterol slightly elevated.",
      icon: FileText,
      color: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      id: 2,
      date: "2024-01-12",
      type: "symptom",
      title: "Headache Episode",
      description: "Moderate headache, left temporal region",
      status: "resolved",
      details: "Duration: 4 hours. Severity: 6/10. Triggered by stress.",
      icon: Activity,
      color: "bg-orange-100 text-orange-700 border-orange-200"
    },
    {
      id: 3,
      date: "2024-01-10",
      type: "ai_insight",
      title: "Health Pattern Analysis",
      description: "AI detected recurring headache pattern",
      status: "recommendation",
      details: "Suggests tracking sleep patterns and stress levels.",
      icon: Brain,
      color: "bg-purple-100 text-purple-700 border-purple-200"
    },
    {
      id: 4,
      date: "2024-01-08",
      type: "prescription",
      title: "Medication Update",
      description: "Blood pressure medication dosage adjusted",
      status: "active",
      details: "Lisinopril 10mg daily, continue for 3 months.",
      icon: FileText,
      color: "bg-green-100 text-green-700 border-green-200"
    },
    {
      id: 5,
      date: "2024-01-05",
      type: "symptom",
      title: "Voice Log: Fatigue",
      description: "Persistent fatigue over 3 days",
      status: "monitoring",
      details: "Energy levels 3/10. No fever. Good appetite.",
      icon: Mic,
      color: "bg-yellow-100 text-yellow-700 border-yellow-200"
    }
  ];

  const healthMetrics = [
    { label: "Blood Pressure", value: "118/76", trend: "stable", color: "text-green-600" },
    { label: "Heart Rate", value: "72 bpm", trend: "improving", color: "text-blue-600" },
    { label: "Weight", value: "165 lbs", trend: "decreasing", color: "text-green-600" },
    { label: "Sleep Quality", value: "7.2/10", trend: "improving", color: "text-blue-600" },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      normal: "bg-green-100 text-green-800",
      resolved: "bg-blue-100 text-blue-800",
      active: "bg-orange-100 text-orange-800",
      recommendation: "bg-purple-100 text-purple-800",
      monitoring: "bg-yellow-100 text-yellow-800"
    };
    
    return statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Health Metrics Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span>Health Metrics Overview</span>
          </CardTitle>
          <CardDescription>Your key health indicators at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-white/60 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
                <div className={`text-xs font-medium ${metric.color}`}>
                  {metric.trend === 'improving' ? '↗️ Improving' : 
                   metric.trend === 'stable' ? '→ Stable' : '↘️ Decreasing'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-green-600" />
                <span>Health Timeline</span>
              </CardTitle>
              <CardDescription>Chronological view of your health records and activities</CardDescription>
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Timeline</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timelineData.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === timelineData.length - 1;
              
              return (
                <div key={item.id} className="relative">
                  {/* Timeline Line */}
                  {!isLast && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                  )}
                  
                  <div className="flex items-start space-x-4">
                    {/* Timeline Icon */}
                    <div className={`w-12 h-12 rounded-full border-2 ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Timeline Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-white/80 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{item.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusBadge(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{item.description}</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{item.details}</p>
                        
                        {item.type === 'ai_insight' && (
                          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                            <div className="flex items-center space-x-2">
                              <Brain className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-800">AI Recommendation</span>
                            </div>
                            <p className="text-sm text-purple-700 mt-1">
                              Consider implementing sleep hygiene practices and stress management techniques.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Load More */}
          <div className="text-center mt-8">
            <Button variant="outline" className="w-full">
              Load More Timeline Entries
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Health Insights */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-700">
            <Brain className="h-6 w-6" />
            <span>Timeline Insights</span>
          </CardTitle>
          <CardDescription>AI-powered analysis of your health timeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/60 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-800 mb-2">📈 Positive Trends</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Blood pressure has stabilized over the past month</li>
                <li>• Sleep quality showing consistent improvement</li>
                <li>• Regular symptom logging helping identify patterns</li>
              </ul>
            </div>
            <div className="p-4 bg-white/60 rounded-lg border border-orange-100">
              <h4 className="font-semibold text-orange-800 mb-2">⚠️ Areas to Monitor</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Headache frequency increased this week</li>
                <li>• Consider follow-up on cholesterol levels</li>
                <li>• Track stress triggers more consistently</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthTimeline;

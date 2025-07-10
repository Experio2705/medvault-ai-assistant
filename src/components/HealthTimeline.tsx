
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, FileText, Mic, Brain, Calendar, TrendingUp, Download, Heart, Weight, Thermometer, Droplets, AlertCircle } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TimelineItem {
  id: string;
  date: string;
  type: 'health_metric' | 'symptom' | 'medical_record' | 'ai_insight';
  title: string;
  description: string;
  status: string;
  details: string;
  icon: any;
  color: string;
  severity?: number;
  confidence?: number;
}

const HealthTimeline = () => {
  const { user } = useAuth();
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState([
    { label: "Blood Pressure", value: "N/A", trend: "stable", color: "text-gray-600" },
    { label: "Heart Rate", value: "N/A", trend: "stable", color: "text-gray-600" },
    { label: "Weight", value: "N/A", trend: "stable", color: "text-gray-600" },
    { label: "Temperature", value: "N/A", trend: "stable", color: "text-gray-600" },
  ]);

  useEffect(() => {
    if (user) {
      fetchTimelineData();
      subscribeToRealtimeUpdates();
    }
  }, [user]);

  const fetchTimelineData = async () => {
    if (!user) return;

    try {
      const [metricsResponse, symptomsResponse, recordsResponse] = await Promise.all([
        supabase.from('health_metrics').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(10),
        supabase.from('symptoms').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }).limit(10),
        supabase.from('medical_records').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
      ]);

      const timeline: TimelineItem[] = [];

      // Process health metrics
      if (metricsResponse.data) {
        const latestMetrics = {
          blood_pressure: null as any,
          heart_rate: null as any,
          weight: null as any,
          temperature: null as any,
        };

        metricsResponse.data.forEach(metric => {
          const date = new Date(metric.recorded_at || metric.created_at).toISOString();
          
          // Update latest metrics for overview
          if (metric.metric_type in latestMetrics && !latestMetrics[metric.metric_type as keyof typeof latestMetrics]) {
            latestMetrics[metric.metric_type as keyof typeof latestMetrics] = metric;
          }

          timeline.push({
            id: metric.id,
            date,
            type: 'health_metric',
            title: `${metric.metric_type.replace('_', ' ').toUpperCase()} Reading`,
            description: `${metric.value_numeric || metric.value_text} ${metric.unit || ''}`,
            status: 'recorded',
            details: metric.notes || 'Health metric recorded',
            icon: getMetricIcon(metric.metric_type),
            color: getMetricColor(metric.metric_type)
          });
        });

        // Update health metrics overview
        setHealthMetrics([
          { 
            label: "Blood Pressure", 
            value: latestMetrics.blood_pressure ? `${latestMetrics.blood_pressure.value_numeric || latestMetrics.blood_pressure.value_text} ${latestMetrics.blood_pressure.unit || ''}` : "N/A",
            trend: "stable", 
            color: "text-blue-600" 
          },
          { 
            label: "Heart Rate", 
            value: latestMetrics.heart_rate ? `${latestMetrics.heart_rate.value_numeric} ${latestMetrics.heart_rate.unit || 'bpm'}` : "N/A",
            trend: "stable", 
            color: "text-red-600" 
          },
          { 
            label: "Weight", 
            value: latestMetrics.weight ? `${latestMetrics.weight.value_numeric} ${latestMetrics.weight.unit || 'kg'}` : "N/A",
            trend: "stable", 
            color: "text-green-600" 
          },
          { 
            label: "Temperature", 
            value: latestMetrics.temperature ? `${latestMetrics.temperature.value_numeric} ${latestMetrics.temperature.unit || '°C'}` : "N/A",
            trend: "stable", 
            color: "text-orange-600" 
          },
        ]);
      }

      // Process symptoms
      if (symptomsResponse.data) {
        symptomsResponse.data.forEach(symptom => {
          const date = new Date(symptom.recorded_at || symptom.created_at).toISOString();
          timeline.push({
            id: symptom.id,
            date,
            type: 'symptom',
            title: `Symptom: ${symptom.symptom_name}`,
            description: symptom.description || `Severity: ${symptom.severity || 'Unknown'}/10`,
            status: symptom.severity && symptom.severity > 7 ? 'severe' : symptom.severity && symptom.severity > 4 ? 'moderate' : 'mild',
            details: `${symptom.location ? `Location: ${symptom.location}. ` : ''}${symptom.duration_hours ? `Duration: ${symptom.duration_hours} hours. ` : ''}${symptom.description || ''}`,
            icon: AlertCircle,
            color: getSeverityColor(symptom.severity),
            severity: symptom.severity,
            confidence: symptom.confidence_score
          });
        });
      }

      // Process medical records
      if (recordsResponse.data) {
        recordsResponse.data.forEach(record => {
          const date = new Date(record.created_at).toISOString();
          timeline.push({
            id: record.id,
            date,
            type: 'medical_record',
            title: record.title,
            description: record.description || `${record.record_type} record`,
            status: record.ai_analysis ? 'analyzed' : 'uploaded',
            details: record.extracted_text || record.description || 'Medical record uploaded',
            icon: FileText,
            color: "bg-blue-100 text-blue-700 border-blue-200"
          });
        });
      }

      // Add AI insights based on data patterns
      if (timeline.length > 0) {
        const recentSymptoms = timeline.filter(item => item.type === 'symptom' && item.severity && item.severity > 5);
        if (recentSymptoms.length > 1) {
          timeline.push({
            id: 'ai-insight-' + Date.now(),
            date: new Date().toISOString(),
            type: 'ai_insight',
            title: 'Health Pattern Analysis',
            description: 'AI detected recurring high-severity symptoms',
            status: 'recommendation',
            details: `Detected ${recentSymptoms.length} high-severity symptoms recently. Consider consulting with a healthcare provider.`,
            icon: Brain,
            color: "bg-purple-100 text-purple-700 border-purple-200"
          });
        }
      }

      // Sort timeline by date (newest first)
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimelineData(timeline);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    }
    setLoading(false);
  };

  const subscribeToRealtimeUpdates = () => {
    if (!user) return;

    // Subscribe to health metrics changes
    const metricsChannel = supabase
      .channel('health_metrics_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'health_metrics', filter: `user_id=eq.${user.id}` },
        () => fetchTimelineData()
      )
      .subscribe();

    // Subscribe to symptoms changes
    const symptomsChannel = supabase
      .channel('symptoms_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'symptoms', filter: `user_id=eq.${user.id}` },
        () => fetchTimelineData()
      )
      .subscribe();

    // Subscribe to medical records changes
    const recordsChannel = supabase
      .channel('medical_records_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'medical_records', filter: `user_id=eq.${user.id}` },
        () => fetchTimelineData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(symptomsChannel);
      supabase.removeChannel(recordsChannel);
    };
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'heart_rate': return Heart;
      case 'blood_pressure': return Activity;
      case 'weight': return Weight;
      case 'temperature': return Thermometer;
      case 'blood_sugar': return Droplets;
      default: return Activity;
    }
  };

  const getMetricColor = (type: string) => {
    switch (type) {
      case 'heart_rate': return "bg-red-100 text-red-700 border-red-200";
      case 'blood_pressure': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'weight': return "bg-green-100 text-green-700 border-green-200";
      case 'temperature': return "bg-orange-100 text-orange-700 border-orange-200";
      case 'blood_sugar': return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getSeverityColor = (severity?: number) => {
    if (!severity) return "bg-gray-100 text-gray-700 border-gray-200";
    if (severity >= 8) return "bg-red-100 text-red-700 border-red-200";
    if (severity >= 5) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      recorded: "bg-green-100 text-green-800",
      uploaded: "bg-blue-100 text-blue-800",
      analyzed: "bg-purple-100 text-purple-800",
      severe: "bg-red-100 text-red-800",
      moderate: "bg-orange-100 text-orange-800",
      mild: "bg-yellow-100 text-yellow-800",
      recommendation: "bg-purple-100 text-purple-800"
    };
    
    return statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 bg-white/60 rounded-lg border border-gray-200">
                    <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <CardDescription>Real-time chronological view of your health records and activities</CardDescription>
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Timeline</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {timelineData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No health data recorded yet.</p>
              <p className="text-sm text-gray-500">Start by logging symptoms or uploading medical records.</p>
            </div>
          ) : (
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
                                Consider implementing preventive measures and tracking patterns more closely.
                              </p>
                            </div>
                          )}

                          {item.severity && item.severity > 7 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-medium text-red-800">High Severity Alert</span>
                              </div>
                              <p className="text-sm text-red-700 mt-1">
                                This symptom has high severity. Consider consulting a healthcare provider.
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
          )}
          
          {/* Load More */}
          {timelineData.length > 0 && (
            <div className="text-center mt-8">
              <Button variant="outline" className="w-full" onClick={fetchTimelineData}>
                Refresh Timeline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Insights */}
      {timelineData.length > 0 && (
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
                <h4 className="font-semibold text-purple-800 mb-2">📈 Recent Activity</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• {timelineData.filter(item => item.type === 'health_metric').length} health metrics recorded</li>
                  <li>• {timelineData.filter(item => item.type === 'symptom').length} symptoms logged</li>
                  <li>• {timelineData.filter(item => item.type === 'medical_record').length} medical records uploaded</li>
                </ul>
              </div>
              <div className="p-4 bg-white/60 rounded-lg border border-orange-100">
                <h4 className="font-semibold text-orange-800 mb-2">⚠️ Areas to Monitor</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {timelineData.filter(item => item.severity && item.severity > 5).length > 0 ? (
                    <li>• {timelineData.filter(item => item.severity && item.severity > 5).length} high-severity symptoms detected</li>
                  ) : (
                    <li>• No high-severity symptoms detected</li>
                  )}
                  <li>• Keep tracking regularly for better insights</li>
                  <li>• Consider adding more health metrics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthTimeline;


import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, Heart, Weight, Thermometer, Droplets, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface HealthMetric {
  id: string;
  metric_type: string;
  value_numeric: number;
  value_text: string;
  unit: string;
  recorded_at: string;
  notes: string;
}

interface Symptom {
  id: string;
  symptom_name: string;
  severity: number;
  recorded_at: string;
  location: string;
  ai_suggestions: any;
}

const HealthAnalytics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHealthData();
    }
  }, [user]);

  const fetchHealthData = async () => {
    if (!user) return;

    try {
      const [metricsResponse, symptomsResponse] = await Promise.all([
        supabase.from('health_metrics').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }),
        supabase.from('symptoms').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false })
      ]);

      if (metricsResponse.data) setMetrics(metricsResponse.data);
      if (symptomsResponse.data) setSymptoms(symptomsResponse.data);
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
    setLoading(false);
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'heart_rate': return <Heart className="h-5 w-5 text-red-500" />;
      case 'blood_pressure': return <Activity className="h-5 w-5 text-blue-500" />;
      case 'weight': return <Weight className="h-5 w-5 text-green-500" />;
      case 'temperature': return <Thermometer className="h-5 w-5 text-orange-500" />;
      case 'blood_sugar': return <Droplets className="h-5 w-5 text-purple-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const prepareChartData = (metricType: string) => {
    return metrics
      .filter(m => m.metric_type === metricType && m.value_numeric)
      .slice(0, 10)
      .reverse()
      .map(m => ({
        date: new Date(m.recorded_at).toLocaleDateString(),
        value: m.value_numeric,
        unit: m.unit
      }));
  };

  const getHealthScore = () => {
    if (metrics.length === 0) return 85; // Default score
    
    // Simple health score calculation based on recent metrics
    const recentMetrics = metrics.slice(0, 5);
    let score = 85;
    
    // Adjust score based on symptom severity
    const recentSymptoms = symptoms.slice(0, 5);
    const avgSeverity = recentSymptoms.reduce((sum, s) => sum + (s.severity || 0), 0) / Math.max(recentSymptoms.length, 1);
    score -= avgSeverity * 5;
    
    return Math.max(Math.min(score, 100), 0);
  };

  const symptomDistribution = symptoms.reduce((acc, symptom) => {
    acc[symptom.symptom_name] = (acc[symptom.symptom_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const symptomChartData = Object.entries(symptomDistribution).map(([name, count]) => ({
    name,
    count
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-white/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Health Score</p>
                <p className="text-3xl font-bold">{Math.round(getHealthScore())}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Symptoms Logged</p>
                <p className="text-2xl font-bold text-gray-900">{symptoms.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.filter(m => 
                    new Date(m.recorded_at).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heart Rate Trend */}
        {prepareChartData('heart_rate').length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>Heart Rate Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareChartData('heart_rate')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Weight Trend */}
        {prepareChartData('weight').length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Weight className="h-5 w-5 text-green-500" />
                <span>Weight Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={prepareChartData('weight')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Symptom Distribution */}
        {symptomChartData.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Symptom Distribution</CardTitle>
              <CardDescription>Most frequently reported symptoms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={symptomChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {symptomChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest health metrics and symptoms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...metrics.slice(0, 3), ...symptoms.slice(0, 2)]
                .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                .slice(0, 5)
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {'metric_type' in item ? getMetricIcon(item.metric_type) : <AlertCircle className="h-5 w-5 text-orange-500" />}
                      <div>
                        <p className="font-medium">
                          {'metric_type' in item 
                            ? `${item.metric_type.replace('_', ' ')} - ${item.value_numeric} ${item.unit}`
                            : item.symptom_name
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(item.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {'severity' in item && (
                      <Badge variant={item.severity > 3 ? 'destructive' : 'secondary'}>
                        Severity: {item.severity}/5
                      </Badge>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthAnalytics;

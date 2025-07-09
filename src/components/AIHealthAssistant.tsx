
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Sparkles, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AIAnalysis {
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  possible_conditions: string[];
  urgency: 'routine' | 'schedule_soon' | 'seek_immediate_care';
  confidence: number;
  [key: string]: any; // Add index signature for Json compatibility
}

const AIHealthAssistant = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeSymptom = async () => {
    if (!input.trim() || !user) return;

    setLoading(true);
    try {
      // Simulate AI analysis (in a real app, this would call an AI service)
      const mockAnalysis: AIAnalysis = {
        severity: input.toLowerCase().includes('severe') || input.toLowerCase().includes('pain') ? 'high' : 
                 input.toLowerCase().includes('mild') ? 'low' : 'medium',
        recommendations: [
          'Monitor symptoms closely',
          'Stay hydrated and get adequate rest',
          'Consider over-the-counter pain relief if needed',
          'Track symptoms in your health log'
        ],
        possible_conditions: [
          'Viral infection',
          'Stress-related symptoms',
          'Seasonal allergies'
        ],
        urgency: input.toLowerCase().includes('severe') ? 'seek_immediate_care' : 
                input.toLowerCase().includes('persistent') ? 'schedule_soon' : 'routine',
        confidence: 0.75
      };

      // Save symptom to database with proper type casting
      const { error } = await supabase.from('symptoms').insert({
        user_id: user.id,
        symptom_name: input.split(' ').slice(0, 3).join(' '),
        description: input,
        severity: mockAnalysis.severity === 'high' ? 4 : mockAnalysis.severity === 'medium' ? 3 : 2,
        ai_suggestions: mockAnalysis as any, // Cast to any for Json compatibility
        recorded_at: new Date().toISOString()
      });

      if (error) throw error;

      setAnalysis(mockAnalysis);
      toast.success('Symptom analyzed and saved!');
    } catch (error) {
      console.error('Error analyzing symptom:', error);
      toast.error('Failed to analyze symptom');
    }
    setLoading(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'seek_immediate_care': return 'destructive';
      case 'schedule_soon': return 'default';
      case 'routine': return 'secondary';
      default: return 'secondary';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'seek_immediate_care': return <AlertTriangle className="h-4 w-4" />;
      case 'schedule_soon': return <Clock className="h-4 w-4" />;
      case 'routine': return <CheckCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI Health Assistant</span>
        </CardTitle>
        <CardDescription>
          Describe your symptoms for AI-powered analysis and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Describe your symptoms, how long you've had them, and any other relevant details..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button
            onClick={analyzeSymptom}
            disabled={!input.trim() || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Analyzing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Analyze Symptoms</span>
              </div>
            )}
          </Button>
        </div>

        {analysis && (
          <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">AI Analysis Results</h3>
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                {Math.round(analysis.confidence * 100)}% Confidence
              </Badge>
            </div>

            {/* Urgency Level */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Urgency Level:</span>
              <Badge variant={getUrgencyColor(analysis.urgency)} className="flex items-center space-x-1">
                {getUrgencyIcon(analysis.urgency)}
                <span>{analysis.urgency.replace('_', ' ').toUpperCase()}</span>
              </Badge>
            </div>

            {/* Severity */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Severity:</span>
              <Badge 
                variant={analysis.severity === 'high' ? 'destructive' : analysis.severity === 'medium' ? 'default' : 'secondary'}
              >
                {analysis.severity.toUpperCase()}
              </Badge>
            </div>

            {/* Possible Conditions */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Possible Conditions:</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.possible_conditions.map((condition, index) => (
                  <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Recommendations:</h4>
              <ul className="space-y-1">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. 
                Please consult with a healthcare provider for proper diagnosis and treatment.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIHealthAssistant;

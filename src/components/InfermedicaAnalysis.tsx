
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Symptom {
  id: string;
  symptom_name: string;
  severity: number;
}

interface InfermedicaAnalysisProps {
  symptoms: Symptom[];
}

const InfermedicaAnalysis = ({ symptoms }: InfermedicaAnalysisProps) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const runAnalysis = async () => {
    if (!symptoms.length || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('infermedica-analysis', {
        body: {
          symptoms: symptoms,
          age: 30, // Default age, could be from user profile
          sex: 'male' // Default sex, could be from user profile
        }
      });

      if (error) throw error;

      if (data.success) {
        setAnalysis(data.analysis);
        toast.success('AI analysis completed!');
        
        // Update symptoms with Infermedica analysis
        for (const symptom of symptoms) {
          await supabase
            .from('symptoms')
            .update({
              infermedica_analysis: data.analysis as any,
              confidence_score: data.analysis.confidence_score
            })
            .eq('id', symptom.id);
        }
      }
    } catch (error) {
      console.error('Analysis Error:', error);
      toast.error('Failed to analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>AI Symptom Analysis</span>
        </CardTitle>
        <CardDescription>
          Get AI-powered medical insights using Infermedica's healthcare API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runAnalysis}
          disabled={loading || symptoms.length === 0}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Symptoms...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Run AI Analysis ({symptoms.length} symptoms)
            </>
          )}
        </Button>

        {analysis && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Possible Conditions:</h4>
              <div className="space-y-2">
                {analysis.conditions.slice(0, 3).map((condition: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-blue-800">{condition.name}</span>
                    <span className="text-sm text-blue-600">
                      {Math.round(condition.probability * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {analysis.question && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900">Follow-up Question:</h4>
                    <p className="text-orange-800 text-sm mt-1">{analysis.question.text}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
              ⚠️ This analysis is for informational purposes only and should not replace professional medical advice.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InfermedicaAnalysis;

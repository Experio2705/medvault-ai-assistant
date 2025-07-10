
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import { toast } from 'sonner';

interface VoiceSymptomLoggerProps {
  onSymptomDetected: (symptom: string) => void;
}

const VoiceSymptomLogger = ({ onSymptomDetected }: VoiceSymptomLoggerProps) => {
  const [transcript, setTranscript] = useState('');

  const { isListening, startListening, stopListening } = useVoiceToText({
    onTranscript: (text) => {
      setTranscript(text);
      // Simple symptom detection - look for common symptom keywords
      const symptomKeywords = ['pain', 'ache', 'headache', 'fever', 'cough', 'nausea', 'dizzy', 'tired', 'fatigue'];
      const foundSymptoms = symptomKeywords.filter(keyword => 
        text.toLowerCase().includes(keyword)
      );
      
      if (foundSymptoms.length > 0) {
        foundSymptoms.forEach(symptom => onSymptomDetected(symptom));
      }
    },
    onError: (error) => {
      toast.error(error);
    }
  });

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      setTranscript('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5" />
          <span>Voice Symptom Logger</span>
        </CardTitle>
        <CardDescription>
          Describe your symptoms using voice - we'll detect and log them automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Button
            onClick={handleToggleListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="w-full"
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Voice Recording
              </>
            )}
          </Button>
        </div>

        {isListening && (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700 mb-2">🎤 Listening... Speak clearly about your symptoms</p>
            <div className="flex justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {transcript && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Transcript:</h4>
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>💡 Try saying things like: "I have a headache", "I'm feeling nauseous", "I have chest pain"</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceSymptomLogger;


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, Brain, Calendar, MapPin, Thermometer, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SymptomLogger = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState("3");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [transcript, setTranscript] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const startRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        toast({
          title: "Recording started",
          description: "Speak clearly about your symptoms",
        });
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(finalTranscript);
          setSymptoms(finalTranscript);
          
          // Mock AI analysis
          setTimeout(() => {
            setAiSuggestions([
              "Consider consulting a neurologist",
              "Track triggers like stress or lack of sleep",
              "Monitor blood pressure regularly"
            ]);
          }, 1000);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
        toast({
          title: "Recording error",
          description: "Please try again or type your symptoms manually",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      toast({
        title: "Speech recognition not supported",
        description: "Please type your symptoms manually",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const handleSubmit = () => {
    if (!symptoms.trim()) {
      toast({
        title: "Missing information",
        description: "Please describe your symptoms",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Symptoms logged successfully",
      description: "Your symptoms have been recorded and analyzed",
    });

    // Reset form
    setSymptoms("");
    setSeverity("3");
    setDuration("");
    setLocation("");
    setTranscript("");
    setAiSuggestions([]);
  };

  const severityColors = {
    "1": "bg-green-100 text-green-800",
    "2": "bg-yellow-100 text-yellow-800", 
    "3": "bg-orange-100 text-orange-800",
    "4": "bg-red-100 text-red-800",
    "5": "bg-red-200 text-red-900"
  };

  const commonSymptoms = [
    "Headache", "Fever", "Nausea", "Fatigue", "Dizziness", 
    "Chest Pain", "Shortness of Breath", "Abdominal Pain"
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-green-600" />
            <span>Log Your Symptoms</span>
          </CardTitle>
          <CardDescription>
            Record your symptoms using voice or text. Our AI will analyze and provide recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Recording */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Voice Recording</h3>
                <p className="text-sm text-gray-600">Speak naturally about your symptoms</p>
              </div>
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className={`${isRecording ? 'animate-pulse' : ''}`}
              >
                {isRecording ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
            </div>
            
            {transcript && (
              <div className="p-3 bg-white rounded-md border">
                <p className="text-sm text-gray-700">{transcript}</p>
              </div>
            )}
          </div>

          {/* Quick Symptom Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Common Symptoms</Label>
            <div className="flex flex-wrap gap-2">
              {commonSymptoms.map((symptom) => (
                <Badge
                  key={symptom}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  onClick={() => setSymptoms(prev => prev ? `${prev}, ${symptom}` : symptom)}
                >
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>

          {/* Symptom Description */}
          <div className="space-y-2">
            <Label htmlFor="symptoms" className="text-base font-medium">Describe Your Symptoms</Label>
            <Textarea
              id="symptoms"
              placeholder="Describe your symptoms in detail... (e.g., I have a throbbing headache on the left side of my head that started this morning)"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Severity and Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity" className="text-base font-medium flex items-center space-x-1">
                <Thermometer className="h-4 w-4" />
                <span>Severity (1-5)</span>
              </Label>
              <Input
                id="severity"
                type="range"
                min="1"
                max="5"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full"
              />
              <div className="text-center">
                <Badge className={severityColors[severity as keyof typeof severityColors]}>
                  Level {severity} - {
                    severity === "1" ? "Mild" :
                    severity === "2" ? "Mild-Moderate" :
                    severity === "3" ? "Moderate" :
                    severity === "4" ? "Severe" : "Very Severe"
                  }
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-base font-medium flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Duration</span>
              </Label>
              <Input
                id="duration"
                placeholder="e.g., 2 hours, 3 days"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-medium flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., left temple, chest"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-purple-700">
                  <Brain className="h-5 w-5" />
                  <span>AI Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg py-3"
            disabled={!symptoms.trim()}
          >
            <Send className="h-5 w-5 mr-2" />
            Log Symptoms
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SymptomLogger;

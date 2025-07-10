
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Mic, MicOff, User, Bot, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useVoiceToText } from '@/hooks/useVoiceToText';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    conditions?: any[];
    urgency?: string;
    confidence?: number;
    follow_up_question?: string;
  };
}

interface ConversationState {
  stage: 'greeting' | 'symptom_gathering' | 'clarification' | 'analysis' | 'recommendation';
  symptoms: string[];
  context: Record<string, any>;
}

const ConversationalHealthAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    stage: 'greeting',
    symptoms: [],
    context: {}
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isListening, startListening, stopListening } = useVoiceToText({
    onTranscript: (text) => {
      setInput(prev => prev + ' ' + text);
    },
    onError: (error) => toast.error(error)
  });

  useEffect(() => {
    // Initial greeting
    if (messages.length === 0) {
      addMessage('assistant', "Hello! I'm your AI health assistant. I'm here to help you understand your symptoms and provide medical guidance. How are you feeling today?");
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (type: 'user' | 'assistant', content: string, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      metadata
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const processNaturalLanguage = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Extract symptoms using pattern matching
    const symptomPatterns = [
      /(?:i have|experiencing|feeling|suffering from)\s+(.*?)(?:\.|$)/gi,
      /(?:my|the)\s+(.*?)\s+(?:hurts?|aches?|pains?|is sore)/gi,
      /(headache|fever|cough|nausea|dizzy|tired|fatigue|pain|ache)/gi,
      /(chest pain|stomach ache|back pain|sore throat|runny nose)/gi
    ];

    const extractedSymptoms: string[] = [];
    symptomPatterns.forEach(pattern => {
      const matches = lowerText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/(?:i have|experiencing|feeling|suffering from|my|the|hurts?|aches?|pains?|is sore)/gi, '').trim();
          if (cleaned && cleaned.length > 2) {
            extractedSymptoms.push(cleaned);
          }
        });
      }
    });

    // Extract severity indicators
    const severityPatterns = {
      high: /(severe|terrible|excruciating|unbearable|intense|sharp)/gi,
      medium: /(moderate|noticeable|bothersome|uncomfortable)/gi,
      low: /(mild|slight|minor|little)/gi
    };

    let severity = 'medium';
    Object.entries(severityPatterns).forEach(([level, pattern]) => {
      if (pattern.test(lowerText)) {
        severity = level;
      }
    });

    // Extract duration
    const durationPattern = /(for\s+)?(\d+)\s+(hours?|days?|weeks?|minutes?)/gi;
    const durationMatch = lowerText.match(durationPattern);
    const duration = durationMatch ? durationMatch[0] : null;

    return {
      symptoms: extractedSymptoms,
      severity,
      duration,
      intent: determineIntent(lowerText)
    };
  };

  const determineIntent = (text: string) => {
    if (/(hello|hi|hey|good morning|good afternoon)/i.test(text)) return 'greeting';
    if (/(yes|yeah|correct|right|that\'s right)/i.test(text)) return 'confirmation';
    if (/(no|nope|incorrect|wrong|not really)/i.test(text)) return 'denial';
    if (/(help|what should i do|advice|recommend)/i.test(text)) return 'seeking_help';
    if (/(pain|hurt|ache|sick|ill|symptom)/i.test(text)) return 'symptom_report';
    return 'general';
  };

  const generateContextualResponse = async (userInput: string, nlpResult: any) => {
    const { stage } = conversationState;
    
    switch (stage) {
      case 'greeting':
        if (nlpResult.symptoms.length > 0) {
          setConversationState(prev => ({
            ...prev,
            stage: 'symptom_gathering',
            symptoms: [...prev.symptoms, ...nlpResult.symptoms],
            context: { ...prev.context, severity: nlpResult.severity, duration: nlpResult.duration }
          }));
          
          return `I understand you're experiencing ${nlpResult.symptoms.join(', ')}. That sounds concerning. Can you tell me more about when this started and how severe it feels on a scale of 1-10?`;
        } else {
          return "I'm here to help with any health concerns you might have. Please describe any symptoms you're experiencing, and I'll do my best to provide guidance.";
        }

      case 'symptom_gathering':
        if (nlpResult.intent === 'confirmation' && conversationState.symptoms.length > 0) {
          setConversationState(prev => ({ ...prev, stage: 'analysis' }));
          return await performInfermedicaAnalysis();
        } else if (nlpResult.symptoms.length > 0) {
          setConversationState(prev => ({
            ...prev,
            symptoms: [...prev.symptoms, ...nlpResult.symptoms]
          }));
          return `I've noted ${nlpResult.symptoms.join(', ')} as well. Are there any other symptoms you'd like to mention? If not, I can analyze what you've told me so far.`;
        } else {
          return "Could you provide more details about your symptoms? For example, where exactly do you feel discomfort, and how long have you been experiencing this?";
        }

      case 'analysis':
        return "I'm currently analyzing your symptoms. Please wait a moment...";

      default:
        return "I'm here to help with your health concerns. How are you feeling?";
    }
  };

  const performInfermedicaAnalysis = async () => {
    try {
      const symptoms = conversationState.symptoms.map(symptom => ({
        symptom_name: symptom,
        severity: 3
      }));

      const { data, error } = await supabase.functions.invoke('infermedica-analysis', {
        body: {
          symptoms: symptoms,
          age: 30,
          sex: 'male'
        }
      });

      if (error) throw error;

      if (data.success) {
        const analysis = data.analysis;
        setConversationState(prev => ({ ...prev, stage: 'recommendation' }));
        
        // Add analysis to message metadata
        const metadata = {
          conditions: analysis.conditions,
          urgency: getUrgencyLevel(analysis.conditions),
          confidence: analysis.confidence_score,
          follow_up_question: analysis.question?.text
        };

        let response = "Based on my analysis of your symptoms, here are the most likely conditions:\n\n";
        
        analysis.conditions.slice(0, 3).forEach((condition: any, index: number) => {
          response += `${index + 1}. **${condition.name}** (${Math.round(condition.probability * 100)}% likelihood)\n`;
        });

        response += "\n";

        if (analysis.question) {
          response += `I have a follow-up question to better understand your condition: ${analysis.question.text}`;
          setConversationState(prev => ({ ...prev, stage: 'clarification' }));
        } else {
          response += getRecommendationText(metadata.urgency);
        }

        // Store the analysis metadata for the next message
        setTimeout(() => {
          addMessage('assistant', response, metadata);
        }, 100);

        return "Let me analyze your symptoms using medical AI...";
      }
    } catch (error) {
      console.error('Analysis error:', error);
      return "I'm having trouble analyzing your symptoms right now. Based on what you've told me, I'd recommend consulting with a healthcare professional, especially if your symptoms persist or worsen.";
    }
  };

  const getUrgencyLevel = (conditions: any[]) => {
    if (!conditions?.length) return 'routine';
    const highestProbability = Math.max(...conditions.map(c => c.probability));
    if (highestProbability > 0.7) return 'seek_immediate_care';
    if (highestProbability > 0.4) return 'schedule_soon';
    return 'routine';
  };

  const getRecommendationText = (urgency: string) => {
    switch (urgency) {
      case 'seek_immediate_care':
        return "\n🚨 **Important:** Based on your symptoms, I recommend seeking immediate medical attention. Please consider visiting an emergency room or urgent care center.";
      case 'schedule_soon':
        return "\n⏰ **Recommendation:** You should schedule an appointment with your healthcare provider within the next few days to discuss these symptoms.";
      default:
        return "\n✅ **Recommendation:** Keep monitoring your symptoms. If they worsen or persist, consider scheduling a routine appointment with your healthcare provider.";
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    addMessage('user', userMessage);

    try {
      // Process natural language
      const nlpResult = processNaturalLanguage(userMessage);
      
      // Generate contextual response
      const response = await generateContextualResponse(userMessage, nlpResult);
      
      // Add assistant response
      addMessage('assistant', response);
      
    } catch (error) {
      console.error('Conversation error:', error);
      addMessage('assistant', "I apologize, but I'm having trouble processing your message. Could you please rephrase your concern?");
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const configs = {
      seek_immediate_care: { variant: 'destructive' as const, icon: AlertTriangle, text: 'URGENT' },
      schedule_soon: { variant: 'default' as const, icon: Clock, text: 'SCHEDULE SOON' },
      routine: { variant: 'secondary' as const, icon: CheckCircle, text: 'ROUTINE' }
    };
    
    const config = configs[urgency as keyof typeof configs] || configs.routine;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col bg-white/60 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span>Conversational Health Assistant</span>
        </CardTitle>
        <CardDescription>
          Have a natural conversation about your health concerns with AI-powered medical insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="flex items-start space-x-2">
                  {message.type === 'assistant' && <Bot className="h-4 w-4 mt-1 text-purple-600" />}
                  {message.type === 'user' && <User className="h-4 w-4 mt-1" />}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Metadata for analysis results */}
                    {message.metadata && (
                      <div className="mt-3 space-y-2">
                        {message.metadata.urgency && (
                          <div className="flex items-center space-x-2">
                            {getUrgencyBadge(message.metadata.urgency)}
                            {message.metadata.confidence && (
                              <Badge variant="outline">
                                {Math.round(message.metadata.confidence * 100)}% Confidence
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {message.metadata.conditions && (
                          <div className="mt-2 text-xs text-gray-600">
                            <strong>Analyzed conditions:</strong> {message.metadata.conditions.slice(0, 3).map((c: any) => c.name).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your symptoms or ask a health question..."
              disabled={loading}
              className="pr-12"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <p className="text-xs text-yellow-800">
            <strong>Disclaimer:</strong> This AI assistant provides informational guidance only and should not replace professional medical advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationalHealthAssistant;

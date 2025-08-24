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
  previousQuestions: string[];
  userProfile: {
    age?: number;
    sex?: 'male' | 'female';
    conditions?: string[];
  };
}

const ConversationalHealthAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    stage: 'greeting',
    symptoms: [],
    context: {},
    previousQuestions: [],
    userProfile: {}
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
      addMessage('assistant', "Hello! I'm your AI health assistant. I can help you understand your symptoms and provide medical guidance. To get started, please tell me your age and gender, then describe how you're feeling today.");
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

  const extractMedicalInfo = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Extract age
    const ageMatch = text.match(/(?:i am|i'm|age)\s*(\d{1,3})|(\d{1,3})\s*(?:years?\s*old|yo)/i);
    const age = ageMatch ? parseInt(ageMatch[1] || ageMatch[2]) : null;
    
    // Extract gender
    const genderMatch = text.match(/(?:i am|i'm)\s*(male|female|man|woman)|(?:male|female|man|woman)/i);
    const gender = genderMatch ? (genderMatch[1].toLowerCase().includes('m') ? 'male' : 'female') : null;
    
    // Extract symptoms with more comprehensive patterns
    const symptomPatterns = [
      /(?:i have|experiencing|feeling|suffering from|i've been having)\s+([^.!?]+)/gi,
      /(?:my|the)\s+([a-zA-Z\s]+)\s+(?:hurts?|aches?|pains?|is sore|feels|bothers?)/gi,
      /(headache|fever|cough|nausea|dizzy|tired|fatigue|pain|ache|chest pain|stomach ache|back pain|sore throat|runny nose|congestion|shortness of breath|difficulty breathing|vomiting|diarrhea|constipation|rash|swelling|joint pain|muscle pain)/gi
    ];

    const extractedSymptoms: string[] = [];
    symptomPatterns.forEach(pattern => {
      const matches = Array.from(lowerText.matchAll(pattern));
      matches.forEach(match => {
        let symptom = match[1] || match[0];
        symptom = symptom.replace(/(?:i have|experiencing|feeling|suffering from|i've been having|my|the|hurts?|aches?|pains?|is sore|feels|bothers?)/gi, '').trim();
        if (symptom && symptom.length > 2 && !extractedSymptoms.includes(symptom)) {
          extractedSymptoms.push(symptom);
        }
      });
    });

    // Extract severity indicators
    const severityPatterns = {
      high: /(severe|terrible|excruciating|unbearable|intense|sharp|extreme|worst)/gi,
      medium: /(moderate|noticeable|bothersome|uncomfortable|bad)/gi,
      low: /(mild|slight|minor|little|light)/gi
    };

    let severity = 'medium';
    Object.entries(severityPatterns).forEach(([level, pattern]) => {
      if (pattern.test(lowerText)) {
        severity = level;
      }
    });

    // Extract duration
    const durationPattern = /(for\s+)?(\d+)\s+(hours?|days?|weeks?|months?|minutes?)/gi;
    const durationMatch = lowerText.match(durationPattern);
    const duration = durationMatch ? durationMatch[0] : null;

    return {
      age,
      gender,
      symptoms: extractedSymptoms,
      severity,
      duration,
      intent: determineIntent(lowerText)
    };
  };

  // Helper function to fetch user documents for context
  const fetchUserDocuments = async (): Promise<string> => {
    try {
      const { data: documents, error } = await supabase
        .from('medical_records')
        .select('title, description, extracted_text, record_type, date_recorded')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!documents || documents.length === 0) {
        return "No medical documents found in your records.";
      }

      return documents.map(doc => 
        `Document: ${doc.title} (${doc.record_type})
Date: ${doc.date_recorded || 'Not specified'}
Description: ${doc.description || 'No description'}
Content: ${doc.extracted_text || 'No extracted text available'}
---`
      ).join('\n\n');
    } catch (error) {
      console.error('Error fetching documents:', error);
      return "Unable to access your medical documents at this time.";
    }
  };

  const determineIntent = (text: string) => {
    if (/(hello|hi|hey|good morning|good afternoon)/i.test(text)) return 'greeting';
    if (/(yes|yeah|correct|right|that\'s right|exactly)/i.test(text)) return 'confirmation';
    if (/(no|nope|incorrect|wrong|not really|not exactly)/i.test(text)) return 'denial';
    if (/(help|what should i do|advice|recommend|treatment|medicine)/i.test(text)) return 'seeking_help';
    if (/(pain|hurt|ache|sick|ill|symptom|feel|feeling)/i.test(text)) return 'symptom_report';
    if (/(\d+)\s*(?:years?\s*old|yo)|(?:i am|i'm)\s*(\d+)|(?:male|female|man|woman)/i.test(text)) return 'profile_info';
    return 'general';
  };

  const generateDynamicResponse = async (userInput: string, extractedInfo: any) => {
    const { stage, symptoms, context, previousQuestions } = conversationState;
    
    // Check if user is asking about their documents or medical history
    if (userInput.toLowerCase().includes('document') || 
        userInput.toLowerCase().includes('record') || 
        userInput.toLowerCase().includes('history') ||
        userInput.toLowerCase().includes('report') ||
        userInput.toLowerCase().includes('past') ||
        userInput.toLowerCase().includes('previous') ||
        userInput.toLowerCase().includes('uploaded') ||
        userInput.toLowerCase().includes('file')) {
      
      const documents = await fetchUserDocuments();
      const documentContext = `Based on your uploaded medical documents:\n\n${documents}`;
      
      return `${documentContext}\n\nI can see your medical documents and records. How can I help you understand or analyze this information?`;
    }
    
    // Update user profile if new info is provided
    if (extractedInfo.age || extractedInfo.gender) {
      setConversationState(prev => ({
        ...prev,
        userProfile: {
          ...prev.userProfile,
          age: extractedInfo.age || prev.userProfile.age,
          sex: extractedInfo.gender || prev.userProfile.sex
        }
      }));
    }
    
    switch (stage) {
      case 'greeting':
        if (extractedInfo.age && extractedInfo.gender && extractedInfo.symptoms.length > 0) {
          // Complete profile and symptoms in one go
          setConversationState(prev => ({
            ...prev,
            stage: 'symptom_gathering',
            symptoms: [...prev.symptoms, ...extractedInfo.symptoms],
            context: { ...prev.context, severity: extractedInfo.severity, duration: extractedInfo.duration }
          }));
          
          return `Thank you for that information. So you're a ${extractedInfo.age}-year-old ${extractedInfo.gender} experiencing ${extractedInfo.symptoms.join(', ')}. ${extractedInfo.duration ? `You mentioned this has been going on ${extractedInfo.duration}. ` : ''}Can you rate the severity on a scale of 1-10, and tell me if there are any other symptoms I should know about?`;
        } else if (extractedInfo.age || extractedInfo.gender) {
          return `Thanks! I have your ${extractedInfo.age ? 'age as ' + extractedInfo.age : 'gender as ' + extractedInfo.gender}. ${extractedInfo.age && !extractedInfo.gender ? 'Could you also tell me your gender?' : !extractedInfo.age && extractedInfo.gender ? 'Could you also tell me your age?' : ''} Now, please describe any symptoms you're experiencing.`;
        } else if (extractedInfo.symptoms.length > 0) {
          setConversationState(prev => ({
            ...prev,
            symptoms: [...prev.symptoms, ...extractedInfo.symptoms],
            context: { ...prev.context, severity: extractedInfo.severity, duration: extractedInfo.duration }
          }));
          return `I understand you're experiencing ${extractedInfo.symptoms.join(', ')}. To help you better, I'll need to know your age and gender first. This helps me provide more accurate medical guidance.`;
        } else {
          return generateVariedGreeting(previousQuestions);
        }

      case 'symptom_gathering':
        if (extractedInfo.intent === 'confirmation') {
          if (symptoms.length > 0 && conversationState.userProfile.age && conversationState.userProfile.sex) {
            setConversationState(prev => ({ ...prev, stage: 'analysis' }));
            return "Perfect! Let me analyze your symptoms now. This may take a moment...";
          } else {
            return "I still need your age and gender to proceed with the analysis. Could you please provide that information?";
          }
        } else if (extractedInfo.symptoms.length > 0) {
          const newSymptoms = extractedInfo.symptoms.filter(s => !symptoms.includes(s));
          if (newSymptoms.length > 0) {
            setConversationState(prev => ({
              ...prev,
              symptoms: [...prev.symptoms, ...newSymptoms],
              context: { ...prev.context, severity: extractedInfo.severity, duration: extractedInfo.duration }
            }));
            return `I've noted ${newSymptoms.join(', ')} as additional symptoms. ${extractedInfo.duration ? `Duration: ${extractedInfo.duration}. ` : ''}Are there any other symptoms you'd like to mention, or shall I analyze what you've told me so far?`;
          }
        }
        
        return generateSymptomGatheringResponse(symptoms, extractedInfo);

      case 'analysis':
        if (symptoms.length > 0 && conversationState.userProfile.age && conversationState.userProfile.sex) {
          return await performDocumentBasedAnalysis();
        } else {
          setConversationState(prev => ({ ...prev, stage: 'symptom_gathering' }));
          return "I need more information to perform the analysis. Please provide your symptoms, age, and gender.";
        }

      case 'clarification':
        if (extractedInfo.intent === 'confirmation' || extractedInfo.intent === 'denial') {
          return await performDocumentBasedAnalysis();
        }
        return "Please answer the follow-up question with yes or no, or provide more details about your symptoms.";

      default:
        return generateContextualResponse(userInput, extractedInfo);
    }
  };

  const generateVariedGreeting = (previousQuestions: string[]) => {
    const greetings = [
      "I'm here to help with your health concerns. Please start by telling me your age, gender, and describe any symptoms you're experiencing.",
      "Let's work together to understand your health situation. First, I'll need your age and gender, then please describe how you're feeling.",
      "To provide you with the best medical guidance, please share your age, gender, and tell me about any symptoms or discomfort you're having.",
      "I'm ready to help analyze your symptoms. Could you please tell me your age, gender, and describe what's bothering you?"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const generateSymptomGatheringResponse = (symptoms: string[], extractedInfo: any) => {
    if (symptoms.length === 0) {
      return "I haven't identified any specific symptoms yet. Could you describe what you're feeling? For example, do you have pain, discomfort, or any unusual sensations?";
    }
    
    const responses = [
      `Based on what you've shared about ${symptoms.join(', ')}, are there any other symptoms I should know about?`,
      `You've mentioned ${symptoms.join(', ')}. How would you rate the severity, and are there any other concerns?`,
      `I have ${symptoms.join(', ')} noted. Any additional symptoms or details about when this started?`,
      `Thank you for sharing about ${symptoms.join(', ')}. Anything else you'd like to add before I analyze this?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateContextualResponse = (userInput: string, extractedInfo: any) => {
    const responses = [
      "I understand your concern. Could you provide more specific details about your symptoms?",
      "That's helpful information. Can you tell me more about how this is affecting you?",
      "I see. Let me gather a bit more information to help you better.",
      "Thank you for sharing that. Could you elaborate on any other symptoms you might be experiencing?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const performDocumentBasedAnalysis = async () => {
    try {
      const { symptoms, userProfile } = conversationState;
      
      if (symptoms.length === 0 || !userProfile.age || !userProfile.sex) {
        return "I need your symptoms, age, and gender to perform a proper medical analysis. Could you please provide this information?";
      }

      // Get user documents for additional context
      const documents = await fetchUserDocuments();
      
      setConversationState(prev => ({ ...prev, stage: 'recommendation' }));
      
      let response = `Based on your reported symptoms and available medical documents, here's my analysis:\n\n`;
      
      // Analyze symptoms
      response += `**Your Symptoms:** ${symptoms.join(', ')}\n`;
      response += `**Profile:** ${userProfile.age}-year-old ${userProfile.sex}\n\n`;
      
      // Provide document-based insights
      if (documents && !documents.includes("No medical documents found")) {
        response += `**From Your Medical Records:**\n`;
        response += `I've reviewed your uploaded medical documents and can provide context based on your medical history. `;
        
        // Check for relevant patterns in documents
        const documentText = documents.toLowerCase();
        const currentSymptoms = symptoms.map(s => s.toLowerCase());
        
        const foundRelevantInfo = currentSymptoms.some(symptom => 
          documentText.includes(symptom) || 
          documentText.includes(symptom.replace(/\s+/g, '')) ||
          documentText.includes('chronic') ||
          documentText.includes('history of')
        );
        
        if (foundRelevantInfo) {
          response += `Your current symptoms may be related to conditions mentioned in your medical history. `;
        }
        
        response += `Please discuss these symptoms with your healthcare provider who can review your complete medical history.\n\n`;
      } else {
        response += `**No Medical History Available:**\nI don't have access to your previous medical records to provide historical context.\n\n`;
      }
      
      // Provide general guidance based on symptoms
      response += `**General Guidance:**\n`;
      
      // Symptom severity assessment
      const severeSymptoms = ['chest pain', 'difficulty breathing', 'severe pain', 'high fever', 'bleeding', 'confusion', 'severe headache'];
      const hasSevereSymptoms = symptoms.some(symptom => 
        severeSymptoms.some(severe => symptom.toLowerCase().includes(severe))
      );
      
      if (hasSevereSymptoms) {
        response += `🚨 **Urgent:** Some of your symptoms may require immediate medical attention. Please consider seeking emergency care or contacting your healthcare provider immediately.\n\n`;
      } else {
        response += `• Monitor your symptoms and note any changes\n`;
        response += `• Stay hydrated and get adequate rest\n`;
        response += `• Consider scheduling an appointment with your healthcare provider if symptoms persist or worsen\n\n`;
      }
      
      response += `**Important Disclaimer:** This analysis is for informational purposes only and cannot replace professional medical advice. Please consult with a qualified healthcare professional for proper diagnosis and treatment.`;
      
      const metadata = {
        conditions: [],
        urgency: hasSevereSymptoms ? 'seek_immediate_care' : 'schedule_soon',
        confidence: 0.7
      };
      
      // Store the analysis metadata for the next message
      setTimeout(() => {
        addMessage('assistant', response, metadata);
      }, 100);

      return "Analyzing your symptoms and reviewing your medical documents...";
    } catch (error) {
      console.error('Analysis error:', error);
      return "I'm experiencing technical difficulties. For your safety, please consult with a healthcare professional about your symptoms.";
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

    // Update previous questions for context
    setConversationState(prev => ({
      ...prev,
      previousQuestions: [...prev.previousQuestions, userMessage].slice(-5) // Keep last 5 questions
    }));

    try {
      // Extract medical information
      const extractedInfo = extractMedicalInfo(userMessage);
      console.log('Extracted info:', extractedInfo);
      
      // Generate dynamic response
      const response = await generateDynamicResponse(userMessage, extractedInfo);
      
      // Add assistant response
      addMessage('assistant', response);
      
    } catch (error) {
      console.error('Conversation error:', error);
      addMessage('assistant', "I apologize, but I'm having trouble processing your message. Could you please rephrase your concern or try again?");
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
          Have a natural conversation about your health concerns with AI-powered medical insights and document analysis
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


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface OCRUploadProps {
  onTextExtracted: (text: string, confidence: number) => void;
  recordId?: string;
}

const OCRUpload = ({ onTextExtracted, recordId }: OCRUploadProps) => {
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setProcessing(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix

          // Call OCR edge function
          const { data, error } = await supabase.functions.invoke('ocr-prescription', {
            body: {
              imageBase64: base64Data,
              recordId: recordId || 'temp'
            }
          });

          if (error) throw error;

          if (data.success) {
            onTextExtracted(data.extractedText, data.confidence);
            toast.success('Text extracted successfully!');
          } else {
            throw new Error('OCR processing failed');
          }
        } catch (error) {
          console.error('OCR Error:', error);
          toast.error('Failed to extract text from image');
        } finally {
          setProcessing(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error('Failed to upload file');
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>OCR Text Extraction</span>
        </CardTitle>
        <CardDescription>
          Upload a prescription or medical document to extract text automatically
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="ocr-upload"
              disabled={processing}
            />
            <label
              htmlFor="ocr-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              {processing ? (
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
              ) : (
                <Upload className="h-12 w-12 text-gray-400" />
              )}
              <span className="text-sm text-gray-600">
                {processing ? 'Processing image...' : 'Click to upload prescription image'}
              </span>
            </label>
          </div>
          
          {processing && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                🔍 Analyzing image with OCR.Space API...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OCRUpload;


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Image, CheckCircle, AlertCircle, Brain, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FileUpload = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    extractedText?: string;
    aiInsights?: string[];
  }>>([]);
  const { toast } = useToast();

  const mockProcessFile = (file: File) => {
    const fileData = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type.includes('image') ? 'image' : 'pdf',
      status: 'uploading' as const
    };

    setUploadedFiles(prev => [...prev, fileData]);

    // Simulate upload and processing
    setTimeout(() => {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'processing' } : f
      ));
      
      setTimeout(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'completed',
            extractedText: "Extracted medical information: Blood pressure 120/80, Cholesterol 180 mg/dL, Normal glucose levels.",
            aiInsights: [
              "Blood pressure within normal range",
              "Cholesterol slightly elevated - consider dietary changes",
              "Glucose levels normal - continue current management"
            ]
          } : f
        ));
        
        toast({
          title: "File processed successfully",
          description: `${file.name} has been analyzed with AI insights.`,
        });
      }, 2000);
    }, 1000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.includes('image') || file.type.includes('pdf')) {
        mockProcessFile(file);
      } else {
        toast({
          title: "Unsupported file type",
          description: "Please upload only PDF or image files.",
          variant: "destructive",
        });
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(mockProcessFile);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-6 w-6 text-blue-600" />
            <span>Upload Medical Documents</span>
          </CardTitle>
          <CardDescription>
            Upload prescriptions, lab reports, X-rays, or any medical documents. Our AI will extract and analyze the information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drop your files here, or click to browse
                </h3>
                <p className="text-gray-600 mb-4">
                  Supports PDF, PNG, JPG, JPEG files up to 10MB
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload">
                  <Button asChild className="cursor-pointer">
                    <span>Choose Files</span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>

          {/* File Categories */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: FileText, label: "Lab Reports", desc: "Blood tests, urine analysis, etc." },
              { icon: Image, label: "Medical Images", desc: "X-rays, MRI, CT scans" },
              { icon: FileText, label: "Prescriptions", desc: "Doctor prescriptions and notes" }
            ].map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Icon className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">{category.label}</h4>
                  <p className="text-sm text-gray-600">{category.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Uploaded Files</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {file.type === 'image' ? (
                      <Image className="h-8 w-8 text-blue-600" />
                    ) : (
                      <FileText className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <p className="text-sm text-gray-600">{file.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      file.status === 'completed' ? 'default' :
                      file.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {file.status === 'uploading' && 'Uploading...'}
                      {file.status === 'processing' && 'Processing...'}
                      {file.status === 'completed' && 'Completed'}
                      {file.status === 'error' && 'Error'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {file.status === 'completed' && file.extractedText && (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-md">
                      <h5 className="font-medium text-gray-900 mb-1">Extracted Information:</h5>
                      <p className="text-sm text-gray-700">{file.extractedText}</p>
                    </div>
                    
                    {file.aiInsights && (
                      <div className="p-3 bg-blue-50 rounded-md">
                        <h5 className="font-medium text-blue-900 mb-2 flex items-center space-x-1">
                          <Brain className="h-4 w-4" />
                          <span>AI Insights:</span>
                        </h5>
                        <ul className="space-y-1">
                          {file.aiInsights.map((insight, idx) => (
                            <li key={idx} className="text-sm text-blue-800 flex items-start space-x-2">
                              <CheckCircle className="h-3 w-3 mt-0.5 text-green-600" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;

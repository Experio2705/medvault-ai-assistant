
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share, Link, Mail, Calendar, Shield, Copy, Eye, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ShareRecords = () => {
  const [shareMethod, setShareMethod] = useState("link");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [shareNote, setShareNote] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const { toast } = useToast();

  const activeShares = [
    {
      id: 1,
      recipient: "Dr. Sarah Johnson",
      email: "sarah.johnson@medcenter.com",
      type: "Cardiologist",
      sharedDate: "2024-01-15",
      expiryDate: "2024-01-22",
      status: "active",
      views: 3,
      lastViewed: "2024-01-16"
    },
    {
      id: 2,
      recipient: "Dr. Michael Chen",
      email: "michael.chen@healthclinic.com", 
      type: "General Practitioner",
      sharedDate: "2024-01-10",
      expiryDate: "2024-01-17",
      status: "expired",
      views: 1,
      lastViewed: "2024-01-12"
    }
  ];

  const handleGenerateLink = () => {
    const mockLink = `https://medvault.app/share/${Math.random().toString(36).substr(2, 12)}`;
    setGeneratedLink(mockLink);
    
    toast({
      title: "Share link generated",
      description: "Your secure share link has been created successfully.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({
      title: "Link copied",
      description: "Share link has been copied to your clipboard.",
    });
  };

  const handleSendEmail = () => {
    if (!doctorEmail) {
      toast({
        title: "Email required",
        description: "Please enter the doctor's email address.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Email sent successfully",
      description: `Share invitation sent to ${doctorEmail}`,
    });
    
    setDoctorEmail("");
    setShareNote("");
  };

  const revokeAccess = (shareId: number) => {
    toast({
      title: "Access revoked",
      description: "The share link has been deactivated.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Share New Records */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share className="h-6 w-6 text-blue-600" />
            <span>Share Medical Records</span>
          </CardTitle>
          <CardDescription>
            Securely share your medical records with healthcare providers using encrypted, time-limited access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Share Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                shareMethod === 'link' 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => setShareMethod('link')}
            >
              <CardContent className="p-4 text-center">
                <Link className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Share via Link</h3>
                <p className="text-sm text-gray-600">Generate a secure link to share</p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                shareMethod === 'email' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => setShareMethod('email')}
            >
              <CardContent className="p-4 text-center">
                <Mail className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold text-gray-900">Send via Email</h3>
                <p className="text-sm text-gray-600">Email directly to doctor</p>
              </CardContent>
            </Card>
          </div>

          {/* Security Settings */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-purple-700">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Link Expiration</Label>
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="14">2 weeks</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select defaultValue="read">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Read Only</SelectItem>
                      <SelectItem value="download">Read + Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {shareMethod === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctor-email">Doctor's Email Address</Label>
                <Input
                  id="doctor-email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-note">Message (Optional)</Label>
                <Textarea
                  id="share-note"
                  placeholder="Add a note for the healthcare provider..."
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={handleSendEmail}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <Mail className="h-5 w-5 mr-2" />
                Send Secure Email
              </Button>
            </div>
          )}

          {shareMethod === 'link' && (
            <div className="space-y-4">
              <Button 
                onClick={handleGenerateLink}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link className="h-5 w-5 mr-2" />
                Generate Secure Link
              </Button>

              {generatedLink && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <Label>Your Secure Share Link:</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={generatedLink} readOnly className="flex-1" />
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    This link expires in {expiryDays} day{expiryDays !== '1' ? 's' : ''} and can only be accessed by authorized healthcare providers.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Shares */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-green-600" />
            <span>Active Shares</span>
          </CardTitle>
          <CardDescription>Manage your currently shared medical records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeShares.map((share) => (
              <div key={share.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{share.recipient}</h4>
                    <p className="text-sm text-gray-600">{share.type}</p>
                    <p className="text-sm text-gray-500">{share.email}</p>
                  </div>
                  <Badge variant={share.status === 'active' ? 'default' : 'secondary'}>
                    {share.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Shared: {new Date(share.sharedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Expires: {new Date(share.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span>{share.views} views</span>
                  </div>
                </div>

                {share.status === 'active' && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      Last viewed: {new Date(share.lastViewed).toLocaleDateString()}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => revokeAccess(share.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Revoke Access
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareRecords;

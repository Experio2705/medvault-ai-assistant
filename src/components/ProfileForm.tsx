
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, User, Calendar, Phone, AlertTriangle, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileData {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string[];
  allergies?: string[];
  current_medications?: string[];
}

const ProfileForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({});
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const { register, handleSubmit, setValue, watch } = useForm<ProfileData>();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
      Object.entries(data).forEach(([key, value]) => {
        setValue(key as keyof ProfileData, value);
      });
    }
  };

  const onSubmit = async (data: ProfileData) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          medical_conditions: profile.medical_conditions || [],
          allergies: profile.allergies || [],
          current_medications: profile.current_medications || [],
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Profile updated successfully!');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  const addItem = (type: 'medical_conditions' | 'allergies' | 'current_medications', value: string) => {
    if (!value.trim()) return;

    const currentItems = profile[type] || [];
    const updatedItems = [...currentItems, value.trim()];
    
    setProfile(prev => ({ ...prev, [type]: updatedItems }));
    
    if (type === 'medical_conditions') setNewCondition('');
    if (type === 'allergies') setNewAllergy('');
    if (type === 'current_medications') setNewMedication('');
  };

  const removeItem = (type: 'medical_conditions' | 'allergies' | 'current_medications', index: number) => {
    const currentItems = profile[type] || [];
    const updatedItems = currentItems.filter((_, i) => i !== index);
    setProfile(prev => ({ ...prev, [type]: updatedItems }));
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5 text-blue-600" />
          <span>Profile Information</span>
        </CardTitle>
        <CardDescription>
          Keep your medical profile up to date for better health tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Date of Birth</span>
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-1">
                <Phone className="h-4 w-4" />
                <span>Phone Number</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  {...register('emergency_contact_name')}
                  placeholder="Emergency contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  {...register('emergency_contact_phone')}
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Medical Conditions</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.medical_conditions?.map((condition, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{condition}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeItem('medical_conditions', index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add medical condition"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('medical_conditions', newCondition))}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem('medical_conditions', newCondition)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Allergies</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.allergies?.map((allergy, index) => (
                <Badge key={index} variant="destructive" className="flex items-center space-x-1">
                  <span>{allergy}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-700"
                    onClick={() => removeItem('allergies', index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('allergies', newAllergy))}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem('allergies', newAllergy)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Medications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Pill className="h-5 w-5 text-green-500" />
              <span>Current Medications</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.current_medications?.map((medication, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1 border-green-200 text-green-700">
                  <span>{medication}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeItem('current_medications', index)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Add current medication"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('current_medications', newMedication))}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem('current_medications', newMedication)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;

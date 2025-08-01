import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Building, Calendar, MapPin, Save, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  employer_name?: string | null;
  employer_address?: string | null;
  job_title?: string | null;
  employment_start_date?: string | null;
  occupation?: string | null;
  monthly_income?: number | null;
}

interface ClientEmploymentTabProps {
  client: Client;
}

export const ClientEmploymentTab = ({ client }: ClientEmploymentTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employer_name: client.employer_name || '',
    employer_address: client.employer_address || '',
    job_title: client.job_title || '',
    employment_start_date: client.employment_start_date || '',
    occupation: client.occupation || '',
    monthly_income: client.monthly_income?.toString() || '',
  });
  const { toast } = useToast();

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "KES 0";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          employer_name: formData.employer_name || null,
          employer_address: formData.employer_address || null,
          job_title: formData.job_title || null,
          employment_start_date: formData.employment_start_date || null,
          occupation: formData.occupation || null,
          monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employment details updated successfully",
      });
      
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating employment details:', error);
      toast({
        title: "Error",
        description: "Failed to update employment details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      employer_name: client.employer_name || '',
      employer_address: client.employer_address || '',
      job_title: client.job_title || '',
      employment_start_date: client.employment_start_date || '',
      occupation: client.occupation || '',
      monthly_income: client.monthly_income?.toString() || '',
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Edit Employment Information
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employer_name">Employer Name</Label>
                  <Input
                    id="employer_name"
                    value={formData.employer_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, employer_name: e.target.value }))}
                    placeholder="Enter employer name"
                  />
                </div>
                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="Enter job title"
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                    placeholder="Enter occupation"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monthly_income">Monthly Income (KES)</Label>
                  <Input
                    id="monthly_income"
                    type="number"
                    value={formData.monthly_income}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_income: e.target.value }))}
                    placeholder="Enter monthly income"
                  />
                </div>
                <div>
                  <Label htmlFor="employment_start_date">Employment Start Date</Label>
                  <Input
                    id="employment_start_date"
                    type="date"
                    value={formData.employment_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, employment_start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="employer_address">Employer Address</Label>
                  <Input
                    id="employer_address"
                    value={formData.employer_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, employer_address: e.target.value }))}
                    placeholder="Enter employer address"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Employment Information
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Employer Name</Label>
                <p className="text-sm font-medium">{client.employer_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                <p className="text-sm">{client.job_title || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Occupation</Label>
                <p className="text-sm">{client.occupation || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Monthly Income</Label>
                <p className="text-lg font-semibold text-success">{formatCurrency(client.monthly_income)}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Employment Start Date</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {client.employment_start_date 
                      ? format(new Date(client.employment_start_date), 'PPP')
                      : 'Not provided'
                    }
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Employer Address</Label>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm">{client.employer_address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {(!client.employer_name && !client.job_title && !client.occupation) && (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No employment information provided</p>
              <Button className="mt-4" onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employment Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
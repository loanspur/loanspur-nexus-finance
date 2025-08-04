import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users } from "lucide-react";
import { useOffices, useOfficeStaff } from "@/hooks/useOfficeManagement";

export const ActiveBranchesCard = () => {
  const { data: offices = [] } = useOffices();
  const { data: officeStaff = [] } = useOfficeStaff();

  const activeOffices = offices.filter(office => office.is_active);
  
  const getOfficeTypeBadgeColor = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (type) {
      case 'head_office':
        return 'default';
      case 'branch':
        return 'secondary';
      case 'sub_branch':
        return 'outline';
      case 'collection_center':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getOfficeTypeLabel = (type: string) => {
    switch (type) {
      case 'head_office':
        return 'Head Office';
      case 'branch':
        return 'Branch';
      case 'sub_branch':
        return 'Sub Branch';
      case 'collection_center':
        return 'Collection Center';
      default:
        return type;
    }
  };

  const getStaffCount = (officeId: string) => {
    return officeStaff.filter(staff => staff.office_id === officeId && staff.is_active).length;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Active Branches</CardTitle>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeOffices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active offices found</p>
          ) : (
            activeOffices.map((office) => (
              <div key={office.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{office.office_name}</h4>
                    <Badge variant={getOfficeTypeBadgeColor(office.office_type)} className="text-xs">
                      {getOfficeTypeLabel(office.office_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{office.office_code}</span>
                    <Users className="h-3 w-3 ml-2" />
                    <span>{getStaffCount(office.id)} staff</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {activeOffices.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Total: {activeOffices.length} active office{activeOffices.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useQuery } from "@tanstack/react-query";
import { Staff } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";
import worker1 from "@/assets/images/worker1.svg";
import worker2 from "@/assets/images/worker2.svg";
import worker3 from "@/assets/images/worker3.svg";
import worker4 from "@/assets/images/worker4.svg";

interface StaffAssignmentProps {
  selectedStaff: number[];
  onChange: (selectedStaff: number[]) => void;
}

// Componente de checkbox simple sin usar el componente de shadcn para evitar problemas
function SimpleCheckbox({ checked, onChange }: { checked: boolean, onChange: () => void }) {
  return (
    <div 
      className={`h-5 w-5 border rounded-sm flex items-center justify-center cursor-pointer ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
    >
      {checked && <Check className="h-4 w-4 text-white" />}
    </div>
  );
}

export function StaffAssignment({ selectedStaff, onChange }: StaffAssignmentProps) {
  // Fetch all staff members
  const { data: staffMembers, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Esta función maneja el toggle de una manera segura
  const handleToggle = (staffId: number, e?: React.MouseEvent) => {
    // Detener la propagación para evitar clicks múltiples
    if (e) {
      e.stopPropagation();
    }
    
    // Crear un nuevo array de seleccionados
    let newSelected: number[];
    
    if (selectedStaff.includes(staffId)) {
      newSelected = selectedStaff.filter(id => id !== staffId);
    } else {
      newSelected = [...selectedStaff, staffId];
    }
    
    // Notificar al componente padre solo si realmente hay un cambio
    if (JSON.stringify(newSelected) !== JSON.stringify(selectedStaff)) {
      onChange(newSelected);
    }
  };

  // Helper to get staff avatar image
  const getStaffAvatar = (staff: Staff) => {
    if (staff.avatar) {
      return staff.avatar;
    }
    
    switch (staff.id % 4) {
      case 0: return worker1;
      case 1: return worker2;
      case 2: return worker3;
      case 3: return worker4;
      default: return worker1;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!staffMembers || staffMembers.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-gray-500">
          No hay personal disponible para asignar
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
      {staffMembers.map((staff) => {
        const isSelected = selectedStaff.includes(staff.id);
        
        return (
          <Card 
            key={staff.id} 
            className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
            onClick={(e) => handleToggle(staff.id, e)}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <SimpleCheckbox
                checked={isSelected}
                onChange={() => handleToggle(staff.id)}
              />
              <div className="flex items-center flex-1 space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getStaffAvatar(staff)} alt={staff.name} />
                  <AvatarFallback>
                    {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{staff.name}</div>
                  <p className="text-sm text-gray-500">{staff.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

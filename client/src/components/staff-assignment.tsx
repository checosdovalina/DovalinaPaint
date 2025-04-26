import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Staff } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import worker1 from "@/assets/images/worker1.svg";
import worker2 from "@/assets/images/worker2.svg";
import worker3 from "@/assets/images/worker3.svg";
import worker4 from "@/assets/images/worker4.svg";

interface StaffAssignmentProps {
  selectedStaff: number[];
  onChange: (selectedStaff: number[]) => void;
}

export function StaffAssignment({ selectedStaff, onChange }: StaffAssignmentProps) {
  const [selected, setSelected] = useState<number[]>(selectedStaff || []);

  // Fetch all staff members
  const { data: staffMembers, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
  });

  // Update parent component when selection changes
  useEffect(() => {
    onChange(selected);
  }, [selected, onChange]);

  const toggleStaffSelection = (staffId: number) => {
    setSelected((prevSelected) => {
      if (prevSelected.includes(staffId)) {
        return prevSelected.filter((id) => id !== staffId);
      } else {
        return [...prevSelected, staffId];
      }
    });
  };

  // Helper to get staff avatar image
  const getStaffAvatar = (staff: Staff) => {
    if (staff.avatar) {
      return staff.avatar;
    }
    
    // Map staff id to avatar images (for example purposes)
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
      {staffMembers.map((staff) => (
        <Card 
          key={staff.id} 
          className={`cursor-pointer transition-colors ${selected.includes(staff.id) ? 'bg-blue-50 border-blue-200' : ''}`}
          onClick={() => toggleStaffSelection(staff.id)}
        >
          <CardContent className="p-4 flex items-center space-x-4">
            <Checkbox 
              id={`staff-${staff.id}`} 
              checked={selected.includes(staff.id)}
              onCheckedChange={() => toggleStaffSelection(staff.id)}
              className="h-5 w-5"
            />
            <Avatar className="h-10 w-10">
              <AvatarImage src={getStaffAvatar(staff)} alt={staff.name} />
              <AvatarFallback>
                {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label 
                htmlFor={`staff-${staff.id}`}
                className="font-medium cursor-pointer"
              >
                {staff.name}
              </Label>
              <p className="text-sm text-gray-500">{staff.role}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

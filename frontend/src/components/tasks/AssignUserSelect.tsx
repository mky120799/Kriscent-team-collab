import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  projectId: string;
  initialValue?: string;
  onSelect: (userId: string) => void;
};

import { useGetUsersByProjectQuery } from "@/store/services/user.api";

const AssignUserSelect = ({ projectId, initialValue, onSelect }: Props) => {
  const { data: users = [] } = useGetUsersByProjectQuery(projectId);
  const [selectedUser, setSelectedUser] = useState<string>(initialValue || "");

  const handleChange = (userId: string) => {
    setSelectedUser(userId);
    onSelect(userId);
  };

  return (
    <Select value={selectedUser} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="Assign to user" />
      </SelectTrigger>
      <SelectContent>
        {users.map((user) => (
          <SelectItem key={user._id} value={user._id}>
            {user.name} ({user.email})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AssignUserSelect;
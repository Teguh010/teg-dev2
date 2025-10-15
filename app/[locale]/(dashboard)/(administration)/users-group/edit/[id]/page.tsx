"use client";
import { useRouter, useParams } from "next/navigation";
import { getUserGroups, renameUserGroup } from "@/models/users_group";
import UserGroupForm from "../../components/UserGroupForm";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

export default function EditUserGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = Number(params.id);
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;
  const [initialData, setInitialData] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const token = getUserRef().token;
        const groups = await getUserGroups(token, groupId);
        if (groups && groups.length > 0) {
          setInitialData({ name: groups[0].val });
        }
      } catch {}
      setLoading(false);
    };
    fetchGroup();
  }, [getUserRef, groupId]);

  const handleSubmit = async (data: { name: string }) => {
    try {
      const token = getUserRef().token;
      await renameUserGroup(token, groupId, data.name);
      toast.success("User group updated successfully");
      router.push("/users-group");
    } catch {
      toast.error("Failed to update user group");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!initialData) return <div>Group not found</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Edit User Group</h2>
      <UserGroupForm onSubmit={handleSubmit} initialData={initialData} isEdit />
    </div>
  );
} 
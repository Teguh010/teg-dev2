"use client";
import { useRouter, useParams } from "next/navigation";
import { getWorkersGroups, editWorkersGroup } from "@/models/workers_group";
import WorkersGroupForm from "../../components/WorkersGroupForm";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

export default function EditWorkersGroupPage() {
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
        const groups = await getWorkersGroups(token, groupId);
        if (groups && groups.length > 0) {
          setInitialData({ name: groups[0].name });
        }
      } catch {}
      setLoading(false);
    };
    fetchGroup();
  }, [getUserRef, groupId]);

  const handleSubmit = async (data: { name: string }) => {
    try {
      const token = getUserRef().token;
      await editWorkersGroup(token, { group_id: groupId, name: data.name });
      toast.success("Workers group updated successfully");
      router.push("/workers-group");
    } catch {
      toast.error("Failed to update workers group");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!initialData) return <div>Group not found</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Edit Workers Group</h2>
      <WorkersGroupForm onSubmit={handleSubmit} initialData={initialData} isEdit />
    </div>
  );
}
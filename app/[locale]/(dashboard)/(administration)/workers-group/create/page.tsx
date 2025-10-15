"use client";
import { useRouter } from "next/navigation";
import { createWorkersGroup } from "@/models/workers_group";
import WorkersGroupForm from "../components/WorkersGroupForm";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";

export default function CreateWorkersGroupPage() {
  const router = useRouter();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;

  const handleSubmit = async (data: { name: string; foreign_system_id?: string }) => {
    try {
      const token = getUserRef().token;
      await createWorkersGroup(token, data.name, data.foreign_system_id);
      toast.success("Workers group created successfully");
      router.push("/workers-group");
    } catch {
      toast.error("Failed to create workers group");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Create Workers Group</h2>
      <WorkersGroupForm onSubmit={handleSubmit} />
    </div>
  );
} 
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createAndAssignUser, Worker, objectWorkers } from "@/models/workers";
import type { CreateAndAssignUserPayload } from "@/models/workers";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import UserForm from "../components/UserForm";

export default function CreateAssignUserPage() {
  const router = useRouter();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;
  const [workers, setWorkers] = useState<{id: number; name: string; surname: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const token = getUserRef().token;
        const data: Worker[] = await objectWorkers(token, {});
        setWorkers(data.map(w => ({ id: w.id, name: w.name, surname: w.surname })));
      } catch {
        setWorkers([]);
      }
      setLoading(false);
    };
    fetchWorkers();
  }, [getUserRef]);

  const handleSubmit = async (data: CreateAndAssignUserPayload) => {
    try {
      const token = getUserRef().token;
      await createAndAssignUser(token, data);
      toast.success("User created and assigned to worker successfully");
      router.push("/users");
    } catch {
      toast.error("Failed to create and assign user");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Create & Assign User to Worker</h2>
      <UserForm
        onSubmit={async (data) => {
          // Ensure worker_id is present for CreateAndAssignUserPayload
          if (!data.worker_id) {
            // Optionally show an error or toast here
            return;
          }
          // Call handleSubmit with the correct type
          await handleSubmit(data as CreateAndAssignUserPayload);
        }}
        workers={workers}
        isAssignToWorker
      />
    </div>
  );
}
"use client";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { createAndAssignUser } from "@/models/workers";
import AssignUserToWorkerForm from "../../components/AssignUserToWorkerForm";
import LayoutLoader from "@/components/layout-loader";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { objectList, objectGroupList } from "@/models/object";
import { getUserTypesList } from '@/models/users';
import type { CreateAndAssignUserPayload } from "@/models/workers";

export default function AssignUserToWorkerPage() {
  const { id } = useParams();
  const router = useRouter();
  const UserContext = useUser();
  const [userTypes, setUserTypes] = useState<{ value: number; label: string }[]>([]);
  const [objectOptions, setObjectOptions] = useState<{ value: number; label: string }[]>([]);
  const [objectGroupOptions, setObjectGroupOptions] = useState<{ value: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      if (!UserContext.models.user) return;
      const token = UserContext.operations.getUserRef().token;
      // User types
      try {
        const types = await getUserTypesList(token);
        setUserTypes(Array.isArray(types) ? types.map((ut: { id: number; val: string }) => ({ value: ut.id, label: ut.val })) : []);
      } catch {
        setUserTypes([
          { value: 1, label: "Admin" },
          { value: 2, label: "Superuser" },
          { value: 3, label: "Dispatcher" },
          { value: 4, label: "Driver" },
        ]);
      }
      // Objects
      try {
        const objects = await objectList(token);
        setObjectOptions(Array.isArray(objects) ? objects.map((obj: { id: number; name: string }) => ({ value: obj.id, label: obj.name })) : []);
      } catch {
        setObjectOptions([]);
      }
      // Object groups
      try {
        const groups = await objectGroupList(token);
        setObjectGroupOptions(Array.isArray(groups) ? groups.map((g: { id: number; name: string }) => ({ value: g.id, label: g.name })) : []);
      } catch {
        setObjectGroupOptions([]);
      }
    };
    fetchDropdowns();
  }, [UserContext.models.user]);

  if (!UserContext.models.user) {
    return <LayoutLoader />;
  }

  const handleSubmit = async (data: CreateAndAssignUserPayload) => {
    setLoading(true);
    try {
      await createAndAssignUser(UserContext.operations.getUserRef().token, data);
      toast.success("User assigned successfully!");
      router.push("/worker");
    } catch {
      toast.error("Failed to assign user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-xl font-semibold">Assign User to Worker</h1>
      <AssignUserToWorkerForm
        workerId={Number(id)}
        onSubmit={handleSubmit}
        loading={loading}
        userTypes={userTypes}
        objectOptions={objectOptions}
        objectGroupOptions={objectGroupOptions}
      />
    </div>
  );
}
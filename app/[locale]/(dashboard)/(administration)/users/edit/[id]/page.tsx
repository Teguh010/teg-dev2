"use client";
import { useRouter, useParams } from "next/navigation";
import { getUserById, editUser } from "@/models/users";
import UserForm from "../../components/UserForm";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = Number(params.id);
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getUserRef().token;
        const userRes = await getUserById(token, userId);
        // user.get API returns array in result
        const user = Array.isArray(userRes) ? userRes[0] : userRes;
        if (user) {
          setInitialData({
            user_name: user.name || "",
            user_type: user.typeid ? Number(user.typeid) : 1,
            user_expire: user.expires || "",
            user_data_age_limit: user.data_age_limit,
            all_objects_visible: user.all_objects_visible || false,
            visible_objects: user.assigned_objects || [],
            visible_object_groups: user.assigned_object_groups || [],
            // worker_id: user.worker?.id, // jika ingin assign worker
          });
        }
      } catch {}
      setLoading(false);
    };
    fetchUser();
  }, [getUserRef, userId]);

  const handleSubmit = async (data: any) => {
    try {
      const token = getUserRef().token;
      await editUser(token, { ...data, user_id: userId });
      toast.success("User updated successfully");
      router.push("/users");
    } catch {
      toast.error("Failed to update user");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!initialData) return <div>User not found</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Edit User</h2>
      <UserForm onSubmit={handleSubmit} initialData={initialData} isEdit />
    </div>
  );
} 
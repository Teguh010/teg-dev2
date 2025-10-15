"use client";
import { useRouter } from "next/navigation";
import { createUserGroup } from "@/models/users_group";
import UserGroupForm from "../components/UserGroupForm";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";

export default function CreateUserGroupPage() {
  const router = useRouter();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;

  const handleSubmit = async (data: { name: string }) => {
    try {
      const token = getUserRef().token;
      await createUserGroup(token, data.name);
      toast.success("User group created successfully");
      router.push("/users-group");
    } catch {
      toast.error("Failed to create user group");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Create User Group</h2>
      <UserGroupForm onSubmit={handleSubmit} />
    </div>
  );
} 
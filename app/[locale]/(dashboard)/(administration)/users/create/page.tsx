"use client";
import { useRouter } from "next/navigation";
import { createUser } from "@/models/users";
import UserForm from "../components/UserForm";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";

export default function CreateUserPage() {
  const router = useRouter();
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;

  const handleSubmit = async (data: any) => {
    try {
      const token = getUserRef().token;
      await createUser(token, data);
      toast.success("User created successfully");
      router.push("/users");
    } catch {
      toast.error("Failed to create user");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Create User</h2>
      <UserForm onSubmit={handleSubmit} />
    </div>
  );
} 
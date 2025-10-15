"use client";
import { controller } from "../controller";
import TaskForm from "../components/TaskForm";
import LayoutLoader from "@/components/layout-loader";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { TaskFormData } from "@/models/task";
import { Icon } from "@iconify/react";

export default function TaskCreatePage() {
  const { models, operations } = controller();
  const { t } = useTranslation();
  const router = useRouter();

  if (!models.user) {
    return <LayoutLoader />;
  }

  const handleSubmit = async (data: TaskFormData) => {
    await operations.createTask(data);
    router.push("/tasks");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {/* <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full bg-white p-2  hover:bg-gray-100 transition-colors"
          aria-label={t("Back")}
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5 text-gray-700" />
        </button> */}
        <h1 className="text-xl font-semibold">{t("Create Task")}</h1>
      </div>
      <TaskForm onSubmit={handleSubmit} loading={models.loading} />
    </div>
  );
}

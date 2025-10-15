"use client";
import { controller } from "../controller";
import WorkerWithLoginForm from "../components/WorkerWithLoginForm";
import LayoutLoader from "@/components/layout-loader";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

export default function WorkerCreateWithLoginPage() {
  const { models, operations } = controller();
  const { t } = useTranslation();
  const router = useRouter();

  if (!models.user) {
    return <LayoutLoader />;
  }

  const handleSubmit = async (data) => {
    await operations.createWorkerWithLogin(data);
    router.push("/worker");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2">
        {/* <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full bg-white p-2 hover:bg-gray-100 transition-colors"
          aria-label={t("Back")}
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5 text-gray-700" />
        </button> */}
        <h1 className="text-xl font-semibold">{t("Create Worker with Login")}</h1>
      </div>
      <WorkerWithLoginForm onSubmit={handleSubmit} />
    </div>
  );
} 
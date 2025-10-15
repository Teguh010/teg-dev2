"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { controller } from "../../controller";
import WorkerForm from "../../components/WorkerForm";
import LayoutLoader from "@/components/layout-loader";
import { useTranslation } from "react-i18next";
import { WorkerFormData } from "@/models/workers";
import { Icon } from "@iconify/react";

export default function WorkerEditPage() {
  const { models, operations } = controller();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const workerId = Number(params.id);
  const [workerData, setWorkerData] = useState<WorkerFormData | null>(null);
  const [loadingWorker, setLoadingWorker] = useState(true);

  // Destructure getWorker so it's stable for useEffect
  const { getWorker } = operations;

  useEffect(() => {
    const fetchWorker = async () => {
      if (!workerId) return;
      
      try {
        setLoadingWorker(true);
        const worker = await getWorker(workerId);
        
        if (!worker) {
          router.push("/worker");
          return;
        }
        // Transform the worker data to match the form structure
        const transformedWorker: WorkerFormData = {
          name: worker.name || "",
          surname: worker.surname || "",
          phone: worker.phone || "",
          email: worker.email || "",
          tacho_driver_id: worker.tacho_driver_id ?? undefined,
          tacho_driver_name: worker.tacho_driver_name || '', // <-- tambahkan ini
          foreign_system_id: worker.foreign_system_id || "",
          groups_list: Array.isArray(worker.groups_list)
            ? worker.groups_list
                .filter((g): g is Exclude<typeof g, null | undefined> => g !== null && g !== undefined)
                .map(g => hasId(g) ? g.id : g as number)
            : [],
          rfid: worker.rfid || "",
          rfid_size: worker.rfid_size ?? undefined,
          rfid_reversed: worker.rfid_reversed ?? undefined,
          assigned_to: worker.assigned_to ?? undefined,
        };
        setWorkerData(transformedWorker);
      } catch (error) {
        console.error("Failed to fetch worker:", error);
        router.push("/worker");
      } finally {
        setLoadingWorker(false);
      }
    };

    fetchWorker();
  }, [workerId, getWorker, router]);

  if (!models.user) {
    return <LayoutLoader />;
  }

  if (loadingWorker) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">{t("Edit Worker")}</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t("Loading worker...")}</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: WorkerFormData) => {
    // Copy data to avoid mutating the original
    const payload = { ...data, worker_id: workerId };
    // Remove foreign_system_id if empty string or undefined/null
    if (!payload.foreign_system_id) {
      delete payload.foreign_system_id;
    }
    await operations.updateWorker(payload);
    router.push("/worker");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full bg-white p-2 hover:bg-gray-100 transition-colors"
          aria-label={t("Back")}
        >
          <Icon icon="mdi:arrow-left" className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold">{t("Edit Worker")}</h1>
      </div>
      {workerData && (
        <WorkerForm 
          onSubmit={handleSubmit} 
          initialData={workerData}
          isEdit={true}
        />
      )}
    </div>
  );
}

// Type guard for group objects with an id
function hasId(obj: unknown): obj is { id: number } {
  return typeof obj === "object" && obj !== null && "id" in obj && typeof (obj as { id?: unknown }).id === "number";
}
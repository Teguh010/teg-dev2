"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { controller } from "../../controller";
import TaskForm from "../../components/TaskForm";
import LayoutLoader from "@/components/layout-loader";
import { useTranslation } from "react-i18next";
import { TaskFormData } from "@/models/task";
import { taskGet } from "@/models/task";
import { useUser } from "@/context/UserContext";


export default function TaskEditPage() {
  const { models, operations } = controller();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const taskId = Number(params.id);
  const [taskData, setTaskData] = useState<TaskFormData | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const UserContext = useUser();
  const { getUserRef } = UserContext.operations;

  useEffect(() => {
    const fetchTask = async () => {
      if (!models.user || !taskId) return;
      
      try {
        setLoadingTask(true);
        const token = getUserRef().token;
        const task = await taskGet(token, taskId);
        
        // Transform the task data to match the form structure
        const taskType = task.task_body?.task_type || 2; // Default to task type 2 if not specified
        
        const transformedTask: TaskFormData = {
          description: task.description || "",
          task_body: {
            task_type: taskType,
            // For task type 1, API uses lat/lon, but we need latitude/longitude for consistency
            ...(taskType === 1 && task.task_body?.destination && {
              destination: {
                latitude: task.task_body.destination.lat,
                longitude: task.task_body.destination.lon
              }
            }),
            // For task type 2, API now also uses lat/lon, so we need to convert to latitude/longitude
            ...(taskType === 2 && {
              ...(task.task_body?.origin && {
                origin: {
                  latitude: task.task_body.origin.lat,
                  longitude: task.task_body.origin.lon
                }
              }),
              ...(task.task_body?.destination && {
                destination: {
                  latitude: task.task_body.destination.lat,
                  longitude: task.task_body.destination.lon
                }
              }),
              ...(task.task_body?.waypoints && {
                waypoints: task.task_body.waypoints.map((wp: any) => ({
                  latitude: wp.lat,
                  longitude: wp.lon
                }))
              })
            })
          },
          task_time: task.task_time ? new Date(task.task_time).toISOString().slice(0, 19).replace('T', ' ') : "",
          status_id: task.status_id || 1,
          priority: task.priority || 1,
          memo: task.last_memo || "",
          assigned_to: task.assigned_to || 0,
        };
        
        setTaskData(transformedTask);
      } catch (error) {
        console.error("Failed to fetch task:", error);
        router.push("/tasks");
      } finally {
        setLoadingTask(false);
      }
    };

    fetchTask();
  }, [models.user, taskId, getUserRef, router]);

  if (!models.user) {
    return <LayoutLoader />;
  }

  if (loadingTask) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">{t("Edit Task")}</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t("Loading task...")}</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: TaskFormData) => {
    await operations.updateTask({
      ...data,
      task_id: taskId,
    });
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
              <h1 className="text-xl font-semibold">{t("Edit Task")}</h1>
            </div>
      {taskData && (
        <TaskForm 
          onSubmit={handleSubmit} 
          loading={models.loading} 
          initialData={taskData}
          isEdit={true}
        />
      )}
    </div>
  );
}
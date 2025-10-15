"use client";
import { useRouter } from "next/navigation";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import AdvancedTable from "@/components/partials/advanced";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContentWrapper,
  DialogClose
} from "@/components/ui/custom-dialog";
import { toast } from "react-hot-toast";

import MultiSelect from "./components/MultiSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Custom hook for localStorage
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

export default function TasksPage() {
  const { models, operations } = controller();
  const { t } = useTranslation();
  const router = useRouter();

  // Persistent state using localStorage
  const [selectedViewMode, setSelectedViewMode] = useLocalStorage("tasks-view-mode", "normal");
  const [selectedExecutors, setSelectedExecutors] = useLocalStorage("tasks-executor-filter", []);

  // Get unique executor list from taskTableData
  const executorOptions = useMemo(() => {
    const uniqueExecutors = Array.from(
      new Set((models.taskTableData || []).map((task) => task.executor).filter(Boolean))
    );
    return uniqueExecutors.map((executor) => ({ value: executor, label: executor }));
  }, [models.taskTableData]);

  // Filtered data for table
  const filteredTaskTableData = useMemo(() => {
    if (!selectedExecutors.length) return models.taskTableData;
    return models.taskTableData.filter((task) => selectedExecutors.includes(task.executor));
  }, [models.taskTableData, selectedExecutors]);

  // Grouped data based on filtered data
  const filteredGroupedTaskTableData = useMemo(() => {
    return operations.createGroupedData(filteredTaskTableData);
  }, [filteredTaskTableData, operations.createGroupedData]);

  useEffect(() => {
    operations.fetchTasks();
  }, []);

  if (!models.user) {
    return <LayoutLoader />;
  }

  const canEditTask =
    (models.user?.role === "user" || models.user?.role === "manager") && models.user?.userTypeId < 3;

  const pickers = () => (
    <div className='flex flex-col md:flex-row md:items-center gap-4 mb-4'>
      <DatePickerWithRange
        setStartDate={operations.setStartDate}
        setEndDate={operations.setEndDate}
        startDate={models.startDate}
        endDate={models.endDate}
        onlyDate={true}
        text='pick_date'
        useDefaultValue={false}
      />
      <Button
        variant='outline'
        color='success'
        size='sm'
        className='h-8'
        disabled={models.loading}
        onClick={() => operations.fetchTasks(models.startDate, models.endDate)}
      >
        {models.loading ? t('general.loading') : t('general.generate')}
      </Button>
      {canEditTask && (
        <Button
          variant='outline'
          color='primary'
          size='sm'
          className='h-8'
          onClick={() => router.push("/tasks/create")}
        >
          {t('tasks.create_task')}
        </Button>
      )}
    </div>
  );

  // Tabs functionality to be placed in toolbar
  const groups = () => {
    return (
      <div className='flex  gap-4 w-full md:justify-end flex-col md:flex-row'>
        <div className='mb-4'>
          <TabsList className='grid grid-cols-2 h-9'>
            <TabsTrigger value='normal' className='text-xs px-3'>
              {t('general.normal_view')}
            </TabsTrigger>
            <TabsTrigger value='grouped' className='text-xs px-3'>
              {t('general.grouped_view')}
            </TabsTrigger>
          </TabsList>
        </div>
         <div className='min-w-[200px] h-8 pr-2'>
        <MultiSelect
          value={selectedExecutors}
          onChange={setSelectedExecutors}
          options={executorOptions}
          placeholder={t('general.filter_by_executor')}
        />
      </div>
      </div>
    );
  };

  const actions = (row) => (
    <div className='flex gap-2'>
      {canEditTask && (
        <Button
          size='icon'
          variant='ghost'
          color='primary'
          onClick={() => {
            router.push(`/tasks/edit/${row.original.id}`);
          }}
        >
          <Icon icon='mdi:pencil' className='w-5 h-5' />
        </Button>
      )}
      {canEditTask && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size='icon'
              variant='ghost'
              color='destructive'
              onClick={() => {
                // setSelectedTaskId(row.original.id);
              }}
            >
              <Icon icon='mdi:delete' className='w-5 h-5' />
            </Button>
          </DialogTrigger>
          <DialogContentWrapper
            size='sm'
            className='flex flex-col items-center justify-center gap-6 py-8'
          >
            <div className='text-lg  text-center'>
              {t('tasks.delete_task_confirm')}
            </div>
            <div className='flex gap-4 justify-center'>
              <DialogClose asChild>
                <Button variant='outline' color='secondary'>
                  {t('general.cancel')}
                </Button>
              </DialogClose>
              <Button
                variant='outline'
                color='destructive'
                onClick={async () => {
                  if (row.original.id) {
                    try {
                      await operations.setTaskStatus(row.original.id, 4);
                      toast.success(t('tasks.task_deleted_success'));
                    } catch {
                      toast.error(t('tasks.task_deleted_failed'));
                    }
                  }
                }}
              >
                {t('general.delete')}
              </Button>
            </div>
          </DialogContentWrapper>
        </Dialog>
      )}
    </div>
  );

  return (
    <div className='space-y-6'>
      <span className='text-xl font-bold'>{t('tasks.task_list')}</span>

      <Tabs value={selectedViewMode} onValueChange={setSelectedViewMode} className='w-full'>
        <TabsContent value='normal' className='mt-0'>
          <AdvancedTable
            dataList={filteredTaskTableData}
            ignoreList={models.ignoreList}
            actionList={models.actionList}
            styleColumnList={models.styleColumnList}
            pickers={pickers}
            groups={groups}
            ifPagination={false}
            actions={canEditTask ? actions : undefined}
          />
        </TabsContent>

        <TabsContent value='grouped' className='mt-0'>
          <AdvancedTable
            dataList={filteredGroupedTaskTableData}
            ignoreList={models.ignoreList}
            actionList={models.actionList}
            styleColumnList={models.styleColumnList}
            styleRowList={models.styleRowList}
            pickers={pickers}
            groups={groups}
            ifPagination={false}
            disableSorting={true}
            actions={
              canEditTask
                ? (row) => {
                    // Don't show actions for group header rows
                    if (row.original.isGroupHeader) return null;
                    return actions(row);
                  }
                : undefined
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

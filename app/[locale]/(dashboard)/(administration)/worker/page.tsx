"use client";
import { useRouter } from "next/navigation";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import SearchableSelect from '@/components/ui/searchable-select';

export default function WorkerPage() {
  const { models, operations } = controller();
  const { t } = useTranslation();
  const router = useRouter();

  // State untuk modal assign user
  const [assignModal, setAssignModal] = useState({ open: false, workerId: null });
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [workersWithoutUsers, setWorkersWithoutUsers] = useState([]);
  // State untuk modal konfirmasi unassign
  const [unassignModal, setUnassignModal] = useState({ open: false, workerId: null });
  // State for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ open: false, workerId: null });
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    operations.fetchWorkers();
    // Fetch workers without users untuk kebutuhan tombol assign
    operations.getWorkersWithoutUsers().then(setWorkersWithoutUsers).catch(() => setWorkersWithoutUsers([]));
  }, []);

  // Handler buka modal assign user
  const openAssignModal = async (workerId) => {
    // Pastikan hanya worker yang belum punya user yang bisa assign
    if (!workersWithoutUsers.some(w => w.id === workerId)) return;
    setAssignModal({ open: true, workerId });
    setLoadingAssign(true);
    try {
      const users = await operations.getUsersWithoutWorkers();
      setUserList(users);
    } catch {
      setUserList([]);
    } finally {
      setLoadingAssign(false);
    }
  };

  // Handler assign user ke worker
  const handleAssign = async () => {
    if (!assignModal.workerId || !selectedUser) return;
    setLoadingAssign(true);
    try {
      await operations.assignUserToWorker(assignModal.workerId, selectedUser);
      setAssignModal({ open: false, workerId: null });
      setSelectedUser(null);
      // Refresh workers without users setelah assign
      operations.getWorkersWithoutUsers().then(setWorkersWithoutUsers).catch(() => setWorkersWithoutUsers([]));
    } finally {
      setLoadingAssign(false);
    }
  };

  // Handler unassign user dari worker
  const handleUnassign = async (workerId) => {
    setLoadingAssign(true);
    try {
      await operations.unassignUserFromWorker(workerId);
      // Refresh workers without users setelah unassign
      operations.getWorkersWithoutUsers().then(setWorkersWithoutUsers).catch(() => setWorkersWithoutUsers([]));
    } finally {
      setLoadingAssign(false);
    }
  };

  if (!models.user) {
    return <LayoutLoader />;
  }

  const canEditWorker = !(models.user?.role === 'user' && models.user?.userTypeId > 2);

  const pickers = () => (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
      {canEditWorker && (
        <Button
          variant="outline"
          color="primary"
          size="sm"
          className="h-8"
          onClick={() => router.push("/worker/create")}
        >
          {t("worker.create_worker")}
        </Button>
      )}
      {canEditWorker && (
        <Button
          variant="outline"
          color="success"
          size="sm"
          className="h-8"
          onClick={() => router.push("/worker/create-with-login")}
        >
          {t("Create Worker with Login")}
        </Button>
        
      )}
    </div>
  );

  const actions = (row) => {
    const isUnassigned = Array.isArray(workersWithoutUsers) && workersWithoutUsers.some(w => w.id === row.original.id);
    return (
      <div className="flex gap-2">
        {canEditWorker && (
          <Button
            size="icon"
            variant="ghost"
            color="primary"
            onClick={() => {
              router.push(`/worker/edit/${row.original.id}`);
            }}
          >
            <Icon icon="mdi:pencil" className="w-5 h-5" />
          </Button>
        )}
        {canEditWorker && (
          <Button
            size="icon"
            variant="ghost"
            color="destructive"
            onClick={() => setDeleteModal({ open: true, workerId: row.original.id })}
          >
            <Icon icon="mdi:delete" className="w-5 h-5" />
          </Button>
            // <Button onClick={() => router.push(`/worker/assign-user/${row.original.id}`)}>Assign User</Button>
        )}
       
        {/* Jika worker sudah punya user, tampilkan tombol Unassign User */}
        {canEditWorker && !isUnassigned && (
          <Button
            variant="outline"
            color="destructive"
            onClick={() => setUnassignModal({ open: true, workerId: row.original.id })}
            disabled={loadingAssign}
            className="w-[130px] flex items-center justify-center"
            title={t("Unassign User")}
          >
            {/* <Icon icon="mdi:account-remove" className="w-5 h-5" /> */}
            <span className="ml-2">Unassign User</span>
          </Button>
        )}
        {/* If worker has no user, show Assign User button*/}
        {canEditWorker && isUnassigned && (
          <Button
            variant="outline"
            color="primary"
            onClick={() => openAssignModal(row.original.id)}
            title={t("Assign User")}
            className="w-[130px] flex items-center justify-center"
          >
            {/* <Icon icon="mdi:account-plus" className="w-5 h-5" /> */}
            <span className="ml-2">Assign User</span>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <span className="text-xl font-bold">{t("Worker List")}</span>
      <AdvancedTable
        dataList={models.workerTableData}
        ignoreList={models.ignoreList}
        actionList={models.actionList}
        styleColumnList={models.styleColumnList}
        pickers={pickers}
        ifPagination={false}
        actions={canEditWorker ? actions : undefined}
        ifSearch={true}
        searchList={models.searchList}
        columnVisibility={models.columnVisibility}
        setColumnVisibility={operations.setColumnVisibility}
      />
      {/* Modal Assign User */}
      {assignModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 min-w-[320px]">
            <h2 className="font-bold mb-4">{t("Assign User to Worker")}</h2>
            {loadingAssign ? (
              <div>{t("Loading...")}</div>
            ) : (
              <>
                <SearchableSelect
                  className="mb-4"
                  value={selectedUser ? String(selectedUser) : ''}
                  onChange={v => setSelectedUser(Number(v))}
                  options={userList.map(u => ({ value: String(u.id), label: u.name }))}
                  placeholder={t("Select User")}
                  disabled={loadingAssign}
                  label=""
                />
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setAssignModal({ open: false, workerId: null })} variant="outline">
                    {t("Cancel")}
                  </Button>
                  <Button onClick={handleAssign} disabled={!selectedUser || loadingAssign} color="primary">
                    {t("Assign")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Unassign User */}
      {unassignModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 min-w-[320px]">
            <h2 className="font-semibold mb-4">{t("Are you sure you want to unassign user from this worker?")}</h2>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setUnassignModal({ open: false, workerId: null })} variant="outline">
                {t("Cancel")}
              </Button>
              <Button
                onClick={async () => {
                  await handleUnassign(unassignModal.workerId);
                  setUnassignModal({ open: false, workerId: null });
                }}
                color="destructive"
                disabled={loadingAssign}
              >
                {t("Unassign")}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Delete Worker */}
      {deleteModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 min-w-[320px]">
            <h2 className="font-semibold mb-4">{t("Are you sure you want to delete this worker?")}</h2>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setDeleteModal({ open: false, workerId: null })} variant="outline">
                {t("Cancel")}
              </Button>
              <Button
                onClick={async () => {
                  setLoadingDelete(true);
                  await operations.deleteWorker(deleteModal.workerId);
                  setLoadingDelete(false);
                  setDeleteModal({ open: false, workerId: null });
                }}
                color="destructive"
                disabled={loadingDelete}
              >
                {t("Delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

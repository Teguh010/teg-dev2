"use client";
import { useRouter } from "next/navigation";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const { models, operations } = controller();
  const { t } = useTranslation();
  const router = useRouter();

  // State for Delete Modal.
  const [deleteModal, setDeleteModal] = useState({ open: false, userId: null });
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    operations.fetchUsers();
  }, []);

  const pickers = () => (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
      <Button
        variant="outline"
        color="primary"
        size="sm"
        className="h-8"
        onClick={() => router.push("/users/create")}
      >
        {t("Create User")}
      </Button>
      <Button
        variant="outline"
        color="success"
        size="sm"
        className="h-8"
        onClick={() => router.push("/users/create-assign")}
      >
        {t("Create & Assign User to Worker")}
      </Button>
    </div>
  );

  const actions = (row) => (
    <div className="flex gap-2">
      <Button
        size="icon"
        variant="ghost"
        color="primary"
        onClick={() => router.push(`/users/edit/${row.original.id}`)}
      >
        <Icon icon="mdi:pencil" className="w-5 h-5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        color="destructive"
        onClick={() => setDeleteModal({ open: true, userId: row.original.id })}
      >
        <Icon icon="mdi:delete" className="w-5 h-5" />
      </Button>
    </div>
  );

  if (models.loading) {
    return <LayoutLoader />;
  }

  return (
    <div className="space-y-6">
      <span className="text-xl font-bold">{t("User List")}</span>
      <AdvancedTable
        dataList={models.userTableData}
        ignoreList={models.ignoreList}
        actionList={models.actionList}
        styleColumnList={models.styleColumnList}
        pickers={pickers}
        ifPagination={false}
        actions={actions}
        ifSearch={true}
        searchList={models.searchList}
      />
      {/* Delete User Confirmation Modal... */}
      {deleteModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg p-6 min-w-[320px]">
            <h2 className="font-semibold mb-4">{t("Are you sure you want to delete this user?")}</h2>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setDeleteModal({ open: false, userId: null })} variant="outline">
                {t("Cancel")}
              </Button>
              <Button
                onClick={async () => {
                  setLoadingDelete(true);
                  await operations.deleteUser(deleteModal.userId);
                  setLoadingDelete(false);
                  setDeleteModal({ open: false, userId: null });
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
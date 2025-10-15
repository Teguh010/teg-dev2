"use client";
import { useRouter } from "next/navigation";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { useEffect } from "react";

export default function UsersGroupPage() {
  const { models, operations } = controller();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    operations.fetchUserGroups();
  }, []);

  const pickers = () => (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
      <Button
        variant="outline"
        color="primary"
        size="sm"
        className="h-8"
        onClick={() => router.push("/users-group/create")}
      >
        {t("Create User Group")}
      </Button>
    </div>
  );

  const actions = (row) => (
    <div className="flex gap-2">
      <Button
        size="icon"
        variant="ghost"
        color="primary"
        onClick={() => router.push(`/users-group/edit/${row.original.id}`)}
      >
        <Icon icon="mdi:pencil" className="w-5 h-5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        color="destructive"
        onClick={() => operations.deleteUserGroup(row.original.id)}
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
      <span className="text-xl font-bold">{t("User Group List")}</span>
      <AdvancedTable
        dataList={models.userGroupTableData}
        ignoreList={models.ignoreList}
        actionList={models.actionList}
        styleColumnList={models.styleColumnList}
        pickers={pickers}
        ifPagination={false}
        actions={actions}
        ifSearch={true}
        searchList={models.searchList}
      />
    </div>
  );
} 
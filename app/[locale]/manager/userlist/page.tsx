'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedCustomerStore } from '@/store/selected-customer';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const UserList = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedCustomerId } = useSelectedCustomerStore();
  
  useEffect(() => {
    if (!selectedCustomerId) {
      router.push('/manager/dashboard');
    }
  }, [selectedCustomerId, router, t]);
  
  const { models, operations } = controller();
  const user = models.user;

  if (!user) {
    return <LayoutLoader />;
  }

  const renderActions = (row: any) => {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => operations.handleGetUserToken(row.original.id)}
          title={t("Get User Token")}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(t("User List"))}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataGenerated ? models.userList : []}
            ignoreList={models.ignoreList}
            styleRowList={models.styleRowList}
            ifSearch={true}
            ifPagination={false}
            searchList={models.searchList}
            options={renderActions}
          />
        </div>
      </div>
    </div>
  );
};

export default UserList;

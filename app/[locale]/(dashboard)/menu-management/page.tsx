"use client";
import { useState, useEffect } from "react";
import { controller } from "./controller";
import LayoutLoader from "@/components/layout-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, Settings, Info, Users, User, Mail, Phone, Calendar, Shield } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SearchableSelect from "@/components/ui/searchable-select";

const ClientMenuManagement = () => {
  const { models, operations } = controller();
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await operations.fetchUsers();
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, [operations.fetchUsers]);

  if (loading) {
    return <LayoutLoader />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Menu Management</h1>
          <p className="text-muted-foreground">
            Manage menu visibility for individual users.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
            disabled={!models.selectedUser}
          >
            <Eye className="h-4 w-4" />
            {previewMode ? "Hide Preview" : "Preview Menu"}
          </Button>
        </div>
      </div>

      {/* User Selection */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>  
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SearchableSelect
              value={models.selectedUser?.id.toString() || ""}
              onChange={(value) => {
                const user = models.users.find(u => u.id.toString() === value);
                operations.selectUser(user || null);
              }}
              options={[
                { value: "", label: models.usersLoading ? "Loading users..." : "Select a user" },
                ...models.users.map((user) => ({
                  value: user.id.toString(),
                  label: `${user.name} (${user.user_type})`
                }))
              ]}
              placeholder={models.usersLoading ? "Loading users..." : "Select a user"}
              label="Choose User"
              disabled={models.usersLoading}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Menu Groups */}
      {models.selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Menu Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Menu Configuration for {models.selectedUser.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {models.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading menu elements...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {models.menuGroups?.map((group) => (
                      <div key={group.group_id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold capitalize">
                              {group.group_name}
                            </h3>
                            {group.disabled && (
                              <Badge color="destructive" variant="outline" className="text-xs">
                                Group Disabled
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => operations.enableAllInGroup(group.group_id)}
                              disabled={group.disabled}
                            >
                              Enable All
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => operations.disableAllInGroup(group.group_id)}
                              disabled={group.disabled}
                            >
                              Disable All
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 pl-4">
                          {group.report?.map((report) => (
                            <div
                              key={report.id}
                              className="flex items-center space-x-3 p-2 rounded-lg border"
                            >
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  {...({
                                    checked: report.enabled,
                                    onCheckedChange: (checked) =>
                                      operations.toggleReport(report.id, checked as boolean),
                                    disabled: false, // Always allow interaction for now
                                    'aria-label': `Toggle ${report.name}`,
                                    className: "translate-y-[1px] mr-2",
                                    onClick: (e) => {
                                      e.stopPropagation(); // Prevent row click when checkbox is clicked
                                    }
                                  } as Record<string, unknown>)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium cursor-pointer">
                                    {report.name}
                                  </div>
                                    {report.disabled && (
                                      <div className="group relative">
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                          This feature is disabled by default.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      color={report.disabled ? "destructive" : "success"} 
                                      variant="outline" 
                                      className="text-xs"
                                    >
                                      {report.disabled ? "Disabled" : "Enabled"}
                                    </Badge>
                                    <Badge 
                                      color={report.accessible === true ? "success" : report.accessible === false ? "destructive" : "secondary"} 
                                      variant="outline" 
                                      className="text-xs"
                                    >
                                      {report.accessible === true ? "Accessible" : report.accessible === false ? "Blocked" : "Default"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Separator />
                      </div>
                    ))}

                    {/* Save Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={operations.saveChanges}
                        disabled={models.saving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {models.saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={operations.resetToDefault}
                        disabled={models.loading}
                      >
                        Reset to Default
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          {previewMode && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Menu Preview</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    How the menu will appear for {models.selectedUser?.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {models.menuGroups?.map((group) => {
                      const visibleReports = group.report?.filter(report => report.enabled) || [];
                      if (visibleReports.length === 0) return null;
                      
                      return (
                        <div key={group.group_id} className="space-y-1">
                          <h4 className="font-semibold text-sm capitalize">
                            {group.group_name}
                          </h4>
                          <div className="pl-4 space-y-1">
                            {visibleReports?.map((report) => (
                              <div
                                key={report.id}
                                className="text-sm text-muted-foreground flex items-center gap-2"
                              >
                                <span>• {report.name} <span className="text-xs opacity-70">(ID: {report.id})</span></span>
                                {report.disabled && (
                                  <Badge color="warning" variant="outline" className="text-xs">
                                    Disabled
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Validation Messages */}
      {models.validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {models.validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ClientMenuManagement;

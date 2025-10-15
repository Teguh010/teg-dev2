import {
  ChevronDown,
  ChevronUp,
  XCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DataTableColumnHeader({ column, title, className, disableSorting = false }) {
  // Check if title contains newline for multi-line display
  const isMultiLine = title && title.includes('\n');
  const titleLines = isMultiLine ? title.split('\n') : [title];

  if (!column.getCanSort() || disableSorting) {
    return (
      <div className={cn(className, isMultiLine && "leading-tight")}>
        {isMultiLine ? (
          titleLines.map((line, index) => (
            <div key={index} className="text-xs">{line}</div>
          ))
        ) : (
          title
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("-ml-3 h-8 data-[state:open]:bg-accent", isMultiLine && "h-auto py-1")}
          >
            <div className={cn(isMultiLine && " leading-tight")}>
              {isMultiLine ? (
                titleLines.map((line, index) => (
                  <div key={index} className="text-xs">{line}</div>
                ))
              ) : (
                <span>{title}</span>
              )}
            </div>
            {column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <XCircle className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ChevronUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ChevronDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

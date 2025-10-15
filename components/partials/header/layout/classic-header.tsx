"use client";
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ClassicHeaderProps {
  className?: string;
  children?: ReactNode;
}

const ClassicHeader: React.FC<ClassicHeaderProps> = ({ children, className }) => {
  return <header className={cn("z-50", className)}>{children}</header>;
};

export default ClassicHeader;
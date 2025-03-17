import React from "react";

export const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <main className="container mx-auto min-h-screen px-2">{children}</main>;
};

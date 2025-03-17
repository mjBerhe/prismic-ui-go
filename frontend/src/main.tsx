import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { createBrowserRouter, RouterProvider, useRouteError } from "react-router-dom";

import { useLoadUIConfig } from "./hooks/useLoadUIConfig";
import Root from "./roots/root";
import Valuation from "./roots/valuation";

const container = document.getElementById("root");

const root = createRoot(container!);

export const ErrorPage: React.FC = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <div>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
    </div>
  );
};

// Global Config Loader Component
const AppWithConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useLoadUIConfig();

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/valuation",
    element: <Valuation />,
    errorElement: <ErrorPage />,
  },
  // {
  //   path: "/liability-analytics",
  //   element: <LiabilityAnalyics />,
  //   errorElement: <ErrorPage />,
  // },
  // {
  //   path: "/risk-analytics",
  //   element: <RiskAnalytics />,
  //   errorElement: <ErrorPage />,
  // },
  // {
  //   path: "/generate-inputs",
  //   element: <GenerateInputs />,
  //   errorElement: <ErrorPage />,
  // },
]);

root.render(
  <React.StrictMode>
    <AppWithConfig>
      <RouterProvider router={router} />
    </AppWithConfig>
  </React.StrictMode>
);

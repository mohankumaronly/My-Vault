import { createBrowserRouter, Navigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { SetupVaultPage } from "./pages/SetupVaultPage";
import { UnlockVaultPage } from "./pages/UnlockVaultPage";
import { DashboardPage } from "./pages/DashboardPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/setup", element: <SetupVaultPage /> },
  { path: "/unlock", element: <UnlockVaultPage /> },
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

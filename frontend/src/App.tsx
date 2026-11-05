import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { VaultProvider } from "./contexts/VaultContext";
import { ToastProvider } from "./components/ui/Toast";

const App = () => {
  return (
    <ToastProvider>
      <VaultProvider>
        <RouterProvider router={router} />
      </VaultProvider>
    </ToastProvider>
  );
};

export default App;

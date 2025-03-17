import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useUIConfigStore } from "../stores";
import { UIConfig } from "../types/pages";

export const useLoadUIConfig = () => {
  const { setConfig } = useUIConfigStore();

  // loads ui_config file into global state
  const loadUIConfig = async () => {
    try {
      const data = await invoke<UIConfig>("read_ui_config");
      if (data) {
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load ui config:", err);
    }
  };

  useEffect(() => {
    loadUIConfig();
  }, []);
};

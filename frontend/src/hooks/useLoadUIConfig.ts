import { useEffect } from "react";
import { useUIConfigStore } from "../stores";
import { ReadUIConfig } from "../../wailsjs/go/main/App";

export const useLoadUIConfig = () => {
  const { setConfig } = useUIConfigStore();

  // loads ui_config file into global state
  const loadUIConfig = async () => {
    try {
      const config = await ReadUIConfig();
      setConfig(config);
    } catch (err) {
      console.error("Failed to load ui config:", err);
    }
  };

  useEffect(() => {
    loadUIConfig();
  }, []);
};

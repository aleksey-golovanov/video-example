import { proxy } from "valtio";

export const videoState = proxy<{ lastFileName: string }>({
  lastFileName: "",
});

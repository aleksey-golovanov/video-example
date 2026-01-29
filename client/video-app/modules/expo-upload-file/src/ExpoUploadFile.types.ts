export type UploadProgressEventPayload = {
  progress: number;
};

export type ExpoUploadFileModuleEvents = {
  "upload-progress": (params: UploadProgressEventPayload) => void;
};

export type UploadOptions = {
  url: string;
  path: string;
  method?: string;
  headers?: Record<string, string>;
};

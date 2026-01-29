import { NativeModule, requireNativeModule } from "expo";

import {
  ExpoUploadFileModuleEvents,
  UploadOptions,
} from "./ExpoUploadFile.types";

declare class ExpoUploadFileModule extends NativeModule<ExpoUploadFileModuleEvents> {
  startUpload(options: UploadOptions): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoUploadFileModule>("ExpoUploadFile");

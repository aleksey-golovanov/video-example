// Reexport the native module. On web, it will be resolved to ExpoUploadFileModule.web.ts
// and on native platforms to ExpoUploadFileModule.ts
export { default } from "./src/ExpoUploadFileModule";
export * from "./src/ExpoUploadFile.types";

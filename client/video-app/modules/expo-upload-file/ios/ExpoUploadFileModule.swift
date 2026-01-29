import ExpoModulesCore

public class ExpoUploadFileModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoUploadFile")

        Events("upload-progress", "upload-complete", "error")

        Function("startUpload") { (options: [String: Any]) in
            guard let uploadUrl = options["url"] as? String else {
                // TODO: proper exception handling
                fatalError("URL is required")
            }

            guard let fileUri = options["path"] as? String else {
                fatalError("File path is required")
            }

            let method = options["method"] as? String ?? "PUT"
            let headers = options["headers"] as? [String: String] ?? [:]

            let filePath: String
            if fileUri.hasPrefix("file://") {
                filePath = String(fileUri.dropFirst(7))
            } else {
                filePath = fileUri
            }

            let fileManager = FileManager.default

            let attributes = try fileManager.attributesOfItem(atPath: filePath)
            let fileSize = attributes[.size] as? Int64 ?? 0

            guard let url = URL(string: uploadUrl) else {
                fatalError("Invalid URL")
            }

            var request = URLRequest(url: url)
            request.httpMethod = method

            for (key, value) in headers {
                request.setValue(value, forHTTPHeaderField: key)
            }

            request.setValue(
                "\(fileSize)",
                forHTTPHeaderField: "Content-Length"
            )

            guard let session = UploadManager.shared.backgroundSession else {
                fatalError("Failed to retrieve session")
            }

            let fileURL = URL(fileURLWithPath: filePath)

            let uploadTask = session.uploadTask(
                with: request,
                fromFile: fileURL
            )

            uploadTask.resume()
        }
    }
}

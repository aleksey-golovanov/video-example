import UIKit

extension Notification.Name {
    static let uploadProgress = Notification.Name("UploadProgressNotification")
    static let uploadCompleted = Notification.Name("UploadCompletedNotification")
    static let uploadFailed = Notification.Name("UploadFailedNotification")
}

class UploadManager: NSObject, URLSessionDelegate, URLSessionTaskDelegate {
    static let shared = UploadManager()

    public var backgroundSession: URLSession!

    private var completionHandler: (() -> Void)?

    private func createBackgroundSession() {
        let configuration = URLSessionConfiguration.background(
            withIdentifier: "com.videoapp.backgroundUpload"
        )

        configuration.isDiscretionary = false
        configuration.sessionSendsLaunchEvents = true
        configuration.timeoutIntervalForRequest = 60
        configuration.timeoutIntervalForResource = 60 * 60

        backgroundSession = URLSession(
            configuration: configuration,
            delegate: self,
            delegateQueue: nil
        )
    }

    override init() {
        super.init()
    }

    func handleAppLaunch() {
        self.createBackgroundSession()
    }

    func handleAppRelaunch(_ completionHandler: @escaping () -> Void) {
        self.completionHandler = completionHandler
        self.createBackgroundSession()
    }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didCompleteWithError error: Error?
    ) {
        // This is called while app is already awake
        // TODO: process the result
    }

    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession)
    {
        // TODO: process the result

        // This is called when all pending events have been delivered
        DispatchQueue.main.async {
            if let completionHandler = self.completionHandler {
                self.completionHandler = nil
                completionHandler()
            }
        }
    }
    
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didSendBodyData bytesSent: Int64,
        totalBytesSent: Int64,
        totalBytesExpectedToSend: Int64
    ) {
        let progress = Double(totalBytesSent) / Double(totalBytesExpectedToSend)

        print("progress: \(progress)")

        guard let taskId = task.taskDescription else { return }

        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: .uploadProgress,
                object: nil,
                userInfo: ["taskId": taskId, "progress": progress]
            )
        }
    }
}

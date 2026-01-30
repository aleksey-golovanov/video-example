extension Notification.Name {
    static let uploadProgress = Notification.Name("UploadProgressNotification")
    static let uploadCompleted = Notification.Name(
        "UploadCompletedNotification"
    )
    static let uploadFailed = Notification.Name("UploadFailedNotification")
}

class NotificationManager {
    static let shared = NotificationManager()
    private var observers: [NotificationObserver] = []

    struct NotificationObserver {
        let name: Notification.Name
        let token: NSObjectProtocol
    }

    func observeProgress(
        forTaskId taskId: String? = nil,
        handler: @escaping (Double, String) -> Void
    ) -> NotificationObserver {

        let token = NotificationCenter.default.addObserver(
            forName: .uploadProgress,
            object: nil,
            queue: .main
        ) { notification in
            guard let infoTaskId = notification.userInfo?["taskId"] as? String,
                let progress = notification.userInfo?["progress"] as? Double
            else {
                return
            }

            if let taskId = taskId, taskId != infoTaskId {
                return
            }

            handler(progress, infoTaskId)
        }

        let notificationObserver = NotificationObserver(
            name: .uploadProgress,
            token: token
        )
        observers.append(notificationObserver)

        return notificationObserver
    }

    func stopObserving(_ observer: NotificationObserver) {
        NotificationCenter.default.removeObserver(observer.token)
        observers.removeAll { $0.token === observer.token }
    }
}

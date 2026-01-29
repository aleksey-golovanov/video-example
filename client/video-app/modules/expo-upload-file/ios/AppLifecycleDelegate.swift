import ExpoModulesCore

public class AppLifecycleDelegate: ExpoAppDelegateSubscriber {
    public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication
            .LaunchOptionsKey: Any]?
    ) -> Bool {
        print("app launch")
        
        UploadManager.shared.handleAppLaunch()

        return true
    }

    // 1. System detects background URLSession events need delivery
    // 2. System launches or wakes the app in the background
    // 3. System calls this method
    public func application(
        _ application: UIApplication,
        handleEventsForBackgroundURLSession identifier: String,
        completionHandler: @escaping () -> Void
    ) {
        print("app relaunch")
        
        UploadManager.shared.handleAppRelaunch(completionHandler)
    }
}

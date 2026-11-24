import UIKit
import Capacitor
import AppTrackingTransparency

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    /// Verhindert zwei Abfragen, wenn die Szene kurz hintereinander aktiv wird.
    private var trackingAbfrageLaeuft = false

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        frageNachTracking()
    }

    // MARK: - App Tracking Transparency (Version 1.1, 04.10.2026)
    //
    //  Nativ und erst, wenn die Szene AKTIV ist. Vorlage: Anigosha. Dort fragte
    //  zuerst das AdMob-Plugin, das auf Capacitors Hintergrund-Warteschlange
    //  laeuft. iOS zeigte nichts, und Apple lehnte am 12.08.2026 ab (2.1).
    //  ⚠ LoonPop arbeitet mit Szenen: `applicationDidBecomeActive` im
    //  AppDelegate kommt hier nie, deshalb steht die Abfrage in diesem Delegate.
    //  ⚠ Drei Dinge muessen zusammen stimmen: NSUserTrackingUsageDescription in
    //  der Info.plist, diese Abfrage und in App Store Connect „Tracking: ja“.
    //  werbung.ts wartet auf die Antwort, bevor es AdMob startet.
    private func frageNachTracking() {
        guard !trackingAbfrageLaeuft else { return }
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }
        trackingAbfrageLaeuft = true
        // Kurz warten: Beim Kaltstart wird das Fenster gerade erst aufgebaut.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard UIApplication.shared.applicationState == .active else {
                self?.trackingAbfrageLaeuft = false
                return
            }
            ATTrackingManager.requestTrackingAuthorization { _ in
                self?.trackingAbfrageLaeuft = false
            }
        }
    }
}

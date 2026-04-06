---
sidebar_position: 1
sidebar_label: "광고 UI 선언"
---

# 광고 UI 선언

광고를 표시하려면 목적에 맞는 위치에 따라 앱 레이아웃에 `AdView`를 추가해야 합니다.

## _SwiftUI_
```swift
struct PlaybackView: View {
    public let player = AVQueuePlayer()

    // TODO GUIDE: Create FlowerAdView instance
    public let flowerAdView = FlowerAdView()

    var body: some View {
        // TODO GUIDE: Add FlowerAdView over content
        ZStack {
            VideoPlayer(player: player)
            flowerAdView.body
        }
    }
}
```

## _UIKit_
```swift
class PlaybackViewController: UIViewController {
    private var player = AVQueuePlayer()

    // TODO GUIDE: Create FlowerAdView instance
    private var flowerAdViewHostingController = FlowerAdView.HostingController()
    private var flowerAdView: FlowerAdView {
        flowerAdViewHostingController.adView
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        let playerViewController = AVPlayerViewController()
        playerViewController.player = player
        addChild(playerViewController)
        view.addSubview(playerViewController.view)
        playerViewController.didMove(toParent: self)

        view.addSubview(flowerAdViewHostingController.view)
        addChild(flowerAdViewHostingController)
        flowerAdViewHostingController.didMove(toParent: self)

        // TODO GUIDE: Add FlowerAdView over content
        flowerAdViewHostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            flowerAdViewHostingController.view.topAnchor.constraint(equalTo: playerViewController.view.topAnchor),
            flowerAdViewHostingController.view.bottomAnchor.constraint(equalTo: playerViewController.view.bottomAnchor),
            flowerAdViewHostingController.view.leadingAnchor.constraint(equalTo: playerViewController.view.leadingAnchor),
            flowerAdViewHostingController.view.trailingAnchor.constraint(equalTo: playerViewController.view.trailingAnchor)
        ])
    }
}
```

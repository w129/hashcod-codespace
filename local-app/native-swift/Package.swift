// swift-tools-version: 6.3
import PackageDescription

let package = Package(
    name: "HashcodCodespaceNativeSwift",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "HashcodCodespaceNativeSwift", targets: ["HashcodCodespaceNativeSwift"])
    ],
    targets: [
        .executableTarget(
            name: "HashcodCodespaceNativeSwift",
            path: "Sources",
            swiftSettings: [
                .swiftLanguageMode(.v6)
            ]
        )
    ]
)

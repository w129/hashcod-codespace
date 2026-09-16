import SwiftUI
import UniformTypeIdentifiers
import Combine

private enum NativeModule: String, CaseIterable, Identifiable {
    case home = "Inicio"
    case codes = "Codes"
    case qrVault = "QR Vault"
    case textLab = "Text Lab"
    case diskLab = "Disk Lab"
    case markdown = "Markdown"
    case eft = "EFT"
    case pandora = "p-andora"
    case desk = "Desk"
    case osdg = "OSDG-rest"
    case sync = "Sync"
    case codeKey = "CodeKey"

    var id: String { rawValue }

    var requiresCodeKey: Bool { self == .eft }

    var detail: String {
        switch self {
        case .home: return "Estado del cliente local nativo"
        case .codes: return "Biblioteca y gestión local de códigos"
        case .qrVault: return "Creación y almacenamiento de QR"
        case .textLab: return "Herramientas de texto y transformación"
        case .diskLab: return "Archivos y operaciones locales"
        case .markdown: return "Editor y documentos Markdown"
        case .eft: return "Editor CoffeeScript/Jupyter protegido por CodeKey"
        case .pandora: return "Celdas, datos y códigos"
        case .desk: return "Área de trabajo local"
        case .osdg: return "Cifrado y archivos locales"
        case .sync: return "Sincronización con la plataforma alojada"
        case .codeKey: return "Control de acceso administrativo nativo"
        }
    }
}

@MainActor
private final class NativeAppState: ObservableObject {
    @Published var selected: NativeModule = .home
    @Published var codeKeyUnlocked = false
    @Published var codeKeyMessage = "EFT está bloqueado hasta verificar la CodeKey."
    @Published var codeKeyExpiresAt: Date?
    @Published var selectedCodeKeyName: String?
    @Published var showCodeKeyImporter = false

    func select(_ module: NativeModule) {
        if module.requiresCodeKey && !codeKeyUnlocked {
            selected = .codeKey
            codeKeyMessage = "Verifica la CodeKey antes de abrir EFT."
        } else {
            selected = module
        }
    }

    func verifyCodeKey(url: URL) {
        let started = url.startAccessingSecurityScopedResource()
        defer { if started { url.stopAccessingSecurityScopedResource() } }

        let result = CodeKeyVerifier.verify(url: url)
        selectedCodeKeyName = url.lastPathComponent
        codeKeyUnlocked = result.valid
        codeKeyMessage = result.message
        codeKeyExpiresAt = result.valid ? Date().addingTimeInterval(600) : nil
        if result.valid { selected = .eft }
    }

    func refreshExpiry() {
        guard let expiry = codeKeyExpiresAt, Date() >= expiry else { return }
        lockCodeKey(message: "La sesión CodeKey expiró. EFT volvió a bloquearse.")
    }

    func lockCodeKey(message: String = "CodeKey bloqueada.") {
        codeKeyUnlocked = false
        codeKeyExpiresAt = nil
        codeKeyMessage = message
        if selected == .eft { selected = .codeKey }
    }
}

private struct HashcodCodespaceNativeSwiftApp: App {
    @StateObject private var state = NativeAppState()

    var body: some Scene {
        WindowGroup("Hashcod Codespace · Native Swift") {
            RootView(state: state)
                .frame(minWidth: 1040, minHeight: 700)
        }
        .windowStyle(.automatic)
    }
}

private struct RootView: View {
    @ObservedObject var state: NativeAppState
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationSplitView {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("HASHCOD")
                        .font(.system(size: 22, weight: .black, design: .default))
                    Text("NATIVE LOCAL")
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 6)

                List(NativeModule.allCases, selection: Binding(
                    get: { state.selected },
                    set: { if let value = $0 { state.select(value) } }
                )) { module in
                    HStack(spacing: 8) {
                        Image(systemName: module.requiresCodeKey && !state.codeKeyUnlocked ? "lock.fill" : "square.fill")
                            .font(.system(size: 9))
                        Text(module.rawValue)
                    }
                    .tag(module)
                }
                .listStyle(.sidebar)
            }
            .padding(.top, 14)
            .navigationSplitViewColumnWidth(min: 190, ideal: 220, max: 260)
        } detail: {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(state.selected.rawValue)
                                .font(.system(size: 31, weight: .bold))
                            Text(state.selected.detail)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        CodeKeyStatusBadge(unlocked: state.codeKeyUnlocked)
                    }

                    switch state.selected {
                    case .home:
                        HomePanel(state: state)
                    case .codeKey:
                        CodeKeyPanel(state: state)
                    case .eft:
                        if state.codeKeyUnlocked {
                            EFTPanel()
                        } else {
                            CodeKeyPanel(state: state)
                        }
                    default:
                        ModulePanel(module: state.selected)
                    }
                }
                .padding(30)
            }
            .background(Color(nsColor: .windowBackgroundColor))
        }
        .onReceive(timer) { _ in state.refreshExpiry() }
        .fileImporter(
            isPresented: $state.showCodeKeyImporter,
            allowedContentTypes: [UTType(filenameExtension: "ipynb") ?? .json, .json],
            allowsMultipleSelection: false
        ) { result in
            switch result {
            case .success(let urls):
                if let url = urls.first { state.verifyCodeKey(url: url) }
            case .failure(let error):
                state.codeKeyMessage = error.localizedDescription
            }
        }
    }
}

private struct CodeKeyStatusBadge: View {
    let unlocked: Bool

    var body: some View {
        Text(unlocked ? "CODEKEY ACTIVE" : "CODEKEY LOCKED")
            .font(.system(size: 11, weight: .bold, design: .monospaced))
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(.quaternary, in: RoundedRectangle(cornerRadius: 9))
    }
}

private struct HomePanel: View {
    @ObservedObject var state: NativeAppState

    var body: some View {
        GroupBox("Runtime nativo") {
            VStack(alignment: .leading, spacing: 10) {
                Text("SwiftUI controla la edición Apple de Hashcod Codespace sin Electron.")
                Text("La edición Windows/Linux usa Kotlin/Compose y mantiene el mismo contrato funcional.")
                Text("EFT conserva el bloqueo CodeKey de 10 minutos.")
                Button(state.codeKeyUnlocked ? "Ver estado CodeKey" : "Desbloquear CodeKey") {
                    state.selected = .codeKey
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(8)
        }
    }
}

private struct CodeKeyPanel: View {
    @ObservedObject var state: NativeAppState

    var body: some View {
        GroupBox("CodeKey Jupyter") {
            VStack(alignment: .leading, spacing: 12) {
                Text("El cliente nativo analiza el .ipynb como JSON; nunca ejecuta el código guardado dentro de la llave.")
                if let name = state.selectedCodeKeyName {
                    Text("Archivo: \(name)")
                        .font(.system(size: 12, design: .monospaced))
                }
                Text(state.codeKeyMessage)

                HStack {
                    Button("Seleccionar CodeKey") { state.showCodeKeyImporter = true }
                    if state.codeKeyUnlocked {
                        Button("Bloquear") { state.lockCodeKey(message: "Sesión CodeKey cerrada manualmente.") }
                        Button("Abrir EFT") { state.selected = .eft }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(8)
        }
    }
}

private struct EFTPanel: View {
    @State private var source = """
    # EFT CoffeeScript / Jupyter
    # Native Swift editor surface

    algorithm = (inputValue) ->
      inputValue
    """

    var body: some View {
        GroupBox("EFT Native Editor") {
            VStack(alignment: .leading, spacing: 12) {
                Text("Sesión autorizada mediante CodeKey.")
                TextEditor(text: $source)
                    .font(.system(size: 14, design: .monospaced))
                    .frame(minHeight: 340)
                    .scrollContentBackground(.hidden)
                    .background(Color.black.opacity(0.93))
                    .foregroundStyle(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(8)
        }
    }
}

private struct ModulePanel: View {
    let module: NativeModule

    var body: some View {
        GroupBox("\(module.rawValue) · Native") {
            Text("Este módulo forma parte del mapa de navegación nativo. Su lógica se trasladará al núcleo Swift/Kotlin sin depender de Electron.")
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(8)
        }
    }
}

HashcodCodespaceNativeSwiftApp.main()

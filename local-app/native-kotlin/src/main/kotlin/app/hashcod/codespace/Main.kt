package app.hashcod.codespace

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import kotlinx.coroutines.delay
import java.awt.FileDialog
import java.awt.Frame
import java.io.File
import java.time.Instant

private enum class NativeModule(val label: String, val description: String, val requiresCodeKey: Boolean = false) {
    HOME("Inicio", "Estado del cliente local nativo"),
    CODES("Codes", "Biblioteca y gestión local de códigos"),
    QR_VAULT("QR Vault", "Creación y almacenamiento de QR"),
    TEXT_LAB("Text Lab", "Herramientas de texto y transformación"),
    DISK_LAB("Disk Lab", "Archivos, almacenamiento y operaciones locales"),
    MARKDOWN("Markdown", "Editor y documentos Markdown"),
    EFT("EFT", "Editor CoffeeScript/Jupyter protegido por CodeKey", true),
    PANDORA("p-andora", "Celdas, datos y códigos"),
    DESK("Desk", "Área de trabajo local"),
    OSDG("OSDG-rest", "Cifrado y archivos locales"),
    SYNC("Sync", "Sincronización con la plataforma alojada"),
    CODEKEY("CodeKey", "Control de acceso administrativo nativo")
}

private class NativeAppState {
    var selected by mutableStateOf(NativeModule.HOME)
    var codeKeyUnlocked by mutableStateOf(false)
    var codeKeyMessage by mutableStateOf("EFT está bloqueado hasta verificar la CodeKey.")
    var codeKeyExpiresAt by mutableStateOf<Instant?>(null)
    var selectedCodeKeyName by mutableStateOf<String?>(null)

    fun verifyCodeKey(file: File) {
        val result = CodeKeyVerifier.verify(file)
        selectedCodeKeyName = file.name
        codeKeyUnlocked = result.valid
        codeKeyMessage = result.message
        codeKeyExpiresAt = if (result.valid) Instant.now().plusSeconds(600) else null
    }

    fun refreshExpiry() {
        val expiry = codeKeyExpiresAt ?: return
        if (Instant.now().isAfter(expiry)) lockCodeKey("La sesión CodeKey expiró. EFT volvió a bloquearse.")
    }

    fun lockCodeKey(message: String = "CodeKey bloqueada.") {
        codeKeyUnlocked = false
        codeKeyExpiresAt = null
        codeKeyMessage = message
        if (selected == NativeModule.EFT) selected = NativeModule.CODEKEY
    }
}

fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "Hashcod Codespace · Native Kotlin"
    ) {
        MaterialTheme(colorScheme = lightColorScheme()) {
            HashcodNativeApp()
        }
    }
}

@Composable
private fun HashcodNativeApp() {
    val state = remember { NativeAppState() }

    LaunchedEffect(Unit) {
        while (true) {
            state.refreshExpiry()
            delay(1000)
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFFF7F7F5)) {
        Row(modifier = Modifier.fillMaxSize()) {
            NativeNavigation(state)
            Divider(modifier = Modifier.fillMaxHeight().width(1.dp))
            NativeContent(state)
        }
    }
}

@Composable
private fun NativeNavigation(state: NativeAppState) {
    Column(
        modifier = Modifier
            .width(210.dp)
            .fillMaxHeight()
            .background(Color.White)
            .padding(vertical = 18.dp)
    ) {
        Column(modifier = Modifier.padding(horizontal = 18.dp)) {
            Text("HASHCOD", fontSize = 21.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            Text("NATIVE LOCAL", fontSize = 11.sp, fontFamily = FontFamily.Monospace, color = Color(0xFF666666))
        }
        Spacer(Modifier.height(18.dp))
        Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
            NativeModule.entries.forEach { module ->
                val locked = module.requiresCodeKey && !state.codeKeyUnlocked
                NavigationRailItem(
                    selected = state.selected == module,
                    onClick = {
                        if (locked) {
                            state.selected = NativeModule.CODEKEY
                            state.codeKeyMessage = "Verifica la CodeKey antes de abrir EFT."
                        } else {
                            state.selected = module
                        }
                    },
                    icon = {
                        Text(
                            when {
                                module == NativeModule.CODEKEY -> "⌘"
                                locked -> "🔒"
                                else -> "■"
                            },
                            fontSize = 13.sp
                        )
                    },
                    label = { Text(module.label, fontSize = 12.sp) },
                    alwaysShowLabel = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun NativeContent(state: NativeAppState) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(30.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(state.selected.label, fontSize = 30.sp, fontWeight = FontWeight.Bold)
                Text(state.selected.description, color = Color(0xFF5D5D5D))
            }
            StatusPill(state)
        }

        when (state.selected) {
            NativeModule.HOME -> HomePanel(state)
            NativeModule.CODEKEY -> CodeKeyPanel(state)
            NativeModule.EFT -> EftPanel(state)
            else -> NativeModulePanel(state.selected)
        }
    }
}

@Composable
private fun StatusPill(state: NativeAppState) {
    val text = if (state.codeKeyUnlocked) "CODEKEY ACTIVE" else "CODEKEY LOCKED"
    Card {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun HomePanel(state: NativeAppState) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Runtime nativo", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text("Kotlin/Compose controla la ventana, navegación, estado local y módulos en Windows/Linux.")
            Text("La edición Apple utiliza el mismo contrato funcional desde SwiftUI.")
            Text("EFT conserva el bloqueo CodeKey de 10 minutos.")
            Button(onClick = { state.selected = NativeModule.CODEKEY }) {
                Text(if (state.codeKeyUnlocked) "Ver estado CodeKey" else "Desbloquear CodeKey")
            }
        }
    }
}

@Composable
private fun CodeKeyPanel(state: NativeAppState) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("CodeKey Jupyter", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text("La app lee el .ipynb como JSON y nunca ejecuta el código contenido en la llave.")
            state.selectedCodeKeyName?.let { Text("Archivo: $it", fontFamily = FontFamily.Monospace, fontSize = 12.sp) }
            Text(state.codeKeyMessage)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = {
                    selectCodeKeyFile()?.let(state::verifyCodeKey)
                }) {
                    Text("Seleccionar CodeKey")
                }
                if (state.codeKeyUnlocked) {
                    Button(onClick = { state.lockCodeKey("Sesión CodeKey cerrada manualmente.") }) {
                        Text("Bloquear")
                    }
                    Button(onClick = { state.selected = NativeModule.EFT }) {
                        Text("Abrir EFT")
                    }
                }
            }
        }
    }
}

@Composable
private fun EftPanel(state: NativeAppState) {
    if (!state.codeKeyUnlocked) {
        LaunchedEffect(Unit) { state.selected = NativeModule.CODEKEY }
        return
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("EFT Native Editor", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text("Sesión autorizada mediante CodeKey. El motor de edición nativo sustituirá progresivamente la implementación web.")
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(320.dp)
                    .background(Color(0xFF111111))
                    .padding(18.dp)
            ) {
                Text(
                    "# EFT CoffeeScript / Jupyter\n# Native Kotlin editor surface\n\nalgorithm = (inputValue) ->\n  inputValue",
                    color = Color(0xFFF3F3F3),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 14.sp
                )
            }
        }
    }
}

@Composable
private fun NativeModulePanel(module: NativeModule) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(22.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("${module.label} · Native", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text("Este módulo ya forma parte del mapa de navegación nativo. Su lógica se moverá al núcleo Kotlin/Swift sin depender de Electron.")
        }
    }
}

private fun selectCodeKeyFile(): File? {
    val dialog = FileDialog(null as Frame?, "Selecciona la CodeKey .ipynb", FileDialog.LOAD)
    dialog.file = "*.ipynb"
    dialog.isVisible = true
    val directory = dialog.directory ?: return null
    val filename = dialog.file ?: return null
    return File(directory, filename)
}

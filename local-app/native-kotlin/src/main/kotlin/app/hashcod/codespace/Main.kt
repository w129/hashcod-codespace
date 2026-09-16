package app.hashcod.codespace

import cn.enaium.webview.createWebview
import java.io.File
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.security.SecureRandom
import java.time.Instant
import java.util.Locale
import java.util.concurrent.TimeUnit

private const val APP_TITLE = "Hashcod Codespace"
private const val APP_ID = "app.hashcod.codespace"
private const val LOOPBACK_HOST = "127.0.0.1"
private const val CLOUD_ORIGIN = "https://hashcod-codespace-1.onrender.com"
private val PRESERVE_PATHS = listOf(".env", "LOCAL-DB-CREDENTIALS.txt", "data_storage", "uploads")

private data class RuntimePaths(
    val resources: Path,
    val userData: Path,
    val runtimeRoot: Path,
    val liveSite: Path,
    val phpExecutable: Path,
    val phpIni: Path,
)

private class HashcodLocalRuntime {
    private val secureRandom = SecureRandom()
    private val paths = resolvePaths()
    private var phpProcess: Process? = null
    private var bridgeToken: String = ""
    private var localOrigin: String = ""

    fun run() {
        val site = installSite()
        bridgeToken = randomToken()
        val port = freePort()
        localOrigin = "http://$LOOPBACK_HOST:$port"
        phpProcess = startPhp(site, port, bridgeToken)
        Runtime.getRuntime().addShutdownHook(Thread { stopPhp() })
        waitForPort(port)
        openNativeWindow(localOrigin, bridgeToken)
        stopPhp()
    }

    private fun resolvePaths(): RuntimePaths {
        val resources = System.getenv("HASHCOD_NATIVE_RESOURCES")
            ?.takeIf { it.isNotBlank() }
            ?.let { Paths.get(it).toAbsolutePath().normalize() }
            ?: Paths.get(System.getProperty("user.dir"), "runtime").toAbsolutePath().normalize()

        val os = System.getProperty("os.name").lowercase(Locale.ROOT)
        val home = Paths.get(System.getProperty("user.home"))
        val userData = when {
            os.contains("win") -> {
                val appData = System.getenv("APPDATA")?.takeIf { it.isNotBlank() }
                (appData?.let(Paths::get) ?: home.resolve("AppData/Roaming")).resolve("Hashcod Codespace Native")
            }
            os.contains("mac") -> home.resolve("Library/Application Support/Hashcod Codespace Native")
            else -> {
                val xdg = System.getenv("XDG_DATA_HOME")?.takeIf { it.isNotBlank() }
                (xdg?.let(Paths::get) ?: home.resolve(".local/share")).resolve("hashcod-codespace-native")
            }
        }.toAbsolutePath().normalize()

        val runtimeRoot = userData.resolve("runtime")
        val phpName = if (os.contains("win")) "php.exe" else "php"
        return RuntimePaths(
            resources = resources,
            userData = userData,
            runtimeRoot = runtimeRoot,
            liveSite = runtimeRoot.resolve("site"),
            phpExecutable = resources.resolve("php").resolve(phpName),
            phpIni = resources.resolve("php").resolve("php.ini"),
        )
    }

    private fun packagedVersion(): String {
        return System.getenv("HASHCOD_NATIVE_VERSION")?.takeIf { it.isNotBlank() }
            ?: HashcodLocalRuntime::class.java.`package`?.implementationVersion
            ?: "dev"
    }

    private fun installSite(): Path {
        val bundledSite = paths.resources.resolve("site")
        require(Files.isRegularFile(bundledSite.resolve("router.php"))) {
            "Native package is missing runtime/site/router.php"
        }

        Files.createDirectories(paths.runtimeRoot)
        val staging = paths.runtimeRoot.resolve("site.staging")
        val previous = paths.runtimeRoot.resolve("site.previous")
        val versionFile = paths.runtimeRoot.resolve("bundle-version.txt")
        val expectedVersion = packagedVersion()
        val installedVersion = runCatching { Files.readString(versionFile).trim() }.getOrDefault("")

        if (installedVersion == expectedVersion && Files.isRegularFile(paths.liveSite.resolve("router.php"))) {
            return paths.liveSite
        }

        deleteTree(staging)
        deleteTree(previous)
        Files.createDirectories(staging)
        copyTree(bundledSite, staging)

        if (Files.exists(paths.liveSite)) {
            for (relative in PRESERVE_PATHS) {
                val oldPath = paths.liveSite.resolve(relative)
                val newPath = staging.resolve(relative)
                if (!Files.exists(oldPath)) continue
                deleteTree(newPath)
                if (Files.isDirectory(oldPath)) copyTree(oldPath, newPath) else copyFile(oldPath, newPath)
            }
            Files.move(paths.liveSite, previous, StandardCopyOption.REPLACE_EXISTING)
        }

        try {
            Files.move(staging, paths.liveSite, StandardCopyOption.REPLACE_EXISTING)
            deleteTree(previous)
        } catch (error: Throwable) {
            if (!Files.exists(paths.liveSite) && Files.exists(previous)) {
                Files.move(previous, paths.liveSite, StandardCopyOption.REPLACE_EXISTING)
            }
            throw error
        }

        val env = paths.liveSite.resolve(".env")
        val envExample = paths.liveSite.resolve(".env.example")
        if (!Files.exists(env) && Files.isRegularFile(envExample)) copyFile(envExample, env)
        Files.createDirectories(paths.liveSite.resolve("data_storage"))
        Files.createDirectories(paths.liveSite.resolve("uploads"))
        Files.writeString(versionFile, expectedVersion + "\n")
        return paths.liveSite
    }

    private fun copyTree(source: Path, destination: Path) {
        Files.walk(source).use { stream ->
            stream.forEach { item ->
                if (Files.isSymbolicLink(item)) return@forEach
                val relative = source.relativize(item)
                val target = destination.resolve(relative.toString())
                if (Files.isDirectory(item)) {
                    Files.createDirectories(target)
                } else if (Files.isRegularFile(item)) {
                    copyFile(item, target)
                }
            }
        }
    }

    private fun copyFile(source: Path, destination: Path) {
        destination.parent?.let(Files::createDirectories)
        Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES)
    }

    private fun deleteTree(path: Path) {
        if (!Files.exists(path)) return
        Files.walk(path).sorted(Comparator.reverseOrder()).use { stream ->
            stream.forEach { Files.deleteIfExists(it) }
        }
    }

    private fun randomToken(): String {
        val bytes = ByteArray(32)
        secureRandom.nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it.toInt() and 0xff) }
    }

    private fun freePort(): Int {
        ServerSocket(0, 1, InetAddress.getByName(LOOPBACK_HOST)).use { socket ->
            return socket.localPort
        }
    }

    private fun startPhp(site: Path, port: Int, token: String): Process {
        require(Files.isRegularFile(paths.phpExecutable)) {
            "Native package is missing the bundled PHP runtime: ${paths.phpExecutable.fileName}"
        }
        val args = mutableListOf(paths.phpExecutable.toString())
        if (Files.isRegularFile(paths.phpIni)) args += listOf("-c", paths.phpIni.toString())
        args += listOf("-S", "$LOOPBACK_HOST:$port", "router.php")

        Files.createDirectories(paths.userData)
        val log = paths.userData.resolve("native-runtime.log").toFile()
        val builder = ProcessBuilder(args)
            .directory(site.toFile())
            .redirectErrorStream(true)
            .redirectOutput(ProcessBuilder.Redirect.appendTo(log))

        builder.environment().apply {
            put("APP_ENV", "local")
            put("HASHCOD_DESKTOP", "1")
            put("HASHCOD_NATIVE_HOST", "kotlin")
            put("HASHCOD_DESKTOP_ORIGIN", localOrigin)
            put("HASHCOD_DESKTOP_ADMIN_TOKEN", token)
            put("HASHCOD_CLOUD_ORIGIN", CLOUD_ORIGIN)
            put("L8_TRUST_PROXY", "0")
            put("L8_REQUIRE_AUTH_MUTATIONS", "1")
        }
        return builder.start()
    }

    private fun waitForPort(port: Int, timeoutMillis: Long = 30_000) {
        val deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(timeoutMillis)
        var lastError: Throwable? = null
        while (System.nanoTime() < deadline) {
            val process = phpProcess
            if (process != null && !process.isAlive) {
                error("Local PHP runtime stopped before Hashcod became ready (exit ${process.exitValue()}).")
            }
            try {
                Socket(LOOPBACK_HOST, port).use { return }
            } catch (error: Throwable) {
                lastError = error
                Thread.sleep(200)
            }
        }
        throw IllegalStateException("Local Hashcod runtime did not become ready.", lastError)
    }

    private fun openNativeWindow(origin: String, token: String) {
        val markerScript = """
            (() => {
              document.documentElement.dataset.hashcodDesktop = 'true';
              document.documentElement.dataset.hashcodNativeHost = 'kotlin';
              window.__HASHCOD_DESKTOP__ = true;
              window.__HASHCOD_NATIVE_HOST__ = 'kotlin';
              window.turnstileTokens = window.turnstileTokens || {};
              window.turnstileTokens.register = 'desktop-loopback';
            })();
        """.trimIndent()

        val bootstrap = """
            <!doctype html>
            <html lang="es">
            <head><meta charset="utf-8"><title>$APP_TITLE</title></head>
            <body>
              <form id="hashcodNativeBootstrap" method="post" action="${htmlEscape(origin)}/api/desktop/bootstrap">
                <input type="hidden" name="bridge_token" value="${htmlEscape(token)}">
                <input type="hidden" name="native_host" value="kotlin">
              </form>
              <script>document.getElementById('hashcodNativeBootstrap').submit();</script>
            </body>
            </html>
        """.trimIndent()

        createWebview(debug = false).use { webview ->
            webview.setTitle(APP_TITLE)
            webview.setSize(1440, 900)
            webview.init(markerScript)
            webview.setHtml(bootstrap)
            webview.run()
        }
    }

    private fun htmlEscape(value: String): String = buildString(value.length) {
        value.forEach { char ->
            append(
                when (char) {
                    '&' -> "&amp;"
                    '<' -> "&lt;"
                    '>' -> "&gt;"
                    '"' -> "&quot;"
                    '\'' -> "&#39;"
                    else -> char
                },
            )
        }
    }

    private fun stopPhp() {
        val process = phpProcess ?: return
        phpProcess = null
        if (!process.isAlive) return
        process.destroy()
        runCatching {
            if (!process.waitFor(2, TimeUnit.SECONDS) && process.isAlive) process.destroyForcibly()
        }
        runCatching {
            Files.writeString(
                paths.userData.resolve("native-last-stop.txt"),
                Instant.now().toString() + "\n",
            )
        }
    }
}

fun main() {
    try {
        HashcodLocalRuntime().run()
    } catch (error: Throwable) {
        System.err.println("Hashcod Codespace native runtime failed: ${error.message}")
        error.printStackTrace(System.err)
        kotlin.system.exitProcess(1)
    }
}

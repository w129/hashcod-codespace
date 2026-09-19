package app.hashcod.codespace

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import java.io.File
import java.security.MessageDigest
import java.util.TreeMap

object CodeKeyVerifier {
    const val expectedFilename = "OnIPFeJKssih4mbNLCYXnct6a1L_q84po-KVfKPZInHYbhNJ8OR2n3M2zFJ2zZeK9bqkcmilS1li-3DrTsaUIg.ipynb"
    private const val expectedFormat = "HASHCOD-CODEKEY-IPYNB-1"
    private const val expectedScheme = "HASHCOD-DUAL-FINGERPRINT-1"
    private const val expectedCodeKey = "CODEKEY1:8ccbe307c4199695282e0de07a7a474537d99edf915e71bba5f4f88c6ecff94d"
    private const val expectedJupyter = "JUPYTER1:d185f92f42837d6a3dbea6dc3bf2a26a348e2df7aa8cdadeb9acf3b2a88c9c56"
    private const val expectedCombined = "HASHCOD1:d02c7f85eccb0e8eb63f26bda3bc82fb86a6f6e80b98c2b35ff982e07c215b5b"
    private const val maxBytes = 131072L

    data class Result(
        val valid: Boolean,
        val message: String,
        val codeKeyFingerprint: String = "",
        val jupyterFingerprint: String = "",
        val combinedFingerprint: String = ""
    )

    private val json = Json {
        ignoreUnknownKeys = false
        isLenient = false
        explicitNulls = true
    }

    private fun filenameAllowed(filename: String): Boolean {
        if (filename == expectedFilename) return true
        val stem = expectedFilename.removeSuffix(".ipynb")
        return Regex("^" + Regex.escape(stem) + "\\s*\\(\\d+\\)\\.ipynb$", RegexOption.IGNORE_CASE).matches(filename)
    }

    fun verify(file: File): Result {
        if (!file.isFile) return Result(false, "La CodeKey no existe.")
        if (!filenameAllowed(file.name)) return Result(false, "El nombre de la CodeKey no coincide con el registrado.")
        if (file.length() <= 0L || file.length() > maxBytes) return Result(false, "El archivo CodeKey tiene un tamaño no permitido.")

        val root = try {
            json.parseToJsonElement(file.readText(Charsets.UTF_8)) as? JsonObject
        } catch (_: Exception) {
            null
        } ?: return Result(false, "La CodeKey no es un notebook JSON válido.")

        if (root.primitiveInt("nbformat") != 4 || root.primitiveInt("nbformat_minor") != 5) {
            return Result(false, "La CodeKey debe usar Jupyter Notebook 4.5.")
        }

        val hashcod = ((root["metadata"] as? JsonObject)?.get("hashcod") as? JsonObject)
            ?: return Result(false, "Falta metadata.hashcod.")

        if (hashcod.primitiveString("format") != expectedFormat ||
            hashcod.primitiveString("fingerprint_scheme") != expectedScheme ||
            hashcod.primitiveString("access") != "ADMIN" ||
            hashcod.primitiveString("scope") != "PRIVATE" ||
            hashcod.primitiveString("version") != "1" ||
            hashcod.primitiveString("codekey_fingerprint") != expectedCodeKey ||
            hashcod.primitiveString("jupyter_fingerprint") != expectedJupyter ||
            hashcod.primitiveString("combined_fingerprint") != expectedCombined
        ) {
            return Result(false, "La metadata criptográfica de CodeKey no coincide.")
        }

        val cells = root["cells"] as? JsonArray ?: return Result(false, "El notebook no contiene celdas.")
        val keyCells = cells.mapNotNull { it as? JsonObject }.filter { cell ->
            val metadata = cell["metadata"] as? JsonObject
            cell.primitiveString("cell_type") == "code" &&
                ((metadata?.get("hashcod_codekey") as? JsonPrimitive)?.booleanOrNull == true)
        }
        if (keyCells.size != 1) return Result(false, "Debe existir exactamente una celda CodeKey marcada.")

        val source = keyCells.single()["source"] as? JsonArray
            ?: return Result(false, "La celda CodeKey no contiene source.")
        if (source.isEmpty()) return Result(false, "La celda CodeKey está vacía.")

        val sourceText = buildString {
            for (line in source) {
                val primitive = line as? JsonPrimitive
                    ?: return Result(false, "La celda CodeKey contiene una línea inválida.")
                val text = primitive.contentOrNull
                    ?: return Result(false, "La celda CodeKey contiene una línea inválida.")
                append(text)
            }
        }

        val normalized = normalizeCode(sourceText)
        val codeKey = "CODEKEY1:${sha256(normalized)}"
        if (codeKey != expectedCodeKey) return Result(false, "CODEKEY1 no coincide.", codeKey)

        val canonicalSource = JsonArray(normalized.split("\n").map { JsonPrimitive("$it\n") })
        val canonical = JsonObject(
            mapOf(
                "nbformat" to JsonPrimitive(4),
                "nbformat_minor" to JsonPrimitive(5),
                "cells" to JsonArray(
                    listOf(
                        JsonObject(
                            mapOf(
                                "cell_type" to JsonPrimitive("code"),
                                "metadata" to JsonObject(mapOf("hashcod_codekey" to JsonPrimitive(true))),
                                "source" to canonicalSource
                            )
                        )
                    )
                )
            )
        )
        val canonicalJson = Json.encodeToString(JsonElement.serializer(), sortJson(canonical))
        val jupyter = "JUPYTER1:${sha256(canonicalJson)}"
        if (jupyter != expectedJupyter) return Result(false, "JUPYTER1 no coincide.", codeKey, jupyter)

        val combined = "HASHCOD1:${sha256("$expectedScheme|$codeKey|$jupyter")}" 
        if (combined != expectedCombined) {
            return Result(false, "HASHCOD1 no coincide.", codeKey, jupyter, combined)
        }

        return Result(true, "CodeKey verificada.", codeKey, jupyter, combined)
    }

    private fun normalizeCode(code: String): String = code
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .trim()

    private fun sha256(value: String): String = MessageDigest
        .getInstance("SHA-256")
        .digest(value.toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it) }

    private fun sortJson(value: JsonElement): JsonElement = when (value) {
        is JsonObject -> {
            val sorted = TreeMap<String, JsonElement>()
            value.forEach { (key, element) -> sorted[key] = sortJson(element) }
            JsonObject(sorted)
        }
        is JsonArray -> JsonArray(value.map(::sortJson))
        else -> value
    }

    private fun JsonObject.primitiveString(key: String): String? =
        (this[key] as? JsonPrimitive)?.contentOrNull

    private fun JsonObject.primitiveInt(key: String): Int? =
        (this[key] as? JsonPrimitive)?.intOrNull
}

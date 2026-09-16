import Foundation
import CryptoKit

struct CodeKeyVerificationResult: Sendable {
    let valid: Bool
    let message: String
    let codeKeyFingerprint: String
    let jupyterFingerprint: String
    let combinedFingerprint: String

    init(
        valid: Bool,
        message: String,
        codeKeyFingerprint: String = "",
        jupyterFingerprint: String = "",
        combinedFingerprint: String = ""
    ) {
        self.valid = valid
        self.message = message
        self.codeKeyFingerprint = codeKeyFingerprint
        self.jupyterFingerprint = jupyterFingerprint
        self.combinedFingerprint = combinedFingerprint
    }
}

enum CodeKeyVerifier {
    static let expectedFilename = "OnIPFeJKssih4mbNLCYXnct6a1L_q84po-KVfKPZInHYbhNJ8OR2n3M2zFJ2zZeK9bqkcmilS1li-3DrTsaUIg.ipynb"
    private static let expectedFormat = "HASHCOD-CODEKEY-IPYNB-1"
    private static let expectedScheme = "HASHCOD-DUAL-FINGERPRINT-1"
    private static let expectedCodeKey = "CODEKEY1:8ccbe307c4199695282e0de07a7a474537d99edf915e71bba5f4f88c6ecff94d"
    private static let expectedJupyter = "JUPYTER1:d185f92f42837d6a3dbea6dc3bf2a26a348e2df7aa8cdadeb9acf3b2a88c9c56"
    private static let expectedCombined = "HASHCOD1:d02c7f85eccb0e8eb63f26bda3bc82fb86a6f6e80b98c2b35ff982e07c215b5b"
    private static let maxBytes = 131_072

    static func verify(url: URL) -> CodeKeyVerificationResult {
        guard url.lastPathComponent == expectedFilename else {
            return .init(valid: false, message: "El nombre de la CodeKey no coincide con el registrado.")
        }

        guard let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
              let size = attributes[.size] as? NSNumber,
              size.intValue > 0,
              size.intValue <= maxBytes else {
            return .init(valid: false, message: "El archivo CodeKey tiene un tamaño no permitido.")
        }

        guard let data = try? Data(contentsOf: url),
              let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return .init(valid: false, message: "La CodeKey no es un notebook JSON válido.")
        }

        guard int(root["nbformat"]) == 4, int(root["nbformat_minor"]) == 5 else {
            return .init(valid: false, message: "La CodeKey debe usar Jupyter Notebook 4.5.")
        }

        guard let metadata = root["metadata"] as? [String: Any],
              let hashcod = metadata["hashcod"] as? [String: Any] else {
            return .init(valid: false, message: "Falta metadata.hashcod.")
        }

        guard string(hashcod["format"]) == expectedFormat,
              string(hashcod["fingerprint_scheme"]) == expectedScheme,
              string(hashcod["access"]) == "ADMIN",
              string(hashcod["scope"]) == "PRIVATE",
              string(hashcod["version"]) == "1",
              string(hashcod["codekey_fingerprint"]) == expectedCodeKey,
              string(hashcod["jupyter_fingerprint"]) == expectedJupyter,
              string(hashcod["combined_fingerprint"]) == expectedCombined else {
            return .init(valid: false, message: "La metadata criptográfica de CodeKey no coincide.")
        }

        guard let cells = root["cells"] as? [[String: Any]] else {
            return .init(valid: false, message: "El notebook no contiene celdas.")
        }

        let keyCells = cells.filter { cell in
            guard string(cell["cell_type"]) == "code",
                  let cellMetadata = cell["metadata"] as? [String: Any],
                  let flag = cellMetadata["hashcod_codekey"] as? Bool else { return false }
            return flag
        }

        guard keyCells.count == 1,
              let source = keyCells[0]["source"] as? [String],
              !source.isEmpty else {
            return .init(valid: false, message: "Debe existir exactamente una celda CodeKey marcada.")
        }

        let normalized = normalizeCode(source.joined())
        let codeKey = "CODEKEY1:\(sha256(normalized))"
        guard codeKey == expectedCodeKey else {
            return .init(valid: false, message: "CODEKEY1 no coincide.", codeKeyFingerprint: codeKey)
        }

        let canonicalSource = normalized.split(separator: "\n", omittingEmptySubsequences: false).map { String($0) + "\n" }
        let canonical: [String: Any] = [
            "nbformat": 4,
            "nbformat_minor": 5,
            "cells": [[
                "cell_type": "code",
                "metadata": ["hashcod_codekey": true],
                "source": canonicalSource
            ]]
        ]

        guard let canonicalData = try? JSONSerialization.data(
            withJSONObject: canonical,
            options: [.sortedKeys, .withoutEscapingSlashes]
        ), let canonicalJSON = String(data: canonicalData, encoding: .utf8) else {
            return .init(valid: false, message: "No se pudo canonicalizar la CodeKey.")
        }

        let jupyter = "JUPYTER1:\(sha256(canonicalJSON))"
        guard jupyter == expectedJupyter else {
            return .init(
                valid: false,
                message: "JUPYTER1 no coincide.",
                codeKeyFingerprint: codeKey,
                jupyterFingerprint: jupyter
            )
        }

        let combined = "HASHCOD1:\(sha256("\(expectedScheme)|\(codeKey)|\(jupyter)"))"
        guard combined == expectedCombined else {
            return .init(
                valid: false,
                message: "HASHCOD1 no coincide.",
                codeKeyFingerprint: codeKey,
                jupyterFingerprint: jupyter,
                combinedFingerprint: combined
            )
        }

        return .init(
            valid: true,
            message: "CodeKey verificada.",
            codeKeyFingerprint: codeKey,
            jupyterFingerprint: jupyter,
            combinedFingerprint: combined
        )
    }

    private static func normalizeCode(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\r", with: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func sha256(_ value: String) -> String {
        SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    private static func string(_ value: Any?) -> String? {
        switch value {
        case let text as String: return text
        case let number as NSNumber: return number.stringValue
        default: return nil
        }
    }

    private static func int(_ value: Any?) -> Int? {
        if let number = value as? NSNumber { return number.intValue }
        if let text = value as? String { return Int(text) }
        return nil
    }
}

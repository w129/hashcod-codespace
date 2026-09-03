// Package service provides core cryptographic and telemetry business logic for Hashcod Codespace.
package service

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"hashcod-codespace/daemon/pb"
)

// Verbatim Invariant Error Message required by platform specifications
const InvariantRevokedKeyErrorMessage = "La clave Dilithium-5 proporcionada ha sido revocada, ha expirado o es anterior. Solo se permite validar y registrar credenciales con la última clave generada ahora en la plataforma."

// DilithiumEpochRecord maps to data_storage/auth/active_dilithium5_epoch.json
type DilithiumEpochRecord struct {
	ActiveKeyHash   string  `json:"active_key_hash"`
	ActiveKeyExact  string  `json:"active_key_exact"`
	Epoch           float64 `json:"epoch"`
	Timestamp       int64   `json:"timestamp"`
	RevokedPrevious bool    `json:"revoked_previous"`
}

// DilithiumStateManager manages active and revoked Dilithium-5 keys with thread safety and atomic disk persistence.
type DilithiumStateManager struct {
	mu            sync.RWMutex
	activeRecord  DilithiumEpochRecord
	revokedHashes map[string]int64 // SHA-256 hex -> revocation unix timestamp
	storagePath   string
	envMasterKey  string
}

// NewDilithiumStateManager initializes the state manager and synchronizes with the epoch file.
func NewDilithiumStateManager(customPath string) *DilithiumStateManager {
	path := customPath
	if path == "" {
		path = resolveEpochStoragePath()
	}

	envKey := strings.TrimSpace(os.Getenv("L8_DILITHIUM5_REGISTER_KEY"))
	if envKey == "" {
		envKey = strings.TrimSpace(os.Getenv("DILITHIUM5_ADMIN_SIGNATURE"))
	}

	sm := &DilithiumStateManager{
		revokedHashes: make(map[string]int64),
		storagePath:   path,
		envMasterKey:  envKey,
	}

	_ = sm.loadFromDisk()
	return sm
}

// resolveEpochStoragePath searches standard platform relative paths to locate active_dilithium5_epoch.json.
func resolveEpochStoragePath() string {
	candidates := []string{
		"data_storage/auth/active_dilithium5_epoch.json",
		"../data_storage/auth/active_dilithium5_epoch.json",
		"../../data_storage/auth/active_dilithium5_epoch.json",
		filepath.Join(os.Getenv("DATA_DIR"), "auth", "active_dilithium5_epoch.json"),
	}

	for _, cand := range candidates {
		if cand == "" {
			continue
		}
		if _, err := os.Stat(cand); err == nil {
			return cand
		}
	}

	// Default fallback path
	return "data_storage/auth/active_dilithium5_epoch.json"
}

// CleanDilithiumKey strips whitespace and optional environment prefixes.
func CleanDilithiumKey(key string) string {
	clean := strings.TrimSpace(key)
	if strings.HasPrefix(clean, "DILITHIUM5_ADMIN_SIGNATURE=") {
		clean = clean[len("DILITHIUM5_ADMIN_SIGNATURE="):]
	} else if strings.HasPrefix(clean, "L8_DILITHIUM5_REGISTER_KEY=") {
		clean = clean[len("L8_DILITHIUM5_REGISTER_KEY="):]
	}
	return strings.TrimSpace(clean)
}

// TimingSafeEqual compares two strings in constant time using SHA-256 digest comparison.
func TimingSafeEqual(a, b string) bool {
	hA := sha256.Sum256([]byte(a))
	hB := sha256.Sum256([]byte(b))
	hashMatch := subtle.ConstantTimeCompare(hA[:], hB[:]) == 1
	lenMatch := subtle.ConstantTimeEq(int32(len(a)), int32(len(b))) == 1
	return hashMatch && lenMatch
}

// loadFromDisk loads the active epoch record from the JSON storage file.
func (sm *DilithiumStateManager) loadFromDisk() error {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	if sm.storagePath == "" {
		return fmt.Errorf("storage path not defined")
	}

	data, err := os.ReadFile(sm.storagePath)
	if err != nil {
		return err
	}

	var record DilithiumEpochRecord
	if err := json.Unmarshal(data, &record); err != nil {
		return err
	}

	sm.activeRecord = record
	return nil
}

// saveToDisk writes the active epoch record atomically to disk.
func (sm *DilithiumStateManager) saveToDiskLocked() error {
	if sm.storagePath == "" {
		return nil
	}

	dir := filepath.Dir(sm.storagePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(sm.activeRecord, "", "    ")
	if err != nil {
		return err
	}

	tmpPath := fmt.Sprintf("%s.tmp.%d", sm.storagePath, time.Now().UnixNano())
	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		// Fallback to direct write if temp write fails
		return os.WriteFile(sm.storagePath, data, 0644)
	}

	// Atomic replace
	if err := os.Rename(tmpPath, sm.storagePath); err != nil {
		// On Windows, target might need removal first or fallback to direct write
		_ = os.Remove(sm.storagePath)
		if err2 := os.Rename(tmpPath, sm.storagePath); err2 != nil {
			_ = os.Remove(tmpPath)
			return os.WriteFile(sm.storagePath, data, 0644)
		}
	}
	return nil
}

// VerifyKey implements the inviolable single active Dilithium-5 key rule.
func (sm *DilithiumStateManager) VerifyKey(candidateKey string) *pb.VerifyResponse {
	cleanCandidate := CleanDilithiumKey(candidateKey)
	nowMs := time.Now().UnixMilli()

	if cleanCandidate == "" {
		return &pb.VerifyResponse{
			Valid:            false,
			VerificationType: "invalid_empty",
			ErrorMessage:     "Falta ingresar la clave Dilithium-5 de registro.",
			VerifiedAtUnixMs: nowMs,
			IsRevoked:        false,
		}
	}

	h := sha256.Sum256([]byte(cleanCandidate))
	candidateHash := hex.EncodeToString(h[:])

	sm.mu.RLock()
	defer sm.mu.RUnlock()

	// 1. If an active dynamic key exists, ONLY that exact key is accepted.
	if sm.activeRecord.ActiveKeyExact != "" {
		cleanActive := CleanDilithiumKey(sm.activeRecord.ActiveKeyExact)

		if TimingSafeEqual(cleanCandidate, cleanActive) {
			return &pb.VerifyResponse{
				Valid:            true,
				VerificationType: "dynamic_active_key",
				Epoch:            sm.activeRecord.Epoch,
				KeyHashSha256:    sm.activeRecord.ActiveKeyHash,
				VerifiedAtUnixMs: nowMs,
				IsRevoked:        false,
			}
		}

		// Any other key (whether previously generated, revoked, or invalid) is REJECTED
		// with the exact platform verbatim error.
		return &pb.VerifyResponse{
			Valid:            false,
			VerificationType: "rejected_revoked_or_previous",
			Epoch:            sm.activeRecord.Epoch,
			KeyHashSha256:    candidateHash,
			ErrorMessage:     InvariantRevokedKeyErrorMessage,
			VerifiedAtUnixMs: nowMs,
			IsRevoked:        true,
		}
	}

	// 2. Fallback to environment master key if no dynamic key was generated yet.
	if sm.envMasterKey != "" {
		cleanEnv := CleanDilithiumKey(sm.envMasterKey)
		if TimingSafeEqual(cleanCandidate, cleanEnv) {
			return &pb.VerifyResponse{
				Valid:            true,
				VerificationType: "env_master_key",
				KeyHashSha256:    candidateHash,
				VerifiedAtUnixMs: nowMs,
				IsRevoked:        false,
			}
		}
	}

	return &pb.VerifyResponse{
		Valid:            false,
		VerificationType: "unauthorized_key",
		KeyHashSha256:    candidateHash,
		ErrorMessage:     "Clave Dilithium-5 incorrecta o no autorizada para el registro.",
		VerifiedAtUnixMs: nowMs,
		IsRevoked:        false,
	}
}

// RegisterKey registers a newly generated Dilithium-5 key and revokes all prior keys.
func (sm *DilithiumStateManager) RegisterKey(newKey string, epoch float64, operator string) (*pb.RegisterKeyResponse, error) {
	cleanNew := CleanDilithiumKey(newKey)
	if cleanNew == "" {
		return nil, fmt.Errorf("active_key cannot be empty")
	}

	h := sha256.Sum256([]byte(cleanNew))
	newHash := hex.EncodeToString(h[:])

	sm.mu.Lock()
	defer sm.mu.Unlock()

	// If a prior key existed with a different hash, add it to revoked set
	if sm.activeRecord.ActiveKeyHash != "" && sm.activeRecord.ActiveKeyHash != newHash {
		sm.revokedHashes[sm.activeRecord.ActiveKeyHash] = time.Now().Unix()
	}

	effectiveEpoch := epoch
	if effectiveEpoch <= 0 {
		effectiveEpoch = float64(time.Now().UnixNano()) / 1e9
	}

	sm.activeRecord = DilithiumEpochRecord{
		ActiveKeyHash:   newHash,
		ActiveKeyExact:  cleanNew,
		Epoch:           effectiveEpoch,
		Timestamp:       time.Now().Unix(),
		RevokedPrevious: true,
	}

	if err := sm.saveToDiskLocked(); err != nil {
		// Log warning but allow in-memory state to succeed
		fmt.Printf("[WARN] Failed to persist active Dilithium epoch to disk: %v\n", err)
	}

	return &pb.RegisterKeyResponse{
		Ok:                    true,
		Epoch:                 sm.activeRecord.Epoch,
		KeyHashSha256:         newHash,
		RevokedPriorKeysCount: int64(len(sm.revokedHashes)),
		StatusMessage:         "Dilithium-5 active key successfully registered; all prior keys revoked.",
	}, nil
}

// GetStatus returns the current active Dilithium-5 key metadata.
func (sm *DilithiumStateManager) GetStatus() *pb.KeyStatusResponse {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	hasKey := sm.activeRecord.ActiveKeyExact != ""
	return &pb.KeyStatusResponse{
		HasActiveKey:     hasKey,
		ActiveKeyHash:    sm.activeRecord.ActiveKeyHash,
		Epoch:            sm.activeRecord.Epoch,
		RegisteredAtUnix: sm.activeRecord.Timestamp,
		RevokedPrevious:  sm.activeRecord.RevokedPrevious,
		Algorithm:        "ML-DSA-87 / Dilithium-5",
		RevokedKeysCount: int64(len(sm.revokedHashes)),
	}
}

// GetActiveHash returns current active key hash.
func (sm *DilithiumStateManager) GetActiveHash() string {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	return sm.activeRecord.ActiveKeyHash
}

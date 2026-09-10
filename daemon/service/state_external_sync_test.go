package service

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func writeExternalEpochRecord(t *testing.T, path, key string, epoch float64) {
	t.Helper()
	h := sha256.Sum256([]byte(key))
	record := DilithiumEpochRecord{
		ActiveKeyHash:   hex.EncodeToString(h[:]),
		ActiveKeyExact:  key,
		Epoch:           epoch,
		Timestamp:       time.Now().Unix(),
		RevokedPrevious: true,
	}
	data, err := json.MarshalIndent(record, "", "  ")
	if err != nil {
		t.Fatalf("marshal epoch record: %v", err)
	}
	if err := os.WriteFile(path, data, 0600); err != nil {
		t.Fatalf("write epoch record: %v", err)
	}
}

func TestVerifyKeyRefreshesActiveKeyWrittenByPHP(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "active_dilithium5_epoch.json")

	const keyA = "DILITHIUM5-REG-test-key-a"
	const keyB = "DILITHIUM5-REG-test-key-b"

	writeExternalEpochRecord(t, path, keyA, 1001)
	sm := NewDilithiumStateManager(path)

	if got := sm.VerifyKey(keyA); !got.Valid {
		t.Fatalf("initial key should verify: %+v", got)
	}

	// Simulate PHP /api/auth/dilithium-active-key replacing the shared file
	// while the Go daemon remains alive.
	writeExternalEpochRecord(t, path, keyB, 1002)

	if got := sm.VerifyKey(keyB); !got.Valid {
		t.Fatalf("externally activated key should verify without daemon restart: %+v", got)
	}
	if got := sm.VerifyKey(keyA); got.Valid || !got.IsRevoked {
		t.Fatalf("previous key must be rejected after external rotation: %+v", got)
	}

	status := sm.GetStatus()
	if !status.HasActiveKey || status.Epoch != 1002 {
		t.Fatalf("status should expose refreshed epoch: %+v", status)
	}
}

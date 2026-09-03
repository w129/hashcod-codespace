package service_test

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"hashcod-codespace/daemon/pb"
	"hashcod-codespace/daemon/service"
)

// TestDilithiumKeyInvariant asserts the inviolable single-active-key rule.
func TestDilithiumKeyInvariant(t *testing.T) {
	// Create isolated temporary directory for epoch state storage
	tmpDir, err := os.MkdirTemp("", "dilithium_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	epochFile := filepath.Join(tmpDir, "active_dilithium5_epoch.json")
	sm := service.NewDilithiumStateManager(epochFile)
	svc := service.NewDilithiumService(sm)
	ctx := context.Background()

	keyA := "d5_lattice_signature_key_v1_aaaa1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"
	keyB := "d5_lattice_signature_key_v2_bbbb1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"

	// 1. Register Key A
	regRespA, err := svc.RegisterActiveKey(ctx, &pb.RegisterKeyRequest{
		ActiveKey:        keyA,
		Epoch:            1700000001.5,
		Timestamp:        time.Now().Unix(),
		OperatorIdentity: "test-admin-1",
	})
	if err != nil {
		t.Fatalf("failed to register Key A: %v", err)
	}
	if !regRespA.Ok {
		t.Fatalf("expected regRespA.Ok == true")
	}

	// 2. Verify Key A succeeds
	verA, err := svc.VerifySignature(ctx, &pb.VerifyRequest{
		KeyOrSignature: keyA,
	})
	if err != nil {
		t.Fatalf("unexpected error verifying Key A: %v", err)
	}
	if !verA.Valid {
		t.Errorf("expected Key A to be valid, got false: %s", verA.ErrorMessage)
	}
	if verA.VerificationType != "dynamic_active_key" {
		t.Errorf("expected verification_type == 'dynamic_active_key', got '%s'", verA.VerificationType)
	}

	// 3. Register Key B (which MUST revoke Key A)
	regRespB, err := svc.RegisterActiveKey(ctx, &pb.RegisterKeyRequest{
		ActiveKey:        keyB,
		Epoch:            1700000002.5,
		Timestamp:        time.Now().Unix(),
		OperatorIdentity: "test-admin-2",
	})
	if err != nil {
		t.Fatalf("failed to register Key B: %v", err)
	}
	if !regRespB.Ok {
		t.Fatalf("expected regRespB.Ok == true")
	}

	// 4. Verify Key A is now REJECTED with the exact verbatim error message
	verAAfterB, err := svc.VerifySignature(ctx, &pb.VerifyRequest{
		KeyOrSignature: keyA,
	})
	if err != nil {
		t.Fatalf("unexpected error verifying Key A after rotation: %v", err)
	}
	if verAAfterB.Valid {
		t.Errorf("INVARIANT VIOLATION: Key A was accepted after Key B was registered!")
	}
	if !verAAfterB.IsRevoked {
		t.Errorf("expected is_revoked == true for Key A")
	}
	expectedMsg := "La clave Dilithium-5 proporcionada ha sido revocada, ha expirado o es anterior. Solo se permite validar y registrar credenciales con la última clave generada ahora en la plataforma."
	if verAAfterB.ErrorMessage != expectedMsg {
		t.Errorf("expected verbatim error message:\nGOT:      %q\nEXPECTED: %q", verAAfterB.ErrorMessage, expectedMsg)
	}

	// 5. Verify Key B succeeds
	verB, err := svc.VerifySignature(ctx, &pb.VerifyRequest{
		KeyOrSignature: keyB,
	})
	if err != nil {
		t.Fatalf("unexpected error verifying Key B: %v", err)
	}
	if !verB.Valid {
		t.Errorf("expected Key B to be valid, got false: %s", verB.ErrorMessage)
	}

	// 6. Verify single-bit corrupted key is rejected
	corruptedB := keyB[:len(keyB)-1] + "x"
	verCorrupted, err := svc.VerifySignature(ctx, &pb.VerifyRequest{
		KeyOrSignature: corruptedB,
	})
	if err != nil {
		t.Fatalf("unexpected error verifying corrupted key: %v", err)
	}
	if verCorrupted.Valid {
		t.Errorf("INVARIANT VIOLATION: single-bit corrupted key was accepted!")
	}
	if verCorrupted.ErrorMessage != expectedMsg {
		t.Errorf("expected verbatim error on corrupted key, got %q", verCorrupted.ErrorMessage)
	}

	// 7. Verify empty key fails closed
	verEmpty, err := svc.VerifySignature(ctx, &pb.VerifyRequest{
		KeyOrSignature: "",
	})
	if err != nil {
		t.Fatalf("unexpected error verifying empty key: %v", err)
	}
	if verEmpty.Valid {
		t.Errorf("empty key must not be valid")
	}
	if !strings.Contains(verEmpty.ErrorMessage, "Falta ingresar la clave") {
		t.Errorf("expected empty key warning, got %q", verEmpty.ErrorMessage)
	}
}

// TestDilithiumPrefixStripping verifies prefix handling parity with auth.php.
func TestDilithiumPrefixStripping(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "dilithium_prefix_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	epochFile := filepath.Join(tmpDir, "active_dilithium5_epoch.json")
	sm := service.NewDilithiumStateManager(epochFile)
	svc := service.NewDilithiumService(sm)
	ctx := context.Background()

	rawKey := "d5_signature_prefix_test_raw_string_8937hkdf"

	_, err = svc.RegisterActiveKey(ctx, &pb.RegisterKeyRequest{
		ActiveKey: "DILITHIUM5_ADMIN_SIGNATURE=" + rawKey,
	})
	if err != nil {
		t.Fatalf("failed to register prefixed key: %v", err)
	}

	// Test 1: Query with L8_DILITHIUM5_REGISTER_KEY= prefix
	ver1, _ := svc.VerifySignature(ctx, &pb.VerifyRequest{
		KeyOrSignature: "L8_DILITHIUM5_REGISTER_KEY=" + rawKey,
	})
	if !ver1.Valid {
		t.Errorf("expected normalized L8 prefix to match active key")
	}

	// Test 2: Query with raw key without prefix
	ver2, _ := svc.VerifySignature(ctx, &pb.VerifyRequest{
		KeyOrSignature: rawKey,
	})
	if !ver2.Valid {
		t.Errorf("expected raw key to match normalized active key")
	}
}

// TestDeriveKeySeed asserts RFC 8937 64-byte seed generation.
func TestDeriveKeySeed(t *testing.T) {
	sm := service.NewDilithiumStateManager("")
	svc := service.NewDilithiumService(sm)
	ctx := context.Background()

	resp, err := svc.DeriveKeySeed(ctx, &pb.SeedRequest{
		Context:   "unit-test-context",
		SeedBytes: 64,
	})
	if err != nil {
		t.Fatalf("DeriveKeySeed failed: %v", err)
	}

	if !resp.Ok {
		t.Errorf("expected resp.Ok == true")
	}
	if len(resp.SeedBytes) != 64 {
		t.Errorf("expected 64 seed bytes, got %d", len(resp.SeedBytes))
	}
	if len(resp.SeedHex) != 128 {
		t.Errorf("expected 128 hex chars, got %d", len(resp.SeedHex))
	}
	if resp.QuantumRatio <= 0 {
		t.Errorf("expected positive quantum ratio, got %f", resp.QuantumRatio)
	}
	if len(resp.EntropySources) == 0 {
		t.Errorf("expected entropy sources in response")
	}
}

// TestSecurityTelemetrySnapshot tests point-in-time metrics retrieval.
func TestSecurityTelemetrySnapshot(t *testing.T) {
	sm := service.NewDilithiumStateManager("")
	tel := service.NewSecurityTelemetryService(sm)
	ctx := context.Background()

	resp, err := tel.GetSecurityStatus(ctx, &pb.SecurityStatusRequest{
		RequesterId: "test-client",
	})
	if err != nil {
		t.Fatalf("GetSecurityStatus failed: %v", err)
	}

	if resp.HealthScore != 100 {
		t.Errorf("expected initial health score 100, got %d", resp.HealthScore)
	}
	if resp.EntropyPoolBytes != 64 {
		t.Errorf("expected entropy pool 64 bytes, got %d", resp.EntropyPoolBytes)
	}
	if resp.QuantumStatus != "ACTIVE" {
		t.Errorf("expected quantum status ACTIVE, got %s", resp.QuantumStatus)
	}
}

// TestSecurityEventReporting verifies event recording and counter incrementation.
func TestSecurityEventReporting(t *testing.T) {
	sm := service.NewDilithiumStateManager("")
	tel := service.NewSecurityTelemetryService(sm)
	ctx := context.Background()

	snapBefore, _ := tel.GetSecurityStatus(ctx, nil)

	evtResp, err := tel.ReportSecurityEvent(ctx, &pb.SecurityEventRequest{
		EventType:   "THREAT_INTERCEPTED",
		SourceIp:    "192.168.1.100",
		Severity:    "HIGH",
		Description: "SQL Injection payload blocked by edge filter",
	})
	if err != nil {
		t.Fatalf("ReportSecurityEvent failed: %v", err)
	}

	if !evtResp.Recorded {
		t.Errorf("expected event to be recorded")
	}
	if evtResp.EventId == "" {
		t.Errorf("expected non-empty event ID")
	}
	if evtResp.ThreatsBlockedTotal != snapBefore.ThreatsBlocked+1 {
		t.Errorf("expected threats blocked %d, got %d", snapBefore.ThreatsBlocked+1, evtResp.ThreatsBlockedTotal)
	}
}

// TestProtobufWireRoundTrip verifies binary serialization/deserialization fidelity.
func TestProtobufWireRoundTrip(t *testing.T) {
	origChunk := &pb.SecurityTelemetryChunk{
		HealthScore:         95,
		CvesScanned:         350,
		CvesDetected:        1,
		ThreatsBlocked:      25,
		HoneypotHits:        5,
		EntropyPoolBytes:    64,
		QuantumStatus:       "ACTIVE",
		AtomicTimeStatus:    "SYNCED",
		CircuitBreakerState: "CLOSED",
		LastEdgeTimestamp:   1725330000.123,
		TimestampUnixMs:     1725330000123,
		Message:             "Periodic telemetry heartbeat",
		ActiveKeyHash:       "deadbeefcafe12345678",
	}

	data, err := origChunk.Marshal()
	if err != nil {
		t.Fatalf("failed to marshal SecurityTelemetryChunk: %v", err)
	}

	decChunk := &pb.SecurityTelemetryChunk{}
	if err := decChunk.Unmarshal(data); err != nil {
		t.Fatalf("failed to unmarshal SecurityTelemetryChunk: %v", err)
	}

	if decChunk.HealthScore != origChunk.HealthScore {
		t.Errorf("mismatch HealthScore: got %d, want %d", decChunk.HealthScore, origChunk.HealthScore)
	}
	if decChunk.ThreatsBlocked != origChunk.ThreatsBlocked {
		t.Errorf("mismatch ThreatsBlocked: got %d, want %d", decChunk.ThreatsBlocked, origChunk.ThreatsBlocked)
	}
	if decChunk.Message != origChunk.Message {
		t.Errorf("mismatch Message: got %q, want %q", decChunk.Message, origChunk.Message)
	}
	if decChunk.ActiveKeyHash != origChunk.ActiveKeyHash {
		t.Errorf("mismatch ActiveKeyHash: got %q, want %q", decChunk.ActiveKeyHash, origChunk.ActiveKeyHash)
	}
}

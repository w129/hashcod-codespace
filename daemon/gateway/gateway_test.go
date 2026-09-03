package gateway_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"hashcod-codespace/daemon/gateway"
	"hashcod-codespace/daemon/pb"
	"hashcod-codespace/daemon/service"
)

// ----------------------------------------------------------------------------
// 1. Binary Framing Engine Unit Tests
// ----------------------------------------------------------------------------

func TestPackAndUnpackDataFrame(t *testing.T) {
	testPayloads := [][]byte{
		{},
		[]byte("X"),
		[]byte("hello-grpc-web-binary-framing"),
		bytes.Repeat([]byte{0x42}, 1024),
		bytes.Repeat([]byte("LARGE_PAYLOAD_CHUNK_"), 3000), // ~60KB
	}

	for _, payload := range testPayloads {
		packed := gateway.PackDataFrame(payload)

		// Check 5-byte header
		if len(packed) != 5+len(payload) {
			t.Fatalf("expected packed len %d, got %d", 5+len(payload), len(packed))
		}
		if packed[0] != gateway.FrameFlagData {
			t.Fatalf("expected flag 0x00, got 0x%02x", packed[0])
		}

		frames, remainder := gateway.UnpackFrames(packed)
		if len(remainder) != 0 {
			t.Fatalf("expected empty remainder, got %d bytes", len(remainder))
		}
		if len(frames) != 1 {
			t.Fatalf("expected exactly 1 frame, got %d", len(frames))
		}

		frame := frames[0]
		if !frame.IsData {
			t.Errorf("expected frame.IsData == true")
		}
		if frame.IsTrailer {
			t.Errorf("expected frame.IsTrailer == false")
		}
		if frame.Length != uint32(len(payload)) {
			t.Errorf("expected frame.Length == %d, got %d", len(payload), frame.Length)
		}
		if !bytes.Equal(frame.Payload, payload) {
			t.Errorf("payload bytes mismatch")
		}
	}
}

func TestPackAndParseTrailerFrame(t *testing.T) {
	// Status 0: OK
	okTrailer := gateway.PackStatusTrailer(0, "OK")
	if len(okTrailer) < 5 {
		t.Fatalf("trailer frame too short: %d bytes", len(okTrailer))
	}
	if okTrailer[0] != gateway.FrameFlagTrailers {
		t.Fatalf("expected trailer flag 0x80, got 0x%02x", okTrailer[0])
	}

	frames, remainder := gateway.UnpackFrames(okTrailer)
	if len(remainder) != 0 || len(frames) != 1 {
		t.Fatalf("failed to unpack trailer frame: %d frames, %d remainder", len(frames), len(remainder))
	}
	if !frames[0].IsTrailer {
		t.Errorf("expected frame.IsTrailer == true")
	}

	status, msg, _ := gateway.ParseTrailers(frames[0].Payload)
	if status != 0 {
		t.Errorf("expected status 0, got %d", status)
	}
	if msg != "OK" {
		t.Errorf("expected message 'OK', got %q", msg)
	}

	// Status 12: Unimplemented
	unimplTrailer := gateway.PackStatusTrailer(12, "Unimplemented")
	frames12, _ := gateway.UnpackFrames(unimplTrailer)
	status12, msg12, _ := gateway.ParseTrailers(frames12[0].Payload)
	if status12 != 12 || msg12 != "Unimplemented" {
		t.Errorf("expected 12/Unimplemented, got %d/%s", status12, msg12)
	}

	// Status 8: Resource Exhausted (4MB limit exceeded)
	exhaustTrailer := gateway.PackStatusTrailer(8, "frame size exceeds 4MB limit")
	frames8, _ := gateway.UnpackFrames(exhaustTrailer)
	status8, msg8, _ := gateway.ParseTrailers(frames8[0].Payload)
	if status8 != 8 || msg8 != "frame size exceeds 4MB limit" {
		t.Errorf("expected 8/frame size exceeds 4MB limit, got %d/%s", status8, msg8)
	}
}

func TestSequentialMultiFrameUnpacking(t *testing.T) {
	f1 := gateway.PackDataFrame([]byte("stream-chunk-1"))
	f2 := gateway.PackDataFrame([]byte("stream-chunk-2"))
	f3 := gateway.PackDataFrame([]byte("stream-chunk-3"))
	f4 := gateway.PackStatusTrailer(0, "OK")

	combined := append(append(append(f1, f2...), f3...), f4...)
	frames, remainder := gateway.UnpackFrames(combined)

	if len(remainder) != 0 {
		t.Fatalf("expected 0 remainder, got %d bytes", len(remainder))
	}
	if len(frames) != 4 {
		t.Fatalf("expected 4 frames, got %d", len(frames))
	}

	if string(frames[0].Payload) != "stream-chunk-1" || !frames[0].IsData {
		t.Errorf("frame 0 mismatch")
	}
	if string(frames[1].Payload) != "stream-chunk-2" || !frames[1].IsData {
		t.Errorf("frame 1 mismatch")
	}
	if string(frames[2].Payload) != "stream-chunk-3" || !frames[2].IsData {
		t.Errorf("frame 2 mismatch")
	}
	if !frames[3].IsTrailer {
		t.Errorf("frame 3 should be trailer")
	}
}

func TestFragmentedFrameBuffering(t *testing.T) {
	fullFrame := gateway.PackDataFrame([]byte("buffered-stream-payload"))

	// Split across 3 sequential packet deliveries
	p1 := fullFrame[:2]   // partial header (2 bytes)
	p2 := fullFrame[2:5]  // rest of header (3 bytes)
	p3 := fullFrame[5:12] // partial payload
	p4 := fullFrame[12:]  // rest of payload

	// Delivery 1
	f1, rem1 := gateway.UnpackFrames(p1)
	if len(f1) != 0 || len(rem1) != 2 {
		t.Fatalf("expected 0 frames, 2 remainder on p1")
	}

	// Delivery 2
	f2, rem2 := gateway.UnpackFrames(append(rem1, p2...))
	if len(f2) != 0 || len(rem2) != 5 {
		t.Fatalf("expected 0 frames, 5 remainder on p2")
	}

	// Delivery 3
	f3, rem3 := gateway.UnpackFrames(append(rem2, p3...))
	if len(f3) != 0 || len(rem3) != 12 {
		t.Fatalf("expected 0 frames, 12 remainder on p3")
	}

	// Delivery 4 completes the frame
	f4, rem4 := gateway.UnpackFrames(append(rem3, p4...))
	if len(f4) != 1 || len(rem4) != 0 {
		t.Fatalf("expected 1 frame, 0 remainder on p4")
	}
	if string(f4[0].Payload) != "buffered-stream-payload" {
		t.Errorf("payload corrupted during fragmented stream: %s", string(f4[0].Payload))
	}
}

func TestInvalidFrameFlagHandling(t *testing.T) {
	// Frame with unknown flag 0xFF
	badFrame := []byte{0xFF, 0x00, 0x00, 0x00, 0x04, 't', 'e', 's', 't'}
	frames, remainder := gateway.UnpackFrames(badFrame)

	if len(remainder) != 0 || len(frames) != 1 {
		t.Fatalf("expected 1 frame parsed even with unknown flag")
	}
	if frames[0].IsData {
		t.Errorf("unknown flag should not be IsData")
	}
	if frames[0].IsTrailer {
		t.Errorf("unknown flag should not be IsTrailer")
	}
	if string(frames[0].Payload) != "test" {
		t.Errorf("payload preserved despite unknown flag")
	}
}

// ----------------------------------------------------------------------------
// 2. Gateway Server HTTP & CORS Middleware Tests
// ----------------------------------------------------------------------------

func setupTestGateway(t *testing.T) (*gateway.GrpcWebGateway, *service.DilithiumService, *service.SecurityTelemetryService, func()) {
	tmpDir, err := os.MkdirTemp("", "gw_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	cleanup := func() { os.RemoveAll(tmpDir) }

	epochFile := filepath.Join(tmpDir, "active_dilithium5_epoch.json")
	sm := service.NewDilithiumStateManager(epochFile)
	dilithiumSvc := service.NewDilithiumService(sm)
	telemetrySvc := service.NewSecurityTelemetryService(sm)

	gw := gateway.NewGrpcWebGateway(50052, dilithiumSvc, telemetrySvc)
	return gw, dilithiumSvc, telemetrySvc, cleanup
}

func TestCorsPreflightOptions(t *testing.T) {
	gw, _, _, cleanup := setupTestGateway(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodOptions, "/hashcod.pqc.v1.DilithiumService/VerifySignature", nil)
	req.Header.Set("Origin", "http://localhost:8000")
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "Content-Type, X-Grpc-Web")

	w := httptest.NewRecorder()
	gw.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusNoContent {
		t.Errorf("expected preflight 204 No Content, got %d", resp.StatusCode)
	}

	origin := resp.Header.Get("Access-Control-Allow-Origin")
	if origin != "*" {
		t.Errorf("expected Access-Control-Allow-Origin: *, got %q", origin)
	}

	methods := resp.Header.Get("Access-Control-Allow-Methods")
	if !strings.Contains(methods, "POST") || !strings.Contains(methods, "OPTIONS") {
		t.Errorf("expected POST, GET, OPTIONS in allow-methods, got %q", methods)
	}

	allowHeaders := strings.ToLower(resp.Header.Get("Access-Control-Allow-Headers"))
	if !strings.Contains(allowHeaders, "content-type") || !strings.Contains(allowHeaders, "x-grpc-web") {
		t.Errorf("missing essential headers in allow-headers: %q", allowHeaders)
	}

	exposeHeaders := strings.ToLower(resp.Header.Get("Access-Control-Expose-Headers"))
	if !strings.Contains(exposeHeaders, "grpc-status") || !strings.Contains(exposeHeaders, "grpc-message") {
		t.Errorf("missing grpc-status in expose-headers: %q", exposeHeaders)
	}
}

func TestCanaryHealthEndpoint(t *testing.T) {
	gw, _, _, cleanup := setupTestGateway(t)
	defer cleanup()

	paths := []string{"/health", "/healthz", "/api/health", "/canary"}
	for _, p := range paths {
		req := httptest.NewRequest(http.MethodGet, p, nil)
		w := httptest.NewRecorder()
		gw.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusOK {
			t.Errorf("path %s: expected 200 OK, got %d", p, resp.StatusCode)
		}

		ct := resp.Header.Get("Content-Type")
		if !strings.Contains(ct, "application/json") {
			t.Errorf("path %s: expected application/json, got %s", p, ct)
		}

		if resp.Header.Get("Access-Control-Allow-Origin") != "*" {
			t.Errorf("path %s: missing CORS origin header", p)
		}

		var health gateway.CanaryHealthResponse
		if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
			t.Fatalf("path %s: failed to decode health JSON: %v", p, err)
		}

		if health.Status != "HEALTHY" {
			t.Errorf("expected status HEALTHY, got %q", health.Status)
		}
		if health.Gateway != "grpc-web" {
			t.Errorf("expected gateway 'grpc-web', got %q", health.Gateway)
		}
		if health.Port != 50052 {
			t.Errorf("expected port 50052, got %d", health.Port)
		}
		if health.Timestamp <= 0 {
			t.Errorf("expected positive timestamp, got %d", health.Timestamp)
		}
	}
}

func TestDisallowedHttpMethodsOnRpc(t *testing.T) {
	gw, _, _, cleanup := setupTestGateway(t)
	defer cleanup()

	disallowedMethods := []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch}
	for _, m := range disallowedMethods {
		req := httptest.NewRequest(m, "/hashcod.pqc.v1.DilithiumService/VerifySignature", nil)
		w := httptest.NewRecorder()
		gw.ServeHTTP(w, req)

		resp := w.Result()
		if resp.StatusCode != http.StatusMethodNotAllowed {
			t.Errorf("method %s: expected 405 Method Not Allowed, got %d", m, resp.StatusCode)
		}
	}
}

func TestUnimplementedRpcPath(t *testing.T) {
	gw, _, _, cleanup := setupTestGateway(t)
	defer cleanup()

	req := httptest.NewRequest(http.MethodPost, "/hashcod.pqc.v1.DilithiumService/NonExistentRpc", bytes.NewReader(gateway.PackDataFrame([]byte{})))
	req.Header.Set("Content-Type", gateway.ContentTypeGrpcWebProto)
	req.Header.Set("X-Grpc-Web", "1")

	w := httptest.NewRecorder()
	gw.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("expected 404 for unknown RPC, got %d", resp.StatusCode)
	}

	frames, _ := gateway.UnpackFrames(w.Body.Bytes())
	if len(frames) == 0 {
		t.Fatalf("expected trailer frame in unimplemented response")
	}

	trailerFrame := frames[len(frames)-1]
	status, msg, _ := gateway.ParseTrailers(trailerFrame.Payload)
	if status != 12 {
		t.Errorf("expected grpc-status 12 (UNIMPLEMENTED), got %d", status)
	}
	if !strings.Contains(msg, "Unimplemented") {
		t.Errorf("expected Unimplemented message, got %q", msg)
	}
}

// ----------------------------------------------------------------------------
// 3. End-to-End RPC Invariant & Streaming Tests
// ----------------------------------------------------------------------------

func TestVerifySignatureRpcEndToEnd(t *testing.T) {
	gw, dilSvc, _, cleanup := setupTestGateway(t)
	defer cleanup()

	ctx := context.Background()
	keyA := "d5_sig_key_gateway_test_active_key_11112222333344445555"
	keyB := "d5_sig_key_gateway_test_active_key_66667777888899990000"

	// 1. Register Key A
	_, err := dilSvc.RegisterActiveKey(ctx, &pb.RegisterKeyRequest{
		ActiveKey: keyA,
		Epoch:     1725331200.0,
	})
	if err != nil {
		t.Fatalf("failed to register keyA: %v", err)
	}

	// 2. Query VerifySignature via gRPC-Web gateway
	verifyReq := &pb.VerifyRequest{
		KeyOrSignature: keyA,
	}
	reqBytes, _ := verifyReq.Marshal()
	framedReq := gateway.PackDataFrame(reqBytes)

	httpReq := httptest.NewRequest(http.MethodPost, "/hashcod.pqc.v1.DilithiumService/VerifySignature", bytes.NewReader(framedReq))
	httpReq.Header.Set("Content-Type", gateway.ContentTypeGrpcWebProto)
	httpReq.Header.Set("X-Grpc-Web", "1")

	w := httptest.NewRecorder()
	gw.ServeHTTP(w, httpReq)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", resp.StatusCode)
	}
	if resp.Header.Get("X-Grpc-Web") != "1" {
		t.Errorf("expected X-Grpc-Web: 1 header")
	}

	frames, _ := gateway.UnpackFrames(w.Body.Bytes())
	if len(frames) < 2 {
		t.Fatalf("expected at least data frame + trailer frame, got %d frames", len(frames))
	}

	verResp := &pb.VerifyResponse{}
	if err := verResp.Unmarshal(frames[0].Payload); err != nil {
		t.Fatalf("failed to unmarshal VerifyResponse: %v", err)
	}

	if !verResp.Valid {
		t.Errorf("expected Key A to be valid, got false: %s", verResp.ErrorMessage)
	}

	// 3. Register Key B -> Invariant asserts Key A is instantly revoked
	_, _ = dilSvc.RegisterActiveKey(ctx, &pb.RegisterKeyRequest{
		ActiveKey: keyB,
		Epoch:     1725331201.0,
	})

	// Query Key A again via gateway
	httpReqA2 := httptest.NewRequest(http.MethodPost, "/hashcod.pqc.v1.DilithiumService/VerifySignature", bytes.NewReader(framedReq))
	httpReqA2.Header.Set("Content-Type", gateway.ContentTypeGrpcWebProto)
	httpReqA2.Header.Set("X-Grpc-Web", "1")

	wA2 := httptest.NewRecorder()
	gw.ServeHTTP(wA2, httpReqA2)

	framesA2, _ := gateway.UnpackFrames(wA2.Body.Bytes())
	verRespA2 := &pb.VerifyResponse{}
	_ = verRespA2.Unmarshal(framesA2[0].Payload)

	if verRespA2.Valid {
		t.Errorf("INVARIANT VIOLATION: Key A accepted through gateway after rotation to Key B!")
	}
	expectedMsg := "La clave Dilithium-5 proporcionada ha sido revocada, ha expirado o es anterior. Solo se permite validar y registrar credenciales con la última clave generada ahora en la plataforma."
	if verRespA2.ErrorMessage != expectedMsg {
		t.Errorf("expected verbatim error message, got: %q", verRespA2.ErrorMessage)
	}
}

func TestTelemetryStreamingRpcEndToEnd(t *testing.T) {
	gw, _, _, cleanup := setupTestGateway(t)
	defer cleanup()

	// Empty subscription frame
	framedReq := gateway.PackDataFrame([]byte{})

	// Test both canonical and survey alias paths
	pathsToTest := []string{
		"/hashcod.pqc.v1.SecurityTelemetryService/StreamSecurityTelemetry",
		"/hashcod.security.SecurityTelemetryService/StreamSecurityTelemetry",
	}

	for _, p := range pathsToTest {
		httpReq := httptest.NewRequest(http.MethodPost, p, bytes.NewReader(framedReq))
		httpReq.Header.Set("Content-Type", gateway.ContentTypeGrpcWebProto)
		httpReq.Header.Set("X-Grpc-Web", "1")

		w := httptest.NewRecorder()
		gw.ServeHTTP(w, httpReq)

		resp := w.Result()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("path %s: expected 200 OK, got %d", p, resp.StatusCode)
		}
		if resp.Header.Get("Content-Type") != gateway.ContentTypeGrpcWebProto {
			t.Errorf("path %s: expected application/grpc-web+proto, got %s", p, resp.Header.Get("Content-Type"))
		}
		if resp.Header.Get("X-Grpc-Web") != "1" {
			t.Errorf("path %s: missing X-Grpc-Web: 1", p)
		}

		frames, remainder := gateway.UnpackFrames(w.Body.Bytes())
		if len(remainder) != 0 {
			t.Errorf("path %s: unexpected remainder: %d bytes", p, len(remainder))
		}
		// Expecting at least 3 telemetry data frames + 1 trailer frame
		if len(frames) < 4 {
			t.Fatalf("path %s: expected >= 4 frames (3 data + 1 trailer), got %d", p, len(frames))
		}

		// Verify data frames
		for i := 0; i < 3; i++ {
			if !frames[i].IsData {
				t.Errorf("path %s: frame %d must be data frame", p, i)
			}
			chunk := &pb.SecurityTelemetryChunk{}
			if err := chunk.Unmarshal(frames[i].Payload); err != nil {
				t.Fatalf("path %s: failed to unmarshal chunk %d: %v", p, i, err)
			}
			if chunk.HealthScore != 100 {
				t.Errorf("path %s: expected health score 100, got %d", p, chunk.HealthScore)
			}
			if chunk.QuantumStatus != "ACTIVE" {
				t.Errorf("path %s: expected quantum status ACTIVE, got %s", p, chunk.QuantumStatus)
			}
		}

		// Verify trailer frame
		trailerFrame := frames[len(frames)-1]
		if !trailerFrame.IsTrailer {
			t.Errorf("path %s: last frame must be trailer frame", p)
		}
		status, msg, _ := gateway.ParseTrailers(trailerFrame.Payload)
		if status != 0 || msg != "OK" {
			t.Errorf("path %s: expected status 0/OK, got %d/%s", p, status, msg)
		}
	}
}

func TestStreamEncoderDirect(t *testing.T) {
	w := httptest.NewRecorder()
	encoder := gateway.NewStreamEncoder(w)

	// Send 2 chunks
	if err := encoder.SendChunk([]byte("chunk-alpha")); err != nil {
		t.Fatalf("unexpected SendChunk error: %v", err)
	}
	if err := encoder.SendChunk([]byte("chunk-beta")); err != nil {
		t.Fatalf("unexpected SendChunk error: %v", err)
	}

	// Close with status
	if err := encoder.CloseWithStatus(0, "OK"); err != nil {
		t.Fatalf("unexpected CloseWithStatus error: %v", err)
	}

	// Attempting to send after close must return error
	if err := encoder.SendChunk([]byte("late-chunk")); err == nil {
		t.Errorf("expected error sending on closed encoder")
	}

	// Unpack and assert
	frames, remainder := gateway.UnpackFrames(w.Body.Bytes())
	if len(remainder) != 0 || len(frames) != 3 {
		t.Fatalf("expected 3 frames, 0 remainder, got %d frames", len(frames))
	}
	if string(frames[0].Payload) != "chunk-alpha" {
		t.Errorf("chunk 0 mismatch")
	}
	if string(frames[1].Payload) != "chunk-beta" {
		t.Errorf("chunk 1 mismatch")
	}
	if !frames[2].IsTrailer {
		t.Errorf("frame 2 must be trailer")
	}
}

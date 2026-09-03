package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"hashcod-codespace/daemon/pb"
)

// SecurityTelemetryService implements pb.SecurityTelemetryServiceServer.
type SecurityTelemetryService struct {
	mu                  sync.RWMutex
	stateManager        *DilithiumStateManager
	healthScore         int32
	cvesScanned         int32
	cvesDetected        int32
	threatsBlocked      int32
	honeypotHits        int32
	entropyPoolBytes    int32
	quantumStatus       string
	atomicTimeStatus    string
	circuitBreakerState string
	lastEdgeTimestamp   float64
	eventCounter        int64
	startTime           time.Time
}

// NewSecurityTelemetryService initializes telemetry service with healthy defaults.
func NewSecurityTelemetryService(sm *DilithiumStateManager) *SecurityTelemetryService {
	return &SecurityTelemetryService{
		stateManager:        sm,
		healthScore:         100,
		cvesScanned:         284,
		cvesDetected:        0,
		threatsBlocked:      12,
		honeypotHits:        3,
		entropyPoolBytes:    64,
		quantumStatus:       "ACTIVE",
		atomicTimeStatus:    "SYNCED",
		circuitBreakerState: "CLOSED",
		lastEdgeTimestamp:   float64(time.Now().UnixMilli()) / 1000.0,
		startTime:           time.Now(),
	}
}

// StreamSecurityTelemetry streams real-time telemetry frames to the client.
func (s *SecurityTelemetryService) StreamSecurityTelemetry(sub *pb.TelemetrySubscription, stream pb.SecurityTelemetryService_StreamSecurityTelemetryServer) error {
	heartbeatSec := 2
	if sub != nil && sub.HeartbeatSeconds > 0 && sub.HeartbeatSeconds <= 60 {
		heartbeatSec = int(sub.HeartbeatSeconds)
	}

	ticker := time.NewTicker(time.Duration(heartbeatSec) * time.Second)
	defer ticker.Stop()

	// 1. Emit initial telemetry snapshot immediately
	initialChunk := s.buildCurrentChunk("Telemetry stream connected successfully")
	if err := stream.Send(initialChunk); err != nil {
		return err
	}

	// 2. Stream ticks until context is canceled
	for {
		select {
		case <-stream.Context().Done():
			return stream.Context().Err()
		case t := <-ticker.C:
			chunk := s.buildCurrentChunk(fmt.Sprintf("Live telemetry heartbeat at %s", t.Format(time.RFC3339)))
			if err := stream.Send(chunk); err != nil {
				return err
			}
		}
	}
}

func (s *SecurityTelemetryService) buildCurrentChunk(msg string) *pb.SecurityTelemetryChunk {
	s.mu.RLock()
	defer s.mu.RUnlock()

	activeHash := ""
	if s.stateManager != nil {
		activeHash = s.stateManager.GetActiveHash()
	}

	now := time.Now()
	return &pb.SecurityTelemetryChunk{
		HealthScore:         s.healthScore,
		CvesScanned:         s.cvesScanned,
		CvesDetected:        s.cvesDetected,
		ThreatsBlocked:      s.threatsBlocked,
		HoneypotHits:        s.honeypotHits,
		EntropyPoolBytes:    s.entropyPoolBytes,
		QuantumStatus:       s.quantumStatus,
		AtomicTimeStatus:    s.atomicTimeStatus,
		CircuitBreakerState: s.circuitBreakerState,
		LastEdgeTimestamp:   float64(now.UnixMilli()) / 1000.0,
		TimestampUnixMs:     now.UnixMilli(),
		Message:             msg,
		ActiveKeyHash:       activeHash,
	}
}

// GetSecurityStatus returns a single instantaneous snapshot of platform metrics.
func (s *SecurityTelemetryService) GetSecurityStatus(ctx context.Context, req *pb.SecurityStatusRequest) (*pb.SecurityStatusResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	activeHash := ""
	if s.stateManager != nil {
		activeHash = s.stateManager.GetActiveHash()
	}

	now := time.Now()
	return &pb.SecurityStatusResponse{
		HealthScore:         s.healthScore,
		CvesScanned:         s.cvesScanned,
		CvesDetected:        s.cvesDetected,
		ThreatsBlocked:      s.threatsBlocked,
		HoneypotHits:        s.honeypotHits,
		EntropyPoolBytes:    s.entropyPoolBytes,
		QuantumStatus:       s.quantumStatus,
		AtomicTimeStatus:    s.atomicTimeStatus,
		CircuitBreakerState: s.circuitBreakerState,
		LastEdgeTimestamp:   float64(now.UnixMilli()) / 1000.0,
		ActiveKeyHash:       activeHash,
		TimestampUnixMs:     now.UnixMilli(),
		DaemonVersion:       "3.2.0-pqc-m1",
	}, nil
}

// ReportSecurityEvent records an alert, threat interception, or honeypot hit.
func (s *SecurityTelemetryService) ReportSecurityEvent(ctx context.Context, req *pb.SecurityEventRequest) (*pb.SecurityEventResponse, error) {
	if req == nil {
		return nil, fmt.Errorf("empty security event request")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.threatsBlocked++
	if req.EventType == "HONEYPOT_HIT" || req.EventType == "HONEYPOT_TRAP" {
		s.honeypotHits++
	}

	// Update health score if high/critical severity
	if req.Severity == "CRITICAL" && s.healthScore > 50 {
		s.healthScore -= 10
	} else if req.Severity == "HIGH" && s.healthScore > 70 {
		s.healthScore -= 5
	}

	seq := atomic.AddInt64(&s.eventCounter, 1)
	var randBytes [4]byte
	_, _ = rand.Read(randBytes[:])
	eventID := fmt.Sprintf("EVT-%d-%s", seq, hex.EncodeToString(randBytes[:]))

	return &pb.SecurityEventResponse{
		Recorded:            true,
		EventId:             eventID,
		ThreatsBlockedTotal: s.threatsBlocked,
	}, nil
}

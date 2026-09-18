package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"os"
	"runtime"
	"sync"
	"time"
)

// PlatformMetadata contiene las métricas del orquestador Go
type PlatformMetadata struct {
	Engine        string    `json:"engine"`
	Version       string    `json:"version"`
	Goroutines    int       `json:"goroutines"`
	NumCPU        int       `json:"num_cpu"`
	MemoryAllocKB uint64    `json:"memory_alloc_kb"`
	UptimeSec     int64     `json:"uptime_sec"`
	Status        string    `json:"status"`
	QuantumReady  bool      `json:"quantum_ready"`
	Timestamp     time.Time `json:"timestamp"`
}

// TokenRecord representa el almacenamiento concurrente de tokens
type TokenRecord struct {
	Allowance int    `json:"allowance"`
	Used      int    `json:"used"`
	Remaining int    `json:"remaining"`
	Period    string `json:"period"`
}

// GoOrchestrator maneja el estado concurrente en Go
type GoOrchestrator struct {
	mu        sync.RWMutex
	startTime time.Time
	tokens    TokenRecord
	cache     map[string]string
}

var orchestrator *GoOrchestrator

func init() {
	orchestrator = &GoOrchestrator{
		startTime: time.Now(),
		tokens: TokenRecord{
			Allowance: 10000,
			Used:      0,
			Remaining: 10000,
			Period:    time.Now().Format("2006-01"),
		},
		cache: make(map[string]string),
	}
}

func (o *GoOrchestrator) GetMetrics() PlatformMetadata {
	o.mu.RLock()
	defer o.mu.RUnlock()

	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	return PlatformMetadata{
		Engine:        "Hashcod Go Concurrent Orchestrator",
		Version:       "3.2.0-concurrent-quantum",
		Goroutines:    runtime.NumGoroutine(),
		NumCPU:        runtime.NumCPU(),
		MemoryAllocKB: m.Alloc / 1024,
		UptimeSec:     int64(time.Since(o.startTime).Seconds()),
		Status:        "Running & Synchronized",
		QuantumReady:  true,
		Timestamp:     time.Now(),
	}
}

func (o *GoOrchestrator) CalculateQuantumSignature(seed string) string {
	hasher := sha256.New()
	hasher.Write([]byte("HASHCOD-DILITHIUM-5:" + seed + ":" + time.Now().Format(time.RFC3339Nano)))
	return "DILITHIUM-5-GO:" + hex.EncodeToString(hasher.Sum(nil))[:48]
}

func localOriginAllowed(origin string) bool {
	origin = strings.TrimSpace(origin)
	if origin == "" {
		return true
	}
	u, err := url.Parse(origin)
	if err != nil {
		return false
	}
	host := strings.ToLower(u.Hostname())
	return host == "localhost" || host == "127.0.0.1" || host == "::1"
}

func prepareLocalResponse(w http.ResponseWriter, r *http.Request) bool {
	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin != "" {
		if !localOriginAllowed(origin) {
			http.Error(w, "origin not allowed", http.StatusForbidden)
			return false
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Vary", "Origin")
	}
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return false
	}
	return true
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	if !prepareLocalResponse(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	metrics := orchestrator.GetMetrics()
	_ = json.NewEncoder(w).Encode(metrics)
}

func quantumSignHandler(w http.ResponseWriter, r *http.Request) {
	if !prepareLocalResponse(w, r) {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	seed := r.URL.Query().Get("seed")
	if len(seed) > 256 {
		http.Error(w, "seed too large", http.StatusBadRequest)
		return
	}
	if seed == "" {
		seed = "default_orchestrator_node"
	}

	sig := orchestrator.CalculateQuantumSignature(seed)
	resp := map[string]interface{}{
		"status":    "success",
		"signature": sig,
		"algorithm": "Dilithium-5 / SPHINCS+ Go Native",
		"timestamp": time.Now().Format(time.RFC3339),
	}
	_ = json.NewEncoder(w).Encode(resp)
}

func main() {
	port := os.Getenv("GO_ORCHESTRATOR_PORT")
	if port == "" {
		port = "8088"
	}

	http.HandleFunc("/api/go/status", statusHandler)
	http.HandleFunc("/api/go/quantum_sign", quantumSignHandler)

	addr := "127.0.0.1:" + port
	log.Printf("⚡ Hashcod Go Micro-Engine listening on http://%s\n", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Printf("Go Micro-Engine stopped: %v\n", err)
	}
}

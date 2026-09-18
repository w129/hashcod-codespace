package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"hashcod-codespace/daemon/gateway"
	"hashcod-codespace/daemon/pb"
	"hashcod-codespace/daemon/service"
)

func main() {
	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50051"
	}

	gatewayPort := os.Getenv("GRPC_WEB_PORT")
	if gatewayPort == "" {
		gatewayPort = "50052"
	}

	gwPortInt, err := strconv.Atoi(gatewayPort)
	if err != nil || gwPortInt <= 0 {
		gwPortInt = 50052
	}

	storagePath := os.Getenv("DILITHIUM_EPOCH_FILE")

	log.Println("================================================================================")
	log.Println("⚡ Hashcod Codespace Post-Quantum Cryptography & Telemetry Daemon (Go)")
	log.Println("🔒 Algorithm: NIST FIPS 204 CRYSTALS-Dilithium Level 5 (ML-DSA-87)")
	log.Println("================================================================================")

	// 1. Initialize State Manager & Services
	stateManager := service.NewDilithiumStateManager(storagePath)
	dilithiumSvc := service.NewDilithiumService(stateManager)
	telemetrySvc := service.NewSecurityTelemetryService(stateManager)

	// 2. Initialize Native gRPC Server Engine (Port 50051)
	nativeGrpcServer := pb.NewGrpcServer()
	nativeGrpcServer.RegisterDilithiumServiceServer(dilithiumSvc)
	nativeGrpcServer.RegisterSecurityTelemetryServiceServer(telemetrySvc)

	// 3. Initialize gRPC-Web Gateway Layer (Port 50052) with CORS & Framing
	grpcWebGateway := gateway.NewGrpcWebGateway(gwPortInt, dilithiumSvc, telemetrySvc)

	// 4. Start Native gRPC Server on port 50051
	nativeServer := &http.Server{
		Addr:           "127.0.0.1:" + grpcPort,
		Handler:        nativeGrpcServer,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// 5. Start gRPC-Web Gateway Server on port 50052
	gatewayServer := &http.Server{
		Addr:           "127.0.0.1:" + gatewayPort,
		Handler:        grpcWebGateway,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	go func() {
		log.Printf("📡 Native gRPC Server listening on http://127.0.0.1:%s\n", grpcPort)
		if err := nativeServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[FATAL] Native gRPC listener failed: %v", err)
		}
	}()

	go func() {
		log.Printf("🌐 gRPC-Web Browser Gateway listening on http://127.0.0.1:%s\n", gatewayPort)
		if err := gatewayServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("[WARN] Gateway listener stopped or failed: %v\n", err)
		}
	}()

	status := stateManager.GetStatus()
	log.Printf("✓ Active Dilithium-5 Epoch: %.6f | Has Active Key: %v | Key Hash: %s\n",
		status.Epoch, status.HasActiveKey, status.ActiveKeyHash)

	// 5. Graceful shutdown handler
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down Hashcod Codespace gRPC Daemon gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_ = nativeServer.Shutdown(ctx)
	_ = gatewayServer.Shutdown(ctx)
	fmt.Println("✓ gRPC Daemon stopped cleanly.")
}

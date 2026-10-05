package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
)

type request struct {
	Secret string `json:"secret"`
	Code   string `json:"code"`
}

type response struct {
	OK    bool   `json:"ok"`
	Valid bool   `json:"valid"`
	Error string `json:"error,omitempty"`
}

func main() {
	if len(os.Args) != 2 || os.Args[1] != "validate" {
		write(response{OK: false, Valid: false, Error: "unsupported action"})
		os.Exit(2)
	}

	var in request
	if err := json.NewDecoder(os.Stdin).Decode(&in); err != nil {
		write(response{OK: false, Valid: false, Error: "invalid input"})
		os.Exit(2)
	}

	secret := strings.ToUpper(strings.TrimSpace(in.Secret))
	secret = strings.ReplaceAll(secret, " ", "")
	secret = strings.ReplaceAll(secret, "-", "")
	secret = strings.TrimRight(secret, "=")
	code := strings.TrimSpace(in.Code)

	valid, err := totp.ValidateCustom(code, secret, time.Now().UTC(), totp.ValidateOpts{
		Period:    30,
		Skew:      1,
		Digits:    otp.DigitsSix,
		Algorithm: otp.AlgorithmSHA1,
	})
	if err != nil {
		write(response{OK: false, Valid: false, Error: "validation failed"})
		os.Exit(1)
	}

	write(response{OK: true, Valid: valid})
}

func write(v response) {
	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(true)
	if err := enc.Encode(v); err != nil {
		fmt.Fprintln(os.Stdout, `{"ok":false,"valid":false,"error":"encode failed"}`)
	}
}

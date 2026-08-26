#ifndef HASHCOD_CORE_H
#define HASHCOD_CORE_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <stdbool.h>
#include <time.h>

#define CORE_VERSION "2.4.0-quantum-native"
#define MAX_BUFFER_SIZE 65536
#define MAX_TOKENS_MONTHLY 10000

/* Estructura de estado criptográfico y tokens en C */
typedef struct {
    uint32_t monthly_allowance;
    uint32_t tokens_used;
    uint32_t tokens_remaining;
    char current_period[16];
    char last_action[64];
    uint64_t last_timestamp_ms;
    char sphincs_digest[128];
    bool is_dilithium_authorized;
} PlatformState;

/* Estructura de resultado de ejecución en C */
typedef struct {
    int exit_code;
    char command[256];
    char stdout_buffer[MAX_BUFFER_SIZE];
    char stderr_buffer[4096];
    double execution_time_ms;
} CommandResult;

/* Prototipos */
const char* core_get_version(void);
void core_init_state(PlatformState* state);
bool core_consume_tokens(PlatformState* state, const char* action, uint32_t amount);
void core_generate_sphincs_digest(const char* identifier, char* out_digest, size_t out_len);
CommandResult core_execute_builtin(const char* raw_cmd, const char* workspace_dir);

#endif /* HASHCOD_CORE_H */

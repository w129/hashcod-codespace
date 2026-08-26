use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptMetadata {
    pub model: String,
    pub prompt_template: String,
    pub variables: Vec<String>,
    pub kv_cache_hit: bool,
    pub latency_ms: f64,
    pub tokens_generated: usize,
    pub throughput_tok_s: f64,
}

pub struct MarkdownFormatter;

impl MarkdownFormatter {
    pub fn compile_prompt_markdown(meta: &PromptMetadata, content: &str) -> String {
        let hit_badge = if meta.kv_cache_hit {
            "🟢 **KV-Cache HIT** (Prefill Reusado en VRAM)"
        } else {
            "🟡 **KV-Cache MISS** (Nuevo Bloque Asignado)"
        };

        format!(
            "# Dynamo Inference Output: {}\n\n            > ⚡ **Motor**: NVIDIA Dynamo (Rust Core) | **Tokens**: {} | **Velocidad**: {:.1} tok/s | **Latencia**: {:.2} ms\n            > 🧩 **Estado KV**: {}\n\n            ---\n\n            ### 📝 Especificación del Prompt\n            ```prompt-spec\n            Model: {}\n            Template: {}\n            Variables: {:?}\n            ```\n\n            ### 🚀 Respuesta Procesada para Editor de Prompts\n\n            {}\n\n            ---\n            *Generado automáticamente por el subsistema Markdown de NVIDIA Dynamo para integración con Editores de Prompts.*",
            meta.model,
            meta.tokens_generated,
            meta.throughput_tok_s,
            meta.latency_ms,
            hit_badge,
            meta.model,
            meta.prompt_template,
            meta.variables,
            content
        )
    }
}

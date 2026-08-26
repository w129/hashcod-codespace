use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClusterStatus {
    pub stack: String,
    pub version: String,
    pub active_gpus: u32,
    pub total_vram_gb: u32,
    pub vram_used_gb: f64,
    pub kv_cache_hit_rate: f64,
    pub prefill_nodes_online: u32,
    pub decode_nodes_online: u32,
    pub active_engines: Vec<String>,
}

impl ClusterStatus {
    pub fn current() -> Self {
        Self {
            stack: "NVIDIA Dynamo Datacenter Inference Stack (Rust Engine)".to_string(),
            version: "0.8.0-native-rust".to_string(),
            active_gpus: 8,
            total_vram_gb: 640,
            vram_used_gb: 348.6,
            kv_cache_hit_rate: 94.8,
            prefill_nodes_online: 4,
            decode_nodes_online: 12,
            active_engines: vec![
                "vLLM Engine (Online)".to_string(),
                "TensorRT-LLM (Online)".to_string(),
                "SGLang (Online)".to_string(),
            ],
        }
    }
}

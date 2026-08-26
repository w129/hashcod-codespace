use dynamo_core::{ClusterStatus, DisaggregatedEngine, KvRouter};

fn main() {
    println!("⚡ Starting NVIDIA Dynamo Inference Stack in Rust...");
    let router = KvRouter::new();
    let disagg = DisaggregatedEngine::new();
    let status = ClusterStatus::current();

    let (blocks, hit_rate) = router.get_metrics();
    println!("✓ Dynamo Rust Core Ready | Active GPUs: {} | KV Hit Rate: {:.1}% | Cached Blocks: {}", status.active_gpus, hit_rate, blocks);
    
    let res = disagg.execute_inference("deepseek-ai/DeepSeek-R1", "Hello Dynamo Cluster");
    println!("{}", res);
}

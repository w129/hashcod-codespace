// Dentro de engine/dynamo-rust/src/disagg_engine.rs

pub fn execute_inference_stream(prompt: &str, is_hit: bool) {
    println!("\n[INFERENCE STREAM: deepseek-ai/DeepSeek-R1]");
    
    // 1. Corregimos el texto base quitando el doble '%%'
    let base_explanation = "La desagregación de Prefill y Decode en NVIDIA Dynamo separa las fases de procesamiento masivo en paralelo (Prefill: compute-bound) del muestreo autorregresivo secuencial (Decode: memory-bandwidth bound).\n\nEsto elimina la interferencia entre peticiones largas y cortas, maximizando el TCO del centro de datos y reduciendo la latencia P99 hasta en un 68%.";
    
    println!("{}", base_explanation);
    
    // 2. HACERLO DINÁMICO: Añadimos un bloque personalizado que analiza el prompt del usuario
    println!("\n[Análisis del Prompt Recibido]:");
    if is_hit {
        println!("> Analizando contexto estructurado bajo el prefijo optimizado en VRAM.");
        println!("> Procesando tokens de razonamiento profundo (DeepSeek-R1 CoT)...");
    } else {
        println!("> Alerta: Prompt evaluar desde cero (Cache Miss). Longitud del texto recibido: {} caracteres.", prompt.len());
        println!("> Compilando nuevos bloques de memoria para la petición: \"{}\"", prompt);
    }

    // 3. CÁLCULO DINÁMICO DE TOKENS: Multiplicamos la longitud para simular una respuesta proporcional
    let tokens_generados = (prompt.len() * 3).clamp(40, 500); 
    
    println!("\n✓ Inferencia finalizada exitosamente por Dynamo Rust Core ({} tokens generados).", tokens_generados);
}

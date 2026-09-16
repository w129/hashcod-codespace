plugins {
    kotlin("jvm") version "2.4.20"
    application
}

group = "app.hashcod.codespace"
version = "1.0.0"

kotlin {
    jvmToolchain(21)
}

dependencies {
    implementation("cn.enaium.webview:webview-kmp-jvm:1.0.1")
    testImplementation(kotlin("test"))
}

application {
    mainClass.set("app.hashcod.codespace.MainKt")
}

tasks.test {
    useJUnitPlatform()
}

/**
 * ============================================================================
 * HASHCOD CODESPACE · CLIENT-SIDE SECURITY SCANNER WATCHDOG WORKER
 * workers/security-scanner.worker.js
 * ============================================================================
 * 
 * Non-blocking Web Worker for real-time static code analysis, vulnerability
 * detection, hardcoded secret hunting, reverse shell heuristics, and AST/regex
 * auditing across workspace files, buffers, and package manifests.
 */

'use strict';

// ----------------------------------------------------------------------------
// KNOWN CVE DATABASE (Curated offline database for OSV.dev & NIST NVD patterns)
// ----------------------------------------------------------------------------
const KNOWN_CVE_CATALOG = {
    npm: {
        'lodash': {
            cve: 'CVE-2019-10744',
            severity: 'CRITICAL',
            cvss: 9.8,
            title: 'Prototype Pollution in lodash',
            affected: '<4.17.19',
            vulnerableVersions: ['4.17.15', '4.17.14', '4.17.13', '4.17.12', '4.17.11', '4.17.10', '4.17.5', '4.17.4', '4.0.0'],
            fixedIn: '4.17.19',
            remediation: 'Upgrade lodash to >= 4.17.19 via npm install lodash@latest'
        },
        'axios': {
            cve: 'CVE-2021-3749',
            severity: 'HIGH',
            cvss: 7.5,
            title: 'Regular Expression Denial of Service in axios',
            affected: '<0.21.2',
            vulnerableVersions: ['0.21.1', '0.21.0', '0.20.0', '0.19.2', '0.19.0'],
            fixedIn: '0.21.2',
            remediation: 'Upgrade axios to >= 0.21.2 via npm install axios@latest'
        },
        'express': {
            cve: 'CVE-2024-29041',
            severity: 'MEDIUM',
            cvss: 6.1,
            title: 'Open Redirect in express res.location / res.redirect',
            affected: '<4.19.2',
            vulnerableVersions: ['4.18.2', '4.18.1', '4.18.0', '4.17.3', '4.17.1'],
            fixedIn: '4.19.2',
            remediation: 'Upgrade express to >= 4.19.2 via npm install express@latest'
        },
        'jsonwebtoken': {
            cve: 'CVE-2022-23529',
            severity: 'CRITICAL',
            cvss: 9.8,
            title: 'Insecure Key Retrieval in jsonwebtoken verify',
            affected: '<=8.5.1',
            vulnerableVersions: ['8.5.1', '8.5.0', '8.4.0', '8.3.0'],
            fixedIn: '9.0.0',
            remediation: 'Upgrade jsonwebtoken to >= 9.0.0 via npm install jsonwebtoken@latest'
        },
        'tar': {
            cve: 'CVE-2021-37712',
            severity: 'HIGH',
            cvss: 7.5,
            title: 'Arbitrary File Creation via symlink path traversal',
            affected: '<6.1.9',
            vulnerableVersions: ['6.1.8', '6.1.0', '6.0.0', '5.0.0'],
            fixedIn: '6.1.9',
            remediation: 'Upgrade tar to >= 6.1.9 via npm install tar@latest'
        }
    },
    pypi: {
        'flask': {
            cve: 'CVE-2018-1000656',
            severity: 'HIGH',
            cvss: 7.5,
            title: 'Denial of Service in Flask JSON decoding',
            affected: '<1.0',
            vulnerableVersions: ['0.12.2', '0.12.1', '0.12.0', '0.11.1', '0.10.1'],
            fixedIn: '1.0',
            remediation: 'Upgrade flask to >= 1.0 via pip install --upgrade flask'
        },
        'requests': {
            cve: 'CVE-2023-32681',
            severity: 'MEDIUM',
            cvss: 6.1,
            title: 'Proxy-Authorization header leak on HTTPS redirect',
            affected: '<2.31.0',
            vulnerableVersions: ['2.30.0', '2.28.2', '2.28.1', '2.27.0', '2.25.1'],
            fixedIn: '2.31.0',
            remediation: 'Upgrade requests to >= 2.31.0 via pip install --upgrade requests'
        },
        'urllib3': {
            cve: 'CVE-2023-45803',
            severity: 'HIGH',
            cvss: 7.5,
            title: 'Request body leak on redirect with 307/308 status',
            affected: '<2.0.7',
            vulnerableVersions: ['2.0.6', '2.0.5', '2.0.0', '1.26.17', '1.26.16'],
            fixedIn: '2.0.7',
            remediation: 'Upgrade urllib3 to >= 2.0.7 via pip install --upgrade urllib3'
        },
        'django': {
            cve: 'CVE-2023-36053',
            severity: 'HIGH',
            cvss: 7.5,
            title: 'EmailValidator and URLValidator ReDoS in Django',
            affected: '<4.2.3',
            vulnerableVersions: ['4.2.2', '4.2.1', '4.2.0', '4.1.9', '3.2.19'],
            fixedIn: '4.2.3',
            remediation: 'Upgrade django to >= 4.2.3 via pip install --upgrade django'
        }
    }
};

// ----------------------------------------------------------------------------
// SECURITY HEURISTIC RULES (Secrets, Reverse Shells, Obfuscation, Dangerous APIs)
// ----------------------------------------------------------------------------
const SECURITY_RULES = [
    // 1. HARDCODED SECRETS & CREDENTIALS
    {
        id: 'SEC-001',
        category: 'SECRET',
        rule: 'Hardcoded GitHub Personal Access Token',
        severity: 'CRITICAL',
        regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/g,
        remediation: 'Revoke and rotate the exposed token immediately. Store secrets in environment variables or Hashcod Keys Vault.'
    },
    {
        id: 'SEC-002',
        category: 'SECRET',
        rule: 'Fine-grained GitHub Token',
        severity: 'CRITICAL',
        regex: /github_pat_[A-Za-z0-9_]{82}/g,
        remediation: 'Revoke the fine-grained token and load credentials via server-side vault.'
    },
    {
        id: 'SEC-003',
        category: 'SECRET',
        rule: 'Stripe Live Secret Key',
        severity: 'CRITICAL',
        regex: /(?:sk|rk)_live_[0-9a-zA-Z]{24,}/g,
        remediation: 'Remove live Stripe secret key from client code. Use restricted keys or backend API proxies.'
    },
    {
        id: 'SEC-004',
        category: 'SECRET',
        rule: 'AWS Access Key ID',
        severity: 'HIGH',
        regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
        remediation: 'Never embed AWS Access Keys in source files. Use AWS IAM roles or environment secrets.'
    },
    {
        id: 'SEC-005',
        category: 'SECRET',
        rule: 'Private Cryptographic Key',
        severity: 'CRITICAL',
        regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
        remediation: 'Private keys must not be committed to code workspace. Use PKI key managers or KMS.'
    },
    {
        id: 'SEC-006',
        category: 'SECRET',
        rule: 'Slack API Token / Webhook URL',
        severity: 'HIGH',
        regex: /(?:xox[baprs]-[0-9a-zA-Z]{10,48}|https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9a-zA-Z]+)/g,
        remediation: 'Keep Slack webhook URLs and tokens secret on the backend.'
    },
    {
        id: 'SEC-007',
        category: 'SECRET',
        rule: 'Generic High-Entropy API Secret / Bearer Token',
        severity: 'MEDIUM',
        regex: /(?:api[_-]?key|access[_-]?token|secret[_-]?token|auth[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{24,}['"]/gi,
        remediation: 'Avoid hardcoding plaintext authorization tokens in client-side scripts.'
    },

    // 2. REVERSE SHELLS & REMOTE CODE EXECUTION
    {
        id: 'MAL-001',
        category: 'MALWARE',
        rule: 'Reverse Shell',
        severity: 'CRITICAL',
        regex: /(?:bash\s+-i\s+>&?\s*\/dev\/tcp\/[0-9a-zA-Z\.\-]+\/\d+|nc\s+(?:-e|-c|\-lvp?)\s+\/bin\/(?:ba)?sh|python(?:\d)?\s+-c\s+.*socket.*pty\.spawn|perl\s+-e\s+.*Socket.*exec|php\s+-r\s+.*fsockopen.*exec|ruby\s+-rsocket\s+-e\s+)/gi,
        remediation: 'Malicious reverse shell connection detected. Remove backdoor code immediately.'
    },
    {
        id: 'MAL-002',
        category: 'MALWARE',
        rule: 'Encoded PowerShell Command Execution',
        severity: 'CRITICAL',
        regex: /powershell(?:\.exe)?\s+.*(?:-enc|-encodedcommand)\s+[A-Za-z0-9+/=]{20,}/gi,
        remediation: 'Obfuscated PowerShell command detected. Inspect and decode to ensure legitimacy.'
    },
    {
        id: 'MAL-003',
        category: 'MALWARE',
        rule: 'Arbitrary PHP System / Code Execution from User Input',
        severity: 'CRITICAL',
        regex: /\b(?:eval|exec|system|passthru|shell_exec|popen|proc_open)\s*\(\s*\$_(?:GET|POST|REQUEST|COOKIE|SERVER)\b/gi,
        remediation: 'Unsanitized input passed directly to command execution function. Sanitize or eliminate shell execution.'
    },
    {
        id: 'MAL-004',
        category: 'MALWARE',
        rule: 'Cryptocurrency Miner Signature',
        severity: 'CRITICAL',
        regex: /(?:stratum\+tcp:\/\/|monero(?:ocean)?|xmr-stak|coinhive(?:\.min)?\.js|crypto-loot\.com|minergate)/gi,
        remediation: 'Unauthorized crypto-mining signature detected. Quarantine or remove infected package.'
    },

    // 3. CODE OBFUSCATION & DANGEROUS EVASION PATTERNS
    {
        id: 'OBF-001',
        category: 'OBFUSCATION',
        rule: 'Excessive Hex / Unicode Byte Escapes',
        severity: 'HIGH',
        regex: /(?:\\x[0-9a-fA-F]{2}){10,}|(?:\\u[0-9a-fA-F]{4}){10,}/g,
        remediation: 'Highly obfuscated byte stream found. Inspect deobfuscated payload for hidden exploit payloads.'
    },
    {
        id: 'OBF-002',
        category: 'OBFUSCATION',
        rule: 'Dynamic Function Constructor Execution',
        severity: 'HIGH',
        regex: /(?:new\s+Function\s*\(\s*['"][^'"]*(?:unescape|atob|fromCharCode|eval)[^'"]*['"]\)|Function\s*\(\s*['"]return\s+this['"]\s*\)\s*\(\s*\))/gi,
        remediation: 'Refactor dynamic string evaluation to static imports to avoid CSP bypass.'
    },
    {
        id: 'OBF-003',
        category: 'OBFUSCATION',
        rule: 'Base64 Encoded Dynamic Eval String',
        severity: 'HIGH',
        regex: /(?:eval|Function)\s*\(\s*(?:atob|base64_decode|Buffer\.from)\s*\(\s*['"][A-Za-z0-9+/=]{40,}['"]\s*\)\s*\)/gi,
        remediation: 'Avoid executing Base64 encoded payload strings dynamically.'
    },

    // 4. SUSPICIOUS INJECTIONS & DOM XSS
    {
        id: 'SEC-008',
        category: 'SUSPICIOUS',
        rule: 'Direct innerHTML Injection with User Input',
        severity: 'MEDIUM',
        regex: /\b(?:\.innerHTML|\.outerHTML)\s*=\s*(?:location\.|document\.URL|window\.name|params\.|userInput|event\.data)/gi,
        remediation: 'Use textContent, DOMPurify.sanitize(), or safe document.createElement() instead of raw innerHTML assignment.'
    },
    {
        id: 'SEC-009',
        category: 'SUSPICIOUS',
        rule: 'Insecure WebSocket Connection (ws://) in Production',
        severity: 'LOW',
        regex: /['"]ws:\/\/(?!localhost|127\.0\.0\.1)[a-zA-Z0-9\.\-]+/g,
        remediation: 'Use secure WebSocket protocol (wss://) to protect telemetry from eavesdropping.'
    }
];

// ----------------------------------------------------------------------------
// CORE SCANNER ENGINE
// ----------------------------------------------------------------------------

/**
 * Scans raw code content against security rules
 */
function scanCodeBuffer(filePath, content) {
    const t0 = performance.now();
    const findings = [];
    const lines = typeof content === 'string' ? content.split('\n') : [];

    // Scan line by line for precise line numbers
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const lineContent = lines[lineIdx];
        const lineNum = lineIdx + 1;

        for (const rule of SECURITY_RULES) {
            rule.regex.lastIndex = 0; // Reset stateful regex
            let match;
            while ((match = rule.regex.exec(lineContent)) !== null) {
                const matchedText = match[0];
                const colNum = match.index + 1;

                // Mask sensitive matched token for safe telemetry preview
                const maskedSnippet = maskSensitiveToken(lineContent.trim(), matchedText);

                findings.push({
                    id: rule.id,
                    type: rule.category,
                    severity: rule.severity,
                    rule: rule.rule,
                    filePath: filePath || 'buffer.txt',
                    line: lineNum,
                    column: colNum,
                    snippet: maskedSnippet,
                    remediation: rule.remediation
                });

                // Prevent infinite loop on 0-width match
                if (match.index === rule.regex.lastIndex) {
                    rule.regex.lastIndex++;
                }
            }
        }
    }

    // Compute risk score (0 to 100) and health score (100 down to 0)
    let riskScore = 0;
    for (const f of findings) {
        if (f.severity === 'CRITICAL') riskScore += 25;
        else if (f.severity === 'HIGH') riskScore += 15;
        else if (f.severity === 'MEDIUM') riskScore += 8;
        else if (f.severity === 'LOW') riskScore += 3;
    }
    riskScore = Math.min(100, riskScore);

    const t1 = performance.now();
    const durationMs = Number((t1 - t0).toFixed(2));

    return {
        type: 'SECURITY_SCAN_RESULT',
        timestamp: Date.now(),
        filePath: filePath || 'buffer.txt',
        findings: findings,
        riskScore: riskScore,
        scanDurationMs: durationMs
    };
}

/**
 * Scans dependency manifests (package.json, requirements.txt, composer.json)
 */
function scanManifestBuffer(manifestType, content) {
    const t0 = performance.now();
    const findings = [];
    let parsedJson = null;

    try {
        if (manifestType.includes('package.json')) {
            parsedJson = typeof content === 'string' ? JSON.parse(content) : content;
            const deps = { ...(parsedJson.dependencies || {}), ...(parsedJson.devDependencies || {}) };

            for (const [pkg, rawVersion] of Object.entries(deps)) {
                const cleanVersion = String(rawVersion).replace(/[\^~>=<]/g, '').trim();
                const npmDb = KNOWN_CVE_CATALOG.npm[pkg.toLowerCase()];

                if (npmDb && npmDb.vulnerableVersions.includes(cleanVersion)) {
                    findings.push({
                        id: npmDb.cve,
                        type: 'CVE',
                        severity: npmDb.severity,
                        rule: `Known CVE in ${pkg}: ${npmDb.title}`,
                        package: pkg,
                        version: cleanVersion,
                        cvss: npmDb.cvss,
                        fixedIn: npmDb.fixedIn,
                        filePath: 'package.json',
                        line: 1,
                        snippet: `"${pkg}": "${rawVersion}"`,
                        remediation: npmDb.remediation
                    });
                }
            }
        } else if (manifestType.includes('requirements.txt')) {
            const lines = String(content).split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const match = line.match(/^([a-zA-Z0-9_\-]+)==([a-zA-Z0-9_\.\-]+)/);
                if (match) {
                    const [, pkg, ver] = match;
                    const pypiDb = KNOWN_CVE_CATALOG.pypi[pkg.toLowerCase()];
                    if (pypiDb && pypiDb.vulnerableVersions.includes(ver)) {
                        findings.push({
                            id: pypiDb.cve,
                            type: 'CVE',
                            severity: pypiDb.severity,
                            rule: `Known CVE in ${pkg}: ${pypiDb.title}`,
                            package: pkg,
                            version: ver,
                            cvss: pypiDb.cvss,
                            fixedIn: pypiDb.fixedIn,
                            filePath: 'requirements.txt',
                            line: i + 1,
                            snippet: line,
                            remediation: pypiDb.remediation
                        });
                    }
                }
            }
        }
    } catch (err) {
        findings.push({
            id: 'PARSE-ERR',
            type: 'SUSPICIOUS',
            severity: 'LOW',
            rule: `Malformed Manifest: ${err.message}`,
            filePath: manifestType,
            line: 1,
            snippet: String(content).substring(0, 100),
            remediation: 'Verify JSON syntax in package manifest.'
        });
    }

    let riskScore = 0;
    for (const f of findings) {
        if (f.severity === 'CRITICAL') riskScore += 25;
        else if (f.severity === 'HIGH') riskScore += 15;
        else if (f.severity === 'MEDIUM') riskScore += 8;
        else if (f.severity === 'LOW') riskScore += 3;
    }
    riskScore = Math.min(100, riskScore);

    const t1 = performance.now();
    const durationMs = Number((t1 - t0).toFixed(2));

    return {
        type: 'SECURITY_SCAN_RESULT',
        timestamp: Date.now(),
        filePath: manifestType,
        findings: findings,
        riskScore: riskScore,
        scanDurationMs: durationMs
    };
}

/**
 * Sanitizes and masks sensitive credentials in log previews
 */
function maskSensitiveToken(lineStr, matchStr) {
    if (!matchStr || matchStr.length < 8) return lineStr;
    const masked = matchStr.substring(0, 4) + '••••••••' + matchStr.substring(matchStr.length - 4);
    return lineStr.replace(matchStr, masked);
}

// ----------------------------------------------------------------------------
// WORKER MESSAGE LISTENER & DISPATCHER
// ----------------------------------------------------------------------------
self.onmessage = function(event) {
    const data = event.data || {};
    const action = data.action || data.type || 'SCAN_CODE';

    try {
        if (action === 'SCAN_CODE' || action === 'SCAN_FILE') {
            const filePath = data.filePath || data.filename || 'buffer.js';
            const content = data.content || data.code || '';
            const isManifest = /package\.json|requirements\.txt|composer\.json/i.test(filePath);

            let result;
            if (isManifest) {
                result = scanManifestBuffer(filePath, content);
            } else {
                result = scanCodeBuffer(filePath, content);
            }

            // Include correlation id if provided
            if (data.id) result.id = data.id;

            self.postMessage(result);
        } 
        else if (action === 'SCAN_MANIFEST') {
            const manifestType = data.manifestType || 'package.json';
            const content = data.content || '';
            const result = scanManifestBuffer(manifestType, content);
            if (data.id) result.id = data.id;
            self.postMessage(result);
        }
        else if (action === 'BATCH_SCAN' || action === 'AUDIT_WORKSPACE') {
            const files = Array.isArray(data.files) ? data.files : [];
            const allFindings = [];
            let totalRisk = 0;
            const t0 = performance.now();

            for (const file of files) {
                const path = file.path || file.name || 'unnamed.js';
                const content = file.content || '';
                const isManifest = /package\.json|requirements\.txt|composer\.json/i.test(path);
                const fileRes = isManifest ? scanManifestBuffer(path, content) : scanCodeBuffer(path, content);
                allFindings.push(...fileRes.findings);
                totalRisk += fileRes.riskScore;
            }

            const durationMs = Number((performance.now() - t0).toFixed(2));
            self.postMessage({
                type: 'SECURITY_SCAN_RESULT',
                timestamp: Date.now(),
                batch: true,
                totalFiles: files.length,
                findings: allFindings,
                riskScore: Math.min(100, totalRisk),
                scanDurationMs: durationMs,
                id: data.id || null
            });
        }
        else if (action === 'PING') {
            self.postMessage({ type: 'PONG', timestamp: Date.now(), status: 'ACTIVE' });
        }
        else {
            // Default fallback scan
            const result = scanCodeBuffer(data.filePath || 'code.txt', String(data.content || ''));
            self.postMessage(result);
        }
    } catch (err) {
        self.postMessage({
            type: 'SECURITY_SCAN_ERROR',
            timestamp: Date.now(),
            error: err.message,
            filePath: data.filePath || 'unknown'
        });
    }
};

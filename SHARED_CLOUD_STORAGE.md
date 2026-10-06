# Shared cloud storage

The public workspace uses the same-origin `/api/hashcod-shared-*` facade and
the `hashcod-shared-cloud` Edge Function. File metadata is shared across devices;
file contents and deletion require the exact code chosen at upload time.
The visible Files tree uses the same shared index and refreshes every 15 seconds
while visible, and when the window regains focus. Older non-shared pages retain
their existing endpoint.

Storage is private. The bucket and upload preparation share a 50 MiB limit,
matching the current project limit. Setting a bucket above the global Storage
limit prevents bucket creation, including uploads of tiny files. If that limit
changes, update both checks together; do not expose service credentials to clients.

Successful downloads pass through PHP without JSON decoding or reserialization,
so JSON documents, text and binary files retain their exact contents. Browser
POST requests use the existing same-origin/XHR boundary. Root runtime files are
also packaged by the desktop workflow; no separate desktop implementation is needed.

Verification: `node tests/e2e/test_shared_workspace_contract.js`,
`node tests/e2e/test_shared_cloud_proxy.js` (requires PHP with cURL), and the
protected File Vault browser/device tests. Production checks must use generated
fixtures and remove only those fixtures after confirming independent listing,
wrong-code rejection, exact-byte download and code-protected deletion.

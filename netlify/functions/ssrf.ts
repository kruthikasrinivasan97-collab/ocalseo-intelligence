// SSRF protection for the live-crawl Netlify Function.
//
// The audit endpoint accepts an arbitrary user-supplied URL and fetches it
// server-side, which is a classic SSRF vector (attackers pointing the
// function at internal services, cloud metadata endpoints, localhost, etc).
// This module enforces a strict allowlist: only public http/https URLs on
// standard ports, with the resolved IP checked against private/reserved
// ranges before every request the function makes.

import dns from 'node:dns'

const dnsLookup = dns.promises.lookup

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const ALLOWED_PORTS = new Set(['', '80', '443'])

export class SsrfError extends Error {}

// IPv4 private / reserved / loopback / link-local / metadata ranges.
const IPV4_BLOCKED_RANGES: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local (incl. cloud metadata 169.254.169.254)
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24], // TEST-NET
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24], // TEST-NET-3
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved
]

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number)
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function isIpv4InRange(ip: string, base: string, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask)
}

function isBlockedIpv4(ip: string): boolean {
  return IPV4_BLOCKED_RANGES.some(([base, prefix]) => isIpv4InRange(ip, base, prefix))
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === '::1') return true // loopback
  if (normalized === '::') return true
  if (normalized.startsWith('fe80:')) return true // link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // unique local (fc00::/7)
  if (normalized.startsWith('::ffff:')) {
    // IPv4-mapped IPv6 — check the embedded IPv4 address too
    const mapped = normalized.split(':').pop()
    if (mapped && mapped.includes('.')) return isBlockedIpv4(mapped)
  }
  return false
}

export interface ValidatedUrl {
  url: URL
  resolvedIp: string
}

/**
 * Validates a user-supplied URL is a safe, public, auditable target and
 * returns the resolved IP that was checked. Throws SsrfError with a
 * human-readable reason on rejection.
 */
export async function assertSafePublicUrl(rawUrl: string): Promise<ValidatedUrl> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new SsrfError('That doesn’t look like a valid URL.')
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SsrfError('Only http:// and https:// URLs are allowed.')
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new SsrfError('Only default ports (80/443) are allowed.')
  }
  if (url.username || url.password) {
    throw new SsrfError('URLs with embedded credentials are not allowed.')
  }

  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '0.0.0.0') {
    throw new SsrfError('Local addresses cannot be audited.')
  }
  if (hostname === 'metadata.google.internal') {
    throw new SsrfError('That hostname is not allowed.')
  }

  // If the hostname is itself a literal IP, validate it directly.
  const literalV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  if (literalV4 && isBlockedIpv4(hostname)) {
    throw new SsrfError('Requests to private or reserved IP ranges are blocked.')
  }
  if (hostname.includes(':') && isBlockedIpv6(hostname)) {
    throw new SsrfError('Requests to private or reserved IP ranges are blocked.')
  }

  let resolvedIp: string
  try {
    const result = await dnsLookup(hostname)
    resolvedIp = result.address
  } catch {
    throw new SsrfError('Could not resolve that hostname.')
  }

  const isBlocked = resolvedIp.includes(':') ? isBlockedIpv6(resolvedIp) : isBlockedIpv4(resolvedIp)
  if (isBlocked) {
    throw new SsrfError('That hostname resolves to a private or reserved IP address and cannot be audited.')
  }

  return { url, resolvedIp }
}

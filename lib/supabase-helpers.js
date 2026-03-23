// GF — Supabase REST helpers (zero-dependency)
'use strict';
const https = require('https');
const { URL } = require('url');

const SB_URL = () => process.env.SUPABASE_URL || '';
const SB_SERVICE_KEY = () => process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
const SB_ANON_KEY = () => process.env.SUPABASE_KEY || '';

/** Generic HTTPS request helper */
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

/** Resolve Supabase credentials — server always uses service key */
function _sbCreds() {
  const url = SB_URL();
  const key = SB_SERVICE_KEY();
  if (!url || !key) throw new Error('Supabase no configurado (falta URL o Key)');
  return { url, key };
}

/** Call a Supabase RPC function */
async function supabaseRpc(fnName, params = {}) {
  const { url: sbUrl, key: sbKey } = _sbCreds();
  const parsed = new URL(sbUrl);
  const body = JSON.stringify(params);
  return httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/rpc/${fnName}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`,
      'Content-Length': Buffer.byteLength(body)
    }
  }, body);
}

/** Read a key from app_data table (key-value store) */
async function getAppData(key) {
  const { url: sbUrl, key: sbKey } = _sbCreds();
  const parsed = new URL(sbUrl);
  const result = await httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/app_data?key=eq.${encodeURIComponent(key)}&select=value`,
    method: 'GET',
    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Accept': 'application/json' }
  });
  if (Array.isArray(result) && result.length > 0) return result[0].value;
  return null;
}

/** Query a Supabase table with filters */
async function supabaseQuery(table, select = '*', filters = '') {
  const { url: sbUrl, key: sbKey } = _sbCreds();
  const parsed = new URL(sbUrl);
  const qs = `select=${encodeURIComponent(select)}${filters ? '&' + filters : ''}`;
  return httpsRequest({
    hostname: parsed.hostname,
    path: `/rest/v1/${table}?${qs}`,
    method: 'GET',
    headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`, 'Accept': 'application/json' }
  });
}

module.exports = { httpsRequest, _sbCreds, supabaseRpc, getAppData, supabaseQuery, SB_URL, SB_SERVICE_KEY, SB_ANON_KEY };

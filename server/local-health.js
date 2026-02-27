import config from './config.js';

const INITIAL_VERDICT = {
  status: 'unknown',
  reason: 'no_check_run_yet',
  confidence: 0,
  checkedAt: null,
  inferenceMs: null,
};

export default class LocalHealthChecker {
  constructor(gatewayClient) {
    this._gatewayClient = gatewayClient;
    this._verdict = { ...INITIAL_VERDICT };
    this._timer = null;
  }

  start() {
    if (this._timer) return;
    this._runCheck();
    this._timer = setInterval(() => this._runCheck(), config.healthCheckIntervalMs);
    console.log(`[LocalHealth] Started (interval=${config.healthCheckIntervalMs}ms, model=${config.ollamaModel})`);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      console.log('[LocalHealth] Stopped');
    }
  }

  getVerdict() {
    return { ...this._verdict };
  }

  async _runCheck() {
    const metrics = this._gatewayClient.getMetrics();
    const prompt = this._buildPrompt(metrics);
    const start = Date.now();

    let raw;
    try {
      raw = await this._queryQwen(prompt);
    } catch (err) {
      const inferenceMs = Date.now() - start;
      const reason = `health_checker_error:${err.message.replace(/\s+/g, '_').substring(0, 60)}`;
      this._verdict = {
        status: 'degraded',
        reason,
        confidence: 0,
        checkedAt: new Date().toISOString(),
        inferenceMs,
      };
      console.warn('[LocalHealth] Qwen query failed:', err.message);
      return;
    }

    const inferenceMs = Date.now() - start;
    const parsed = this._parseVerdict(raw);
    this._verdict = {
      ...parsed,
      checkedAt: new Date().toISOString(),
      inferenceMs,
    };
    console.log(`[LocalHealth] Check done in ${inferenceMs}ms: status=${parsed.status} reason=${parsed.reason} confidence=${parsed.confidence}`);
  }

  _buildPrompt(metrics) {
    const lastEventSecs = metrics.msSinceLastEvent !== null
      ? Math.round(metrics.msSinceLastEvent / 1000)
      : null;
    const lastEvent = lastEventSecs !== null ? `${lastEventSecs}s` : 'never';

    return `Assess gateway health and output JSON.

State: connected=${metrics.connected}, authenticated=${metrics.authenticated}, reconnecting=${metrics.reconnecting}, last_event=${lastEvent}, errors=${metrics.errorCount}, reconnects=${metrics.reconnectCount}

Rules:
- healthy: connected + authenticated + last_event<120s + errors<3
- degraded: not authenticated OR last_event 120-600s OR errors 3-9
- down: disconnected OR (reconnecting + reconnects>2) OR errors>=10 OR last_event>600s

Reason tags: connected_authenticated / not_authenticated / long_silence / many_errors / disconnected / reconnecting_repeatedly / extended_silence

Output exactly: {"status":"healthy","reason":"connected_authenticated","confidence":97}`;
  }

  async _queryQwen(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.healthCheckTimeoutMs);

    try {
      const response = await fetch(`${config.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollamaModel,
          prompt,
          stream: false,
          options: {
            temperature: 0.0,
            num_predict: 40,
            top_k: 1,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.response || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  _parseVerdict(raw) {
    // Strip markdown code fences if present
    let text = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    // Extract first JSON object
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) {
      return { status: 'degraded', reason: 'unparseable_verdict', confidence: 0 };
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return { status: 'degraded', reason: 'invalid_json_verdict', confidence: 0 };
    }

    const validStatuses = ['healthy', 'degraded', 'down'];
    const status = validStatuses.includes(parsed.status) ? parsed.status : 'degraded';
    const reason = typeof parsed.reason === 'string'
      ? parsed.reason.replace(/\s+/g, '_').substring(0, 80)
      : 'unknown_reason';
    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
      : 50;

    return { status, reason, confidence };
  }
}

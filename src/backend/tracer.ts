import tracer from 'dd-trace';

tracer.init({
  // Service name for APM
  service: process.env['DD_SERVICE'] || 'profile',

  // Environment (e.g., 'production', 'staging', 'development')
  env: process.env['DD_ENV'] || process.env['NODE_ENV'] || 'development',

  // Version of the application
  version: process.env['DD_VERSION'] || '1.0.0',

  // Enable APM tracing
  appsec: true,

  // Enable runtime metrics
  runtimeMetrics: true,

  // Enable log injection for correlating logs with traces
  logInjection: true,

  // Profiling (optional, can be enabled via DD_PROFILING_ENABLED env var)
  profiling: process.env['DD_PROFILING_ENABLED'] === 'true',

  // Sample rate (1.0 = 100% of traces)
  sampleRate: parseFloat(process.env['DD_TRACE_SAMPLE_RATE'] || '1.0'),
});

export default tracer;
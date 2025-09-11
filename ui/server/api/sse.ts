// Proxies the backend SSE to the browser, preserving streaming.
// Works on Nitro (Nuxt 4 server).
export default defineEventHandler(async (event) => {
  console.log('[SSE Nuxt Proxy] SSE request received');
  console.log('[SSE Nuxt Proxy] Request method:', event.method);
  console.log('[SSE Nuxt Proxy] Request headers:', getHeaders(event));
  
  try {
    // Get backend URL and auth token using the same pattern as other API endpoints
    const config = useRuntimeConfig(event);
    const backendUrl = `${config.apiBaseUrl}/api/sse`;
    const authToken = event.context.token;
    
    console.log('[SSE Nuxt Proxy] Backend URL:', backendUrl);
    console.log('[SSE Nuxt Proxy] Has auth token:', !!authToken);
    console.log('[SSE Nuxt Proxy] Token preview:', authToken ? `${authToken.substring(0, 20)}...` : 'none');

    // Validate authentication
    if (!authToken) {
      console.log('[SSE Nuxt Proxy] Authentication failed - no token');
      setResponseStatus(event, 401);
      return `retry: 5000\nevent: error\ndata: "Authentication required"\n\n`;
    }
    
    console.log('[SSE Nuxt Proxy] Authentication validated');

    // Required headers for SSE downstream to the browser
    console.log('[SSE Nuxt Proxy] Setting SSE headers for client...');
    setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8');
    setHeader(event, 'Cache-Control', 'no-cache, no-transform');
    setHeader(event, 'Connection', 'keep-alive');
    setHeader(event, 'X-Accel-Buffering', 'no');
    console.log('[SSE Nuxt Proxy] SSE headers set');

    // Open connection to the backend SSE with authentication
    console.log('[SSE Nuxt Proxy] Connecting to backend...');
    const backendRes = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    console.log('[SSE Nuxt Proxy] Backend response status:', backendRes.status);
    console.log('[SSE Nuxt Proxy] Backend response headers:', Object.fromEntries(backendRes.headers.entries()));
    console.log('[SSE Nuxt Proxy] Backend has body:', !!backendRes.body);

    if (!backendRes.ok || !backendRes.body) {
      const errorText = await backendRes.text().catch(() => 'Backend SSE connection failed');
      console.error('[SSE Nuxt Proxy] Backend connection failed:', errorText);
      setResponseStatus(event, backendRes.status || 502);
      return `retry: 5000\nevent: error\ndata: "${errorText}"\n\n`;
    }
    
    console.log('[SSE Nuxt Proxy] Backend connection successful, starting stream...');

    // Stream backend chunks to client. Nitro exposes a web-standard WritableStream.
    const nodeRes = event.node.res;

    // Initial ping to flush headers
    console.log('[SSE Nuxt Proxy] Sending initial ping to client');
    nodeRes.write(':connected\n\n');

    const reader = backendRes.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        nodeRes.write(chunk);
      }
    } catch (error) {
      console.error('[SSE Nuxt Proxy] Error reading SSE stream:', error);
      // Send error event to client
      nodeRes.write(`event: error\ndata: "Connection lost"\n\n`);
    } finally {
      console.log('[SSE Nuxt Proxy] Ending SSE connection');
      try {
        nodeRes.end();
      } catch (error) {
        console.error('[SSE Nuxt Proxy] Error ending SSE connection:', error);
      }
    }
  } catch (error) {
    console.error('[SSE Nuxt Proxy] SSE proxy error:', error);
    setResponseStatus(event, 500);
    return `retry: 5000\nevent: error\ndata: "Internal server error"\n\n`;
  }
});

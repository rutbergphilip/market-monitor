export default defineEventHandler((event) => {
  const authHeader = event.node.req.headers.authorization;
  const headerToken = authHeader?.split(' ')?.[1];
  
  const cookieToken = getCookie(event, 'auth_token');
  
  const token = headerToken || cookieToken;
  
  if (token) event.context.token = token;
});

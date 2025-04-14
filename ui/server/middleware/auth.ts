export default defineEventHandler((event) => {
  const authHeader = event.node.req.headers.authorization;
  const token = authHeader?.split(' ')?.[1];

  if (token) event.context.token = token;
});

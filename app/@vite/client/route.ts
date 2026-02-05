export async function GET() {
  return new Response(`// Vite HMR client stub for Next.js dev
  // Prevent 404 logs when extensions probe /@vite/client
  export default {};
  `, {
    headers: { "content-type": "application/javascript" },
    status: 200,
  });
}

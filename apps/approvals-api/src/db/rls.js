// src/db/rls.js
export async function withRLS(prisma, { email }, fn) {
  if (!email) throw new Error('Missing x-user-email header');

  return prisma.$transaction(async (tx) => {
    // Make the email available to auth.jwt() used in policies
    await tx.$executeRawUnsafe(
      `select set_config('request.jwt.claims', $1, true)`,
      JSON.stringify({ email })
    );
    return fn(tx);
  });
}

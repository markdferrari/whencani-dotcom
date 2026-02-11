/**
 * Shared ESLint configuration for Next.js applications
 */
export const nextjsConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
    ],
  },
];

export default nextjsConfig;

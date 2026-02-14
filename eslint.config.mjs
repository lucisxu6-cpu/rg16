import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".data/**"],
  },
  {
    rules: {
      // App Router: fonts are handled in app/layout.tsx; next/font is not usable here due to restricted font fetch.
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default config;

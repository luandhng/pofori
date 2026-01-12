import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      borderWidth: {
        DEFAULT: "0.1px", // Overrides the standard 'border' class
      },
    },
  },
  plugins: [],
};
export default config;

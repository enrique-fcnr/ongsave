import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sem cache incremental em R2: todas as telas do app são dinâmicas.
export default defineCloudflareConfig();

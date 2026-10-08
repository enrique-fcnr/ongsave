import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const photoBucket = () => getCloudflareContext().env.PHOTOS;

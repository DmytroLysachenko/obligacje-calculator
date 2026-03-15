import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { syncEconomicData } from "@/lib/inngest-functions";

// Create an API that serves zero-infrastructure background functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncEconomicData,
  ],
});

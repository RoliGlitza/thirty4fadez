import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  return new Response("Still alive 🚀", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
});

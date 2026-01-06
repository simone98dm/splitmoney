import { createClient } from "@supabase/supabase-js";
import { Database } from "~/types/database.types";

export default defineEventHandler(async (ctx) => {
  try {
    const { room } = getRouterParams(ctx);
    if (!room) {
      throw new Error("Room not found");
    }

    const { supabaseAnonKey, supabaseUrl } = useRuntimeConfig();

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    const roomData = await supabase
      .from("room")
      .select("name,data")
      .eq("id", room as string)
      .single();

    if (roomData.data) {
      const data = JSON.stringify(roomData.data.data);
      return { ...roomData.data, data };
    }
  } catch (e) {
    console.error(e);
  }

  return null;
});

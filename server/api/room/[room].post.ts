import { createClient } from "@supabase/supabase-js";
import { Database } from "~/types/database.types";
import { Expense, Partecipant, Room } from "~/types";

export default defineEventHandler(async (ctx) => {
  try {
    const { expenses, participants } = await readBody<{
      participants: Partecipant[];
      expenses: Expense[];
    }>(ctx);
    const { room } = getRouterParams(ctx);
    const { supabaseAnonKey, supabaseUrl } = useRuntimeConfig();

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    const name = generateRoomName();
    const payload: Room = {
      name,
      data: {
        expenses,
        participants,
      },
    };

    const roomData = await supabase
      .from("room")
      .upsert({
        ...payload,
        data: JSON.stringify(payload.data),
      })
      .eq("id", room as string)
      .select("id")
      .single();

    return roomData.data;
  } catch (e) {
    console.error(e);
  }

  return null;
});

function generateRoomName() {
  return Math.random().toString(36).substring(7);
}

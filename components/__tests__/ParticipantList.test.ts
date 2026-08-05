import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import ParticipantList from "~/components/participant/ParticipantList.vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";

describe("ParticipantList", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  const setup = () => {
    const participantStore = useParticipantsStore();
    participantStore.participants = ["Alice", "Bob"];
    const splitterStore = useExpenseSplitterStore();
    splitterStore.newExpense = {
      payer: "Alice",
      amount: "100",
      description: "Dinner",
    };
    splitterStore.addExpense();
    return { participantStore, splitterStore };
  };

  it("carries a rename into the expenses, not just the roster", async () => {
    const { participantStore, splitterStore } = setup();
    const wrapper = mount(ParticipantList);

    participantStore.startEditing("Alice");
    participantStore.editingParticipant = { original: "Alice", new: "Alicia" };
    await wrapper.vm.$nextTick();

    await wrapper.find('button[title="Salva"]').trigger("click");

    expect(participantStore.participants).toEqual(["Alicia", "Bob"]);
    expect(splitterStore.expenses[0].payer).toBe("Alicia");
    expect(splitterStore.expenses[0].participants).toEqual(["Alicia", "Bob"]);
    // the real regression: a rename that stops at the roster leaves a phantom debtor
    expect(splitterStore.balances).toEqual({ Alicia: 50, Bob: -50 });
  });

  it("only offers removal to participants with a zero balance", () => {
    setup();
    const wrapper = mount(ParticipantList);

    // Alice is owed 50 and Bob owes 50, so neither is removable
    expect(wrapper.findAll('button[title="Rimuovi partecipante"]')).toHaveLength(
      0
    );
  });

  it("offers removal once nobody has an open balance", () => {
    const { participantStore } = setup();
    participantStore.participants = ["Alice", "Bob", "Carol"];
    const wrapper = mount(ParticipantList);

    const removable = wrapper
      .findAll('button[title="Rimuovi partecipante"]')
      .length;

    // Carol joined after the expense, so only Carol is at zero
    expect(removable).toBe(1);
  });
});

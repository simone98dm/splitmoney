import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import ParticipantPanel from "~/components/participant/ParticipantPanel.vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";

const setup = (roster = ["Alice", "Bob"]) => {
  const participantsStore = useParticipantsStore();
  participantsStore.participants = roster;
  const splitterStore = useExpenseSplitterStore();
  splitterStore.newExpense = {
    payer: "Alice",
    amount: "100",
    description: "Cena",
  };
  splitterStore.addExpense();
  return { participantsStore, splitterStore };
};

const openRow = async (wrapper: ReturnType<typeof mount>, name: string) => {
  const row = wrapper
    .findAll("li")
    .find((li) => li.text().includes(name));
  await row!.find("button").trigger("click");
  return row!;
};

describe("ParticipantPanel", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("shows each balance with an explicit sign, not color alone", () => {
    setup();
    const text = mount(ParticipantPanel).text();

    // U+2212 minus, and a real + on the credit side
    expect(text).toContain("+50,00");
    expect(text).toContain("−50,00");
  });

  it("labels the direction in words as well as sign", () => {
    setup();
    const text = mount(ParticipantPanel).text();

    expect(text).toContain("deve ricevere");
    expect(text).toContain("deve dare");
  });

  it("carries a rename into the expenses, not just the roster", async () => {
    const { participantsStore, splitterStore } = setup();
    const wrapper = mount(ParticipantPanel);

    participantsStore.editingParticipant = { original: "Alice", new: "Alicia" };
    await wrapper.vm.$nextTick();
    await wrapper.find('button[aria-label="Salva nome"]').trigger("click");

    expect(participantsStore.participants).toEqual(["Alicia", "Bob"]);
    expect(splitterStore.expenses[0].payer).toBe("Alicia");
    expect(splitterStore.balances).toEqual({ Alicia: 50, Bob: -50 });
  });

  it("hides remove behind an open balance", async () => {
    setup();
    const wrapper = mount(ParticipantPanel);

    await openRow(wrapper, "Alice");

    expect(wrapper.text()).toContain("Non rimuovibile");
  });

  it("offers remove once the person is square", async () => {
    const { participantsStore } = setup();
    participantsStore.participants = ["Alice", "Bob", "Carol"];
    const wrapper = mount(ParticipantPanel);

    // Carol joined after the expense, so her balance is zero
    const row = await openRow(wrapper, "Carol");

    expect(row.text()).toContain("Rimuovi");
    expect(row.text()).not.toContain("Non rimuovibile");
  });

  it("lets a person declare themselves from their own row", async () => {
    const { participantsStore } = setup();
    const wrapper = mount(ParticipantPanel);

    const row = await openRow(wrapper, "Bob");
    await row
      .findAll("button")
      .find((b) => b.text() === "Sono io")!
      .trigger("click");

    expect(participantsStore.me).toBe("Bob");
  });

  it("rejects a duplicate name with a live error", async () => {
    const { participantsStore } = setup();
    const wrapper = mount(ParticipantPanel);

    participantsStore.newParticipant = "alice";
    await wrapper.find("form").trigger("submit");

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toBe("Questo nome è già in uso");
  });
});

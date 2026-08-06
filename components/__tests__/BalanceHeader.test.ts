import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import BalanceHeader from "~/components/balance/BalanceHeader.vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";

const setup = (roster = ["Alice", "Bob"], addExpense = true) => {
  const participantsStore = useParticipantsStore();
  participantsStore.participants = roster;
  const splitterStore = useExpenseSplitterStore();
  if (addExpense) {
    splitterStore.newExpense = {
      payer: "Alice",
      amount: "100",
      description: "Cena",
    };
    splitterStore.addExpense();
  }
  return { participantsStore, splitterStore };
};

describe("BalanceHeader", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("asks who you are before it can show a personal balance", () => {
    setup();
    const wrapper = mount(BalanceHeader);

    expect(wrapper.text()).toContain("Chi sei?");
  });

  it("shows your own balance once you say who you are", async () => {
    const { participantsStore } = setup();
    const wrapper = mount(BalanceHeader);

    participantsStore.setMe("Bob");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("−50,00");
    expect(wrapper.text()).toContain("devi dare");
  });

  it("says 'ti spettano' on the credit side", async () => {
    const { participantsStore } = setup();
    const wrapper = mount(BalanceHeader);

    participantsStore.setMe("Alice");
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("+50,00");
    expect(wrapper.text()).toContain("ti spettano");
  });

  it("falls back to the group total when you skip the question", async () => {
    const { participantsStore } = setup();
    const wrapper = mount(BalanceHeader);

    participantsStore.skipMe();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain("Chi sei?");
    expect(wrapper.text()).toContain("Totale speso");
    expect(wrapper.text()).toContain("100,00");
  });

  it("declares the event over when nobody owes anything", async () => {
    const { participantsStore, splitterStore } = setup();
    participantsStore.setMe("Alice");

    splitterStore.newExpense = { payer: "Bob", amount: "100", description: "" };
    splitterStore.addExpense();
    const wrapper = mount(BalanceHeader);

    expect(wrapper.text()).toContain("Siete in pari");
    expect(wrapper.text()).toContain("Nessun pagamento da fare");
  });

  it("remembers who you are across a reload", () => {
    setup();
    useParticipantsStore().setMe("Bob");

    setActivePinia(createPinia());
    setup();

    expect(useParticipantsStore().me).toBe("Bob");
  });

  it("puts the question back if you remove yourself", () => {
    const { participantsStore } = setup(["Alice", "Bob", "Carol"]);
    participantsStore.setMe("Carol");

    participantsStore.removeParticipant("Carol");

    expect(participantsStore.me).toBeNull();
    expect(localStorage.getItem("me")).toBe("null");
  });
});

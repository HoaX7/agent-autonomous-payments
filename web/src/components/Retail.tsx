import Layers from "lucide-solid/icons/layers";
import Cog from "lucide-solid/icons/cog";
import { Button } from "./commons/Btn";
import { ActivityLog, ActivityLogs } from "./ActivityLogs";
import InventoryData from "../pages/home.data";
import { Accessor, createEffect, createSignal, For, Show } from "solid-js";
import atom from "solid-use/atom";
import { InventoryProps } from "../pages/types";
import { getInventory, simulateLowInventory } from "../api";
import clsx from "clsx";
import { CONSTANTS, store, threshold } from "../utils";
import { Loading } from "./commons/Loading";

interface Props {
  onStart: (bool: boolean) => void;
  logs: ActivityLog[];
  start: Accessor<boolean>;
}

export function Retail(props: Props) {
  const data = InventoryData();
  const [inventory, setInventory] = createSignal<InventoryProps[]>([]);
  const [animatingIds, setAnimatingIds] = createSignal<Set<number>>(new Set());
  const loading = atom(false);
  const loadInitData = atom(true);

  createEffect(() => {
    try {
      const cachedItems = store.getItem<InventoryProps[]>(CONSTANTS.inventory);
      const inProgress = store.getItem(CONSTANTS.inProgress);
      if (inProgress) {
        props.onStart(true);
      }
      if (cachedItems) {
        setInventory(cachedItems);
        loadInitData(false);
        return;
      }
      const result = data()?.data;
      setTimeout(() => {
        if (result) {
          setInventory(result);
          loadInitData(false);
        }
      }, 1000);
    } catch (err) {
      loadInitData(false);
    }
  });

  const animateInv = (array: any[]) => {
    const res = inventory().map((item) => {
      const updated = array.find((r) => r.id === item.id);
      if (!updated) return item;

      if (item.inStock !== updated.inStock) {
        // Add to animating set
        setAnimatingIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(item.id);
          return newSet;
        });

        // Remove after animation
        setTimeout(() => {
          setAnimatingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }, 300); // match animation duration
      }

      return { ...item, inStock: updated.inStock };
    });

    setInventory(res);
    return res;
  };

  async function handleSimulate() {
    try {
      loading(true);
      const result = await simulateLowInventory();
      const updated = animateInv(result.data || []);
      if (updated.length > 0) {
        store.setItem(CONSTANTS.inventory, updated);
      }
      props.onStart(true);
    } catch (err: any) {
      console.error(err);
      props.onStart(false);
      store.removeItem(CONSTANTS.inventory);
      store.removeItem(CONSTANTS.inProgress);
      alert("unknown error " + err.message);
    } finally {
      loading(false);
      //   start(false)
      //   props.onStart(false)
    }
  }

  return (
    <div class="px-4 flex flex-col gap-4">
      <h2 class="font-bold flex justify-between items-center">
        <div>
          <Layers class="inline mr-2" />
          Retailer Inventory - Balance: Unlimited, Budget: $2000
        </div>
      </h2>

      <Show when={loadInitData()}>
        <Loading text="Loading inventory items..." />
      </Show>
      <div class="grid grid-cols-2 gap-4">
        {Array(2)
          .fill(0)
          .map((_, i) => (
            <div class="col-span-1 rounded-md overflow-clip glass">
              <table class="table">
                <tbody>
                  <For each={inventory().slice(i * 4, (i + 1) * 4)}>
                    {(item, j) => (
                      <tr class={(j() % 2 ? "bg-slate-900/20" : "") + " p-2"}>
                        <td>{item.name}</td>
                        <td>
                          <span
                            class={clsx(
                              `inline-block transition-all duration-300 ${
                                animatingIds().has(item.id)
                                  ? "scale-125 text-yellow-300"
                                  : ""
                              }`,
                              item.inStock < threshold ? "text-red-400" : ""
                            )}
                          >
                            {item.inStock} Qty
                          </span>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          ))}
      </div>

      <div class="fixed left-[40dvw] top-[20dvh] z-10 retail-agent">
        {/* @ts-ignore */}
        <dotlottie-player
          src="https://lottie.host/a26b8bc0-ee5f-491e-a72d-950675f8dd95/JzyuVt3Wbb.lottie"
          background="transparent"
          speed="1"
          style="width: 200px; height: 200px"
          loop
          autoplay
        />
      </div>

      <ActivityLogs
        type="retailer"
        start={props.start()}
        onStop={() => {
          props.onStart(false);
        }}
        logs={props.logs}
      />

      <div class="flex justify-center pt-8 sticky bottom-4">
        <Button
          class={clsx(
            "btn btn-neutral bg-accent-content py-6 w-1/2 rounded-full text-base-content",
            "disabled:opacity-50"
          )}
          type="button"
          on:click={handleSimulate}
          disabled={props.start() || loading()}
        >
          <Cog
            class={
              "inline " +
              (props.start() === true || loading() ? "animate-spin" : "")
            }
          />{" "}
          Simulate Low Inventory
        </Button>
      </div>
    </div>
  );
}

import { createEffect, createSignal, onCleanup, onMount, Show, untrack } from "solid-js";
import atom from "solid-use/atom";
import Cloud from "lucide-solid/icons/cloud";
import { Provider } from "../components/Provider";
import { Retail } from "../components/Retail";
import { BotIcon } from "lucide-solid";
import { ActivityLog } from "../components/ActivityLogs";
import { CONSTANTS, store, unique } from "../utils";
import { getActivityLogs } from "../api";

export default function Home() {
  const [start, setStart] = createSignal(false);
  const [localLogs, setLocalLogs] = createSignal<ActivityLog[]>([]);
  const [logs, setLogs] = createSignal<ActivityLog[]>([]);

  const fetchLogs = async () => {
    try {
      const currentLogs = untrack(() => logs());
      const currentLogsDisplayed = untrack(() => localLogs());
      const from = currentLogs.at(0)?.createdAt || currentLogsDisplayed.at(0)?.createdAt;
      if (from) store.setItem(CONSTANTS.inProgress, JSON.stringify({ from }));
      const result = await getActivityLogs(from);
      const newLogs = [...result.data, ...currentLogs];
      setLogsFiltered(unique<ActivityLog>(newLogs));
      count++;
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    }
  };

  let interval,
    timeout,
    interval2,
    counter = 0;

  onMount(() => {
    const inProgress = store.getItem(CONSTANTS.inProgress);
    if (inProgress) fetchLogs(); // initial logs
  });

  const fetchDisplayLogs = () => {
    const data = untrack(() => logs()).pop();
    const currentLogs = untrack(() => localLogs());
    if (data) {
      setLocalLogs([data, ...currentLogs]);
      if ((data.status === "finished" && logs().length <= 0) || data.event === "error") clear2();
    }
  };
  createEffect(() => {
    if (!start()) {
      clear();
      clear2();
      return;
    }

    setLogsFiltered([]); // clear logs
    fetchLogs();
    interval = setInterval(fetchLogs, 5000); // fetch logs from api
    setLocalLogs([]);
    interval2 = setInterval(fetchDisplayLogs, 1200); // display logs
    timeout = setTimeout(() => {
      clear();
      clear2();
    }, 60 * 1000);
    onCleanup(() => {
      clear();
      clear2();
    });
  });

  const clear2 = () => {
    clearInterval(interval2);
    setStart(false);
    store.removeItem(CONSTANTS.inProgress);
    store.removeItem(CONSTANTS.inventory);
  };
  const clear = () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };

  let count = 0;
  const setLogsFiltered = (result: ActivityLog[]) => {
    const filtered = result;
    // props.type === "retailer"
    //   ? result.filter((r) => r.user === "RETAIL_AGENT")
    //   : result.filter((r) => r.user !== "RETAIL_AGENT");

    const canStop = filtered.find(
      (f) => f.status === "finished" || f.event === "error"
    );
    if (canStop) {
      clear();
    }
    setLogs(filtered);
  };

  return (
    <div class="grid grid-cols-2 h-full">
      <section class="h-full retail" data-theme="dark">
        <header class="p-4 font-bold">
          <div class="p-2 text-center text-xl rounded-lg glass">
            ☘️ Clover Pharmacy
          </div>
        </header>
        <Retail start={start} onStart={setStart} logs={localLogs().filter((l) => l.user === "RETAIL_AGENT")} />
      </section>
      <section class="h-full provider">
        <header class="p-4 font-bold">
          <div class="p-2 text-center text-xl rounded-lg glass">
            💊 Pfifier Meds Manufacturing Ltd.
          </div>
        </header>
        <Provider start={start} logs={localLogs().filter((l) => l.user === "VENDOR_AGENT")} />
        <div class="fixed left-[60%] -translate-x-1/2 top-[95dvh] animate-bounce hover:animate-none">
          <a
            class="rounded-full glass px-2 py-1 text-white/70 cursor-pointer"
            href="/"
          >
            <BotIcon class="inline mr-2" /> Intro
          </a>
          <a
            href="/architecture"
            class="rounded-full glass px-2 py-1 text-white/70 ml-2"
          >
            <Cloud class="inline mr-2" /> Architecture
          </a>
        </div>
      </section>
    </div>
  );
}

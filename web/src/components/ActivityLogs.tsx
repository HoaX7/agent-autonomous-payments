import {
  createSignal,
  createEffect,
  For,
  JSX,
  Show,
  onCleanup,
  onMount,
  untrack,
} from "solid-js";
import ScrollText from "lucide-solid/icons/scroll-text";
import { Loading } from "./commons/Loading";
import { TransitionGroup } from "solid-transition-group";
import {
  CheckCircleIcon,
  DownloadIcon,
  FileCogIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  XCircleIcon,
} from "lucide-solid";
import { CONSTANTS, store, toLocaleDateTime, unique } from "../utils";
import { getActivityLogs } from "../api";
import clsx from "clsx";
import { Li } from "./Li";

export type ActivityLogsProps = {
  start: boolean;
  type: "retailer" | "provider";
  onStop?: () => void;
  onTaskComplete?: () => void;
  logs: ActivityLog[];
};

export type ActivityLog = {
  event: "log" | "error" | "completed" | "warn" | "parsing";
  updatedAt: number;
  createdAt: number;
  user: string;
  message: string;
  pk: string;
  id: number;
  status: "finished" | "working" | "started" | "task-completed";
  trigger?: "self" | "VENDOR_AGENT" | "RETAIL_AGENT";
};

export function ActivityLogs(props: ActivityLogsProps) {
  const [loading, setLoading] = createSignal(false);
  const [localLogs] = createSignal([]);

  const getIcons = (
    event: ActivityLog["event"],
    status: ActivityLog["status"]
  ) => {
    switch (event) {
      case "error":
        return { icon: XCircleIcon, class: "text-red-400" };
      case "completed":
        return { icon: CheckCircleIcon, class: "text-green-400" };
      case "warn":
        return { icon: TriangleAlertIcon, class: "text-yellow-400" };
      case "parsing":
        return {
          icon: CheckCircleIcon,
          // class: "text-[#ffa500]"
        };
      default:
        return {
          icon:
            status === "task-completed" || status === "working"
              ? CheckCircleIcon
              : InfoIcon,
        };
    }
  };

  return (
    <>
      <h2 class="font-bold flex justify-between items-center">
        <div>
          <ScrollText class="inline mr-2" /> Activity Logs
        </div>
      </h2>

      <div class="glass rounded-lg h-[50dvh] overflow-auto">
        <Show
          when={!loading()}
          fallback={
            <div class="p-2 text-center opacity-50 h-full flex items-center justify-center">
              <Loading />
            </div>
          }
        >
          <ul class="block h-full space-y-2 transition-all">
            <TransitionGroup name="slide">
              <For each={props.logs}>
                {(item, i) => {
                  const { icon: Icon, class: containerClass } = getIcons(
                    item.event,
                    item.status
                  );
                  return (
                    <Li
                      Icon={Icon}
                      item={item}
                      containerClass={containerClass}
                      index={i()}
                    />
                  );
                }}
              </For>
            </TransitionGroup>
            <Show when={props.logs.length === 0}>
              <li class="p-2 text-center opacity-50 h-full flex items-center justify-center">
                No logs
              </li>
            </Show>
          </ul>
        </Show>
      </div>
    </>
  );
}

import clsx from "clsx";
import { Loading } from "./commons/Loading";
import { toLocaleDateTime } from "../utils";
import { createMemo, JSX } from "solid-js";
import { DownloadIcon } from "lucide-solid";
import { ActivityLog } from "./ActivityLogs";


function parseMessageToJSX(message: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(message)) !== null) {
    const [fullMatch, text, url] = match;
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(message.slice(lastIndex, matchIndex));
    }
    parts.push(
      <a
        href={url}
        target="_blank"
        class={clsx(
          "text-white glass rounded-md text-sm p-1 whitespace-nowrap"
        )}
      >
        {text} <DownloadIcon size={14} class="inline" />
      </a>
    );
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < message.length) {
    parts.push(message.slice(lastIndex));
  }

  return parts;
}

interface Props {
  item: ActivityLog;
  index: number;
  containerClass?: string;
  Icon: any;
  iconClass?: string;
}
export function Li(props: Props) {
    const parsing = createMemo(() => {
        const parsing = props.index === 0 && (props.item.event === "parsing" || props.item.status === "working")
        return parsing
    })
  return <li
      class={clsx(
        "p-2 flex justify-between items-start",
        props.containerClass,
        "slide",
        props.item.trigger === "VENDOR_AGENT" ? "slide-right-left" : ""
      )}
    >
      <div class="flex gap-1 items-start">
        {parsing() ? <Loading noText /> : 
		<props.Icon size={16} class={clsx("flex-shrink-0 mt-0.5", props.iconClass)} />}
        <div class="text-sm">
          {props.item.trigger === "VENDOR_AGENT" && (
            <div class="bg-blue-400 rounded p-1 text-xs inline mr-1 text-white">
              Vendor
            </div>
          )}
          {parseMessageToJSX(props.item.message)}
        </div>
      </div>
      <div class="text-xs text-gray-400 flex-shrink-0 ml-2">
        {toLocaleDateTime(props.item.createdAt)}
      </div>
    </li>
}

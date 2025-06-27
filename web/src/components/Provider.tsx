import Layers from "lucide-solid/icons/layers";
import Cog from "lucide-solid/icons/cog";
import { Button } from "./commons/Btn";
import { ActivityLog, ActivityLogs } from "./ActivityLogs";
import { Accessor } from "solid-js";

interface Props {
	start: Accessor<boolean>;
	logs: ActivityLog[];
}
export function Provider(props: Props) {
	function handleSimulate() {}
	return (
		<div class="px-4 flex flex-col gap-4">
			<ActivityLogs type="provider" start={props.start()} logs={props.logs} />
			<div class="fixed bottom-0 right-0 z-10 -scale-x-[1]">
				{/* @ts-ignore */}
				<dotlottie-player
					src="https://lottie.host/ebe0bee9-4942-46a5-9be6-0a94075efb9a/6MK6HFBzQo.lottie"
					background="transparent"
					speed="1"
					style="width: 200px; height: 200px"
					loop
					autoplay
				/>
			</div>
		</div>
	);
}

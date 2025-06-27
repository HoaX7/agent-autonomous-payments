import { onMount, type JSXElement } from "solid-js";

export type ModalProps = {
	children: JSXElement;
	title: string | JSXElement;
	onClose: () => void;
	widthClass?: string;
};
export function Modal(props: ModalProps) {
	let dialogRef: HTMLDialogElement;
	function close() {
		props.onClose();
	}
	onMount(() => {
		dialogRef.addEventListener("close", close);
		dialogRef.addEventListener("cancel", close);
		dialogRef.showModal();
		return () => {
			dialogRef.removeEventListener("close", close);
			dialogRef.removeEventListener("cancel", close);
		};
	});
	return (
		<dialog ref={(el) => (dialogRef = el)} class="modal text-white/70" data-theme="dark">
			<div class="modal-box max-w-5xl p-0 glass" classList={{ [props.widthClass || ""]: true, "w-80": !props.widthClass }}>
				<form method="dialog" id="modal-dialog">
					<h2 class="bg-black/70 p-4 font-bold ">{props.title}</h2>
					<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-3" title="Close">
						✕
					</button>
				</form>
				{props.children}
			</div>
			<button class="modal-backdrop" form="modal-dialog">
				Close
			</button>
		</dialog>
	);
}

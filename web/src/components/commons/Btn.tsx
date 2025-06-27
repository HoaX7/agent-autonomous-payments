import { splitProps, type JSX, type JSXElement } from "solid-js";
import { Loading } from "./Loading";

export function Button(
	_props: { loading?: boolean; icon?: JSXElement; children: JSXElement } & JSX.ButtonHTMLAttributes<HTMLButtonElement>
) {
	let [props, btnProps] = splitProps(_props, ["loading", "icon", "children"]);
	return (
		<button {...btnProps} disabled={btnProps.disabled || props.loading}>
			{!props.loading && props.icon} {props.children} {props.loading && <Loading noText={true} />}
		</button>
	);
}

import { Suspense, type Component } from "solid-js";

const App: Component = (props: { children: Element }) => {
	return (
		<main class="h-full">
			<Suspense>{props.children}</Suspense>
		</main>
	);
};

export default App;

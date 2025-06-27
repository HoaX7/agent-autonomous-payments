import sequenceDiagram from "../img/sequence-diagram.svg";
import labels from "../img/sequence-diagram-labels.svg";
import architectureDiagram from "../img/architecture-diagram.svg";
import { BackButton } from "../components/commons/BackBtn";

export default function Architecture() {
  return (
    <div data-theme="dark" class="p-8">
      <div class="text-xl font-bold">
        <BackButton />
      </div>
      <div class="mt-5 container mx-auto">
        <div class="text-3xl font-bold text-center my-5">Architecture Diagram</div>
        <img 
          alt="architecture-diagram"
          class="glass rounded-md p-2"
          src={architectureDiagram}
          width={"100%"}
          height={"100%"}
        />
        <div class="mt-12">
          <div class="text-3xl mb-5 text-center font-bold">Sequence Diagram</div>
        <img
          alt="sequence-diagram-labels"
          class="top-0 sticky glass rounded-md p-2"
          src={labels}
          width="100%"
          height="100%"
        />
        <img
          alt="a2a-payments-sequence-diagram"
          class="-mt-11"
          src={sequenceDiagram}
          width="100%"
          height="100%"
        />
        </div>
      </div>
    </div>
  );
}

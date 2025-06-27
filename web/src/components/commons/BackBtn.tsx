import { useNavigate } from "@solidjs/router";
import { ChevronLeftIcon } from "lucide-solid";

export function BackButton() {
  const navigate = useNavigate();

  return <button onClick={() => navigate(-1)} class="cursor-pointer">
    <ChevronLeftIcon class="inline" /> Back
  </button>;
}
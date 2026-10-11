import { bump } from "./store";
export function revalidatePath() {
  bump();
}
export function revalidateTag() {
  bump();
}

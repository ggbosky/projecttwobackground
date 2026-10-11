// Verze dat pro náhled – změna vyvolá překreslení stránek (jako revalidatePath)
type L = () => void;
let version = 0;
const ls = new Set<L>();
export const getVersion = () => version;
export const subscribeVersion = (l: L) => {
  ls.add(l);
  return () => ls.delete(l);
};
export function bump() {
  version++;
  ls.forEach((l) => l());
}

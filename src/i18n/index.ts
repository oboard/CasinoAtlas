import { computed, ref } from "vue";
export type AppLocale = "zh-CN" | "en-US";
const initial =
  (localStorage.getItem("casino-atlas-locale") as AppLocale) ||
  (navigator.language.startsWith("zh") ? "zh-CN" : "en-US");
export const locale = ref<AppLocale>(initial);
export const isChinese = computed(() => locale.value === "zh-CN");
export function setLocale(value: AppLocale) {
  locale.value = value;
  localStorage.setItem("casino-atlas-locale", value);
}
export function t(zh: string, en: string) {
  return computed(() => (locale.value === "zh-CN" ? zh : en));
}

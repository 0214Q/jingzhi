import { reactive, readonly } from 'vue';
// 阶段 0 仅提供状态容器；身份由后续登录流程赋值。
const state = reactive({ displayName: '', authenticated: false });
export const session = readonly(state);
export function clearSession(): void { state.displayName = ''; state.authenticated = false; }

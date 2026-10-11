import { router } from '@kit.ArkUI';
import { sessionServiceProvider } from './SessionProvider';
export async function goToLogin(): Promise<void> {
  sessionServiceProvider.get().invalidate();
  await router.replaceUrl({ url: 'pages/Login' });
  router.clear();
}
export async function goToHome(): Promise<void> {
  await router.replaceUrl({ url: 'pages/Index' });
  router.clear();
}
export async function requireStudentSession(isActive: () => boolean = () => true): Promise<boolean> {
  let valid: boolean = false;
  try { valid = await sessionServiceProvider.get().check(); } catch {}
  if (!isActive()) return false;
  if (!valid) { await goToLogin(); return false; }
  return true;
}

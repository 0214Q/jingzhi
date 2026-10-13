import { router } from '@kit.ArkUI';
import { sessionServiceProvider } from './SessionProvider';
import { studentSchoolProvider } from './StudentSchoolService';
import { RepositoryError } from '../repository/RepositoryError';
let schoolRouting: boolean = false;
export async function goToLogin(): Promise<void> {
  sessionServiceProvider.get().invalidate();
  studentSchoolProvider.get().reset();
  await router.replaceUrl({ url: 'pages/Login' });
  router.clear();
}
export async function goToHome(): Promise<void> {
  await router.replaceUrl({ url: 'pages/Index' });
  router.clear();
}
export async function goToSchoolSelection(): Promise<void> {
  if (schoolRouting) return;
  schoolRouting = true;
  try { await router.replaceUrl({ url: 'pages/SchoolSelection' }); router.clear(); }
  finally { schoolRouting = false; }
}
export async function requireStudentSession(isActive: () => boolean = () => true): Promise<boolean> {
  let valid: boolean = false;
  try { valid = await sessionServiceProvider.get().check(); } catch {}
  if (!isActive()) return false;
  if (!valid) { await goToLogin(); return false; }
  return true;
}
export async function requireStudentSchool(isActive: () => boolean = () => true): Promise<boolean> {
  if (!(await requireStudentSession(isActive))) return false;
  const user = sessionServiceProvider.get().snapshot().user;
  if (user === null || !isActive()) return false;
  const school = studentSchoolProvider.get(); school.bind(user.id);
  try {
    const context = await school.refresh();
    if (!isActive()) return false;
    if (context.selectedSchool === null) { await goToSchoolSelection(); return false; }
    return true;
  } catch (error) {
    if (!isActive()) return false;
    if (error instanceof RepositoryError && error.code === 401) await goToLogin();
    else { school.invalidate(); await goToSchoolSelection(); }
    return false;
  }
}

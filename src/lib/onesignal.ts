import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = '0a15835d-f878-4822-a477-761bbf8e10ea';

let initialized = false;

export async function initOneSignal() {
  if (initialized) return;
  
  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true, // Para desenvolvimento
    });
    
    initialized = true;
    console.log('OneSignal inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar OneSignal:', error);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permission = await OneSignal.Notifications.requestPermission();
    return permission;
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return false;
  }
}

export async function isPushEnabled(): Promise<boolean> {
  try {
    return await OneSignal.Notifications.permission;
  } catch {
    return false;
  }
}

export async function setExternalUserId(userId: string) {
  try {
    await OneSignal.login(userId);
    console.log('External User ID definido:', userId);
  } catch (error) {
    console.error('Erro ao definir External User ID:', error);
  }
}

export async function removeExternalUserId() {
  try {
    await OneSignal.logout();
  } catch (error) {
    console.error('Erro ao remover External User ID:', error);
  }
}

export async function setUserTags(tags: Record<string, string>) {
  try {
    await OneSignal.User.addTags(tags);
  } catch (error) {
    console.error('Erro ao definir tags:', error);
  }
}

export { OneSignal };

import { useState, useEffect } from 'react';
import api from '../services/api';

interface PushSubscriptionResult {
  supported: boolean;
  permission: NotificationPermission | null;
  subscription: PushSubscription | null;
}

export const usePushNotifications = () => {
  const [pushState, setPushState] = useState<PushSubscriptionResult>({
    supported: false,
    permission: null,
    subscription: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState({
        supported: false,
        permission: null,
        subscription: null
      });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setPushState({
        supported: true,
        permission: Notification.permission,
        subscription: subscription
      });
    } catch (error) {
      console.error('Error checking push support:', error);
      setPushState({
        supported: true,
        permission: Notification.permission,
        subscription: null
      });
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!pushState.supported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribeToPush = async (): Promise<boolean> => {
    if (!pushState.supported) {
      console.warn('Push notifications not supported');
      return false;
    }

    setLoading(true);
    try {
      const hasPermission = pushState.permission === 'granted' || await requestPermission();
      if (!hasPermission) {
        setLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const response = await api.get('/notifications/vapid-public-key') as any;
      const vapidPublicKey = response.data.publicKey;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      await api.post('/notifications/push-subscription', {
        subscription: subscription.toJSON()
      });

      setPushState(prev => ({ ...prev, subscription }));
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      setLoading(false);
      return false;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!pushState.subscription) {
      return true;
    }

    setLoading(true);
    try {
      await pushState.subscription.unsubscribe();
      
      await api.delete('/notifications/push-subscription');

      setPushState(prev => ({ ...prev, subscription: null }));
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      setLoading(false);
      return false;
    }
  };

  return {
    ...pushState,
    loading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    checkPushSupport
  };
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

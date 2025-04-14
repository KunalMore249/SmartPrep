export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function scheduleSlotNotification(slot: {
  subject: string;
  topic: string;
  start_time: string;
}) {
  if (Notification.permission !== 'granted') return;

  const now = new Date();
  const startTime = new Date(slot.start_time);
  const timeUntilStart = startTime.getTime() - now.getTime();

  // Schedule notification 5 minutes before start time
  const notificationTime = Math.max(timeUntilStart - 5 * 60 * 1000, 0);

  setTimeout(() => {
    new Notification('Study Session Starting Soon', {
      body: `${slot.subject}: ${slot.topic}\nStarts in 5 minutes`,
      icon: '/favicon.ico',
    });
  }, notificationTime);
}
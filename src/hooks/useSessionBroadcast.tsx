
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useSessionBroadcast = () => {
  const { session, user } = useAuth();

  const broadcastSession = useCallback(async (action: 'signin' | 'signout' | 'refresh') => {
    if (!user) return;

    try {
      const channel = supabase.channel(`session-${user.id}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'session_update',
        payload: {
          action,
          userId: user.id,
          timestamp: new Date().toISOString(),
          sessionActive: !!session,
        },
      });

      console.log(`Session broadcast sent: ${action}`, { userId: user.id });
    } catch (error) {
      console.error('Failed to broadcast session:', error);
    }
  }, [session, user]);

  const subscribeToSessionUpdates = useCallback((callback: (payload: any) => void) => {
    if (!user) return null;

    const channel = supabase
      .channel(`session-${user.id}`)
      .on('broadcast', { event: 'session_update' }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Broadcast session changes automatically
  useEffect(() => {
    if (session && user) {
      broadcastSession('refresh');
    }
  }, [session, user, broadcastSession]);

  return {
    broadcastSession,
    subscribeToSessionUpdates,
  };
};

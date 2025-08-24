import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuditCompliance } from "@/hooks/useAuditCompliance";

export const ActivityTracker = () => {
  const location = useLocation();
  const { logUserActivity } = useAuditCompliance();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logUserActivity('page_focus', `Focused on page: ${location.pathname}`);
      } else {
        logUserActivity('page_blur', `Left page: ${location.pathname}`);
      }
    };

    const handleBeforeUnload = () => {
      logUserActivity('page_unload', `Leaving page: ${location.pathname}`);
    };

    // Track page view
    logUserActivity('page_view', `Visited page: ${location.pathname}`, {
      pathname: location.pathname,
      search: location.search,
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
      user_agent: navigator.userAgent
    });

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track mouse movement for session activity
    let lastActivity = Date.now();
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 30000) { // 30 seconds
        logUserActivity('user_activity', 'User interaction detected');
        lastActivity = now;
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [location.pathname]); // Fixed: Only depend on pathname, not the entire location object or logUserActivity function

  return null; // This is a tracking component, no visual output
};

export default ActivityTracker;
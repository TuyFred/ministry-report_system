export const detectDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (window.innerWidth >= 768 && window.innerWidth < 1024 && !isMobile);

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
};

export default detectDeviceType;

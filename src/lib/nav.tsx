import { forwardRef, type ComponentProps } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';

export const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof RouterLink>>(function Link(props, ref) {
  return <RouterLink ref={ref} {...props} />;
});

export const usePathname = () => useLocation().pathname;
export const useRouter = () => {
  const navigate = useNavigate();
  return { push: (to: string) => navigate(to), replace: (to: string) => navigate(to, { replace: true }), back: () => navigate(-1) };
};

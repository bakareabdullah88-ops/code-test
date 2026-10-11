import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import { sessionService } from '@/lib/services/system';

export const usePersonas = () => useQuery({ queryKey: qk.personas, queryFn: sessionService.personas });

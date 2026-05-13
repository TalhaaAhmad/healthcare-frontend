'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { frappeClient } from '@/lib/frappe-client';

export function usePaginatedList(doctype: string, filters?: any, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: [doctype, 'paginated', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await frappeClient.get(`/resource/${doctype}`, {
        filters,
        limit_start: pageParam,
        limit_page_length: pageSize,
        order_by: 'creation desc',
      });
      return res.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === pageSize ? allPages.length * pageSize : undefined;
    },
  });
}

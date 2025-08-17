import React, { memo, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OptimizedTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  keyExtractor: (item: any, index: number) => string;
  className?: string;
  emptyMessage?: string;
  pageSize?: number;
  currentPage?: number;
}

// Memoized table row component
const MemoizedRow = memo(({ children, rowKey }: { children: React.ReactNode; rowKey: string }) => (
  <TableRow key={rowKey}>{children}</TableRow>
));

MemoizedRow.displayName = "MemoizedRow";

export const OptimizedTable = memo<OptimizedTableProps>(({
  headers,
  data,
  renderRow,
  keyExtractor,
  className,
  emptyMessage = "No data available",
  pageSize = 50,
  currentPage = 1
}) => {
  // Paginate data for better performance
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // Memoize headers
  const memoizedHeaders = useMemo(() => (
    <TableHeader>
      <TableRow>
        {headers.map((header, index) => (
          <TableHead key={`header-${index}`}>{header}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
  ), [headers]);

  // Memoize table body
  const memoizedBody = useMemo(() => (
    <TableBody>
      {paginatedData.length === 0 ? (
        <TableRow>
          <TableCell colSpan={headers.length} className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </TableCell>
        </TableRow>
      ) : (
        paginatedData.map((item, index) => (
          <MemoizedRow
            key={keyExtractor(item, index)}
            rowKey={keyExtractor(item, index)}
          >
            {renderRow(item, index)}
          </MemoizedRow>
        ))
      )}
    </TableBody>
  ), [paginatedData, headers.length, emptyMessage, renderRow, keyExtractor]);

  return (
    <Table className={className}>
      {memoizedHeaders}
      {memoizedBody}
    </Table>
  );
});

OptimizedTable.displayName = "OptimizedTable";
"use client";

import Sidebar from "@/app/components/Sidebar";
import withAuth from "@/app/components/withAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Schema
const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

// Dummy table data
const data = [
  {
    id: "m5gr84i9",
    status: "active",
    brands: "success",
    contact: "1234567890",
    email: "ken99@example.com",
  },
  {
    id: "3u1reuv4",
    status: "active",
    brands: "success",
    contact: "1234567890",
    email: "Abe45@example.com",
  },
  {
    id: "derv1ws0",
    status: "active",
    brands: "processing",
    contact: "1234567890",
    email: "Monserrat44@example.com",
  },
  {
    id: "5kma53ae",
    status: "active",
    brands: "success",
    email: "Silas22@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
  {
    id: "bhqecj4p",
    status: "inactive",
    brands: "failed",
    email: "carmella@example.com",
    contact: "1234567890",
  },
];

// Table columns
const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "brands",
    header: "Customer Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("brands")}</div>
    ),
  },
  {
    accessorKey: "contact",
    header: "Contact Number",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("contact")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Product Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
              className="flex justify-between"
            >
              Edit
              <Pencil />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex justify-between">
              Delete
              <Trash2 />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function Orders() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values) {
    console.log(values);
  }

  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Sidebar className="w-full">
      <div className="flex gap-4 p-4">
        <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter Orders..."
                value={table.getColumn("brands")?.getFilterValue() ?? ""}
                onChange={(event) =>
                  table.getColumn("brands")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default withAuth(Orders);

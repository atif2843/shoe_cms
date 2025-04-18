"use client";

import Sidebar from "@/app/components/Sidebar";
import withAuth from "@/app/components/withAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { Pencil, Trash2, UserCircle, Download } from "lucide-react";
import ActionsCell from "@/app/components/ActionsCell"
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "./../lib/supabaseClient";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';

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
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.avatar ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.avatar} alt={row.getValue("name")} />
            <AvatarFallback>{row.getValue("name")?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-gray-500" />
          </div>
        )}
        <div className="capitalize">{row.getValue("name")}</div>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("phone")}</div>
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
      const user = row.original;
      return <ActionsCell user={user}/>
    },
  },
];

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast.error('Please select users to delete');
      return;
    }

    try {
      setIsDeleting(true);
      const selectedIds = selectedRows.map(row => row.original.id);
      
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;
      
      toast.success(`${selectedIds.length} user(s) deleted successfully`);
      // Refresh the table data
      window.location.reload();
    } catch (error) {
      toast.error('Error deleting users');
      console.error('Error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    // Prepare data for export
    const exportData = users.map(user => ({
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      Status: user.status,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    
    // Generate Excel file
    XLSX.writeFile(wb, "users.xlsx");
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*');

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Error fetching users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const table = useReactTable({
    data: users,
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

  if (loading) {
    return (
      <Sidebar className="w-full">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Loading users...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="w-full">
      <div className="flex gap-4 p-4">
        <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter users..."
                value={table.getColumn("name")?.getFilterValue() ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected ({table.getFilteredSelectedRowModel().rows.length})
                      </>
                    )}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
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
                        No users found.
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

export default withAuth(Users);

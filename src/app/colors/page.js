"use client";

import Sidebar from "@/app/components/Sidebar";
import withAuth from "@/app/components/withAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "./../lib/supabaseClient";
import { useEffect, useState } from "react";
import
{
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import
{
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
import
{
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import
{
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import
{
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import SuccessPopup from "@/app/components/SuccessPopup";

const formSchema = z.object( {
  color_name: z.string().min( 2, {
    message: "colors must be at least 2 characters.",
  } ),
  hex_code: z.string().min( 2, {
    message: "colors must be at least 2 characters.",
  } ),
  status: z.string().nonempty( { message: "Please select a status" } ),
  slug: z.string().optional(),
} );

function Colors ()
{
  const form = useForm( {
    resolver: zodResolver( formSchema ),
    defaultValues: {
      color_name: "",
      hex_code: "#000000",
      status: "",
    },
  } );

  const [ colors, setColors ] = useState( [] );
  const [ selectedStatus, setSelectedStatus ] = useState( "" );
  const [ editItem, setEditItem ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ isDeleteModalOpen, setIsDeleteModalOpen ] = useState( false );
  const [ colorToDelete, setColorToDelete ] = useState( null );
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  useEffect( () =>
  {
    fetchColors();
  }, [] );

  const columns = [
    {
      id: "select",
      header: ( { table } ) => (
        <Checkbox
          checked={ table.getIsAllPageRowsSelected() }
          onCheckedChange={ ( value ) => table.toggleAllPageRowsSelected( !!value ) }
          aria-label="Select all"
        />
      ),
      cell: ( { row } ) => (
        <Checkbox
          checked={ row.getIsSelected() }
          onCheckedChange={ ( value ) => row.toggleSelected( !!value ) }
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "color_name",
      header: "Colors Name",
      cell: ( { row } ) => <div> { row.getValue( "color_name" ) }</div>,
    },
    {
      accessorKey: "hex_code",
      header: "Colors",
      cell: ( { row } ) => <div> <span style={ { background: row.getValue( "hex_code" ) } } className="inline-block w-4 h-4 mx-2 rounded-full"></span>
        { row.getValue( "hex_code" ) }</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ( { row } ) => <div>{ row.getValue( "status" ) }</div>,
    },
    {
      id: "Actions",
      cell: ( { row } ) =>
      {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={ () =>
                {
                  setEditItem( item );
                  form.setValue( "color_name", item.color_name );
                  form.setValue( "hex_code", item.hex_code );
                  form.setValue( "status", item.status );
                } }
              >
                Edit <Pencil className="ml-2" size={ 16 } />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={ () => handleDeleteClick(item) }
              >
                Delete <Trash2 className="ml-2" size={ 16 } />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const fetchColors = async () =>
  {
    setLoading( true );
    const { data, error } = await supabase.from( "colors" ).select( "*" );
    if ( !error ) setColors( data );
    setLoading( false );
  };

  const handleDeleteClick = (color) => {
    setColorToDelete(color);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (colorToDelete) {
      await deleteColor(colorToDelete);
      setIsDeleteModalOpen(false);
      setColorToDelete(null);
    }
  };

  const deleteColor = async (item) => {
    try {
      const { error } = await supabase
        .from("colors")
        .delete()
        .eq("id", item.id);
        
      if (error) throw error;
      
      // Refresh the colors list
      fetchColors();
      setPopupMessage("Color deleted successfully");
      setPopupType("success");
      setShowPopup(true);
    } catch (error) {
      console.error('Error deleting color:', error);
      setPopupMessage("Failed to delete color");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  const onSubmit = async (values) => {
    try {
      // Generate slug from color_name
      const slug = values.color_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (editItem) {
        const { error } = await supabase
          .from("colors")
          .update({
            color_name: values.color_name,
            hex_code: values.hex_code,
            status: values.status,
            slug: slug,
          })
          .eq("id", editItem.id);

        if (error) {
          console.error('Error updating color:', error);
          setPopupMessage("Failed to update color");
          setPopupType("error");
          setShowPopup(true);
          return;
        }
        
        fetchColors();
        setEditItem(null);
        form.reset();
        setSelectedStatus("");
        setPopupMessage("Color updated successfully");
        setPopupType("success");
        setShowPopup(true);
      } else {
        const { error } = await supabase
          .from("colors")
          .insert([
            {
              color_name: values.color_name,
              hex_code: values.hex_code,
              status: values.status,
              slug: slug,
            },
          ]);

        if (error) {
          console.error('Error inserting color:', error);
          setPopupMessage("Failed to create color");
          setPopupType("error");
          setShowPopup(true);
          return;
        }

        fetchColors();
        form.reset();
        setSelectedStatus("");
        setPopupMessage("Color created successfully");
        setPopupType("success");
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setPopupMessage("An unexpected error occurred");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  const [ sorting, setSorting ] = useState( [] );
  const [ columnFilters, setColumnFilters ] = useState( [] );
  const [ columnVisibility, setColumnVisibility ] = useState( {} );
  const [ rowSelection, setRowSelection ] = useState( {} );

  const table = useReactTable( {
    data: colors,
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
  } );

  return (
    <Sidebar className="w-full">
      <SuccessPopup 
        message={popupMessage}
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
        type={popupType}
      />
      <div className="flex gap-4 p-4">
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this color? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="font-medium">Color Details:</p>
              <p>Name: {colorToDelete?.color_name}</p>
              <p>Hex Code: {colorToDelete?.hex_code}</p>
              <p>Status: {colorToDelete?.status}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setColorToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="w-1/2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="color_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter color name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hex_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hex Code</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Enter hex code" {...field} />
                      </FormControl>
                      <div className="flex items-center">
                        <Input 
                          type="color" 
                          value={field.value} 
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-12 h-10 p-1 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </div>

        <div className="w-1/2 border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter Colors..."
                value={ table.getColumn( "color_name" )?.getFilterValue() ?? "" }
                onChange={ ( event ) =>
                  table
                    .getColumn( "color_name" )
                    ?.setFilterValue( event.target.value )
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
                  { table
                    .getAllColumns()
                    .filter( ( col ) => col.getCanHide() )
                    .map( ( column ) => (
                      <DropdownMenuCheckboxItem
                        key={ column.id }
                        className="capitalize"
                        checked={ column.getIsVisible() }
                        onCheckedChange={ ( value ) =>
                          column.toggleVisibility( !!value )
                        }
                      >
                        { column.id }
                      </DropdownMenuCheckboxItem>
                    ) ) }
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            { loading ? (
              <div className="text-center py-10">Loading...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    { table.getHeaderGroups().map( ( headerGroup ) => (
                      <TableRow key={ headerGroup.id }>
                        { headerGroup.headers.map( ( header ) => (
                          <TableHead key={ header.id }>
                            { header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              ) }
                          </TableHead>
                        ) ) }
                      </TableRow>
                    ) ) }
                  </TableHeader>
                  <TableBody>
                    { table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map( ( row ) => (
                        <TableRow
                          key={ row.id }
                          data-state={ row.getIsSelected() && "selected" }
                          className={row.getIsSelected() ? "bg-blue-100" : ""}
                        >
                          { row.getVisibleCells().map( ( cell ) => (
                            <TableCell key={ cell.id }>
                              { flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              ) }
                            </TableCell>
                          ) ) }
                        </TableRow>
                      ) )
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={ columns.length }
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    ) }
                  </TableBody>
                </Table>
              </div>
            ) }

            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                { table.getFilteredSelectedRowModel().rows.length } of{ " " }
                { table.getFilteredRowModel().rows.length } row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={ () => table.previousPage() }
                  disabled={ !table.getCanPreviousPage() }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={ () => table.nextPage() }
                  disabled={ !table.getCanNextPage() }
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

export default withAuth( Colors );

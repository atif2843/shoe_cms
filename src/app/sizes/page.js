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

const formSchema = z.object( {
  sizes: z.string().min( 2, {
    message: "sizes must be at least 2 characters.",
  } ),
  status: z.string().nonempty( { message: "Please select a status" } ),
} );




function Sizes ()
{
  const form = useForm( {
    resolver: zodResolver( formSchema ),
    defaultValues: {
      sizes: "",
      status: "",
    },
  } );


  const [ sizes, setSizes ] = useState( [] );
  const [ selectedStatus, setSelectedStatus ] = useState( "" );
  const [ editItem, setEditItem ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ isDeleteModalOpen, setIsDeleteModalOpen ] = useState( false );
  const [ sizeToDelete, setSizeToDelete ] = useState( null );

  useEffect( () =>
  {
    fetchSizes();
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
      accessorKey: "size",
      header: "Size",
      cell: ( { row } ) => <div>{ row.getValue( "size" ) }</div>,
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
                  form.setValue( "sizes", item.size );
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

  const fetchSizes = async () =>
  {
    setLoading( true );
    const { data, error } = await supabase.from( "sizes" ).select( "*" );
    if ( !error ) setSizes( data );
    setLoading( false );
  };

  const handleDeleteClick = (size) => {
    setSizeToDelete(size);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (sizeToDelete) {
      await deleteSize(sizeToDelete);
      setIsDeleteModalOpen(false);
      setSizeToDelete(null);
    }
  };

  const deleteSize = async (item) => {
    try {
      const { error } = await supabase
        .from("sizes")
        .delete()
        .eq("id", item.id);
        
      if (error) throw error;
      
      fetchSizes();
      toast.success("Size deleted successfully");
    } catch (error) {
      console.error('Error deleting size:', error);
      toast.error("Failed to delete size");
    }
  };

  const onSubmit = async ( values ) =>
  {
    if ( editItem )
    {
      const { error } = await supabase
        .from( "sizes" )
        .update( { size: values.sizes, status: values.status } )
        .eq( "id", editItem.id );
      if ( !error )
      {
        fetchSizes();
        setEditItem( null );
        form.reset();
        setSelectedStatus( "" );
      }
    } else
    {

      const { error } = await supabase
        .from( "sizes" )
        .insert( [ { size: values.sizes, status: values.status } ] );



      if ( !error )
      {
        fetchSizes(); // Refresh the full list instead of adding manually
        form.reset();
        setSelectedStatus( "" );
      }
    }
  };


  const [ sorting, setSorting ] = useState( [] );
  const [ columnFilters, setColumnFilters ] = useState( [] );
  const [ columnVisibility, setColumnVisibility ] = useState( {} );
  const [ rowSelection, setRowSelection ] = useState( {} );

  const table = useReactTable( {
    data: sizes,
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
      <div className="flex gap-4 p-4">
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this size? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="font-medium">Size Details:</p>
              <p>Size: {sizeToDelete?.size}</p>
              <p>Status: {sizeToDelete?.status}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSizeToDelete(null);
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
          <Form { ...form }>
            <form onSubmit={ form.handleSubmit( onSubmit ) } className="space-y-8">
              {/* sizes Field */ }
              <FormField
                control={ form.control }
                name="sizes"
                render={ ( { field } ) => (
                  <FormItem>
                    <FormLabel>Add sizes</FormLabel>
                    <FormControl>
                      <Input placeholder="Add sizes" { ...field } />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />

              {/* Status Field */ }
              <FormField
                control={ form.control }
                name="status"
                render={ ( { field } ) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={ field.onChange }
                      value={ field.value }>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Status of Brand" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                ) }
              />

              {/* Submit Button */ }
              <Button type="submit" disabled={ form.formState.isSubmitting }>
                { editItem ? "Update" : "Submit" }
              </Button>
            </form>
          </Form>
        </div>

        <div className="w-1/2 border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter sizes..."
                value={ table.getColumn( "size" )?.getFilterValue() ?? "" }
                onChange={ ( event ) =>
                  table.getColumn( "size" )?.setFilterValue( event.target.value )
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

export default withAuth( Sizes );

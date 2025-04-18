"use client";

import Sidebar from "@/app/components/Sidebar";
import withAuth from "@/app/components/withAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { Pencil, Trash2, Upload, X, Loader2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object( {
  categories: z.string().min( 2, {
    message: "Categories must be at least 2 characters.",
  } ),
  status: z.string().nonempty( { message: "Please select a status" } ),
} );




function Categrories ()
{
  const form = useForm( {
    resolver: zodResolver( formSchema ),
    defaultValues: {
      categories: "",
      status: "",
    },
  } );


  const [ categories, setCategories ] = useState( [] );
  const [ selectedStatus, setSelectedStatus ] = useState( "" );
  const [ editItem, setEditItem ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ selectedImage, setSelectedImage ] = useState( null );
  const [ imagePreview, setImagePreview ] = useState( null );
  const [ isUploading, setIsUploading ] = useState( false );
  const [ uploadProgress, setUploadProgress ] = useState( 0 );
  
  // Add new state for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect( () =>
  {
    fetchCategories();
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
      accessorKey: "image",
      header: "Image",
      cell: ( { row } ) =>
      {
        const imageUrl = row.getValue( "image" );
        return (
          <div className="w-16 h-16 rounded-md overflow-hidden">
            { imageUrl ? (
              <img
                src={ imageUrl }
                alt="Category"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                <Upload className="h-6 w-6" />
              </div>
            ) }
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Category",
      cell: ( { row } ) => <div>{ row.getValue( "name" ) }</div>,
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
                  form.setValue( "categories", item.name );
                  form.setValue( "status", item.status );
                  if ( item.image )
                  {
                    setImagePreview( item.image );
                  }
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

  const fetchCategories = async () =>
  {
    setLoading( true );
    const { data, error } = await supabase.from( "categories" ).select( "*" );
    if ( !error ) setCategories( data );
    setLoading( false );
  };

  const handleImageSelect = ( e ) =>
  {
    const file = e.target.files[ 0 ];
    if ( file )
    {
      setSelectedImage( file );
      const reader = new FileReader();
      reader.onloadend = () =>
      {
        setImagePreview( reader.result );
      };
      reader.readAsDataURL( file );
    }
  };

  const uploadImageToSupabase = async ( file, categoryId ) =>
  {
    try
    {
      const fileExt = file.name.split( '.' ).pop();
      const fileName = `${ categoryId }_${ Date.now() }.${ fileExt }`;
      const filePath = `${ categoryId }/${ fileName }`;

      const { error: uploadError } = await supabase.storage
        .from( 'categories' )
        .upload( filePath, file, {
          cacheControl: '3600',
          upsert: false
        } );

      if ( uploadError ) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from( 'categories' )
        .getPublicUrl( filePath );

      return publicUrl;
    } catch ( error )
    {
      console.error( 'Error uploading image:', error );
      throw error;
    }
  };

  const onSubmit = async ( values ) =>
  {
    if ( editItem )
    {
      try
      {
        let imageUrl = editItem.image;
        
        // If a new image is selected, upload it
        if ( selectedImage )
        {
          setIsUploading( true );
          imageUrl = await uploadImageToSupabase( selectedImage, editItem.id );
          setIsUploading( false );
        }

        // Generate slug from category name
        const slug = values.categories.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const { error } = await supabase
          .from( "categories" )
          .update( { 
            name: values.categories, 
            status: values.status,
            image: imageUrl,
            slug: slug
          } )
          .eq( "id", editItem.id );

        if ( !error )
        {
          fetchCategories();
          setEditItem( null );
          form.reset();
          setSelectedStatus( "" );
          setSelectedImage( null );
          setImagePreview( null );
          toast.success( "Category updated successfully" );
        }
      } catch ( error )
      {
        console.error( 'Error updating category:', error );
        toast.error( "Failed to update category" );
      }
    } else
    {
      try
      {
        // Generate slug from category name
        const slug = values.categories.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // First create the category
        const { data, error } = await supabase
          .from( "categories" )
          .insert( [ { 
            name: values.categories, 
            status: values.status,
            slug: slug
          } ] )
          .select();

        if ( error ) throw error;

        // If an image was selected, upload it
        if ( selectedImage && data[ 0 ] )
        {
          setIsUploading( true );
          const imageUrl = await uploadImageToSupabase( selectedImage, data[ 0 ].id );
          
          // Update the category with the image URL
          const { error: updateError } = await supabase
            .from( "categories" )
            .update( { image: imageUrl } )
            .eq( "id", data[ 0 ].id );

          if ( updateError ) throw updateError;
          setIsUploading( false );
        }

        fetchCategories();
        form.reset();
        setSelectedStatus( "" );
        setSelectedImage( null );
        setImagePreview( null );
        toast.success( "Category created successfully" );
      } catch ( error )
      {
        console.error( 'Error creating category:', error );
        toast.error( "Failed to create category" );
      }
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const deleteCategory = async (item) => {
    try {
      // First check if there's an image to delete
      if (item.image) {
        // List all files in the category folder
        const { data: storageData, error: listError } = await supabase.storage
          .from('categories')
          .list(`${item.id}/`);

        if (listError) {
          console.error('Error listing storage files:', listError);
          return;
        }

        if (storageData && storageData.length > 0) {
          // Get all file paths in the category folder
          const filePaths = storageData.map(file => `${item.id}/${file.name}`);
          
          // Delete all files in the folder
          const { error: deleteError } = await supabase.storage
            .from('categories')
            .remove(filePaths);

          if (deleteError) {
            console.error('Error deleting files from storage:', deleteError);
            return;
          }
        }
      }
      
      // Delete the category from the database
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", item.id);
        
      if (error) throw error;
      
      // Refresh the categories list
      fetchCategories();
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Failed to delete category");
    }
  };

  const [ sorting, setSorting ] = useState( [] );
  const [ columnFilters, setColumnFilters ] = useState( [] );
  const [ columnVisibility, setColumnVisibility ] = useState( {} );
  const [ rowSelection, setRowSelection ] = useState( {} );

  const table = useReactTable( {
    data: categories,
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
        {/* Add Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this category? This action cannot be undone.
                All associated images will also be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="font-medium">Category Details:</p>
              <p>Name: {categoryToDelete?.name}</p>
              <p>Status: {categoryToDelete?.status}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setCategoryToDelete(null);
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
              {/* Category Field */ }
              <FormField
                control={ form.control }
                name="categories"
                render={ ( { field } ) => (
                  <FormItem>
                    <FormLabel>Add Categories</FormLabel>
                    <FormControl>
                      <Input placeholder="Add Categories" { ...field } />
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
                          <SelectValue placeholder="Status of Category" />
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

              {/* Image Upload Field */ }
              <FormItem>
                <FormLabel>Category Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={ handleImageSelect }
                        />
                      </label>
                    </div>
                    { imagePreview && (
                      <div className="relative w-full h-48">
                        <img
                          src={ imagePreview }
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={ () => {
                            setSelectedImage( null );
                            setImagePreview( null );
                          } }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) }
                    { isUploading && (
                      <div className="space-y-2">
                        <Progress value={ uploadProgress } />
                        <p className="text-sm text-gray-500">Uploading image...</p>
                      </div>
                    ) }
                  </div>
                </FormControl>
              </FormItem>

              {/* Submit Button */ }
              <Button type="submit" disabled={ isUploading }>
                { isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    { editItem ? "Updating..." : "Creating..." }
                  </>
                ) : (
                  editItem ? "Update" : "Submit"
                ) }
              </Button>
            </form>
          </Form>
        </div>

        <div className="w-1/2 border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter Categories..."
                value={ table.getColumn( "name" )?.getFilterValue() ?? "" }
                onChange={ ( event ) =>
                  table.getColumn( "name" )?.setFilterValue( event.target.value )
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

export default withAuth( Categrories );

"use client";

import Sidebar from "@/app/components/Sidebar";
import withAuth from "@/app/components/withAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { supabase } from "./../lib/supabaseClient";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import SuccessPopup from "@/app/components/SuccessPopup";
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

const formSchema = z.object( {
  brands: z.string().min( 2, {
    message: "Brands must be at least 2 characters.",
  } ),
  status: z.string().nonempty( { message: "Please select a status" } ),
  image: z.any().optional(), // File field
  backgroundImage: z.any().optional(), // Background image field
} );




function Brands ()
{
  const form = useForm( {
    resolver: zodResolver( formSchema ),
    defaultValues: {
      brands: "",
      status: "",
      image: null,
      backgroundImage: null,
    },
  } );


  const [ brands, setBrands ] = useState( [] );
  const [ selectedStatus, setSelectedStatus ] = useState( "" );
  const [ editItem, setEditItem ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  const [ imagePreview, setImagePreview ] = useState( null );
  const [ existingImageUrl, setExistingImageUrl ] = useState( null );
  const [ backgroundImagePreview, setBackgroundImagePreview ] = useState( null );
  const [ existingBackgroundImageUrl, setExistingBackgroundImageUrl ] = useState( null );
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  useEffect( () =>
  {
    fetchBrands();
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
      accessorKey: "name",
      header: "Brand",
      cell: ( { row } ) => <div>{ row.getValue( "name" ) }</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ( { row } ) => <div>{ row.getValue( "status" ) }</div>,
    },
    {
      accessorKey: "images",
      header: "Image",
      cell: ({ row }) => (
        row.getValue("images") ? (
          <img src={row.getValue("images")} alt="Brand" className="h-10 w-10 object-cover" />
        ) : null
      ),
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
                  form.setValue( "brands", item.name );
                  form.setValue( "status", item.status );
                  if (item.images) {
                    setExistingImageUrl(item.images);
                  } else {
                    setExistingImageUrl(null);
                  }
                  if (item.backgroundImage) {
                    setExistingBackgroundImageUrl(item.backgroundImage);
                  } else {
                    setExistingBackgroundImageUrl(null);
                  }
                } }
              >
                Edit <Pencil className="ml-2" size={ 16 } />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={ async () =>
                {
                  try {
                    // First, delete images from storage if they exist
                    if (item.images) {
                      const imageFilePath = item.images.split('/').slice(-2).join('/');
                      console.log("Deleting image from storage:", imageFilePath);
                      
                      const { error: imageDeleteError } = await supabase.storage
                        .from("brands")
                        .remove([imageFilePath]);
                        
                      if (imageDeleteError) {
                        console.error("Error deleting image from storage:", imageDeleteError);
                        setPopupMessage("Error deleting image from storage. Please try again.");
                        setPopupType("error");
                        setShowPopup(true);
                        return;
                      }
                    }
                    
                    // Delete background image if it exists
                    if (item.bg_image) {
                      const bgImageFilePath = item.bg_image.split('/').slice(-2).join('/');
                      console.log("Deleting background image from storage:", bgImageFilePath);
                      
                      const { error: bgImageDeleteError } = await supabase.storage
                        .from("brands")
                        .remove([bgImageFilePath]);
                        
                      if (bgImageDeleteError) {
                        console.error("Error deleting background image from storage:", bgImageDeleteError);
                        setPopupMessage("Error deleting background image from storage. Please try again.");
                        setPopupType("error");
                        setShowPopup(true);
                        return;
                      }
                    }
                    
                    // Then delete the record from the database
                    const { error: dbError } = await supabase.from("brands").delete().eq("id", item.id);
                    
                    if (dbError) {
                      console.error("Error deleting brand record:", dbError);
                      setPopupMessage("Error deleting brand. Please try again.");
                      setPopupType("error");
                      setShowPopup(true);
                      return;
                    }
                    
                    setPopupMessage("Brand deleted successfully");
                    setPopupType("success");
                    setShowPopup(true);
                    fetchBrands();
                  } catch (error) {
                    console.error("Unexpected error in delete operation:", error);
                    setPopupMessage("An unexpected error occurred while deleting the brand. Please try again.");
                    setPopupType("error");
                    setShowPopup(true);
                  }
                } }
              >
                Delete <Trash2 className="ml-2" size={ 16 } />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const fetchBrands = async () =>
  {
    setLoading( true );
    const { data, error } = await supabase.from( "brands" ).select( "*" );
    if ( !error ) setBrands( data );
    setLoading( false );
  };
const onSubmit = async (values) => {
  let imageUrl = null;
  let backgroundImageUrl = null;

  try {
    // Check authentication status
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error("Authentication error:", authError);
      toast.error("Authentication error. Please try again.");
      return;
    } else {
      console.log("Auth status:", authData.session ? "Authenticated" : "Not authenticated");
      if (authData.session) {
        console.log("Current user ID:", authData.session.user.id);
        console.log("Current user role:", authData.session.user.role);
      }
    }

    // Generate slug from brand name
    const slug = values.brands.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // If editing and a new image is uploaded, delete the old image
    if (editItem && editItem.images && values.image) {
      try {
        // Extract the file path from the URL
        const oldImageUrl = editItem.images;
        const filePath = oldImageUrl.split('/').slice(-2).join('/'); // Gets 'images/filename.ext'
        
        console.log("Deleting old image:", filePath);
        
        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from("brands")
          .remove([filePath]);
          
        if (deleteError) {
          console.error("Error deleting old image:", deleteError);
          toast.error("Error deleting old image. Please try again.");
        } else {
          console.log("Old image deleted successfully");
        }
      } catch (deleteError) {
        console.error("Error in deleting old image:", deleteError);
        toast.error("Error deleting old image. Please try again.");
      }
    }

    // If editing and a new background image is uploaded, delete the old background image
    if (editItem && editItem.backgroundImage && values.backgroundImage) {
      try {
        // Extract the file path from the URL
        const oldBackgroundImageUrl = editItem.backgroundImage;
        const filePath = oldBackgroundImageUrl.split('/').slice(-2).join('/'); // Gets 'images/filename.ext'
        
        console.log("Deleting old background image:", filePath);
        
        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from("brands")
          .remove([filePath]);
          
        if (deleteError) {
          console.error("Error deleting old background image:", deleteError);
          toast.error("Error deleting old background image. Please try again.");
        } else {
          console.log("Old background image deleted successfully");
        }
      } catch (deleteError) {
        console.error("Error in deleting old background image:", deleteError);
        toast.error("Error deleting old background image. Please try again.");
      }
    }

    if (values.image) {
      const file = values.image;
      const fileName = `${Date.now()}_${file.name}`;

      console.log("Attempting to upload file:", fileName);
      
      // Try to upload with public access
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("brands")
        .upload(`images/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        console.error("Error details:", JSON.stringify(uploadError, null, 2));
        toast.error("Error uploading image. Please try again.");
        return;
      }

      console.log("File uploaded successfully:", uploadData);

      const { data: urlData } = supabase.storage
        .from("brands")
        .getPublicUrl(`images/${fileName}`);
      imageUrl = urlData.publicUrl;
      
      console.log("Public URL generated:", imageUrl);
    }

    // Handle background image upload
    if (values.backgroundImage) {
      const file = values.backgroundImage;
      const fileName = `${Date.now()}_bg_${file.name}`;

      console.log("Attempting to upload background image:", fileName);
      
      // Try to upload with public access
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("brands")
        .upload(`images/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error("Error uploading background image:", uploadError);
        console.error("Error details:", JSON.stringify(uploadError, null, 2));
        toast.error("Error uploading background image. Please try again.");
        return;
      }

      console.log("Background image uploaded successfully:", uploadData);

      const { data: urlData } = supabase.storage
        .from("brands")
        .getPublicUrl(`images/${fileName}`);
      backgroundImageUrl = urlData.publicUrl;
      
      console.log("Background image public URL generated:", backgroundImageUrl);
    }

    if (editItem) {
      console.log("Updating existing brand:", editItem.id);
      
      const { data, error } = await supabase
        .from("brands")
        .update({
          name: values.brands,
          status: values.status,
          slug: slug,
          ...(imageUrl && { images: imageUrl }),
          ...(backgroundImageUrl && { backgroundImage: backgroundImageUrl }),
        })
        .eq("id", editItem.id)
        .select();
      
      if (error) {
        console.error("Error updating brand:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setPopupMessage("Error updating brand. Please try again.");
        setPopupType("error");
        setShowPopup(true);
        return;
      }
      
      console.log("Brand updated successfully:", data);
      setPopupMessage("Brand updated successfully");
      setPopupType("success");
      setShowPopup(true);
    } else {
      console.log("Inserting new brand");
      
      const { data, error } = await supabase
        .from("brands")
        .insert([
          {
            name: values.brands,
            status: values.status,
            slug: slug,
            ...(imageUrl && { images: imageUrl }),
            ...(backgroundImageUrl && { bg_image: backgroundImageUrl }),
          },
        ])
        .select();
      
      if (error) {
        console.error("Error inserting brand:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setPopupMessage("Error creating brand. Please try again.");
        setPopupType("error");
        setShowPopup(true);
        return;
      }
      
      console.log("Brand inserted successfully:", data);
      setPopupMessage("Brand created successfully");
      setPopupType("success");
      setShowPopup(true);
    }

    fetchBrands();
    setEditItem(null);
    
    // Reset form with default values
    form.reset({
      brands: "",
      status: "",
      image: null,
      backgroundImage: null,
    });
    
    // Clear the file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.value = '';
    });
    
    setSelectedStatus("");
    setImagePreview(null);
    setExistingImageUrl(null);
    setBackgroundImagePreview(null);
    setExistingBackgroundImageUrl(null);
  } catch (error) {
    console.error("Unexpected error in onSubmit:", error);
    setPopupMessage("An unexpected error occurred. Please try again.");
    setPopupType("error");
    setShowPopup(true);
  }
};



  const [ sorting, setSorting ] = useState( [] );
  const [ columnFilters, setColumnFilters ] = useState( [] );
  const [ columnVisibility, setColumnVisibility ] = useState( {} );
  const [ rowSelection, setRowSelection ] = useState( {} );

  const table = useReactTable( {
    data: brands,
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

  const handleDeleteImage = async (item) => {
    try {
      // Extract the file path from the URL
      const imageUrl = item.images;
      const filePath = imageUrl.split('/').slice(-2).join('/'); // Gets 'images/filename.ext'
      
      console.log("Deleting image:", filePath);
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from("brands")
        .remove([filePath]);
        
      if (deleteError) {
        console.error("Error deleting image:", deleteError);
        toast.error("Error deleting image. Please try again.");
        return;
      }
      
      console.log("Image deleted successfully");
      
      // Update the database record to remove the image reference
      const { error: updateError } = await supabase
        .from("brands")
        .update({ images: null })
        .eq("id", item.id);
        
      if (updateError) {
        console.error("Error updating brand record:", updateError);
        toast.error("Error updating brand record. Please try again.");
        return;
      }
      
      console.log("Brand record updated successfully");
      toast.success("Image deleted successfully");
      
      // Update the UI
      fetchBrands();
    } catch (error) {
      console.error("Error in handleDeleteImage:", error);
      toast.error("An unexpected error occurred while deleting the image. Please try again.");
    }
  };

  const handleDeleteBackgroundImage = async (item) => {
    try {
      // Extract the file path from the URL
      const backgroundImageUrl = item.bg_image;
      const filePath = backgroundImageUrl.split('/').slice(-2).join('/'); // Gets 'images/filename.ext'
      
      console.log("Deleting background image:", filePath);
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from("brands")
        .remove([filePath]);
        
      if (deleteError) {
        console.error("Error deleting background image:", deleteError);
        toast.error("Error deleting background image. Please try again.");
        return;
      }
      
      console.log("Background image deleted successfully");
      
      // Update the database record to remove the background image reference
      const { error: updateError } = await supabase
        .from("brands")
        .update({ bg_image: null })
        .eq("id", item.id);
        
      if (updateError) {
        console.error("Error updating brand record:", updateError);
        toast.error("Error updating brand record. Please try again.");
        return;
      }
      
      console.log("Brand record updated successfully");
      toast.success("Background image deleted successfully");
      
      // Update the UI
      fetchBrands();
    } catch (error) {
      console.error("Error in handleDeleteBackgroundImage:", error);
      toast.error("An unexpected error occurred while deleting the background image. Please try again.");
    }
  };

  return (
    <Sidebar className="w-full">
      <SuccessPopup 
        message={popupMessage}
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
        type={popupType}
      />
      <div className="flex gap-4 p-4">
        <div className="w-1/2">
          <Form { ...form }>
            <form onSubmit={ form.handleSubmit( onSubmit ) } className="space-y-8">
              
              <FormField
                control={ form.control }
                name="image"
                render={ ( { field } ) => (
                  <FormItem>
                    <FormLabel>Upload Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={ ( e ) => {
                          const file = e.target.files?.[ 0 ];
                          field.onChange( file );
                          
                          // Create preview URL
                          if ( file ) {
                            const previewUrl = URL.createObjectURL( file );
                            setImagePreview( previewUrl );
                          } else {
                            setImagePreview( null );
                          }
                        } }
                      />
                    </FormControl>
                    { imagePreview && (
                      <div className="mt-2 relative">
                        <img 
                          src={ imagePreview } 
                          alt="Preview" 
                          className="h-20 w-20 object-cover rounded-md"
                        />
                      </div>
                    ) }
                    {existingImageUrl && !imagePreview && (
                      <div className="mt-2 relative">
                        <img 
                          src={existingImageUrl} 
                          alt="Current" 
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-0 right-0 h-6 w-6 rounded-full"
                          onClick={() => handleDeleteImage(editItem)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                ) }
              />

              {/* Background Image Field */}
              <FormField
                control={ form.control }
                name="backgroundImage"
                render={ ( { field } ) => (
                  <FormItem>
                    <FormLabel>Upload Background Image</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={ ( e ) => {
                          const file = e.target.files?.[ 0 ];
                          field.onChange( file );
                          
                          // Create preview URL
                          if ( file ) {
                            const previewUrl = URL.createObjectURL( file );
                            setBackgroundImagePreview( previewUrl );
                          } else {
                            setBackgroundImagePreview( null );
                          }
                        } }
                      />
                    </FormControl>
                    { backgroundImagePreview && (
                      <div className="mt-2 relative">
                        <img 
                          src={ backgroundImagePreview } 
                          alt="Background Preview" 
                          className="h-20 w-20 object-cover rounded-md"
                        />
                      </div>
                    ) }
                    {existingBackgroundImageUrl && !backgroundImagePreview && (
                      <div className="mt-2 relative">
                        <img 
                          src={existingBackgroundImageUrl} 
                          alt="Current Background" 
                          className="h-20 w-20 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-0 right-0 h-6 w-6 rounded-full"
                          onClick={() => handleDeleteBackgroundImage(editItem)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                ) }
              />

              {/* Brands Field */ }
              <FormField
                control={ form.control }
                name="brands"
                render={ ( { field } ) => (
                  <FormItem>
                    <FormLabel>Add Brands</FormLabel>
                    <FormControl>
                      <Input placeholder="Add Brands" { ...field } />
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
                placeholder="Filter Brands..."
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

export default withAuth( Brands );

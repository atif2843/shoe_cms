"use client";
import Sidebar from "@/app/components/Sidebar";
import withAuth from "@/app/components/withAuth";
import { zodResolver } from "@hookform/resolvers/zod";

import { MultiSelect } from "@/app/components/MultiSelect";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { Controller } from "react-hook-form";
import ProductImagesCell from "@/app/components/ProductImagesCell"
import
{
  Pencil,
  Trash2,
  ChevronDown,
  MoreHorizontal,
  Turtle,
  Cat,
  Dog,
  Rabbit,
  Fish,
  Plus,
  Upload,
  X,
  Eye,
} from "lucide-react";
import TiptapEditor from "@/app/components/editor/TiptapEditor.js";
import { supabase } from "./../lib/supabaseClient";
import { useEffect, useState } from "react";
import
{
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import
{
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useWatch } from "react-hook-form";
import
{
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import SuccessPopup from "@/app/components/SuccessPopup";
const formSchema = z.object( {
  name: z.string().min( 1, "Name is required" ),
  sku: z.string().min( 1, "SKU is required" ),
  actualPrice: z.string(),
  sellPrice: z.string(),
  discount: z.string(),
  size: z.array( z.string() ).optional(),
  color: z.array( z.string() ).optional(),
  brand: z.string().optional(),
  gender: z.string().optional(),
  productType: z.string().optional(),
  description: z.string().optional(),
  details: z.string().optional(),
  releaseDate: z.string().optional(),
  status: z.string().optional(),
  trending: z.boolean().default( false ),
  topBrand: z.boolean().default( false ),
  images: z.array(z.string()).optional(),
} );


const theme = {
  // optional: define your styling
};

function EditorChangeHandler ( { onChange } )
{
  const [ editor ] = useLexicalComposerContext();

  useEffect( () =>
  {
    return editor.registerUpdateListener( ( { editorState } ) =>
    {
      editorState.read( () =>
      {
        const html = $getRoot().getTextContent(); // for raw text
        onChange( html );
      } );
    } );
  }, [ editor, onChange ] );

  return null;
}

function Product ()
{
  const form = useForm( {
    resolver: zodResolver( formSchema ),
    defaultValues: {
      name: "",
      sku: "",
      actualPrice: "",
      sellPrice: "",
      discount: "",
      size: [],     // must be array if multi-select
      color: [],
      brand: "",
      gender: "",
      productType: "",
      description: "",
      details: "",
      releaseDate: "",
      status: "",
      trending: false,
      topBrand: false,
    },
  } );

  // Function to generate slug from product name
  const generateSlug = (productName) => {
    return productName.toLowerCase().replace(/\s+/g, '-');
  };

  const [ products, setProducts ] = useState( [] );
  const [ sizes, setSizes ] = useState( [] );
  const [ colors, setColors ] = useState( [] );
  const [ brands, setBrands ] = useState( [] );
  const [ category, setCategory ] = useState( [] );
  const [ selectedStatus, setSelectedStatus ] = useState( "" );
  const [ editItem, setEditItem ] = useState( null );
  const [ loading, setLoading ] = useState( true );
  
  // Image upload states
  const [ isUploadModalOpen, setIsUploadModalOpen ] = useState( false );
  const [ filesToUpload, setFilesToUpload ] = useState( [] );
  const [ uploadProgress, setUploadProgress ] = useState( {} );
  const [ isDragging, setIsDragging ] = useState( false );
  const [ selectedProduct, setSelectedProduct ] = useState( null );
  
  // Image viewer states
  const [ isViewerOpen, setIsViewerOpen ] = useState( false );
  const [ viewerProduct, setViewerProduct ] = useState( null );
  const [ viewerImages, setViewerImages ] = useState( [] );
  const [ isLoadingImages, setIsLoadingImages ] = useState( false );
  const [ isDeletingImage, setIsDeletingImage ] = useState( {} );

  // Add new state for delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const showSuccessMessage = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  /*
    const frameworksList = [
      { value: "react", label: "React" },
      { value: "angular", label: "Angular" },
      { value: "vue", label: "Vue" },
      { value: "svelte", label: "Svelte" },
      { value: "ember", label: "Ember" },
    ]; */

  const { setValue } = form;
  const actualPrice = useWatch( { control: form.control, name: "actualPrice" } );
  const sellPrice = useWatch( { control: form.control, name: "sellPrice" } );
  useEffect( () =>
  {
    const price = parseFloat( actualPrice );
    const sell = parseFloat( sellPrice );

    if ( !isNaN( price ) && !isNaN( sell ) && price > 0 )
    {
      const discount = ( ( price - sell ) / price ) * 100;
      setValue( "discount", discount.toFixed( 2 ) );
    } else
    {
      setValue( "discount", "" );
    }
  }, [ actualPrice, sellPrice, setValue ] );

  useEffect( () =>
  {
    fetchProducts();
    fetchColors();
    fetchSizes();
    fetchBrands();
    fetchCategory();
  }, [] );

  // Table columns
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
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "Images",
      cell: ( { row } ) => {
        const productId = row.getValue("id");
        return <ProductImagesCell productId={productId} />;
      },
    },
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "name" ) }</div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "sku" ) }</div>
      ),
    },
    {
      accessorKey: "color",
      header: "Color",
      cell: ( { row } ) =>
      {
        const colors = row.getValue( "color" ); // array like ["red", "yellow"]
        if ( !Array.isArray( colors ) ) return null;

        return (
          <div className="flex items-center space-x-2">
            { colors.map( ( color, index ) => (
              <div key={ index } className="flex items-center space-x-1">
                <div
                  className="w-4 h-4 rounded-full flex"
                  style={ { backgroundColor: color } }
                  title={ color }
                ></div>
              </div>
            ) ) }
          </div>
        );
      },
    },
    {
      accessorKey: "actualPrice",
      header: "Actual Price",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "actualPrice" ) }</div>
      ),
    },
    {
      accessorKey: "sellPrice",
      header: "Sell Price",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "sellPrice" ) }</div>
      ),
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "discount" ) }</div>
      ),
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "gender" ) }</div>
      ),
    },
    {
      accessorKey: "productType",
      header: "Product Type",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "productType" ) }</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "description" ) }</div>
      ),
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "details" ) }</div>
      ),
    },
    {
      accessorKey: "releaseDate",
      header: "Release Date",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "releaseDate" ) }</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ( { row } ) => (
        <div className="capitalize">{ row.getValue( "status" ) }</div>
      ),
    },
    {
      accessorKey: "trending",
      header: "Trending",
      cell: ( { row } ) =>
      {
        const value = row.getValue( "trending" );
        return <div>{ value === true || value === "TRUE" ? "Yes" : "No" }</div>;
      },
    },
    {
      accessorKey: "topBrand",
      header: "Top Brands",
      cell: ( { row } ) =>
      {
        const value = row.getValue( "topBrand" );
        return <div>{ value === true || value === "TRUE" ? "Yes" : "No" }</div>;
      },
    },
    {
      id: "actions",
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
                  form.setValue( "name", item.name );
                  form.setValue( "status", item.status );
                  form.setValue( "sku", item.sku );
                  form.setValue( "actualPrice", String( item.actualPrice ) );
                  form.setValue( "sellPrice", String( item.sellPrice ) );
                  form.setValue( "discount", item.discount );
                  form.setValue( "color", item.color || [] );
                  form.setValue( "size", item.size || [] );
                  form.setValue( "brand", item.brand );
                  form.setValue( "gender", item.gender );
                  form.setValue( "productType", item.productType );
                  form.setValue( "description", item.description );
                  form.setValue( "details", item.details );
                  form.setValue( "releaseDate", item.releaseDate );
                  form.setValue( "Trending", item.trending );
                  form.setValue( "topBrand", item.topBrand );
                } }
              >
                Edit <Pencil className="ml-2" size={ 16 } />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedProduct(item);
                  setIsUploadModalOpen(true);
                }}
              >
                Upload Images <Plus className="ml-2" size={16} />
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  openImageViewer(item);
                }}
              >
                View Images <Eye className="ml-2" size={16} />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteClick(item)}
              >
                Delete <Trash2 className="ml-2" size={16} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  const fetchProducts = async () =>
  {
    setLoading( true );
    const { data, error } = await supabase.from( "products" ).select();
    if ( !error ) setProducts( data );
    setLoading( false );
  };

  const fetchSizes = async () =>
  {
    setLoading( true );
    const { data, error } = await supabase.from( "sizes" )
      .select( "*" );
    if ( !error ) setSizes( data );
    setLoading( false );
  };

  const fetchColors = async () => {
    try {
      const { data, error } = await supabase.from("colors").select("id, color_name, hex_code");
      if (error) {
        console.error("Error fetching colors:", error);
      } else {
        setColors(data);
      }
    } catch (error) {
      console.error("Error in fetchColors:", error);
    }
  };

  const fetchCategory = async () =>
  {
    setLoading( true );
    const { data, error } = await supabase.from( "categories" )
      .select( "*" );
    if ( !error ) setCategory( data );
    setLoading( false );
  };

  const fetchBrands = async () =>
  {
    setLoading( true );
    const { data, error } = await supabase
      .from( "brands" )
      .select( "*" );

    if ( !error ) setBrands( data );
    setLoading( false );
  };

  // Image upload functions
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFilesToUpload(prev => [...prev, ...selectedFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Get all dropped items
    const items = Array.from(e.dataTransfer.items);
    
    // Process each dropped item
    const processItems = async () => {
      const newFiles = [];
      
      for (const item of items) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          
          if (entry) {
            if (entry.isDirectory) {
              // If it's a directory, traverse it
              await traverseDirectory(entry, newFiles);
            } else if (entry.isFile && isImageFile(entry.name)) {
              // If it's a file and it's an image, add it
              const file = await getFileFromEntry(entry);
              if (file) newFiles.push(file);
            }
          }
        }
      }
      
      // Update the filesToUpload state with new files
      setFilesToUpload(prev => [...prev, ...newFiles]);
    };
    
    processItems();
  };
  
  // Helper function to check if a file is an image
  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };
  
  // Helper function to traverse a directory recursively
  const traverseDirectory = async (dirEntry, files) => {
    const reader = dirEntry.createReader();
    
    const readEntries = () => {
      return new Promise((resolve) => {
        reader.readEntries((entries) => {
          resolve(entries);
        });
      });
    };
    
    let entries = await readEntries();
    
    // Process all entries
    for (const entry of entries) {
      if (entry.isDirectory) {
        // Recursively traverse subdirectories
        await traverseDirectory(entry, files);
      } else if (entry.isFile && isImageFile(entry.name)) {
        // If it's an image file, add it
        const file = await getFileFromEntry(entry);
        if (file) files.push(file);
      }
    }
  };
  
  // Helper function to get a File object from a FileSystemEntry
  const getFileFromEntry = (entry) => {
    return new Promise((resolve) => {
      entry.file((file) => {
        resolve(file);
      });
    });
  };

  const removeFile = (index) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (!selectedProduct || filesToUpload.length === 0) return;

    const productId = selectedProduct.id;
    
    // Initialize progress for all files
    const initialProgress = {};
    filesToUpload.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);
    
    const uploadPromises = filesToUpload.map(async (file, index) => {
      try {
        const fileName = `${productId}_${Date.now()}_${index}_${file.name}`;
        
        // Update progress to 0% for this file
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        // Upload file to Supabase storage
        const { data, error } = await supabase.storage
          .from("productsimages")
          .upload(`${productId}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (error) {
          console.error(`Error uploading ${file.name}:`, error);
          return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("productsimages")
          .getPublicUrl(`${productId}/${fileName}`);
        
        if (!urlData || !urlData.publicUrl) {
          console.error(`Failed to get public URL for ${file.name}`);
          return null;
        }

        // Update progress to 100% for this file
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 100
        }));

        return {
          fileName,
          url: urlData.publicUrl
        };
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        return null;
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(result => result !== null);

    // Insert records into productImages table
    if (successfulUploads.length > 0) {
      const imageRecords = successfulUploads.map(upload => ({
        prod_id: productId,
        prod_images: upload.url
      }));
      
      // Log the data we're about to insert
      console.log("Inserting product images:", imageRecords);
      
      // Insert records into productImages table
      const { data, error } = await supabase
        .from("productImages")
        .insert(imageRecords)
        .select();

      if (error) {
        console.error("Error inserting product images:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // Show error to user
        alert(`Failed to save product images: ${error.message || 'Unknown error'}`);
      } else {
        console.log("Product images inserted successfully:", data);
        
        // Refresh products list
        fetchProducts();
        
        // Wait a moment to show the completed progress bars before closing
        setTimeout(() => {
          // Reset upload state
          setFilesToUpload([]);
          setUploadProgress({});
          setIsUploadModalOpen(false);
        }, 1500); // Wait 1.5 seconds before closing
      }
    } else {
      // If no uploads were successful, close the modal immediately
      setFilesToUpload([]);
      setUploadProgress({});
      setIsUploadModalOpen(false);
    }
  };

  const onSubmit = async ( values ) => {
    console.log( values );
    const brandData = {
      name: values.name,
      sku: values.sku,
      color: values.color,
      size: values.size,
      brand: values.brand,
      gender: values.gender,
      productType: values.productType,
      actualPrice: Number( values.actualPrice ),
      sellPrice: Number( values.sellPrice ),
      description: values.description,
      discount: Number( values.discount ),
      details: values.details,
      releaseDate: values.releaseDate,
      trending: values.trending,
      status: values.status,
      topBrand: values.topBrand,
      slug: generateSlug(values.name),
    };

    if ( editItem ) {
      try {
        // Update existing brand
        const { error } = await supabase
          .from( "products" )
          .update( brandData )
          .eq( "id", editItem.id );

        if ( error ) throw error;

        fetchProducts();
        setEditItem( null );
        form.reset();
        setSelectedStatus( "" );
        showSuccessMessage("Product updated successfully");
      } catch (error) {
        console.error('Error updating product:', error);
        showSuccessMessage("Failed to update product", "error");
      }
    } else {
      try {
        // Insert new brand
        const { error } = await supabase.from( "products" ).insert( [ brandData ] );

        if ( error ) throw error;

        fetchProducts(); // Refresh the list
        form.reset();
        setSelectedStatus( "" );
        showSuccessMessage("Product created successfully");
      } catch (error) {
        console.error('Error creating product:', error);
        showSuccessMessage("Failed to create product", "error");
      }
    }
  };

  const [ sorting, setSorting ] = React.useState( [] );
  const [ columnFilters, setColumnFilters ] = React.useState( [] );
  const [ columnVisibility, setColumnVisibility ] = React.useState( {} );
  const [ rowSelection, setRowSelection ] = React.useState( {} );
  const [ pagination, setPagination ] = React.useState( {
    pageIndex: 0,
    pageSize: 10, // Increased from default 10 to 50
  } );

  const table = useReactTable( {
    data: products,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  } );

  const dropdownFields = {
    brand: brands.map( ( brands ) => brands.name ),
    gender: [ "Men", "Women", "Unisex" ],
    productType: category.map( ( category ) => category.name ),
  };

  const sizeOptions = sizes.map( ( size ) => ( {
    label: size.size,
    value: size.size,
  } ) );

  const colorOptions = colors.map( ( colors ) => ( {
    label: colors.color_name,
    value: colors.hex_code
  } ) );

  const fields = [
    {
      name: "size",
      options: sizeOptions, // from earlier
      placeholder: "Select sizes",
    },
    {
      name: "color",
      options: colorOptions, // similar to sizeOptions
      placeholder: "Select colors",
      showSwatch: true,
    },
  ];

  // Image viewer functions
  const openImageViewer = async (product) => {
    setViewerProduct(product);
    setIsViewerOpen(true);
    await loadProductImages(product.id);
  };

  const loadProductImages = async (productId) => {
    setIsLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from("productImages")
        .select("id, prod_images, color_id")
        .eq("prod_id", productId);
        
      if (error) {
        console.error("Error loading product images:", error);
        return;
      }
      
      setViewerImages(data || []);
    } catch (error) {
      console.error("Error in loadProductImages:", error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const deleteImage = async (imageId, imageUrl) => {
    // Set deleting state for this specific image
    setIsDeletingImage(prev => ({ ...prev, [imageId]: true }));
    
    try {
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const productId = urlParts[urlParts.length - 2];
      const filePath = `${productId}/${fileName}`;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("productsimages")
        .remove([filePath]);
        
      if (storageError) {
        console.error("Error deleting from storage:", storageError);
        return;
      }
      
      // Delete from productImages table
      const { error: dbError } = await supabase
        .from("productImages")
        .delete()
        .eq("id", imageId);
        
      if (dbError) {
        console.error("Error deleting from database:", dbError);
        return;
      }
      
      // Update the viewer images list
      setViewerImages(prev => prev.filter(img => img.id !== imageId));
      
      // Refresh the products list to update the image count
      fetchProducts();
    } catch (error) {
      console.error("Error in deleteImage:", error);
    } finally {
      // Clear deleting state for this image
      setIsDeletingImage(prev => ({ ...prev, [imageId]: false }));
    }
  };

  // Update image color
  const updateImageColor = async (imageId, colorId) => {
    try {
      const { error } = await supabase
        .from("productImages")
        .update({ color_id: colorId })
        .eq("id", imageId);

      if (error) {
        console.error("Error updating image color:", error);
      } else {
        // Optionally, refresh the viewer images to reflect the change
        setViewerImages(prev =>
          prev.map(img => (img.id === imageId ? { ...img, color_id: colorId } : img))
        );
      }
    } catch (error) {
      console.error("Error in updateImageColor:", error);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      // First, get all images associated with this product
      const { data: productImages, error: fetchError } = await supabase
        .from("productImages")
        .select("prod_images")
        .eq("prod_id", productId);

      if (fetchError) {
        console.error("Error fetching product images:", fetchError);
        return;
      }

      // Delete the entire product folder from storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from("productsimages")
        .list(`${productId}/`);

      if (storageError) {
        console.error("Error listing storage files:", storageError);
        return;
      }

      if (storageData && storageData.length > 0) {
        // Get all file paths in the product folder
        const filePaths = storageData.map(file => `${productId}/${file.name}`);
        
        // Delete all files in the folder
        const { error: deleteError } = await supabase.storage
          .from("productsimages")
          .remove(filePaths);

        if (deleteError) {
          console.error("Error deleting files from storage:", deleteError);
          return;
        }
      }

      // Delete all image records from productImages table
      const { error: imagesDeleteError } = await supabase
        .from("productImages")
        .delete()
        .eq("prod_id", productId);

      if (imagesDeleteError) {
        console.error("Error deleting image records:", imagesDeleteError);
        return;
      }

      // Finally, delete the product record
      const { error: productDeleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (productDeleteError) {
        console.error("Error deleting product:", productDeleteError);
        return;
      }

      // Refresh the products list
      fetchProducts();
      showSuccessMessage("Product deleted successfully");
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      showSuccessMessage("Failed to delete product", "error");
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
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
      <div className="flex flex-col gap-4 p-4">
        {/* Add Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
                All associated images will also be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="font-medium">Product Details:</p>
              <p>Name: {productToDelete?.name}</p>
              <p>SKU: {productToDelete?.sku}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProductToDelete(null);
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

        {/* Image Upload Modal */}
        <Dialog open={isUploadModalOpen} onOpenChange={(open) => {
          // Only allow closing if no uploads are in progress
          const isUploading = Object.values(uploadProgress).some(progress => progress > 0 && progress < 100);
          if (!isUploading) {
            setIsUploadModalOpen(open);
          }
        }}>
          <DialogContent className="sm:max-w-md h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Upload Product Images</DialogTitle>
              <DialogDescription>
                Upload multiple images for {selectedProduct?.name || 'this product'}. 
                You can drag and drop files or click to select them.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary">Click to upload</span>
                    <span className="text-sm text-gray-500"> or drag and drop</span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    onChange={handleFileSelect}
                    accept="image/*"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
              
              {filesToUpload.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Selected Files:</h3>
                  <div className="border rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {filesToUpload.map((file, index) => (
                        <li key={index} className="p-2 bg-gray-50 hover:bg-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-2">
                              <p className="text-sm truncate" title={file.name}>{file.name}</p>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {uploadProgress[file.name] !== undefined && (
                                <div className="flex items-center space-x-2">
                                  <Progress value={uploadProgress[file.name]} className="w-20" />
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {uploadProgress[file.name]}%
                                  </span>
                                </div>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 flex-shrink-0"
                                disabled={uploadProgress[file.name] > 0 && uploadProgress[file.name] < 100}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-4 flex-shrink-0 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  // Clear all selected files
                  setFilesToUpload([]);
                  // Reset upload progress
                  setUploadProgress({});
                  // Close the modal
                  setIsUploadModalOpen(false);
                }}
                disabled={Object.values(uploadProgress).some(progress => progress > 0 && progress < 100)}
              >
                Cancel
              </Button>
              <Button 
                onClick={uploadImages} 
                disabled={filesToUpload.length === 0 || Object.values(uploadProgress).some(progress => progress > 0 && progress < 100)}
              >
                {Object.values(uploadProgress).some(progress => progress > 0 && progress < 100) 
                  ? "Uploading..." 
                  : `Upload ${filesToUpload.length > 0 ? `(${filesToUpload.length})` : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Image Viewer Modal */}
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Product Images - {viewerProduct?.name}</DialogTitle>
              <DialogDescription>
                View and manage images for this product
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingImages ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 animate-pulse">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewerImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                {viewerImages.map((image) => (
                  <div key={image.id} className="relative aspect-square rounded-md overflow-hidden group">
                    <img 
                      src={image.prod_images} 
                      alt="Product" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 right-0 p-1">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteImage(image.id, image.prod_images)}
                        disabled={isDeletingImage[image.id]}
                      >
                        {isDeletingImage[image.id] ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
                    <Select
  value={image.color_id || ""}
  onValueChange={(value) => updateImageColor(image.id, value)}
>
  <SelectTrigger className="w-full bg-white/100">
    <SelectValue placeholder="Select Color"/>
  </SelectTrigger>
  <SelectContent>
    {colors.map((color) => (
      <SelectItem key={color.id} value={color.hex_code}>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: color.hex_code }}
          />
          {color.color_name}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No images found for this product
              </div>
            )}
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsViewerOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="w-full flex">
          <Form { ...form }>
            <form
              onSubmit={ form.handleSubmit( onSubmit ) }
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-2 gap-4 w-full">
                { [ "name", "sku", "actualPrice", "sellPrice", "discount" ].map(
                  ( fieldName ) => (
                    <FormField
                      key={ fieldName }
                      control={ form.control }
                      name={ fieldName }
                      render={ ( { field } ) => (
                        <FormItem>
                          <FormLabel className="capitalize">
                            { fieldName }
                          </FormLabel>
                          <FormControl>
                            <Input { ...field } />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      ) }
                    />
                  )
                ) }
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                { fields.map( ( field ) => (
                  <Controller
                    key={ field.name }
                    control={ form.control }
                    name={ field.name }
                    render={ ( { field: { onChange, value } } ) => (
                      <FormItem>
                        <FormLabel className="capitalize">
                          { field.name }
                        </FormLabel>

                        <MultiSelect
                          options={ field.options }
                          placeholder={ field.placeholder }
                          variant="inverted"
                          animation={ 2 }
                          maxCount={ 5 }
                          onValueChange={ onChange }
                          value={ value }
                          defaultValue={ [] }
                          showSwatch={ field.showSwatch }
                        />
                      </FormItem>
                    ) }
                  />
                ) ) }
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                { Object.entries( dropdownFields ).map( ( [ fieldName, options ] ) => (
                  <FormField
                    key={ fieldName }
                    control={ form.control }
                    name={ fieldName }
                    render={ ( { field } ) => (
                      <FormItem>
                        <FormLabel className="capitalize">
                          { fieldName }
                        </FormLabel>
                        <Select
                          onValueChange={ field.onChange }
                          value={ field.value }
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue
                                placeholder={ `Select ${ fieldName }` }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            { options.map( ( option ) => (
                              <SelectItem key={ option } value={ option }>
                                <div className="flex items-center space-x-2">
                                  <div
                                    style={ { background: option } }
                                    className="w-4 h-4 rounded-full"
                                  ></div>
                                  <div>{ option }</div>
                                </div>
                              </SelectItem>
                            ) ) }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                ) ) }
              </div>

              { [ "description", "details" ].map( ( fieldName ) => (
                <FormField
                  key={ fieldName }
                  control={ form.control }
                  name={ fieldName }
                  render={ ( { field } ) => (
                    <FormItem className="w-full">
                      <FormLabel className="capitalize">{ fieldName }</FormLabel>
                      <FormControl>
                        <TiptapEditor
                          value={ field.value }
                          onChange={ field.onChange }
                          className="w-full h-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  ) }
                />
              ) ) }

              <div className="grid grid-cols-2 gap-4 w-full">
                <FormField
                  control={ form.control }
                  name="releaseDate"
                  render={ ( { field } ) => (
                    <FormItem>
                      <FormLabel>Release Date</FormLabel>
                      <FormControl>
                        <Input type="date" { ...field } />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  ) }
                />

                <FormField
                  control={ form.control }
                  name="status"
                  render={ ( { field } ) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={ field.onChange }
                        value={ field.value }
                      >
                        <FormControl className="w-full">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  ) }
                />
              </div>

              <div className="flex items-center space-x-2 py-2.5 mt-6">
                { [ "trending", "topBrand" ].map( ( fieldName ) => (
                  <FormField
                    key={ fieldName }
                    control={ form.control }
                    name={ fieldName }
                    render={ ( { field } ) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormLabel className="capitalize">
                          { fieldName }
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="checkbox"
                            className="w-4 h-4"
                            checked={ field.value }
                            onChange={ ( e ) => field.onChange( e.target.checked ) }
                          />
                        </FormControl>
                      </FormItem>
                    ) }
                  />
                ) ) }
              </div>

              <div className="flex items-center justify-center space-x-2 py-2.5 mt-6">

                {/* Submit Button */ }
                <Button type="submit" disabled={ form.formState.isSubmitting }>
                  { editItem ? "Update" : "Submit" }
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter Sizes..."
              value={ table.getColumn( "name" )?.getFilterValue() ?? "" }
              onChange={ ( e ) =>
                table.getColumn( "name" )?.setFilterValue( e.target.value )
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
                  .map( ( col ) => (
                    <DropdownMenuCheckboxItem
                      key={ col.id }
                      checked={ col.getIsVisible() }
                      onCheckedChange={ ( val ) => col.toggleVisibility( !!val ) }
                    >
                      { col.id }
                    </DropdownMenuCheckboxItem>
                  ) ) }
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
                    <TableCell colSpan={ columns.length }>No results.</TableCell>
                  </TableRow>
                ) }
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </p>
              <p className="text-sm text-muted-foreground">
                ({table.getFilteredRowModel().rows.length} total items)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                First
              </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default withAuth( Product );

"use client";

import Sidebar from "@/app/components/Sidebar";
import withAuth from "@/app/components/withAuth";
import { useEffect, useState } from "react";
import { supabase } from "./../lib/supabaseClient";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import SuccessPopup from "@/app/components/SuccessPopup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");

  const showSuccessMessage = (message, type = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders without relying on the foreign key relationship
      const { data, error } = await supabase
        .from("Order_details")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // If we have orders, try to fetch user data separately
      if (data && data.length > 0) {
        // Get unique user IDs from orders
        const userIds = [...new Set(data.map(order => order.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          // Fetch user data for these IDs
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, name, email, phone")
            .in("id", userIds);
            
          if (!userError && userData) {
            // Create a map of user data by ID
            const userMap = {};
            userData.forEach(user => {
              userMap[user.id] = user;
            });
            
            // Attach user data to orders
            const ordersWithUsers = data.map(order => ({
              ...order,
              user: order.user_id ? userMap[order.user_id] : null
            }));
            
            // Group orders by order_id
            const groupedOrders = groupOrdersByOrderId(ordersWithUsers);
            setOrders(groupedOrders);
            return;
          }
        }
      }
      
      // If we couldn't fetch user data or there was an error, just set the orders without user data
      const groupedOrders = groupOrdersByOrderId(data || []);
      setOrders(groupedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      showSuccessMessage("Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to group orders by order_id
  const groupOrdersByOrderId = (orders) => {
    const orderGroups = {};
    
    orders.forEach(order => {
      if (!orderGroups[order.order_id]) {
        orderGroups[order.order_id] = {
          order_id: order.order_id,
          created_at: order.created_at,
          user: order.user,
          products: [],
          total_amount: 0,
          status: order.status || "Confirmed" // Default status if not set
        };
      }
      
      orderGroups[order.order_id].products.push({
        name: order.name,
        color: order.color,
        size: order.size,
        price: order.price
      });
      
      orderGroups[order.order_id].total_amount += parseFloat(order.price) || 0;
    });
    
    return Object.values(orderGroups);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Update all order details with the same order_id
      const { error } = await supabase
        .from("Order_details")
        .update({ status: newStatus })
        .eq("order_id", orderId);

      if (error) throw error;

      // Update the local state
      setOrders(orders.map(order => 
        order.order_id === orderId 
          ? { ...order, status: newStatus } 
          : order
      ));

      showSuccessMessage(`Order status updated to ${newStatus}`, "success");
    } catch (error) {
      console.error("Error updating order status:", error);
      showSuccessMessage("Failed to update order status", "error");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-gray-100 text-gray-800";
      case "Confirmed":
        return "bg-blue-100 text-blue-800";
      case "Dispatched":
        return "bg-yellow-100 text-yellow-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = [
    {
      accessorKey: "order_id",
      header: "Order ID",
      cell: ({ row }) => <div>{row.getValue("order_id")}</div>,
    },
    {
      accessorKey: "user.name",
      header: "Customer Name",
      cell: ({ row }) => {
        const user = row.original.user;
        return <div>{user ? user.name : "N/A"}</div>;
      },
    },
    {
      accessorKey: "products",
      header: "Products",
      cell: ({ row }) => {
        const products = row.original.products;
        return <div>{products.length} item{products.length !== 1 ? 's' : ''}</div>;
      },
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => <div>Rs. {row.getValue("total_amount").toLocaleString('en-IN')}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "Confirmed";
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {status}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange(row.original.order_id, "Pending")}>
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(row.original.order_id, "Confirmed")}>
                  Confirmed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(row.original.order_id, "Dispatched")}>
                  Dispatched
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(row.original.order_id, "Delivered")}>
                  Delivered
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Order Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <div>{date.toLocaleDateString()}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewOrder(order)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: orders,
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
      <SuccessPopup 
        message={popupMessage}
        isVisible={showPopup}
        onClose={() => setShowPopup(false)}
        type={popupType}
      />
      
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        
        <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter orders..."
              value={table.getColumn("order_id")?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn("order_id")?.setFilterValue(event.target.value)
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
                  .filter((column) => column.getCanHide())
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

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
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
          )}

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

      {/* Order Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Order Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              View detailed information about this order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary">Order Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium">{selectedOrder.order_id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="font-medium">{selectedOrder.products.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">Rs. {selectedOrder.total_amount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status || "Confirmed"}
                      </span>
                    
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary">Customer Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedOrder.user?.name || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedOrder.user?.email || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedOrder.user?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary">Products</h3>
                <div className="space-y-3">
                  {selectedOrder.products.map((product, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <div className="flex gap-2 text-sm text-gray-500">
                            <span>Color: <span style={{ backgroundColor: product.color, width: '12px', height: '12px', display: 'inline-block', border: '1px solid #ddd' }}></span> </span>
                            <span>Size: {product.size}</span>
                          </div>
                        </div>
                        <p className="font-medium">Rs. {parseFloat(product.price).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-3">
                  <p className="font-medium">Total Amount</p>
                  <p className="font-bold text-lg">Rs. {selectedOrder.total_amount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}

export default withAuth(Orders);

"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import withAuth from "@/app/components/withAuth";
import { supabase } from "@/app/lib/supabaseClient";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  IndianRupee, 
  TrendingUp, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChartColumnStacked
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Loading animation component
function LoadingAnimation() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <div className="absolute inset-2 animate-spin rounded-full border-4 border-secondary border-t-transparent" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          <div className="absolute inset-4 flex items-center justify-center rounded-full bg-background">
            <Package className="h-8 w-8 text-primary" />
          </div>
        </div>
        <p className="text-lg font-medium text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    recentAddedProducts: [],
    lowStockProducts: []
  });

  useEffect(() => {
    // Initial page loading animation
    const pageTimer = setTimeout(() => {
      setPageLoading(false);
    }, 1500);

    return () => clearTimeout(pageTimer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch counts from all tables
        const [
          { count: productsCount },
          { count: ordersCount },
          { count: usersCount }
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('Order_details').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true })
        ]);

        // Fetch recent pending orders from Order_details
        const { data: orderDetails } = await supabase
          .from('Order_details')
          .select(`
            order_id,
            name,
            color,
            size,
            price,
            created_at,
            status
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20);

        // Group orders by order_id
        const groupedOrders = {};
        if (orderDetails) {
          orderDetails.forEach(order => {
            if (!groupedOrders[order.order_id]) {
              groupedOrders[order.order_id] = {
                order_id: order.order_id,
                created_at: order.created_at,
                status: order.status,
                products: [],
                total_amount: 0
              };
            }
            
            groupedOrders[order.order_id].products.push({
              name: order.name,
              color: order.color,
              size: order.size,
              price: order.price
            });
            
            groupedOrders[order.order_id].total_amount += parseFloat(order.price) || 0;
          });
        }

        // Convert to array and limit to 5 for display
        const recentOrders = Object.values(groupedOrders).slice(0, 5);

        // Fetch popular products
        const { data: recentAddedProducts } = await supabase
          .from('products')
          .select(`
            id,
            name,
            sellPrice,
            brand,
            productType
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch low stock products
        const { data: lowStockProducts } = await supabase
          .from('products')
          .select('id, name, stock')
          .lt('stock', 10)
          .order('stock', { ascending: true })
          .limit(5);

        // Calculate total revenue from Order_details
        const { data: allOrderDetails } = await supabase
          .from('Order_details')
          .select('price, status')
          .eq('status', 'Delivered');
        
        const totalRevenue = allOrderDetails?.reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0) || 0;

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          totalUsers: usersCount || 0,
          totalRevenue: totalRevenue,
          recentOrders: recentOrders,
          recentAddedProducts: recentAddedProducts?.map(product => ({
            product_id: product.id,
            products: { 
              name: product.name, 
              //price: product.sellPrice 
            },
            count: product.sellPrice // Simulated order count
          })) || [],
          lowStockProducts: lowStockProducts?.map(product => ({
            id: product.id,
            name: product.name,
            stock: product.stock
          })) || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-gray-100 text-gray-800';
      case 'Confirmed': return 'bg-blue-100 text-blue-800';
      case 'Dispatched': return 'bg-yellow-100 text-yellow-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading animation at the beginning
  if (pageLoading) {
    return <LoadingAnimation />;
  }

  return (
    <Sidebar className="w-full">
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Enquiries</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee  className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders & Popular Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <a href="/orders">View All Orders</a>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats.recentOrders.length > 0 ? (
              <div className="space-y-0">
                {stats.recentOrders.map((order, index) => (
                  <div key={order.order_id} className={`flex items-center justify-between py-3 ${index !== stats.recentOrders.length - 1 ? 'border-b' : ''}`}>
                    <div>
                      <p className="font-medium">Order #<br/>{order.order_id} ({order.products.length} item{order.products.length !== 1 ? 's' : ''})</p>
                      <p className="text-sm text-muted-foreground">
                        <Badge className={getOrderStatusColor(order.status)}>
                          {order.status}
                        </Badge> / {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No pending orders</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <CardTitle>Recent Added Products</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <a href="/products">View All Products</a>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats.recentAddedProducts.length > 0 ? (
              <div className="space-y-0">
                {stats.recentAddedProducts.map((item, index) => (
                  <div key={item.product_id} className={`flex items-center justify-between py-3 ${index !== stats.recentAddedProducts.length - 1 ? 'border-b' : ''}`}>
                    <div>
                      <p className="font-medium">{item.products?.name || 'Unknown Product'}</p>
                      {/*<p className="text-sm text-muted-foreground">
                        {formatCurrency(item.products?.price || 0)}
                      </p>*/}
                    </div>
                    <div className="flex items-center gap-5">
                      {/*<TrendingUp className="h-4 w-4 text-green-500" />*/}
                      <span className="font-medium">{formatCurrency(item.count || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No popular products data</p>
            )}
          </CardContent>
        </Card>
      </div>
      
         </div>
    </Sidebar>
  );
}

export default withAuth(Dashboard);

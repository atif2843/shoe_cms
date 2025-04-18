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
          supabase.from('enquiries').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true })
        ]);

        // Fetch recent orders
        const { data: recentOrders } = await supabase
          .from('enquiries')
          .select(`
            id,
            name,
            email,
            phone,
            message,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(5);

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

        // Calculate total revenue
        const { data: allOrders } = await supabase
          .from('enquiries')
          .select('total');
        
        const totalRevenue = allOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

        setStats({
          totalProducts: productsCount || 0,
          totalOrders: ordersCount || 0,
          totalUsers: usersCount || 0,
          totalRevenue: totalRevenue,
          recentOrders: recentOrders?.map(order => ({
            id: order.id,
            users: { name: order.name },
            status: order.status || 'pending',
            total: order.total || 0
          })) || [],
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'shipped': return 'bg-green-500';
      case 'delivered': return 'bg-green-700';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
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
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.users?.name || 'Unknown User'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getOrderStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <span className="font-medium">{formatCurrency(order.total || 0)}</span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4" asChild>
                  <a href="/orders">View All Orders</a>
                </Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent orders</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Added Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : stats.recentAddedProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAddedProducts.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between">
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
                <Button variant="outline" className="w-full mt-4" asChild>
                  <a href="/products">View All Products</a>
                </Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No popular products data</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Low Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : stats.lowStockProducts.length > 0 ? (
            <div className="space-y-4">
              {stats.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{product.name}</p>
                      <span className="text-sm font-medium">{product.stock} in stock</span>
                    </div>
                    <Progress value={(product.stock / 10) * 100} className="h-2" />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4" asChild>
                <a href="/products">Manage Inventory</a>
              </Button>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No low stock products</p>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button className="h-24 flex flex-col items-center justify-center gap-2" asChild>
          <a href="/products/new">
            <Package className="h-6 w-6" />
            <span>Add New Product</span>
          </a>
        </Button>
        <Button className="h-24 flex flex-col items-center justify-center gap-2" asChild>
          <a href="/orders">
            <ShoppingCart className="h-6 w-6" />
            <span>Process Orders</span>
          </a>
        </Button>
        <Button className="h-24 flex flex-col items-center justify-center gap-2" asChild>
          <a href="/users">
            <Users className="h-6 w-6" />
            <span>Manage Users</span>
          </a>
        </Button>
        <Button className="h-24 flex flex-col items-center justify-center gap-2" asChild>
          <a href="/categories">
            <ChartColumnStacked className="h-6 w-6" />
            <span>Manage Categories</span>
          </a>
        </Button>
      </div>
    </div>
    </Sidebar>
  );
}

export default withAuth(Dashboard);

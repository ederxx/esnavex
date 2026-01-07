import { useEffect, useState } from "react";
import { getArtistsCount, getBookingsCount, getProductionsCount, getActiveProductionsCount, getRecentProductions, getBookingsBetween } from "@/integrations/firebase/db";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { Loader2 } from "lucide-react";

interface DashboardData {
  artistsCount: number;
  bookingsCount: number;
  productionsCount: number;
  activeProductionsCount: number;
  recentProductions: any[];
  upcomingBookings: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all counts and data in parallel
      const [
        artistsCount,
        bookingsCount,
        productionsCount,
        activeProductionsCount,
        recentProductions,
        upcomingBookings,
      ] = await Promise.all([
        getArtistsCount(),
        getBookingsCount(),
        getProductionsCount(),
        getActiveProductionsCount(),
        getRecentProductions(5),
        getBookingsBetween(new Date().toISOString(), new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()),
      ]);

      setData({
        artistsCount: artistsCount || 0,
        bookingsCount: (bookingsCount as number) || 0,
        productionsCount: (productionsCount as number) || 0,
        activeProductionsCount: (activeProductionsCount as number) || 0,
        recentProductions: recentProductions || [],
        upcomingBookings: (upcomingBookings || []).slice(0, 5),
      });

      setData({
        artistsCount: artistsResult.count || 0,
        bookingsCount: bookingsResult.count || 0,
        productionsCount: productionsResult.count || 0,
        activeProductionsCount: activeProductionsResult.count || 0,
        recentProductions: recentProductionsResult.data || [],
        upcomingBookings: upcomingBookingsResult.data || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do estúdio Espaço Nave
        </p>
      </div>

      {data && (
        <>
          <DashboardStats
            artistsCount={data.artistsCount}
            bookingsCount={data.bookingsCount}
            productionsCount={data.productionsCount}
            activeProductionsCount={data.activeProductionsCount}
          />
          <RecentActivity
            productions={data.recentProductions}
            bookings={data.upcomingBookings}
          />
        </>
      )}
    </div>
  );
}

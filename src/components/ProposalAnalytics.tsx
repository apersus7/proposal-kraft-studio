import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Eye, Clock, MessageSquare, Users, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ProposalAnalyticsProps {
  proposalId: string;
  proposalTitle: string;
}

interface AnalyticsData {
  totalViews: number;
  uniqueViewers: number;
  avgViewTime: number;
  comments: number;
  shares: number;
  lastViewed: string | null;
  topSections: { section: string; views: number; timeSpent: number }[];
  viewsByDay: { date: string; views: number; duration: number }[];
  viewerLocations: { country: string; views: number }[];
  deviceTypes: { device: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ProposalAnalytics({ proposalId, proposalTitle }: ProposalAnalyticsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch proposal analytics
      const { data: analyticsData, error } = await supabase
        .from('proposal_analytics')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process analytics data
      const processedData = processAnalyticsData(analyticsData || []);
      setAnalytics(processedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (data: any[]): AnalyticsData => {
    const views = data.filter(d => d.event_type === 'view');
    const uniqueViewers = new Set(views.map(v => v.visitor_id)).size;
    const totalViews = views.length;
    const avgViewTime = views.reduce((acc, v) => acc + (v.duration || 0), 0) / views.length || 0;

    // Group by sections
    const sectionViews = data.filter(d => d.event_type === 'section_view');
    const topSections = Object.entries(
      sectionViews.reduce((acc: any, view) => {
        const section = view.section_id || 'Unknown';
        if (!acc[section]) acc[section] = { views: 0, timeSpent: 0 };
        acc[section].views++;
        acc[section].timeSpent += view.duration || 0;
        return acc;
      }, {})
    ).map(([section, stats]: [string, any]) => ({
      section: section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      views: stats.views,
      timeSpent: stats.timeSpent
    })).sort((a, b) => b.views - a.views).slice(0, 5);

    // Group by day
    const viewsByDay = Object.entries(
      views.reduce((acc: any, view) => {
        const date = view.created_at.split('T')[0];
        if (!acc[date]) acc[date] = { views: 0, duration: 0 };
        acc[date].views++;
        acc[date].duration += view.duration || 0;
        return acc;
      }, {})
    ).map(([date, stats]: [string, any]) => ({
      date: format(new Date(date), 'MMM dd'),
      views: stats.views,
      duration: Math.round(stats.duration / stats.views) || 0
    })).slice(-7); // Last 7 days

    // Device types (simulated from user agent)
    const deviceTypes = Object.entries(
      data.reduce((acc: any, item) => {
        const ua = item.user_agent || '';
        let device = 'Desktop';
        if (ua.includes('Mobile')) device = 'Mobile';
        else if (ua.includes('Tablet')) device = 'Tablet';
        
        if (!acc[device]) acc[device] = 0;
        acc[device]++;
        return acc;
      }, {})
    ).map(([device, count]) => ({ device, count: count as number }));

    return {
      totalViews,
      uniqueViewers,
      avgViewTime: Math.round(avgViewTime),
      comments: data.filter(d => d.event_type === 'comment').length,
      shares: data.filter(d => d.event_type === 'share').length,
      lastViewed: views.length > 0 ? views[0].created_at : null,
      topSections,
      viewsByDay,
      viewerLocations: [], // Would need IP geolocation
      deviceTypes
    };
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analytics for "{proposalTitle}"</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <Eye className="h-5 w-5 text-blue-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.totalViews}</div>
                    <div className="text-xs text-muted-foreground">Total Views</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <Users className="h-5 w-5 text-green-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.uniqueViewers}</div>
                    <div className="text-xs text-muted-foreground">Unique Viewers</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <Clock className="h-5 w-5 text-orange-500 mb-2" />
                    <div className="text-2xl font-bold">{formatDuration(analytics.avgViewTime)}</div>
                    <div className="text-xs text-muted-foreground">Avg. Time</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <MessageSquare className="h-5 w-5 text-purple-500 mb-2" />
                    <div className="text-2xl font-bold">{analytics.comments}</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <Calendar className="h-5 w-5 text-red-500 mb-2" />
                    <div className="text-sm font-bold">
                      {analytics.lastViewed ? format(new Date(analytics.lastViewed), 'MMM dd') : 'Never'}
                    </div>
                    <div className="text-xs text-muted-foreground">Last Viewed</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Views Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Views Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analytics.viewsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Most Viewed Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.topSections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="section" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Device Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Device Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics.deviceTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.deviceTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Section Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Section Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topSections.map((section, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{section.section}</p>
                        <p className="text-sm text-muted-foreground">
                          {section.views} views • {formatDuration(section.timeSpent / section.views)} avg time
                        </p>
                      </div>
                      <Badge variant="outline">{section.views}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No analytics data available yet
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
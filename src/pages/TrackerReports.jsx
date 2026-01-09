import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, AlertCircle, Clock, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function TrackerReports() {
  const [timeRange, setTimeRange] = useState("week"); // week, month, quarter, year
  const [selectedBoard, setSelectedBoard] = useState(null);

  const { data: boards = [] } = useQuery({
    queryKey: ['tracker-boards'],
    queryFn: () => base44.entities.Tracker_Board.list('position')
  });

  const { data: columns = [] } = useQuery({
    queryKey: ['tracker-columns'],
    queryFn: () => base44.entities.Tracker_Column.list()
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['tracker-cards'],
    queryFn: () => base44.entities.Tracker_Card.list()
  });

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(now.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  };

  const { start, end } = getDateRange();

  // Filter cards by board and date range
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      if (selectedBoard && card.board_id !== selectedBoard) return false;
      
      const updatedDate = new Date(card.updated_date);
      return updatedDate >= start && updatedDate <= end;
    });
  }, [cards, selectedBoard, start, end]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const completed = filteredCards.filter(c => c.status === "Done").length;
    const overdue = filteredCards.filter(c => {
      if (!c.end_date || c.status === "Done") return false;
      return new Date(c.end_date) < new Date();
    }).length;
    
    // Calculate average completion time
    const completedCards = filteredCards.filter(c => c.status === "Done" && c.start_date && c.updated_date);
    const avgTime = completedCards.length > 0 
      ? completedCards.reduce((sum, c) => {
          const start = new Date(c.start_date);
          const end = new Date(c.updated_date);
          return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / completedCards.length
      : 0;

    return {
      total: filteredCards.length,
      completed,
      inProgress: filteredCards.filter(c => c.status === "In progress").length,
      overdue,
      avgCompletionTime: avgTime.toFixed(1)
    };
  }, [filteredCards]);

  // Task distribution by column
  const columnDistribution = useMemo(() => {
    const distribution = {};
    columns.forEach(col => {
      const count = filteredCards.filter(c => c.column_id === col.id).length;
      if (count > 0) {
        distribution[col.title] = count;
      }
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredCards, columns]);

  // Task distribution by status
  const statusDistribution = useMemo(() => {
    const statuses = ["To do", "In progress", "Approved", "Done"];
    return statuses.map(status => ({
      name: status,
      value: filteredCards.filter(c => c.status === status).length
    })).filter(s => s.value > 0);
  }, [filteredCards]);

  // Task distribution by priority
  const priorityDistribution = useMemo(() => {
    const priorities = ["Highest", "High", "Medium", "Low"];
    return priorities.map(priority => ({
      name: priority,
      value: filteredCards.filter(c => c.priority === priority).length
    })).filter(p => p.value > 0);
  }, [filteredCards]);

  // Tasks completed per week
  const weeklyCompletion = useMemo(() => {
    const weeks = {};
    const completedCards = filteredCards.filter(c => c.status === "Done");
    
    completedCards.forEach(card => {
      const date = new Date(card.updated_date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      weeks[key] = (weeks[key] || 0) + 1;
    });
    
    return Object.entries(weeks)
      .map(([date, count]) => ({ date: new Date(date).toLocaleDateString(), count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredCards]);

  const COLORS = ['#0ea5e9', '#06b6d4', '#0891b2', '#0e7490', '#155e75'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen p-6" style={{
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)'
    }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ color: "#1E3A8A" }}>
            Tracker Reports
          </h1>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 ampvibe-button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedBoard || "all"} onValueChange={(v) => setSelectedBoard(v === "all" ? null : v)}>
              <SelectTrigger className="w-40 ampvibe-button">
                <SelectValue placeholder="All Boards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Boards</SelectItem>
                {boards.map(board => (
                  <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <NeuroButton onClick={handlePrint} variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Print Report
            </NeuroButton>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                <TrendingUp className="w-6 h-6" style={{ color: '#0ea5e9' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>{metrics.total}</p>
              </div>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(0, 168, 107, 0.1)' }}>
                <Calendar className="w-6 h-6" style={{ color: '#00A86B' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold" style={{ color: '#00A86B' }}>{metrics.completed}</p>
              </div>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                <Clock className="w-6 h-6" style={{ color: '#eab308' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold" style={{ color: '#eab308' }}>{metrics.inProgress}</p>
              </div>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle className="w-6 h-6" style={{ color: '#ef4444' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{metrics.overdue}</p>
              </div>
            </div>
          </NeuroCard>

          <NeuroCard>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full" style={{ background: 'rgba(14, 165, 233, 0.1)' }}>
                <Clock className="w-6 h-6" style={{ color: '#0ea5e9' }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Time</p>
                <p className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>{metrics.avgCompletionTime}d</p>
              </div>
            </div>
          </NeuroCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Completion Trend */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
              Tasks Completed Per Week
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </NeuroCard>

          {/* Status Distribution */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
              Task Distribution by Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </NeuroCard>

          {/* Column Distribution */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
              Task Distribution by Column
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={columnDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0ea5e9" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </NeuroCard>

          {/* Priority Distribution */}
          <NeuroCard>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1E3A8A' }}>
              Task Distribution by Priority
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#06b6d4" name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </NeuroCard>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body { background: white !important; }
            .ampvibe-card { box-shadow: none !important; border: 1px solid #e5e7eb; }
            button { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
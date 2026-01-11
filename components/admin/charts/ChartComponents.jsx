"use client";

import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Color palette matching the design system
export const CHART_COLORS = {
  orange: '#FE9200',
  orangeLight: '#FFB84D',
  green: '#16A34A',
  greenLight: '#22C55E',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  red: '#EF4444',
  redLight: '#F87171',
  amber: '#F59E0B',
  gray: '#6B7280',
  grayLight: '#9CA3AF'
};

// Chart wrapper with loading state
export const ChartContainer = ({ title, subtitle, children, loading, className = '', actions }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 p-5 md:p-6 ${className}`}>
    <div className="flex items-start justify-between mb-4 md:mb-6">
      <div>
        <h3 className="font-bold text-gray-900 text-sm md:text-base">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-1">{actions}</div>}
    </div>
    {loading ? (
      <div className="flex items-center justify-center h-48 md:h-64">
        <div className="w-8 h-8 border-3 border-[#FE9200] border-t-transparent rounded-full animate-spin" />
      </div>
    ) : children}
  </div>
);

// Time range toggle buttons
export const TimeRangeToggle = ({ value, onChange, options = ['7d', '30d', '90d'] }) => (
  <div className="flex bg-gray-100 rounded-lg p-0.5">
    {options.map(opt => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        className={`px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${
          value === opt 
            ? 'bg-[#FE9200] text-white' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

// Custom tooltip for charts
export const CustomTooltip = ({ active, payload, label, formatter, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="font-bold" style={{ color: entry.color }}>
          {entry.name}: {prefix}{formatter ? formatter(entry.value) : entry.value.toLocaleString()}{suffix}
        </p>
      ))}
    </div>
  );
};

// Revenue Line Chart
export const RevenueLineChart = ({ data, timeRange, loading }) => {
  const formatValue = (val) => {
    if (val >= 1000000) return `${(val/1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val/1000).toFixed(1)}K`;
    return val.toLocaleString();
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          tickFormatter={formatValue}
          width={45}
        />
        <Tooltip content={<CustomTooltip prefix="KSh " formatter={formatValue} />} />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke={CHART_COLORS.green}
          strokeWidth={2}
          fill="url(#revenueGradient)"
          name="Revenue"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// User Growth Area Chart
export const UserGrowthChart = ({ data, loading }) => (
  <ResponsiveContainer width="100%" height={240}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="agentsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
          <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
        </linearGradient>
        <linearGradient id="tenantsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.3} />
          <stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={35} />
      <Tooltip content={<CustomTooltip />} />
      <Legend 
        verticalAlign="top" 
        height={36}
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
      />
      <Area type="monotone" dataKey="agents" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#agentsGradient)" name="Agents" />
      <Area type="monotone" dataKey="tenants" stroke={CHART_COLORS.purple} strokeWidth={2} fill="url(#tenantsGradient)" name="Tenants" />
    </AreaChart>
  </ResponsiveContainer>
);

// Leads Distribution Donut Chart
const LEAD_STATUS_COLORS = {
  active: '#16A34A',
  paused: '#F59E0B',
  expired: '#6B7280',
  closed: '#EF4444'
};

export const LeadsDonutChart = ({ data, loading }) => {
  const total = data?.reduce((sum, d) => sum + d.value, 0) || 0;

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data?.map((entry, idx) => (
              <Cell key={idx} fill={LEAD_STATUS_COLORS[entry.status] || CHART_COLORS.gray} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs">
                  <p className="capitalize font-bold">{item.status}: {item.value}</p>
                  <p className="text-gray-400">{((item.value/total)*100).toFixed(1)}%</p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data?.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LEAD_STATUS_COLORS[item.status] }} />
            <span className="text-[10px] md:text-xs text-gray-600 capitalize">{item.status} ({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Top Locations Horizontal Bar Chart
export const TopLocationsChart = ({ data, loading }) => (
  <ResponsiveContainer width="100%" height={Math.max(200, data?.length * 36 || 200)}>
    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
      <YAxis
        type="category"
        dataKey="location"
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 10, fill: '#374151' }}
        width={90}
      />
      <Tooltip content={<CustomTooltip suffix=" leads" />} />
      <Bar
        dataKey="count"
        fill={CHART_COLORS.orange}
        radius={[0, 4, 4, 0]}
        name="Leads"
        barSize={20}
      />
    </BarChart>
  </ResponsiveContainer>
);

// Daily Activity Grouped Bar Chart
export const DailyActivityChart = ({ data, loading }) => (
  <ResponsiveContainer width="100%" height={240}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={30} />
      <Tooltip content={<CustomTooltip />} />
      <Legend
        verticalAlign="top"
        height={36}
        iconType="circle"
        iconSize={8}
        wrapperStyle={{ fontSize: '10px', fontWeight: 600 }}
      />
      <Bar dataKey="signups" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} name="Signups" barSize={12} />
      <Bar dataKey="transactions" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} name="Transactions" barSize={12} />
      <Bar dataKey="leads" fill={CHART_COLORS.orange} radius={[4, 4, 0, 0]} name="Leads" barSize={12} />
    </BarChart>
  </ResponsiveContainer>
);

// Revenue Breakdown Stacked Bar Chart (for Finance)
export const RevenueBreakdownChart = ({ data, loading }) => (
  <ResponsiveContainer width="100%" height={280}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} width={50}
        tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}K` : val}
      />
      <Tooltip content={<CustomTooltip prefix="KSh " />} />
      <Legend verticalAlign="top" height={36} iconType="rect" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
      <Bar dataKey="starter" stackId="a" fill={CHART_COLORS.blue} name="Starter" radius={[0, 0, 0, 0]} />
      <Bar dataKey="basic" stackId="a" fill={CHART_COLORS.purple} name="Basic" />
      <Bar dataKey="pro" stackId="a" fill={CHART_COLORS.orange} name="Pro" />
      <Bar dataKey="enterprise" stackId="a" fill={CHART_COLORS.green} name="Enterprise" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

// Transaction Volume Dual Axis Chart (for Finance)
export const TransactionVolumeChart = ({ data, loading }) => {
  const formatValue = (val) => {
    if (val >= 1000000) return `${(val/1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val/1000).toFixed(1)}K`;
    return val;
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
        <YAxis
          yAxisId="left"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          width={40}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          tickFormatter={formatValue}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="top" height={36} iconType="line" wrapperStyle={{ fontSize: '10px', fontWeight: 600 }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="count"
          stroke={CHART_COLORS.blue}
          strokeWidth={2}
          dot={false}
          name="Transactions"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="volume"
          stroke={CHART_COLORS.green}
          strokeWidth={2}
          dot={false}
          name="Volume (KSh)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};


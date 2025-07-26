import { lazy } from 'react';

// Lazy loading para páginas principais
export const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));

// Lazy loading para componentes pesados
export const ChartComponents = {
  LineChart: lazy(() => import('recharts').then(module => ({ default: module.LineChart }))),
  BarChart: lazy(() => import('recharts').then(module => ({ default: module.BarChart }))),
  PieChart: lazy(() => import('recharts').then(module => ({ default: module.PieChart }))),
};

// Lazy loading para features condicionais
export const AdvancedFeatures = {
  FileUpload: lazy(() => import('../components/FileUpload')),
  RichEditor: lazy(() => import('../components/RichEditor')),
  DataTable: lazy(() => import('../components/DataTable')),
};
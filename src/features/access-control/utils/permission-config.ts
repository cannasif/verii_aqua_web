export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/': 'dashboard.view',
  '/welcome': 'dashboard.view',

  '/stocks': 'stock.stocks.view',
  '/stocks/:id': 'stock.stocks.view',

  '/profile': 'users.profile.view',

  '/user-management': 'admin-only',
  '/users/mail-settings': 'admin-only',
  '/hangfire-monitoring': 'admin-only',
  '/access-control/permission-definitions': 'admin-only',
  '/access-control/permission-groups': 'admin-only',
  '/access-control/user-group-assignments': 'admin-only',

  '/aqua/definitions/projects': 'aqua.definitions.projects.view',
  '/aqua/definitions/cages': 'aqua.definitions.cages.view',
  '/aqua/definitions/project-cage-assignments': 'aqua.definitions.project-cage-assignments.view',
  '/aqua/definitions/weather-severities': 'aqua.definitions.weather-severities.view',
  '/aqua/definitions/weather-types': 'aqua.definitions.weather-types.view',
  '/aqua/definitions/net-operation-types': 'aqua.definitions.net-operation-types.view',

  '/aqua/operations/quick-setup': 'aqua.operations.quick-setup.view',
  '/aqua/operations/quick-daily-entry': 'aqua.operations.quick-daily-entry.view',
  '/aqua/operations/goods-receipts': 'aqua.operations.goods-receipts.view',
  '/aqua/operations/feedings': 'aqua.operations.feedings.view',
  '/aqua/operations/mortalities': 'aqua.operations.mortalities.view',
  '/aqua/operations/transfers': 'aqua.operations.transfers.view',
  '/aqua/operations/shipments': 'aqua.operations.shipments.view',
  '/aqua/operations/stock-converts': 'aqua.operations.stock-converts.view',
  '/aqua/operations/daily-weathers': 'aqua.operations.daily-weathers.view',
  '/aqua/operations/net-operations': 'aqua.operations.net-operations.view',

  '/aqua/operations/goods-receipt-lines': 'aqua.operations.goods-receipts.view',
  '/aqua/operations/goods-receipt-fish-distributions': 'aqua.operations.goods-receipts.view',
  '/aqua/operations/feeding-lines': 'aqua.operations.feedings.view',
  '/aqua/operations/feeding-distributions': 'aqua.operations.feedings.view',
  '/aqua/operations/transfer-lines': 'aqua.operations.transfers.view',
  '/aqua/operations/shipment-lines': 'aqua.operations.shipments.view',
  '/aqua/operations/mortality-lines': 'aqua.operations.mortalities.view',
  '/aqua/operations/stock-convert-lines': 'aqua.operations.stock-converts.view',
  '/aqua/operations/net-operation-lines': 'aqua.operations.net-operations.view',

  '/aqua/reports/project-detail': 'aqua.reports.project-detail.view',
  '/aqua/reports/batch-movements': 'aqua.reports.batch-movements.view',
  '/aqua/reports/cage-balances': 'aqua.reports.cage-balances.view',
  '/aqua/dashboard': 'aqua.reports.project-detail.view',
};

export const PATH_TO_PERMISSION_PATTERNS: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/$/, permission: 'dashboard.view' },
  { pattern: /^\/welcome(\/|$)/, permission: 'dashboard.view' },

  { pattern: /^\/stocks(\/|$)/, permission: 'stock.stocks.view' },
  { pattern: /^\/profile(\/|$)/, permission: 'users.profile.view' },

  { pattern: /^\/aqua\/definitions\/projects(\/|$)/, permission: 'aqua.definitions.projects.view' },
  { pattern: /^\/aqua\/definitions\/cages(\/|$)/, permission: 'aqua.definitions.cages.view' },
  {
    pattern: /^\/aqua\/definitions\/project-cage-assignments(\/|$)/,
    permission: 'aqua.definitions.project-cage-assignments.view',
  },
  {
    pattern: /^\/aqua\/definitions\/weather-severities(\/|$)/,
    permission: 'aqua.definitions.weather-severities.view',
  },
  {
    pattern: /^\/aqua\/definitions\/weather-types(\/|$)/,
    permission: 'aqua.definitions.weather-types.view',
  },
  {
    pattern: /^\/aqua\/definitions\/net-operation-types(\/|$)/,
    permission: 'aqua.definitions.net-operation-types.view',
  },

  { pattern: /^\/aqua\/operations\/quick-setup(\/|$)/, permission: 'aqua.operations.quick-setup.view' },
  {
    pattern: /^\/aqua\/operations\/quick-daily-entry(\/|$)/,
    permission: 'aqua.operations.quick-daily-entry.view',
  },
  {
    pattern: /^\/aqua\/operations\/(goods-receipts|goods-receipt-lines|goods-receipt-fish-distributions)(\/|$)/,
    permission: 'aqua.operations.goods-receipts.view',
  },
  {
    pattern: /^\/aqua\/operations\/(feedings|feeding-lines|feeding-distributions)(\/|$)/,
    permission: 'aqua.operations.feedings.view',
  },
  {
    pattern: /^\/aqua\/operations\/(mortalities|mortality-lines)(\/|$)/,
    permission: 'aqua.operations.mortalities.view',
  },
  {
    pattern: /^\/aqua\/operations\/(transfers|transfer-lines)(\/|$)/,
    permission: 'aqua.operations.transfers.view',
  },
  {
    pattern: /^\/aqua\/operations\/(shipments|shipment-lines)(\/|$)/,
    permission: 'aqua.operations.shipments.view',
  },
  {
    pattern: /^\/aqua\/operations\/(stock-converts|stock-convert-lines)(\/|$)/,
    permission: 'aqua.operations.stock-converts.view',
  },
  {
    pattern: /^\/aqua\/operations\/daily-weathers(\/|$)/,
    permission: 'aqua.operations.daily-weathers.view',
  },
  {
    pattern: /^\/aqua\/operations\/(net-operations|net-operation-lines)(\/|$)/,
    permission: 'aqua.operations.net-operations.view',
  },

  {
    pattern: /^\/aqua\/reports\/project-detail(\/|$)/,
    permission: 'aqua.reports.project-detail.view',
  },
  {
    pattern: /^\/aqua\/dashboard(\/|$)/,
    permission: 'aqua.reports.project-detail.view',
  },
  {
    pattern: /^\/aqua\/reports\/batch-movements(\/|$)/,
    permission: 'aqua.reports.batch-movements.view',
  },
  {
    pattern: /^\/aqua\/reports\/cage-balances(\/|$)/,
    permission: 'aqua.reports.cage-balances.view',
  },
];

export function isLeafPermissionCode(code: string): boolean {
  if (code === 'dashboard.view') return true;
  return code.split('.').filter(Boolean).length >= 3;
}

export const ACCESS_CONTROL_ADMIN_PERMISSIONS = [
  'access-control.permission-definitions.view',
  'access-control.permission-groups.view',
  'access-control.user-group-assignments.view',
] as const;

export const RBAC_FALLBACK_PERMISSION = 'access-control.permission-definitions.view' as const;

export const ACCESS_CONTROL_ADMIN_FALLBACK_TO_SYSTEM_ADMIN = true as const;

export const ACCESS_CONTROL_ADMIN_ONLY_PATTERNS: RegExp[] = [
  /^\/access-control(\/|$)/,
  /^\/user-management(\/|$)/,
  /^\/users\/mail-settings(\/|$)/,
  /^\/hangfire-monitoring(\/|$)/,
];

export const PERMISSION_CODE_DISPLAY: Record<string, { key: string; fallback: string }> = {
  'dashboard.view': { key: 'sidebar.home', fallback: 'Ana Sayfa' },
  'stock.stocks.view': { key: 'sidebar.stockManagement', fallback: 'Stok Yönetimi' },
  'users.profile.view': { key: 'sidebar.settings', fallback: 'Ayarlar' },

  'aqua.definitions.projects.view': { key: 'sidebar.aquaProjects', fallback: 'Projeler' },
  'aqua.definitions.cages.view': { key: 'sidebar.aquaCages', fallback: 'Kafesler' },
  'aqua.definitions.project-cage-assignments.view': {
    key: 'sidebar.aquaProjectCageAssignments',
    fallback: 'Proje-Kafes Atama',
  },
  'aqua.definitions.weather-severities.view': {
    key: 'sidebar.aquaWeatherSeverities',
    fallback: 'Hava Durumu Şiddet Tanımı',
  },
  'aqua.definitions.weather-types.view': {
    key: 'sidebar.aquaWeatherTypes',
    fallback: 'Hava Durumu Tip Tanımı',
  },
  'aqua.definitions.net-operation-types.view': {
    key: 'sidebar.aquaNetOperationTypes',
    fallback: 'Ağ İşlem Tipleri',
  },

  'aqua.operations.quick-setup.view': { key: 'sidebar.aquaQuickSetup', fallback: 'Hızlı Kurulum' },
  'aqua.operations.quick-daily-entry.view': {
    key: 'sidebar.aquaQuickDailyEntry',
    fallback: 'Hızlı Günlük Giriş',
  },
  'aqua.operations.goods-receipts.view': {
    key: 'sidebar.aquaGoodsReceipts',
    fallback: 'Mal Kabul (Balık/Yem)',
  },
  'aqua.operations.feedings.view': {
    key: 'sidebar.aquaFeedings',
    fallback: 'Besleme (Sabah/Akşam)',
  },
  'aqua.operations.mortalities.view': { key: 'sidebar.aquaMortalities', fallback: 'Ölüm' },
  'aqua.operations.transfers.view': { key: 'sidebar.aquaTransfers', fallback: 'Transfer' },
  'aqua.operations.shipments.view': { key: 'sidebar.aquaShipments', fallback: 'Sevkiyat' },
  'aqua.operations.stock-converts.view': {
    key: 'sidebar.aquaStockConverts',
    fallback: 'Stok Dönüşüm',
  },
  'aqua.operations.daily-weathers.view': {
    key: 'sidebar.aquaDailyWeathers',
    fallback: 'Günlük Hava Durumu',
  },
  'aqua.operations.net-operations.view': { key: 'sidebar.aquaNetOperations', fallback: 'Ağ İşlemleri' },

  'aqua.reports.project-detail.view': {
    key: 'sidebar.aquaProjectDetailReport',
    fallback: 'Proje Detay Raporu',
  },
  'aqua.reports.batch-movements.view': {
    key: 'sidebar.aquaBatchMovements',
    fallback: 'Parti Hareketleri',
  },
  'aqua.reports.cage-balances.view': { key: 'sidebar.aquaCageBalances', fallback: 'Kafes Dengesi' },
};

export function getPermissionDisplayMeta(code: string): { key: string; fallback: string } | null {
  return PERMISSION_CODE_DISPLAY[code] ?? null;
}

export const PERMISSION_MODULE_DISPLAY: Record<string, { key: string; fallback: string }> = {
  dashboard: { key: 'sidebar.home', fallback: 'Ana Sayfa' },
  stock: { key: 'sidebar.productAndStock', fallback: 'Ürünler ve Stok' },
  users: { key: 'sidebar.profile', fallback: 'Profil' },
  aqua: { key: 'sidebar.aquaOperations', fallback: 'Aqua İşlemleri' },
  'access-control': { key: 'sidebar.accessControl', fallback: 'Erişim Kontrolü' },
};

export function getPermissionModuleDisplayMeta(prefix: string): { key: string; fallback: string } | null {
  return PERMISSION_MODULE_DISPLAY[prefix] ?? null;
}

const SIDEBAR_PERMISSION_CODES = [
  'dashboard.view',
  'stock.stocks.view',
  'users.profile.view',

  'aqua.definitions.projects.view',
  'aqua.definitions.cages.view',
  'aqua.definitions.project-cage-assignments.view',
  'aqua.definitions.weather-severities.view',
  'aqua.definitions.weather-types.view',
  'aqua.definitions.net-operation-types.view',

  'aqua.operations.quick-setup.view',
  'aqua.operations.quick-daily-entry.view',
  'aqua.operations.goods-receipts.view',
  'aqua.operations.feedings.view',
  'aqua.operations.mortalities.view',
  'aqua.operations.transfers.view',
  'aqua.operations.shipments.view',
  'aqua.operations.stock-converts.view',
  'aqua.operations.daily-weathers.view',
  'aqua.operations.net-operations.view',

  'aqua.reports.project-detail.view',
  'aqua.reports.batch-movements.view',
  'aqua.reports.cage-balances.view',
] as const;

export const PERMISSION_CODE_CATALOG: string[] = Array.from(
  new Set(SIDEBAR_PERMISSION_CODES)
).sort((a, b) => a.localeCompare(b));

export function getRoutesForPermissionCode(code: string): string[] {
  const routes = Object.entries(ROUTE_PERMISSION_MAP)
    .filter(([, permissionCode]) => permissionCode === code)
    .map(([route]) => route);
  return routes.sort((a, b) => a.localeCompare(b));
}

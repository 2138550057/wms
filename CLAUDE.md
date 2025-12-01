# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WMS (Warehouse Management System) is a full-stack TypeScript application for managing warehouse operations including inbound orders, outbound orders, and inventory tracking. The system uses a monorepo structure with separate backend and frontend applications.

**Current Status**: Full-stack application is operational. Both backend and frontend are complete with CRUD operations, Excel export, filtering, detail pages, dashboard statistics, and attachment management implemented. The system uses **MySQL** in production.

**Recent Additions**:
- ✅ Complete attachment management system with multi-select, batch operations, and share functionality
- ✅ Modal-based detail views with vertical layout (basic info + details in one view)
- ✅ System settings and business type management
- ✅ Temporary file cleanup service
- ✅ Operation logging with automatic operator tracking
- ✅ Smart batch operations with automatic status filtering
- ✅ Production deployment with separate frontend/backend domains
- ✅ Free-text location input (replaced dropdown)
- ✅ Automatic file renaming with category_timestamp_random format
- ✅ Fixed attachment upload to use environment-based API URLs

## Development Commands

### Backend (wms-backend/)

```bash
# Quick start script (handles all setup automatically)
./start.sh
# This script will:
# - Install dependencies if needed
# - Create .env from .env.example if needed
# - Run Prisma generate and migrate if needed
# - Start the dev server

# Start development server (with auto-reload)
npm run dev

# Generate Prisma Client after schema changes
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio (visual database browser at localhost:5555)
npm run prisma:studio

# Build for production
npm run build

# Start production server
npm start
```

### Frontend (wms-frontend/)

```bash
# Start development server (Vite with HMR)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint TypeScript/React code
npm run lint
```

### Database Operations

The system uses **MySQL** in production (configured in `wms-backend/.env`):
- **Production**: MySQL (current setup) - `mysql://user:password@host:port/database`
- **Development**: Can use SQLite (change DATABASE_URL provider to "sqlite") - `file:./dev.db`
- Connection string format in .env: `DATABASE_URL="mysql://root:password@localhost:3306/wms"`

After any schema changes in `prisma/schema.prisma`:

1. Run `npm run prisma:generate` to update Prisma Client
2. Run `npm run prisma:migrate` to apply database migrations
3. Restart backend server if running

### Production Deployment

**Architecture**:
- **Frontend**: https://wms.fexxo.cn/ (Nginx serving static files)
- **Backend**: https://wmsapi.fexxo.cn/ (Node.js API server)
- **Separation**: Frontend and backend run on different domains for security and scalability

**Frontend Deployment**:
```bash
# Build production bundle
cd wms-frontend
npx vite build

# Deploy to production directory
cp -r dist/* /www/wwwroot/wms/public/dist/
chown -R www:www /www/wwwroot/wms/public/dist/

# Reload nginx
nginx -s reload
```

**Critical Nginx Configuration** ([wms.fexxo.cn.conf](file:///www/server/panel/vhost/nginx/wms.fexxo.cn.conf#L66-L69)):
```nginx
# React Router support - all requests fallback to index.html
location / {
    try_files $uri $uri/ /index.html;
}
```
This prevents 404 errors when refreshing React Router routes like `/inbound`, `/outbound`, etc.

**Environment Files**:
- Development: `wms-frontend/.env` with `VITE_API_BASE_URL=/api`
- Production: `wms-frontend/.env.production` with `VITE_API_BASE_URL=https://wmsapi.fexxo.cn/api`

**Domain Configuration**:
- System domain stored in database: `SystemSetting.settingKey = 'system.domain'`
- Used for generating attachment URLs dynamically
- Update via System Settings page in frontend

## Architecture

### Backend Architecture

**Pattern**: MVC with service layer
- `controllers/` - HTTP request handlers, call service layer
- `services/` - Business logic (currently minimal, logic in controllers)
  - `operationLog.service.ts` - Centralized operation logging
  - `tempFileCleanup.service.ts` - Background cleanup of temporary files
  - `attachment.service.ts` - Attachment management operations
- `routes/` - Express route definitions
- `middlewares/` - Auth middleware, error handling
- `utils/helpers.ts` - Core utilities:
  - `generateOrderNo()` - Creates order numbers (WI/WO + date + sequence)
  - `calculateVolume()` - Computes volume from dimensions
  - `calculateTotal*()` - Sum quantity/volume/weight

**Key Flow Pattern**:
1. Route receives request → Auth middleware validates JWT
2. Controller validates input → Performs business logic
3. Prisma queries execute (with transactions for multi-table operations)
4. Response formatted as `{ success, data, message, total?, page?, size? }`

**Background Services** (initialized in `app.ts`):
- **Temporary File Cleanup**: Runs every 6 hours, deletes temp files older than 24 hours
  - Started automatically on server boot
  - Cleans `uploads/temp/` directory
  - Stopped gracefully on SIGTERM/SIGINT signals
  - Logs cleanup operations to console

### Frontend Architecture

**Structure**: Feature-based pages with shared services

```
src/
├── pages/           # Feature modules (inbound, outbound, inventory, etc.)
│   └── [feature]/
│       ├── [Feature]List.tsx    # List view with table
│       ├── [Feature]Form.tsx    # Create new records
│       ├── [Feature]Detail.tsx  # View details (legacy, being replaced by modals)
│       └── [Feature]Edit.tsx    # Edit existing records
├── components/      # Shared UI components
│   ├── MainLayout.tsx           # App layout wrapper
│   ├── InboundDetailModal.tsx   # Inbound detail modal
│   ├── OutboundDetailModal.tsx  # Outbound detail modal
│   ├── AttachmentViewer.tsx     # Attachment management modal
│   ├── AttachmentUploader.tsx   # File upload with progress
│   └── [Other shared components]
├── services/        # API client modules
│   ├── api.ts       # Axios instance with auth interceptor
│   └── [feature].service.ts
└── types/          # TypeScript type definitions
```

**API Communication**:
- Uses Axios with interceptors for auth headers
- Base URL: `/api` (proxied through Vite dev server to `localhost:3001`)
- Response format: `{ success: boolean, data: any, message: string }`
- Auth token stored in `localStorage` and added to all requests

**State Management**:
- Zustand stores exist (`auth.store.ts`, `app.store.ts`) but may not be fully integrated
- Currently uses local component state with React hooks for most features
- Forms use Ant Design Form component
- Auth token stored in localStorage

**Import Path Alias**:
- `@` alias configured in vite.config.ts points to `src/` directory
- Use `import { something } from '@/components/...'` instead of relative paths

### Database Schema Critical Relationships

**Inventory Management Flow**:
1. `InboundOrder` created → `InboundOrderItem` records created
2. On completion: Each item creates/updates corresponding `Inventory` record
3. `OutboundOrder` checks `Inventory.availableQuantity` before allowing creation
4. On outbound completion: Deducts from `Inventory.quantity` and `availableQuantity`

**Field Naming Conventions**:
- Order items reference parent via `orderId` (NOT `inboundOrderId`/`outboundOrderId`)
- Inventory tracks: `quantity` (total), `availableQuantity`, `lockedQuantity`
- All orders have `status: 'pending' | 'completed'`
- Business types: inbound uses `'normal' | 'return' | 'transfer'`, outbound uses `'sales' | 'return' | 'transfer'`
- **Warehouse Entry Number**: `warehouseEntryNo` links inventory items to their original inbound order, stored in both `Inventory` and `OutboundOrderItem` tables
- **Product Identifiers**:
  - `sku` field labeled as "CMD编号" (CMD Number) in UI
  - `internalCode` field labeled as "内部货号" (Internal Code) in UI
  - `productCode` field labeled as "CMD料号" (CMD Material Number) in UI

**Inventory Unique Constraint**:
- Inventory records are unique by combination of: `[sku, customerId, locationCode]`
- This prevents duplicate inventory entries for same product/customer/location
- When updating inventory, system will merge quantities into existing record if match found

**Location Model**:
- Separate `Location` table exists for managing warehouse locations
- Fields: `code` (unique), `name`, `warehouse`, `zone`, `aisle`, `shelf`, `layer`, `position`, `status`
- Currently not fully integrated into inventory management (uses `locationCode` string instead of foreign key)

**Cascade Deletion Behavior**:
- Order items are set with `onDelete: Cascade` in Prisma schema
- Deleting an InboundOrder/OutboundOrder automatically deletes all related items
- Inventory records are NOT automatically deleted when orders are deleted

**Critical: Outbound Form Selection**:
- Outbound forms use `warehouseEntryNo` (warehouse entry number) for selecting inventory, NOT SKU
- When a user selects a warehouse entry number, all related fields auto-populate from inventory
- Stock validation checks `availableQuantity` against the selected warehouse entry number
- Most fields are read-only after selection; only quantity and remark are editable

### Attachment System Architecture

The system includes a comprehensive file attachment feature that supports multiple storage backends and provides rich management capabilities.

**Database Model** (`Attachment`):
- `entityType` + `entityId`: Links attachments to any entity (inbound/outbound/inventory/customer)
- `category`: Attachment classification (default/image/document/contract/other)
- `storageType`: Storage backend (local/s3/qiniu/aliyun/tencent)
- `storagePath`: Relative path for local storage or object key for cloud storage
- `storageUrl`: Full URL for accessing the file
- `shareToken` + `shareExpireAt`: Enable time-limited sharing via unique URLs
- `uploadedBy` + `uploadedByName`: Track who uploaded each file

**Storage Strategy**:
- **Local Storage**: Default mode, files stored in `wms-backend/uploads/` directory
  - Permanent files: `uploads/permanent/`
  - Temporary files: `uploads/temp/` (cleaned up by background service)
- **Cloud Storage**: Configurable via SystemSettings (S3, Qiniu, Aliyun, Tencent Cloud)
- Files are organized by entity type and entity ID

**Key Components**:
- `AttachmentViewer.tsx`: Full-featured modal with multi-select, filtering, batch operations
- `AttachmentUploader.tsx`: Drag-and-drop uploader with progress tracking and preview
- `attachment.controller.ts`: Backend API for upload/download/share/delete
- `tempFileCleanup.service.ts`: Background service that removes orphaned temp files (runs every 6 hours, deletes files older than 24 hours)

**Share Feature**:
- Generate unique share tokens for individual attachments
- Configurable expiry (default: 7 days)
- Public access via `/api/attachments/shared/:token` (no auth required)
- Share links automatically copied to clipboard in UI

### Modal-Based Detail Views

**Pattern**: Detail views open as modals instead of navigating to separate pages, improving UX flow.

**Components**:
- `InboundDetailModal.tsx`: Displays inbound order details in a modal
- `OutboundDetailModal.tsx`: Displays outbound order details in a modal

**Features**:
- Tabbed interface: Basic Info + Items List
- In-modal actions: Edit, Confirm, Reverse Audit, View Attachments
- Status-aware button visibility (edit/confirm only for pending, reverse only for completed)
- Integrated with AttachmentViewer for seamless attachment management
- Data summary: Total quantity, volume, weight displayed prominently

**Integration**:
- List pages open detail modal on "详情" button click (not navigation)
- Edit button in modal navigates to edit page
- After actions (confirm/reverse), modal closes and list refreshes automatically

### System Settings & Business Types

**SystemSetting Model**:
- Stores app-wide configuration as key-value pairs with JSON values
- Categories: basic/business/storage/notification
- `isPublic` flag controls if frontend can access setting
- Tracks who updated each setting and when

**BusinessType Model**:
- Customizable business type dictionaries for inbound/outbound operations
- Fields: code (unique), name, category (inbound/outbound), color (for UI tags)
- `isActive` + `sortOrder` for controlling display
- Replaces hardcoded business type arrays

**Usage Example**:
```typescript
// Fetch business types for inbound dropdown
const types = await BusinessType.findMany({
  where: { category: 'inbound', isActive: true },
  orderBy: { sortOrder: 'asc' }
});
```

## Critical Implementation Details

### Order Number Generation

Located in `wms-backend/src/utils/helpers.ts`:
- Pattern: `PREFIX + YYYYMMDD + 4-digit sequence`
- Prefix: `WI` for inbound, `WO` for outbound
- Sequence counts existing orders with same date prefix
- Example: `WI202511110001`, `WO202511110001`

### Inventory Updates

**Inbound** (`inbound.controller.ts`):
- **Creating**: Creates order with `status: 'pending'`, does NOT update inventory
- **Confirming** (`confirmInboundOrder`): Changes status to `completed` and adds to inventory
  - Creates/updates inventory records with ALL item fields including `internalCode`
  - Uses transactions for atomicity
  - **Critical**: When updating existing inventory, preserves existing `internalCode` if item has none
  - **Critical**: When creating new inventory, stores `internalCode` from the inbound item
- **Reverse Audit** (`reverseAuditInboundOrder`): Changes status back to `pending` and deducts from inventory
  - Checks for related outbound records first (cannot reverse if already shipped)
  - Decrements `quantity` and `availableQuantity`
  - Deletes inventory record if quantity becomes 0
- **Editing**: Only allows editing orders with `status: 'pending'`
- Updates: `quantity`, `availableQuantity`, `lastInboundDate`, dimensions, weight, `internalCode`, and all extended fields
- Stores `warehouseEntryNo` from the inbound order for tracking

**Outbound** (`outbound.controller.ts`):
- **Creating**: Creates order with `status: 'pending'`, does NOT deduct from inventory
  - Checks stock availability before creating
  - Default business type: `'sales'` (普通出库)
- **Confirming** (`confirmOutboundOrder`): Changes status to `completed` and deducts from inventory
  - Re-checks inventory availability before confirming
  - Decrements `quantity` and `availableQuantity`
  - Updates `lastOutboundDate`
  - Uses transactions for atomicity
- **Reverse Audit** (`reverseAuditOutboundOrder`): Changes status back to `pending` and restores inventory
  - Adds back `quantity` and `availableQuantity`
  - Creates new inventory record if not found (in case inventory was deleted)
- **Editing**: Only allows editing orders with `status: 'pending'`
  - Checks stock availability for the new quantities
- Matches inventory by `warehouseEntryNo` when specified in outbound items
- Falls back to SKU matching if warehouseEntryNo not provided

**Critical**: Both inbound and outbound now follow the same workflow: Create (pending) → Confirm (completed) → Reverse Audit (back to pending). This ensures inventory is only modified when orders are confirmed.

### Authentication Flow

**Login with Captcha Verification**:
1. Frontend loads captcha on mount via `GET /api/auth/captcha`
   - Backend generates 4-digit numeric SVG captcha using `svg-captcha`
   - Returns `captchaId` and `captchaSvg` (stored in Map with 5-minute expiry)
2. User enters username, password, and captcha code
3. Backend validates captcha first, then credentials
   - Captcha is one-time use (deleted after validation)
   - Failed login triggers captcha refresh
4. On success: Backend returns JWT token (7-day expiry)
5. Frontend stores token in `localStorage`
6. Axios interceptor adds `Authorization: Bearer <token>` to all requests
7. Backend `authMiddleware` validates token on protected routes
8. On 401 error: Frontend clears token and redirects to `/login`

**Captcha Storage**: Uses in-memory Map with automatic cleanup (suitable for single-instance deployment)

**Auth Middleware Enhancement**:
- The `authMiddleware` in `src/middlewares/auth.ts` now extracts the username from the database using the userId from the JWT token
- Username is available as `req.username` in all authenticated routes
- This enables automatic logging of operations with the operator's name

### Operation Log System

The system includes a comprehensive operation logging feature that automatically tracks all significant actions:

**Location**: `wms-backend/src/services/operationLog.service.ts` and `OperationLog` database model

**Logged Operations**:
- **Inbound**: create, update, delete, confirm, reverse
- **Outbound**: create, update, delete, confirm, reverse
- All operations automatically record operator name, timestamp, and description

**Log Fields**:
- `operatorId` - User ID who performed the action
- `operatorName` - Username (extracted from auth token)
- `module` - Module name (inbound/outbound/inventory/customer/location)
- `action` - Action type (create/update/delete/confirm/reverse/import/export)
- `targetId` - ID of the affected record
- `targetNo` - Order number or identifier
- `description` - Human-readable description (e.g., "新建入库单 WI20251121001，客户：XX，件数：100")
- `createdAt` - Timestamp of the operation

**Frontend**:
- Operation logs viewable at `/logs/operations`
- Supports filtering by module, action type, operator name, and date range
- Exportable to Excel

**Implementation Pattern**:
```typescript
import { createOperationLog } from '../services/operationLog.service';

// In any controller action
await createOperationLog({
  operatorId: req.userId,
  operatorName: req.username || '未知用户',
  module: 'inbound',
  action: 'create',
  targetId: order.id,
  targetNo: order.orderNo,
  description: `新建入库单 ${order.orderNo}，客户：${order.customerName}，件数：${totalQuantity}`,
});
```

**Critical**: Operation logging is fire-and-forget (errors are caught and logged but don't fail the operation). All inbound and outbound controller actions already include operation logging.

### Dashboard Statistics

Located in `wms-backend/src/controllers/dashboard.controller.ts` and displayed on the dashboard page:

**Metrics**:
- `todayInbound`: Count of inbound orders created today
- `todayOutbound`: Count of outbound orders created today
- `totalSku`: Count of inventory records with quantity > 0
- `totalCustomer`: Total number of customers in the system

**API**: `GET /api/dashboard/stats` (requires authentication)

The dashboard auto-loads statistics on page mount and displays them using Ant Design Statistic components.

### Inventory Field Extensions

The `Inventory` model includes extended fields for complete product tracking:

**Additional Fields** (added beyond basic SKU tracking):
- `internalCode` - Internal product code/内部货号
- `warehouseEntryNo` - Links to original inbound order number
- `shippingMark` - Shipping marks/唛头
- `poNumber` - Purchase order number
- `packageType` - Packaging type/包装形式
- `volume` - Calculated as (length × width × height) / 1,000,000 (m³)
- `area` - Surface area (m²)
- `unitGrossWeight` - Weight per unit (kg)
- `totalGrossWeight` - Total weight = unitGrossWeight × quantity (kg)
- `remark` - Additional notes

These fields auto-populate from the inbound order and can be viewed in inventory lists and exported to Excel.

### Inventory Filtering

The inventory list supports comprehensive filtering across all major fields:

**Available Filters**:
- `customerName` - Customer name (dropdown with search)
- `warehouseEntryNo` - Warehouse entry number
- `productName` - Product name
- `productModel` - Product model/specification
- `sku` - CMD编号 (CMD Number)
- `internalCode` - 内部货号 (Internal Code)
- `productCode` - CMD料号 (CMD Material Number)
- `shippingMark` - 唛头 (Shipping Mark)
- `poNumber` - PO number
- `locationCode` - Warehouse location
- `dateFrom` / `dateTo` - Inbound date range

**Backend Implementation** (`inventory.controller.ts`):
- All filters use Prisma's `contains` operator for partial matching
- Date filters use `gte` and `lte` on `lastInboundDate`
- Filters are optional and can be combined

**Frontend Implementation** (`pages/inventory/index.tsx`):
- Filter inputs arranged in wrapped rows for better UX
- All inputs have `allowClear` for easy reset
- Date range picker for inbound date filtering

### Frontend-Backend Communication

**Development Setup**:
- Frontend runs on `0.0.0.0:3000` (accessible externally)
- Backend runs on `:::3001` (all interfaces)
- Vite proxy config forwards `/api/*` to `http://localhost:3001`
- **Critical**: Frontend must use relative path `/api` NOT `http://localhost:3001/api` to work through proxy

**Why Proxy is Required**:
- Avoids CORS issues in development
- Allows frontend to be accessed from external IP while still reaching backend
- Single origin for browser security

### Edit Functionality Implementation

Both inbound and outbound orders support editing:

1. Load existing order with `getById(id)`
2. Pre-populate form using `form.setFieldsValue()`
3. On save: Delete ALL existing items via `deleteMany({ where: { orderId } })`
4. Create new items in same transaction as order update
5. Recalculate totals (quantity, volume, weight)

**Critical**: Edit pages are separate from create pages (InboundEdit.tsx vs InboundForm.tsx)

### Excel Export Pattern

The inventory list page has a comprehensive Excel export feature using the `xlsx` library:

**Implementation** (`src/pages/inventory/index.tsx`):
```typescript
import * as XLSX from 'xlsx';

const handleExport = async () => {
  // Fetch all data without pagination
  const response = await inventoryAPI.list({ page: 1, size: 999999, ...filters });

  // Map to Chinese headers in specific order
  const excelData = response.data.map(item => ({
    '进仓日期': formatDate(item.lastInboundDate),
    '进仓编号': item.warehouseEntryNo || '',
    '货名': item.productName || '',
    // ... all 19 fields in order
  }));

  // Create workbook with column widths
  const ws = XLSX.utils.json_to_sheet(excelData);
  ws['!cols'] = [{ wch: 12 }, { wch: 15 }, ...]; // Set each column width

  // Export with timestamp
  XLSX.writeFile(wb, `库存数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
};
```

**Field Order** (must match inventory display exactly):
1. 进仓日期, 2. 客户, 3. 进仓编号, 4. 货名, 5. 型号, 6. CMD编号, 7. 内部货号, 8. CMD料号, 9. 唛头, 10. PO号, 11. 包装形式, 12. 件数, 13. 库位, 14. 长(cm), 15. 宽(cm), 16. 高(cm), 17. 总毛重(kg), 18. 平方(m²), 19. 体积(m³), 20. 出库日期, 21. 备注

### Attachment Management Implementation

**AttachmentViewer Component**: Full-featured modal for viewing and managing attachments.

**Layout**:
- Left sidebar (250px): Category filter + order information fields (read-only)
- Right content area: Grid layout with attachment thumbnails
- Bottom toolbar: Batch operation buttons

**Usage Pattern**:
```typescript
import AttachmentViewer from '@/components/AttachmentViewer';

const [viewerVisible, setViewerVisible] = useState(false);

<AttachmentViewer
  visible={viewerVisible}
  onCancel={() => setViewerVisible(false)}
  entityType="inbound"  // or "outbound", "inventory", "customer"
  entityId={order.id}
  title={`入库单附件 - ${order.orderNo}`}
  // Optional: display in left sidebar filters
  orderNo={order.orderNo}
  warehouseEntryNo={order.warehouseEntryNo}
  deliveryCompany={order.deliveryCompany}
  vehicleNumber={order.vehicleNumber}
/>
```

**Key Features**:
1. **Multi-select**: Checkbox on each attachment, "Select All" functionality
2. **Batch Operations**:
   - Download selected (or all if none selected)
   - Share selected (or all if none selected)
   - Delete selected
3. **Individual Actions**: View, Download, Share, Delete (on hover)
4. **Category Filtering**: Left sidebar dropdown to filter by attachment type
5. **Smart Button Labels**: Automatically show "下载选中(N)" when items selected

**Critical Implementation Details**:
- Selected attachments tracked in `selectedAttachments` state (array of IDs)
- Bottom toolbar buttons check if selections exist and adjust behavior accordingly
- Hover over attachment shows action buttons with semi-transparent overlay
- Delete operations always require confirmation modal
- Share generates 7-day token and copies link to clipboard

**AttachmentUploader Component**: Drag-and-drop uploader with progress tracking.

```typescript
import AttachmentUploader from '@/components/AttachmentUploader';

<AttachmentUploader
  visible={uploaderVisible}
  onCancel={() => setUploaderVisible(false)}
  entityType="inbound"
  entityId={orderId}
  onUploadComplete={() => {
    setUploaderVisible(false);
    loadAttachments(); // Refresh attachment list
  }}
/>
```

**Features**:
- Drag & drop or click to select files
- Category selection dropdown (required)
- Multi-file upload with individual progress bars
- Real-time preview for images
- Secondary confirmation before final upload
- Auto-cleanup of temp files on cancel or after 24 hours

## Common Tasks

### Finding and Managing Running Processes

**Check if services are running**:
```bash
# Check which ports are in use
netstat -tlnp | grep -E ":(3000|3001)"
# Or use ss command
ss -tlnp | grep -E ":(3000|3001)"

# Find node processes related to WMS
ps aux | grep node | grep -E "(wms|dev)"
```

**Kill hanging processes**:
```bash
# Kill by port (Linux)
kill $(lsof -t -i:3001)  # Backend
kill $(lsof -t -i:3000)  # Frontend

# Or find and kill by process ID
ps aux | grep node
kill <pid>

# Force kill if needed
kill -9 <pid>
```

### Adding a New Field to Database Tables

**Critical workflow for Prisma schema changes**:

1. **Update Prisma schema** (`prisma/schema.prisma`)
   ```prisma
   model OutboundOrderItem {
     warehouseEntryNo String?  // Add new field
     // ... other fields
   }
   ```

2. **Run database migration** (MySQL):
   ```bash
   # Manual ALTER TABLE (for existing production databases)
   mysql -u root -p<password> -e "ALTER TABLE OutboundOrderItem ADD COLUMN warehouseEntryNo VARCHAR(191) AFTER orderId;" wms
   ```

3. **Regenerate Prisma Client**:
   ```bash
   cd wms-backend
   npx prisma generate
   ```

4. **Restart backend server** to load new Prisma types:
   ```bash
   # Kill existing process
   kill <pid>
   # Restart
   npm run dev
   ```

5. **Update TypeScript types** (`wms-frontend/src/types/index.ts` and `wms-backend/src/types/index.ts`)

6. **Update frontend forms and tables**:
   - Add to `[Feature]Form.tsx` (create)
   - Add to `[Feature]Edit.tsx` (edit)
   - Add to `[Feature]Detail.tsx` (view)
   - Add to `[Feature]List.tsx` (table column)

7. **Update Excel export** if field should be exported

8. **Update backend controllers** if field needs special handling:
   - Check `confirmInboundOrder` in `inbound.controller.ts` to ensure new fields are saved to inventory
   - Check `confirmOutboundOrder` in `outbound.controller.ts` for outbound-specific fields

**Example - internalCode field addition**:
- Added to `InboundOrderItem`, `OutboundOrderItem`, and `Inventory` models in Prisma schema
- Required database ALTER TABLE for each table: `ALTER TABLE [table] ADD COLUMN internalCode VARCHAR(191);`
- Updated TypeScript interfaces in both frontend and backend
- Updated all inbound/outbound forms to include input field
- Updated inventory list table to display the field
- **Critical fix**: Updated `confirmInboundOrder` function to save `internalCode` when creating/updating inventory
- Added to inventory Excel export with proper column ordering
- Field labeled as "内部货号" (Internal Code) in all UI components

**Example - warehouseEntryNo field addition**:
- Added to `Inventory`, `InboundOrderItem`, `OutboundOrderItem` models
- Required database ALTER TABLE for each table
- Updated all outbound forms to use dropdown selection by warehouseEntryNo
- Made most fields auto-fill and read-only after selection
- Added to inventory export with proper column ordering

### Using Detail Modals

**Pattern**: Detail modals replace page navigation for viewing record details.

**Implementation Example** (InboundList.tsx or OutboundList.tsx):
```typescript
import InboundDetailModal from '@/components/InboundDetailModal';

const [detailVisible, setDetailVisible] = useState(false);
const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

// In table column actions
<Button
  type="link"
  icon={<EyeOutlined />}
  onClick={() => {
    setSelectedOrderId(record.id);
    setDetailVisible(true);
  }}
>
  详情
</Button>

// Render modal
<InboundDetailModal
  visible={detailVisible}
  orderId={selectedOrderId}
  onCancel={() => {
    setDetailVisible(false);
    setSelectedOrderId(null);
  }}
  onEdit={(id) => {
    setDetailVisible(false);
    navigate(`/inbound/edit/${id}`);
  }}
  onReload={loadData}  // Refresh list after confirm/reverse
/>
```

**Modal Features**:
- Opens on button click without page navigation
- Contains "查看附件" button that opens AttachmentViewer
- "编辑" button closes modal and navigates to edit page
- "确认入库/出库" and "反审核" buttons execute actions and close modal
- Automatically refreshes parent list on action completion via `onReload` callback

**Critical**:
- Always provide `onReload` callback to refresh list data after confirm/reverse operations
- Handle modal state (visible, orderId) in parent component
- Edit navigation should close modal first to prevent multiple layers

### Fixing Backend Compilation Errors

**Common issue**: Field name mismatches with Prisma schema
- Prisma generates types from schema.prisma
- Check `@prisma/client` generated types
- Order items use `orderId` not `[parent]OrderId`
- After fixing, backend auto-reloads (nodemon)

### Debugging API Issues

1. Check backend console for errors (running via `npm run dev`)
2. Verify request in browser DevTools Network tab
3. Test endpoint directly with curl:
   ```bash
   TOKEN="<your-token>"
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/[endpoint]
   ```
4. Use Prisma Studio to inspect database state: `npm run prisma:studio`

### Frontend Not Connecting to Backend

Check these in order:
1. Backend is running on port 3001
2. Frontend `.env` has `VITE_API_BASE_URL=/api`
3. `vite.config.ts` has proxy configured: `'/api': { target: 'http://localhost:3001' }`
4. `src/services/api.ts` uses `baseURL: '/api'` (relative path)
5. Browser is not caching old config (hard refresh: Ctrl+F5)

## Testing & Validation

### Manual API Testing

Create test token:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Test protected endpoint:
```bash
TOKEN="<token-from-login>"
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/inventory?page=1&size=10"
```

### Default Admin Credentials

- Username: `admin`
- Password: `admin123`
- Created during initial setup or via registration endpoint

## Known Issues & Workarounds

### Token Expiration

JWT tokens expire after 7 days. If getting 401 errors, user must re-login. Frontend automatically redirects to login on 401 response.

### Port Conflicts

If ports 3000 or 3001 are in use:
- Backend: Change `PORT` in `wms-backend/.env`
- Frontend: Change `server.port` in `vite.config.ts` and update proxy target

### Database Connection Issues

MySQL connection errors:
1. Check `DATABASE_URL` in `wms-backend/.env`
2. Verify MySQL service is running: `systemctl status mysql`
3. Test connection: `mysql -u<user> -p<password> -e "SELECT 1"`
4. Check Prisma connection: `npm run prisma:studio`

## Code Style & Patterns

### API Response Format

Always return:
```typescript
{
  success: boolean,
  data?: any,
  message: string,
  total?: number,    // For paginated lists
  page?: number,     // For paginated lists
  size?: number      // For paginated lists
}
```

### Error Handling

Backend:
```typescript
try {
  // logic
  res.json({ success: true, data, message: 'success' });
} catch (error: any) {
  res.status(500).json({ success: false, message: error.message });
}
```

Frontend:
```typescript
try {
  const response: any = await someAPI.method();
  if (response.success) {
    message.success(response.message);
  }
} catch (error: any) {
  message.error(error.message || 'operation failed');
}
```

### Form Submission

Use Ant Design Form with validation:
```typescript
const onFinish = async (values: any) => {
  // Transform/validate data
  const response = await api.create(values);
  if (response.success) {
    navigate('/list');
  }
};

<Form onFinish={onFinish}>
  <Form.Item name="field" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>
```

## Project-Specific Terminology

- **入库** (Inbound): Receiving goods into warehouse
- **出库** (Outbound): Shipping goods out of warehouse
- **库存** (Inventory): Current stock levels
- **库位** (Location): Warehouse location/bin
- **CMD编号** (CMD Number / sku): Stock Keeping Unit, product identifier
- **内部货号** (Internal Code / internalCode): Internal product code for tracking
- **CMD料号** (CMD Material Number / productCode): CMD material/part number
- **进仓编号** (Warehouse Entry Number / warehouseEntryNo): Unique identifier linking inventory to its original inbound order
- **唛头** (Shipping Mark): Shipping marks on packages
- **件数** (Quantity): Number of pieces
- **体积** (Volume): Cubic meters (m³)
- **库龄** (Age): Days since last inbound
- **单件毛重** (Unit Gross Weight): Weight per unit (kg)
- **总毛重** (Total Gross Weight): Total weight (kg)
- **附件** (Attachment): File attachments linked to orders/inventory/customers
- **分享** (Share): Generate temporary public links for attachments
- **业务类型** (Business Type): Categorization for inbound/outbound operations (normal/return/transfer/sales)

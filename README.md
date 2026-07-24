# Personal Restaurant Invoice Manager

A modern, clean, and responsive Next.js application for personal restaurant invoice management.

## Features
- **Dashboard**: High-level statistics (total invoices, total items) and quick access to create invoices or items.
- **Restaurant Menu Items**: Create, Read, Update, and Delete items. Fully searchable list.
- **Invoice Creation**: Auto-saving drafts, searchable autocomplete rows, automatic renumbering, and instant creation workflows.
- **Professional PDF Outputs**: Auto-generated professional PDFs containing restaurant logo, details, itemized table, and signature line.
- **Invoice History**: Comprehensive archive with searching by client name or item, filtering by date ranges, duplications, and direct downloads/prints.
- **Settings Panel**: Customize restaurant name, address, phone number, logo (supports Base64 uploads), and footer thank you message.
- **Visual Styles**: Elegant Dark Mode and Light Mode support with smooth styling transitions.

---

## Technical Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS (v4)
- **Forms**: React Hook Form with Zod validation
- **PDF Engines**: jsPDF & jsPDF AutoTable (runs entirely client-side for performance)
- **Database**: MongoDB & Mongoose ORM

---

## Getting Started

### 1. Requirements
Ensure you have **Node.js (v18+)** and **MongoDB** installed and running on your system.

### 2. Configure Environment Variables
Copy the example environment file and configure your connection string:
```bash
cp .env.example .env
```
Inside `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/restaurant-invoices
```

### 3. Install Dependencies
Run the installation command:
```bash
npm install
```

### 4. Run the Project
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
Generate the production bundle:
```bash
npm run build
npm run start
```

# Grab Menu PPT Outline

## Slide 1: Title
- **Grab Menu**
- QR-Based Smart Restaurant Ordering and Billing System
- Team name, presenter name, date

**Speaker note:** Grab Menu is a full-stack restaurant digitization platform that helps customers scan, browse, order, track, and pay from their table while giving staff a live operational dashboard.

## Slide 2: Problem Statement
- Traditional dine-in ordering is slow and staff-dependent
- Manual order taking can cause delays and errors
- Restaurants need faster table turnover and better customer experience
- Billing and payment handling often create end-of-meal friction

**Speaker note:** The main problem is inefficiency in dine-in restaurants. Customers wait to order, staff repeat manual work, kitchens get delayed updates, and billing becomes another bottleneck.

## Slide 3: Proposed Solution
- Customers scan a table QR code to open the menu
- Orders are placed directly from the customer device
- Restaurant admins receive live order updates
- Table sessions, billing, and payment flow are managed digitally
- Super admin can onboard and manage multiple restaurants

**Speaker note:** Grab Menu digitizes the full restaurant service cycle, not just the menu. It connects customers, restaurant admins, and platform admins in one system.

## Slide 4: Core Features
- QR-based table access
- Digital menu with search, category, veg/non-veg, and price filters
- Cart and session-based ordering
- Real-time order tracking with Socket.IO
- Billing with GST and service charge support
- Payment options: QR, UPI, and Cash approval flow
- Restaurant admin dashboard
- Super admin restaurant management

## Slide 5: User Roles
- **Customer**
  - Scan QR, browse menu, place orders, track status, request bill
- **Restaurant Admin**
  - Manage menu, tables, sessions, orders, billing, settings
- **Super Admin**
  - Create restaurants, generate admin credentials, manage status and plans

**Speaker note:** This role separation makes the system scalable for a SaaS-style restaurant platform.

## Slide 6: Customer Flow
1. Customer scans QR code on table
2. System identifies table and restaurant
3. Customer session is created or restored
4. Customer browses menu and adds items to cart
5. Order is placed and sent to admin dashboard in real time
6. Customer tracks order progress
7. Customer generates bill and selects payment method

## Slide 7: Admin Flow
1. Admin logs into restaurant dashboard
2. Sees live incoming orders in kanban-style workflow
3. Moves orders from Pending to Preparing to Completed
4. Manages active table sessions
5. Generates or approves bills and payments
6. Releases completed tables for the next customers

## Slide 8: System Architecture
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB with Mongoose
- **Real-time Communication:** Socket.IO
- **Authentication:** JWT-based admin auth
- **Deployment-ready frontend/backend separation**

**Architecture flow:**  
Customer/Admin UI -> Express API -> MongoDB  
Customer/Admin UI <-> Socket.IO <-> Server

## Slide 9: Important Backend Modules
- `menu.routes.js`: menu CRUD and bulk import preview/commit
- `order.routes.js`: create orders, status updates, customer tracking
- `table.routes.js`: table management and QR generation
- `session.routes.js`: table session lock/start/release flow
- `billing.routes.js`: bill generation, combine tables, payment status
- `payment.routes.js`: customer payment method selection and cash approval
- `restaurant.routes.js`: restaurant profile and multi-restaurant management

## Slide 10: Database Design
- **Restaurant**
  - restaurant profile, billing config, payment settings
- **Admin**
  - credentials, role, linked restaurant
- **Table**
  - table number, capacity, QR data
- **TableSession**
  - active session, status, cart sync, lock state
- **MenuItem**
  - name, category, price, description, food type
- **Order**
  - table, items, total, order status
- **Bill**
  - line items, GST, service charge, payment status

## Slide 11: Real-Time Capabilities
- New orders instantly appear on admin dashboard
- Order status updates reflect back to the customer
- Session updates synchronize table state
- Billing events update both customer and admin views
- Cash payment requests trigger admin notifications

**Speaker note:** Real-time communication is a major strength of this project because it improves operational responsiveness during live restaurant service.

## Slide 12: Unique/Advanced Features
- Table locking to prevent conflicting sessions
- Session-token validation for secure customer actions
- Menu import from JSON, CSV, or plain text
- Bill generation based only on ready/completed items
- Support for cash approval workflow
- Super admin onboarding for multi-restaurant scaling

## Slide 13: Benefits
- Faster service and reduced waiting time
- Fewer manual order-entry errors
- Better customer experience through self-service
- Improved table utilization
- Digital billing and clearer payment handling
- Scalable platform for multiple restaurants

## Slide 14: Challenges Faced
- Synchronizing customer and admin state in real time
- Preventing duplicate or invalid orders
- Managing active table sessions securely
- Handling billing without rebilling old orders
- Designing a workflow suitable for both customers and staff

## Slide 15: Future Enhancements
- Online payment gateway integration
- Kitchen display module
- AI-based menu recommendations
- Inventory sync and auto stock updates
- Sales analytics and reporting enhancements
- Multi-language support
- Push notifications for customers and staff

## Slide 16: Conclusion
- Grab Menu is a complete smart restaurant management workflow
- It improves ordering, tracking, and billing efficiency
- It combines customer convenience with operational control
- The project is scalable for both single restaurants and multi-restaurant platforms

## Slide 17: Demo / Q&A
- Show landing page
- Show QR/table-based menu flow
- Show admin dashboard live updates
- Show bill generation/payment method flow
- End with questions

## Suggested Demo Sequence
- Open landing page
- Open customer menu with a sample `table` and `restaurant` query
- Add items to cart and place an order
- Open admin dashboard and show live incoming order
- Update order status
- Return to customer side and show live status update
- Generate bill and show payment options

## Short Viva Summary
- Grab Menu is a QR-based restaurant ordering system.
- It is built with React, Express, MongoDB, and Socket.IO.
- Customers can scan, order, track, and pay from their table.
- Restaurant admins can manage orders, tables, sessions, and billing in real time.
- The platform also includes a super admin module for managing restaurants.

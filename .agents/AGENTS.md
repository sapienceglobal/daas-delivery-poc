# Rules

### Strict Backend-Driven UI & No Mock Data
- **Never use mock data:** Do not use hardcoded fallback arrays, fake statistical numbers (like `|| 118`), or dummy user data to populate UI designs. All data displayed must be derived directly from the real Node.js backend.
- **Backend-first approach:** If a UI reference design includes elements that do not exist in the current backend schema, you must either:
  1. Build the necessary backend logic/schema to support it (if it's an essential industry-standard feature).
  2. Completely ignore and omit the UI element.
- **No dead buttons:** Never add buttons, dropdowns, or links that lack actual working functionality or state management. Every interactive element must work.

### Component Scoping
- **Respect Layout Bounds:** When building or updating page components from reference designs, ONLY build the content that sits to the right of the global Sidebar and below the global Top Header. Do NOT recreate or duplicate global navigation elements (like profile, date, notifications, or location dropdowns) inside page-specific components.
### API Response Parsing
- **Custom Fetch Wrapper:** The frontend api.js wrapper automatically parses and returns the JSON body directly. It does NOT wrap the response in an Axios-like .data property.
- **Accessing Data:** Since the backend formats successful responses as { status: 'success', data: { ... } }, you must access the payload using response.data (e.g., const res = await api.get('/stats'); const stats = res.data;), and never response.data.data.

### Form Field Visibility
- **Explicit Text Colors:** Whenever you apply a light background utility (e.g., bg-white, bg-gray-50) to form elements like <input>, <select>, or <textarea>, you MUST explicitly set a dark text color (e.g., text-[#1f2937]).
- **Why?** The global color-scheme: dark causes the browser to default to white text. Without text-[#1f2937], the text becomes invisible against the light background.

### Premium Merchant UI & UX Standards
- **Layout & Structure:** Use sectioned layouts for complex forms/modals. Replace basic tabs with interactive, styled toggle buttons.
- **Micro-Interactions:** Always include hover states (e.g., `hover:bg-gray-50`), subtle transitions (`transition-all`), and active states for interactive elements.
- **Loading States:** Any button that triggers a backend API call MUST show a loading spinner and become disabled (`opacity-50`, `cursor-not-allowed`) while processing to prevent duplicate submissions.
- **Data Visualization:** Replace plain checkboxes or text for statuses/properties with vibrant, color-coded badges (e.g., green for Veg/Active, red for Non-Veg/Inactive).
- **Bulk Actions:** Use floating, sticky action bars at the bottom of the screen for bulk operations, rather than cluttering the top table header.

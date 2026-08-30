# Frontend Hamroun Fullstack Template

This template uses a file-system based routing system similar to Next.js. Here's how to use it:

## Creating New Pages

1. Add new pages in the `src/pages` directory
2. File names become routes automatically:
   - `src/pages/index.tsx` → `/`
   - `src/pages/about.tsx` → `/about`
   - `src/pages/users/[id].tsx` → `/users/:id`

## Page Structure

Each page should follow this structure:

```tsx
import { jsx } from 'frontend-hamroun';
import Layout from '../components/Layout';

const YourPage = ({ initialState }) => (
  <Layout title="Your Page Title">
    {/* Your content here */}
  </Layout>
);

// Optional: Add data fetching
YourPage.getInitialData = async (path) => {
  // Fetch any data your page needs
  return {
    yourData: await fetchSomething()
  };
};

export default YourPage;
```

## Data Fetching

Use the API utilities in `src/data/api.ts` to fetch data in a consistent way:

```tsx
import { UserApi } from '../data/api';

// In your getInitialData method:
const users = await UserApi.getAll();
```

## Components

Store reusable components in the `src/components` directory and import them in your pages.

## Navigation

Client-side navigation is handled automatically. Just use regular `<a href="...">` links.

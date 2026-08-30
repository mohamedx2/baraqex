import { jsx } from 'frontend-hamroun';
import Layout from '../components/Layout';

// This is the main App wrapper component similar to Next.js _app.js
export default function App({ Component, pageProps, initialState }) {
  return (
    <Layout>
      <Component {...pageProps} initialState={initialState} />
    </Layout>
  );
}

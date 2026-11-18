import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';
import './styles/pages.css';
import './styles/motion.css';
import './styles/fx.css';
import './styles/cards.css';
import Layout from './components/Layout.jsx';
import { CartProvider } from './components/Cart.jsx';
import Home from './pages/Home.jsx';

const Programs = lazy(() => import('./pages/Programs.jsx'));
const Lab = lazy(() => import('./pages/Lab.jsx'));
const Learn = lazy(() => import('./pages/Learn.jsx'));
const Shop = lazy(() => import('./pages/Shop.jsx'));
const Team = lazy(() => import('./pages/Team.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const GetInvolved = lazy(() => import('./pages/GetInvolved.jsx'));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CartProvider>
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="programs" element={<Programs />} />
              <Route path="lab" element={<Lab />} />
              <Route path="learn" element={<Learn />} />
              <Route path="shop" element={<Shop />} />
              <Route path="team" element={<Team />} />
              <Route path="about" element={<About />} />
              <Route path="get-involved" element={<GetInvolved />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </Suspense>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
);

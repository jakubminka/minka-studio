
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Blog from './pages/Blog';
import BlogPostDetail from './pages/BlogPostDetail';
import SpecializationDetail from './pages/SpecializationDetail';
import ProjectDetail from './pages/ProjectDetail';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookieBar from './components/CookieBar';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const statsStr = localStorage.getItem('jakub_minka_stats');
    const stats = statsStr ? JSON.parse(statsStr) : {
      totalVisits: 0,
      dailyVisits: {},
      pageVisits: {},
      categoryVisits: {}
    };

    const today = new Date().toISOString().split('T')[0];
    stats.totalVisits += 1;
    stats.dailyVisits[today] = (stats.dailyVisits[today] || 0) + 1;
    const path = location.pathname;
    stats.pageVisits[path] = (stats.pageVisits[path] || 0) + 1;

    if (path.includes('/specializace/')) {
      const catId = path.split('/').pop();
      if (catId) stats.categoryVisits[catId] = (stats.categoryVisits[catId] || 0) + 1;
    }

    localStorage.setItem('jakub_minka_stats', JSON.stringify(stats));
    window.dispatchEvent(new Event('storage'));
  }, [location.pathname]);

  return null;
};

const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isContactPage = location.pathname === '/kontakt';

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <AnalyticsTracker />
      {!isAdminPage && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPostDetail />} />
          <Route path="/specializace/:id" element={<SpecializationDetail />} />
          <Route path="/projekt/:id" element={<ProjectDetail />} />
          <Route path="/kontakt" element={<Contact />} />
          <Route path="/ochrana-soukromi" element={<PrivacyPolicy />} />
          <Route path="/podminky-spoluprace" element={<TermsOfService />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminPage && !isContactPage && <Footer />}
      {!isAdminPage && <CookieBar />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MasterDataProvider } from './context/MasterDataContext';
import MainLayout from './components/MainLayout';
import CalculatorPage from './pages/CalculatorPage';
import CatalogPage from './pages/CatalogPage';
import CustomerPage from './pages/CustomerPage';
import QuickAddModal from './components/QuickAddModal';

function App() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <MasterDataProvider>
      <BrowserRouter>
         <Routes>
             <Route path="/" element={<MainLayout onQuickAdd={() => setShowQuickAdd(true)} />}>
                 <Route index element={<CalculatorPage />} />
                 <Route path="catalog" element={<CatalogPage />} />
                 <Route path="customers" element={<CustomerPage />} />
             </Route>
         </Routes>
         <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
      </BrowserRouter>
    </MasterDataProvider>
  );
}

export default App;

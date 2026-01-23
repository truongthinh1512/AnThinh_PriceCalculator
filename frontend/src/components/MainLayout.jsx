import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calculator as CalculatorIcon, Book, Plus, Users } from 'lucide-react';

const MainLayout = ({ onQuickAdd }) => {
    const navLinkClass = ({ isActive }) => 
        `flex items-center gap-2 px-6 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
            isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`;

    return (
        <div className="container mx-auto p-4 min-h-screen font-sans text-gray-800 pb-20">
            {/* HEADER */}
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg shadow-lg">
                        <CalculatorIcon className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">AnThinh Price</h1>
                        <p className="text-xs text-gray-500 font-medium tracking-wide">TRANSFORMER CALCULATOR</p>
                    </div>
                </div>
                
                <nav className="flex bg-gray-100 p-1 rounded-lg">
                    <NavLink to="/" className={navLinkClass}>
                        <CalculatorIcon className="w-4 h-4" /> Tính Giá
                    </NavLink>
                    <NavLink to="/catalog" className={navLinkClass}>
                        <Book className="w-4 h-4" /> Danh Mục
                    </NavLink>
                    <NavLink to="/customers" className={navLinkClass}>
                        <Users className="w-4 h-4" /> Khách Hàng
                    </NavLink>
                </nav>

                <div>
                    <button onClick={onQuickAdd} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow transition-colors text-sm font-bold">
                        <Plus className="w-4 h-4" /> Thêm Nhanh
                    </button>
                </div>
            </header>

            {/* PAGE CONTENT */}
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;

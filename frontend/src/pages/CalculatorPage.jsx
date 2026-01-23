import React, { useState, useEffect } from 'react';
import { 
    Calculator as CalculatorIcon, 
    Plus, 
    Trash2, 
    Edit, 
    Search,
    RefreshCw,
    Book,
    FileText
} from 'lucide-react';
import { useMasterData } from '../context/MasterDataContext';
import TransformerFormModal from '../components/TransformerFormModal';

const CalculatorPage = () => {
    const { refreshData } = useMasterData(); // We just need refresh, data is mostly for the modal or generic lookups
    const [savedTransformers, setSavedTransformers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Initial Load
    useEffect(() => {
        fetchTransformers();
    }, []);

    const fetchTransformers = async () => {
        try {
            const res = await fetch('/api/transformers');
            if (res.ok) {
                setSavedTransformers(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch transformers:", error);
        }
    };

    const deleteTransformer = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa biến áp này?')) return;
        try {
            const res = await fetch(`/api/transformers/${id}`, { method: 'DELETE' });
            if (res.ok) fetchTransformers();
            else alert('Lỗi khi xóa!');
        } catch(err) { console.error(err); }
    };

    const handleCreateNew = () => {
        setEditingItem(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormModalOpen(true);
    };

    const handleSaveSuccess = () => {
        fetchTransformers(); 
    };
    
    // Helper to format Money
    const formatMoney = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                     <div className="relative w-full md:w-80">
                         <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                         <input 
                             type="text" 
                             placeholder="Tìm kiếm báo giá..." 
                             className="w-full pl-9 pr-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                             value={searchTerm}
                             onChange={e => setSearchTerm(e.target.value)}
                         />
                     </div>
                     <button onClick={fetchTransformers} className="p-2 text-gray-500 hover:text-blue-600 rounded bg-gray-50 hover:bg-gray-100" title="Làm mới list">
                         <RefreshCw className="w-4 h-4" />
                     </button>
                </div>
                
                <button 
                    onClick={handleCreateNew}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Tạo Báo Giá Mới
                </button>
            </div>

            {/* MAIN TABLE LIST */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <Book className="w-5 h-5 text-gray-500" />
                        Danh Sách Báo Giá Đã Lưu
                    </h2>
                    <span className="text-xs text-gray-500 font-medium">
                        Tổng số: {savedTransformers.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 w-16">#ID</th>
                                <th className="px-6 py-3">Tên Báo Giá / Biến Áp</th>
                                <th className="px-6 py-3">Loại</th>
                                <th className="px-6 py-3">Khách Hàng</th>
                                <th className="px-6 py-3 text-right">Tổng Tiền</th>
                                <th className="px-6 py-3">Ngày Cập Nhật</th>
                                <th className="px-6 py-3 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {savedTransformers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        Chưa có dữ liệu báo giá nào
                                    </td>
                                </tr>
                            ) : (
                                savedTransformers
                                    .filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .sort((a,b) => (b.id - a.id)) // Sort Descending by ID matches standard behavior
                                    .map((item) => (
                                    <tr key={item.id} className="bg-white hover:bg-blue-50 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-gray-500">#{item.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-700 cursor-pointer" onClick={() => handleEdit(item)}>
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Fix for Tag Display: Use item.type */}
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${item.type === 'VUONG' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {item.type === 'VUONG' ? 'VUÔNG (EI)' : 'TRÒN (Xuyến)'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {item.customer ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{item.customer.name}</span>
                                                    <span className="text-xs text-gray-400">{item.customer.phoneNumber}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Khách lẻ</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-800 font-mono">
                                            {formatMoney(item.totalCost)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(item.updatedDate || item.createdDate || Date.now()).toLocaleDateString('vi-VN')}
                                            <div className="text-[10px] text-gray-400">
                                                {new Date(item.updatedDate || item.createdDate || Date.now()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 flex justify-center gap-2">
                                            <button 
                                                onClick={() => handleEdit(item)} 
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="Chỉnh sửa / Xem chi tiết"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => deleteTransformer(item.id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Xóa biến áp"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FORM MODAL */}
            <TransformerFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                editingItem={editingItem}
                onSaveSuccess={handleSaveSuccess}
            />
        </div>
    );
};

export default CalculatorPage;

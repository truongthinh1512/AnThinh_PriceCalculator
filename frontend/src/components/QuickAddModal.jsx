import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useMasterData } from '../context/MasterDataContext';

const QuickAddModal = ({ isOpen, onClose }) => {
    const { refreshData } = useMasterData();
    const [quickAddItem, setQuickAddItem] = useState({
        type: 'lamination', // 'lamination' | 'winding' | 'accessory'
        name: '',
        price: '',
        unit: 'PER_PIECE', 
        details: '' // coreName for lamination, diameter for winding
    });

    if (!isOpen) return null;

    const handleQuickAddSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (quickAddItem.type === 'lamination') {
                await fetch('/api/catalog/ei-laminations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: quickAddItem.name,
                        pricePerKg: Number(quickAddItem.price),
                        coreName: quickAddItem.details,
                        corePrice: 0
                    })
                });
            } else if (quickAddItem.type === 'winding') {
                await fetch('/api/catalog/winding-specs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: quickAddItem.name,
                        pricePerKg: Number(quickAddItem.price),
                        diameter: parseFloat(quickAddItem.details) || 0,
                        material: 'COPPER',
                        type: 'PRIMARY'
                    })
                });
            } else if (quickAddItem.type === 'accessory') {
                await fetch('/api/catalog/accessories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: quickAddItem.name,
                        unitPrice: Number(quickAddItem.price),
                        unitType: quickAddItem.unit,
                        type: 'ELECTRIC_WIRE'
                    })
                });
            }
            
            await refreshData();
            onClose();
            setQuickAddItem({ type: 'lamination', name: '', price: '', unit: 'PER_PIECE', details: '' });
            alert('Thêm nhanh thành công!');
        } catch (error) {
            console.error("Quick add failed", error);
            alert('Lỗi khi thêm nhanh!');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Thêm Nhanh Vật Tư</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleQuickAddSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại vật tư</label>
                        <select 
                            className="w-full border rounded-lg px-3 py-2"
                            value={quickAddItem.type}
                            onChange={e => setQuickAddItem({...quickAddItem, type: e.target.value})}
                        >
                            <option value="lamination">Lá Phe (Lamination)</option>
                            <option value="winding">Dây Quấn (Winding)</option>
                            <option value="accessory">Phụ Kiện (Accessory)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên / Mã số</label>
                        <input 
                            type="text" required
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder={quickAddItem.type === 'lamination' ? 'Ex: EI-96' : 'Ex: Dây 0.50'}
                            value={quickAddItem.name}
                            onChange={e => setQuickAddItem({...quickAddItem, name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đơn Giá (VNĐ)</label>
                        <input 
                            type="number" required
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="VNĐ"
                            value={quickAddItem.price}
                            onChange={e => setQuickAddItem({...quickAddItem, price: e.target.value})}
                        />
                    </div>

                    {quickAddItem.type === 'lamination' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại Core đi kèm (Tùy chọn)</label>
                            <input 
                                type="text"
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="VD: EI-96 Core"
                                value={quickAddItem.details}
                                onChange={e => setQuickAddItem({...quickAddItem, details: e.target.value})}
                            />
                        </div>
                    )}

                    {quickAddItem.type === 'winding' && (
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Đường kính (mm)</label>
                             <input 
                                type="number" step="0.01" required
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="0.35"
                                value={quickAddItem.details}
                                onChange={e => setQuickAddItem({...quickAddItem, details: e.target.value})}
                            />
                        </div>
                    )}

                    {quickAddItem.type === 'accessory' && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tính</label>
                            <select 
                                className="w-full border rounded-lg px-3 py-2"
                                value={quickAddItem.unit}
                                onChange={e => setQuickAddItem({...quickAddItem, unit: e.target.value})}
                            >
                                <option value="PER_PIECE">Cái / Bộ</option>
                                <option value="PER_KG">Kg / Mét</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg mt-2">
                        Lưu Nhanh
                    </button>
                </form>
            </div>
        </div>
    );
};

export default QuickAddModal;

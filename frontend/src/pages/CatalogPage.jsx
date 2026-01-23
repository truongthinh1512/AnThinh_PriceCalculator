import React, { useState } from 'react';
import { useMasterData } from '../context/MasterDataContext';
import { Trash2, Save, Plus } from 'lucide-react';

const CatalogPage = () => {
    const { laminations, windingSpecs, accessories, refreshData } = useMasterData();
    const [catalogTab, setCatalogTab] = useState('lamination'); // 'lamination' | 'winding' | 'accessory'
    
    // New Item State
    const [newItem, setNewItem] = useState({
        lamination: { name: '', pricePerKg: '', coreName: '', corePrice: '' },
        winding: { name: '', material: 'COPPER', type: 'PRIMARY', diameter: '', pricePerKg: '' },
        accessory: { name: '', type: 'ELECTRIC_WIRE', unitType: 'PER_PIECE', unitPrice: '' }
    });

    const formatMoney = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // --- CATALOG HANDLERS ---
    const saveLamination = async (e) => {
        e.preventDefault();
        try {
            const payload = { 
                ...newItem.lamination, 
                pricePerKg: Number(newItem.lamination.pricePerKg), 
                corePrice: Number(newItem.lamination.corePrice)
            };
            const res = await fetch('/api/catalog/ei-laminations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await refreshData();
                setNewItem(prev => ({ ...prev, lamination: { name: '', pricePerKg: '', coreName: '', corePrice: '' } }));
            } else {
                alert('Lỗi khi lưu Phe/Lõi');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const saveWinding = async (e) => {
        e.preventDefault();
        try {
            const payload = { 
                ...newItem.winding, 
                diameter: Number(newItem.winding.diameter), 
                pricePerKg: Number(newItem.winding.pricePerKg)
            };
            const res = await fetch('/api/catalog/winding-specs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await refreshData();
                setNewItem(prev => ({ ...prev, winding: { name: '', material: 'COPPER', type: 'PRIMARY', diameter: '', pricePerKg: '' } }));
            } else {
                alert('Lỗi khi lưu Dây quấn');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const saveAccessory = async (e) => {
        e.preventDefault();
        try {
            const payload = { 
                ...newItem.accessory, 
                unitPrice: Number(newItem.accessory.unitPrice)
            };
            const res = await fetch('/api/catalog/accessories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await refreshData();
                setNewItem(prev => ({ ...prev, accessory: { name: '', type: 'ELECTRIC_WIRE', unitType: 'PER_PIECE', unitPrice: '' } }));
            } else {
                alert('Lỗi khi lưu Phụ kiện');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteItem = async (type, id) => {
        if (!window.confirm('Bạn có chắc muốn xóa?')) return;
        try {
            const res = await fetch(`/api/catalog/${type}/${id}`, { method: 'DELETE' });
            if (res.ok) await refreshData();
            else alert('Không thể xóa mục này (có thể đang được sử dụng).');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[600px]">
             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                 Quản Lý Danh Mục Vật Tư
             </h2>

             {/* TABS */}
             <div className="flex border-b mb-6 space-x-6">
                 <button 
                     onClick={() => setCatalogTab('lamination')}
                     className={`pb-3 text-sm font-medium transition-colors border-b-2 ${catalogTab === 'lamination' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                     Lõi Thép (EI Core)
                 </button>
                 <button 
                     onClick={() => setCatalogTab('winding')}
                     className={`pb-3 text-sm font-medium transition-colors border-b-2 ${catalogTab === 'winding' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                     Dây Quấn (Winding)
                 </button>
                 <button 
                     onClick={() => setCatalogTab('accessory')}
                     className={`pb-3 text-sm font-medium transition-colors border-b-2 ${catalogTab === 'accessory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                     Phụ Kiện Khác
                 </button>
             </div>

             {/* CONTENT: LAMINATION */}
             {catalogTab === 'lamination' && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {/* List */}
                     <div className="md:col-span-2 overflow-x-auto">
                         <table className="w-full text-sm text-left">
                             <thead className="text-xs text-gray-700 bg-gray-50 uppercase">
                                 <tr>
                                     <th className="px-4 py-3">Tên Phe</th>
                                     <th className="px-4 py-3">Loại Core đi kèm</th>
                                     <th className="px-4 py-3 text-right">Giá Phe/kg</th>
                                     <th className="px-4 py-3 text-right">Thao tác</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {laminations.map(item => (
                                     <tr key={item.id} className="hover:bg-gray-50">
                                         <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                         <td className="px-4 py-3 text-gray-500">{item.coreName || '-'}</td>
                                         <td className="px-4 py-3 text-right font-mono text-blue-600">{formatMoney(item.pricePerKg)}</td>
                                         <td className="px-4 py-3 text-right">
                                             <button onClick={() => deleteItem('ei-laminations', item.id)} className="text-red-500 hover:text-red-700 p-1">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                     {/* Form */}
                     <form onSubmit={saveLamination} className="bg-gray-50 p-5 rounded-lg border h-fit">
                         <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/> Thêm mới Phe/Core</h3>
                         <div className="space-y-3">
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Tên Phe (VD: EI-96)</label>
                                 <input type="text" required className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newItem.lamination.name} 
                                        onChange={e => setNewItem({...newItem, lamination: {...newItem.lamination, name: e.target.value}})} />
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Giá Phe (VND/kg)</label>
                                 <input type="number" required className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newItem.lamination.pricePerKg} 
                                        onChange={e => setNewItem({...newItem, lamination: {...newItem.lamination, pricePerKg: e.target.value}})} />
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Loại Core đi kèm (Option)</label>
                                 <input type="text" className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newItem.lamination.coreName} 
                                        onChange={e => setNewItem({...newItem, lamination: {...newItem.lamination, coreName: e.target.value}})} />
                             </div>
                             <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 mt-2">Lưu lại</button>
                         </div>
                     </form>
                 </div>
             )}

             {/* CONTENT: WINDING */}
             {catalogTab === 'winding' && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="md:col-span-2 overflow-x-auto">
                         <table className="w-full text-sm text-left">
                             <thead className="text-xs text-gray-700 bg-gray-50 uppercase">
                                 <tr>
                                     <th className="px-4 py-3">Tên Dây / Mã số</th>
                                     <th className="px-4 py-3">Đường kính (mm)</th>
                                     <th className="px-4 py-3 text-right">Giá / kg</th>
                                     <th className="px-4 py-3 text-right">Thao tác</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {windingSpecs.map(item => (
                                     <tr key={item.id} className="hover:bg-gray-50">
                                         <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                         <td className="px-4 py-3 text-gray-500">{item.diameter}</td>
                                         <td className="px-4 py-3 text-right font-mono text-blue-600">{formatMoney(item.pricePerKg)}</td>
                                         <td className="px-4 py-3 text-right">
                                             <button onClick={() => deleteItem('winding-specs', item.id)} className="text-red-500 hover:text-red-700 p-1">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                     <form onSubmit={saveWinding} className="bg-gray-50 p-5 rounded-lg border h-fit">
                         <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/> Thêm mới Dây</h3>
                         <div className="space-y-3">
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Tên Dây (VD: Dây 0.35)</label>
                                 <input type="text" required className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newItem.winding.name} 
                                        onChange={e => setNewItem({...newItem, winding: {...newItem.winding, name: e.target.value}})} />
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Đường kính (mm)</label>
                                 <input type="number" step="0.01" required className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newItem.winding.diameter} 
                                        onChange={e => setNewItem({...newItem, winding: {...newItem.winding, diameter: e.target.value}})} />
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Giá (VND/kg)</label>
                                 <input type="number" required className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newItem.winding.pricePerKg} 
                                        onChange={e => setNewItem({...newItem, winding: {...newItem.winding, pricePerKg: e.target.value}})} />
                             </div>
                             <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 mt-2">Lưu lại</button>
                         </div>
                     </form>
                 </div>
             )}

             {/* CONTENT: ACCESSORY */}
             {catalogTab === 'accessory' && (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="md:col-span-2 overflow-x-auto">
                         <table className="w-full text-sm text-left">
                             <thead className="text-xs text-gray-700 bg-gray-50 uppercase">
                                 <tr>
                                     <th className="px-4 py-3">Tên Phụ Kiện</th>
                                     <th className="px-4 py-3">Đơn vị tính</th>
                                     <th className="px-4 py-3 text-right">Đơn giá</th>
                                     <th className="px-4 py-3 text-right">Thao tác</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {accessories.map(item => (
                                     <tr key={item.id} className="hover:bg-gray-50">
                                         <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                                         <td className="px-4 py-3 text-gray-500">{item.unitType === 'PER_PIECE' ? 'Cái / Bộ' : 'Kg / Mét'}</td>
                                         <td className="px-4 py-3 text-right font-mono text-blue-600">{formatMoney(item.unitPrice)}</td>
                                         <td className="px-4 py-3 text-right">
                                             <button onClick={() => deleteItem('accessories', item.id)} className="text-red-500 hover:text-red-700 p-1">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                     <form onSubmit={saveAccessory} className="bg-gray-50 p-5 rounded-lg border h-fit">
                         <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4"/> Thêm mới Phụ Kiện</h3>
                         <div className="space-y-3">
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Tên Phụ Kiện</label>
                                 <input type="text" required className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newItem.accessory.name} 
                                        onChange={e => setNewItem({...newItem, accessory: {...newItem.accessory, name: e.target.value}})} />
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Đơn vị</label>
                                 <select className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                         value={newItem.accessory.unitType}
                                         onChange={e => setNewItem({...newItem, accessory: {...newItem.accessory, unitType: e.target.value}})}
                                 >
                                     <option value="PER_PIECE">Cái / Bộ</option>
                                     <option value="PER_KG">Kg / Mét</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Đơn giá (VND)</label>
                                 <input type="number" required className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newItem.accessory.unitPrice} 
                                        onChange={e => setNewItem({...newItem, accessory: {...newItem.accessory, unitPrice: e.target.value}})} />
                             </div>
                             <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 mt-2">Lưu lại</button>
                         </div>
                     </form>
                 </div>
             )}
        </div>
    );
};

export default CatalogPage;

import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, 
    Plus, 
    Trash2, 
    Play,
    RotateCcw
} from 'lucide-react';
import { useMasterData } from '../context/MasterDataContext';

const TransformerFormModal = ({ isOpen, onClose, editingItem, onSaveSuccess }) => {
    const { laminations, windingSpecs, accessories, customers } = useMasterData();
    
    // Default State
    const defaultTransformerState = {
        name: '',
        type: 'VUONG', // VUONG | TRON
        coreWeight: '', // Kg
        laminationId: '', // Select from DB
        roundPricePerKg: '', 
        turnLength: 15, // Legacy field, kept for structure
        windings: [],
        accessories: [],
        customerId: '',
        note: ''
    };

    const [newTransformer, setNewTransformer] = useState(defaultTransformerState);
    const [lastCalculated, setLastCalculated] = useState(null);

    // Load data when modal opens or editingItem changes
    useEffect(() => {
        if (isOpen) {
            if (editingItem) {
                // Map backend DTO to form state
                // Note: Ensure field mapping matches Backend DTO -> Frontend State
                setNewTransformer({
                    id: editingItem.id, // Keep ID for update
                    name: editingItem.name,
                    type: editingItem.type || 'VUONG', // Fix: backend uses 'type'
                    coreWeight: editingItem.type === 'VUONG' && editingItem.squareCore 
                        ? editingItem.squareCore.laminationWeightKg 
                        : (editingItem.roundCore ? editingItem.roundCore.coreWeightKg : ''),
                    
                    laminationId: editingItem.squareCore 
                        ? (editingItem.squareCore.laminationId || findLaminationIdByName(editingItem.squareCore.laminationName))
                        : '',
                    
                    roundPricePerKg: editingItem.roundCore ? editingItem.roundCore.corePricePerKg : '',
                    
                    windings: editingItem.windings?.map(w => ({
                        specId: w.specId || findWindingSpecIdByName(w.specName) || '', 
                        weight: w.weightKg || 0,
                        type: w.type || 'PRIMARY'
                    })) || [],
                    
                    accessories: editingItem.accessories?.map(a => ({
                        accessoryId: a.accessoryId || findAccessoryIdByName(a.accessoryName) || '',
                        quantity: a.quantity || 1
                    })) || [],
                    
                    customerId: editingItem.customer ? editingItem.customer.id : '',
                    note: ''
                });
                // Recalculate to show current cost? Maybe later.
            } else {
                setNewTransformer(defaultTransformerState);
                setLastCalculated(null);
            }
        }
    }, [isOpen, editingItem, laminations, windingSpecs, accessories]);

    // Helper to find Lamination ID from Name (since backend DTO might return flattened data)
    // Actually, looking at TransformerDetailDto, it returns 'squareCore' object. 
    // Ideally backend should return ID. If not, we try to match by name.
    // For now, assuming we might need to match if ID is missing, but if backend returns ID it's better.
    // Update logic: The backend DTO for SquareCoreDto currently doesn't seem to have ID in the snippet I read.
    // It has `laminationName`. I'll try to find it in `laminations` list.
    const findLaminationIdByName = (name) => {
        const found = laminations.find(l => l.name === name);
        return found ? found.id : '';
    };

    const findWindingSpecIdByName = (name) => {
        const found = windingSpecs.find(s => s.name === name);
        return found ? found.id : '';
    };

    const findAccessoryIdByName = (name) => {
        const found = accessories.find(a => a.name === name);
        return found ? found.id : '';
    };

    
    // --- COMPUTED / HELPERS ---
    const selectedLamination = useMemo(() => {
        if (!newTransformer.laminationId) return null;
        return laminations.find(l => l.id == newTransformer.laminationId);
    }, [newTransformer.laminationId, laminations]);

    const formatMoney = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // --- LOGIC METHODS ---
    const calculateCoreCost = () => {
        const weight = parseFloat(newTransformer.coreWeight) || 0;
        let pricePerKg = 0;
        let name = '';

        if (newTransformer.type === 'VUONG') {
            if (selectedLamination) {
                pricePerKg = selectedLamination.pricePerKg;
                name = `Phe ${selectedLamination.name}`;
            }
        } else {
            // TRON
            pricePerKg = parseFloat(newTransformer.roundPricePerKg) || 0;
            name = 'Biến áp Tròn (Xuyến)';
        }

        return {
            totalCost: weight * pricePerKg,
            description: name,
            weight: weight
        };
    };

    const calculateWindingCost = (wUsage) => {
        const spec = windingSpecs.find(s => s.id == wUsage.specId?.toString());
        if (!spec) return 0;
        const weightKg = parseFloat(wUsage.weight) || 0;
        return weightKg * spec.pricePerKg;
    };

    const calculateAccessoryCost = (accUsage) => {
        const acc = accessories.find(a => a.id == accUsage.accessoryId?.toString());
        if (!acc) return 0;
        return acc.unitPrice * accUsage.quantity;
    };

    const performCalculation = () => {
        const coreResult = calculateCoreCost();
        
        const windingsResult = newTransformer.windings.map(w => {
            const spec = windingSpecs.find(s => s.id == w.specId?.toString());
            const calc = calculateWindingCost(w); 
            const weightKg = parseFloat(w.weight) || 0;

            return {
                ...w, 
                name: spec ? spec.name : 'Unknown',
                cost: calc,
                calculatedWeight: weightKg 
            };
        });

        const accResult = newTransformer.accessories.map(a => {
            const item = accessories.find(i => i.id == a.accessoryId?.toString());
            const cost = calculateAccessoryCost(a);
            return {
                ...a, 
                name: item ? item.name : 'Unknown',
                cost: cost
            };
        });

        const totalCore = coreResult.totalCost || 0;
        const totalWinding = windingsResult.reduce((sum, w) => sum + w.cost, 0);
        const totalAcc = accResult.reduce((sum, a) => sum + a.cost, 0);
        const grandTotal = totalCore + totalWinding + totalAcc;

        return {
            name: newTransformer.name || 'Biến áp mới',
            type: newTransformer.type,
            totalCost: grandTotal,
            core: coreResult,
            windings: windingsResult, 
            accessories: accResult,
            customerId: newTransformer.customerId,
            timestamp: new Date().toISOString()
        };
    };

    const handleCalculateAndSave = async (e) => {
        e.preventDefault();
        const result = performCalculation();
        setLastCalculated(result); 

        if (newTransformer.type === 'VUONG') {
            const payload = {
                name: newTransformer.name || 'Biến áp Vuông',
                model3dUrl: '',
                customerId: newTransformer.customerId || null,
                eiLaminationId: newTransformer.laminationId,
                laminationWeightKg: parseFloat(newTransformer.coreWeight),
                windings: result.windings.map(w => ({
                    windingSpecId: w.specId,
                    weightKg: parseFloat(w.weight) || 0,
                    type: w.type 
                })),
                accessories: result.accessories.map(a => ({
                    accessoryId: a.accessoryId,
                    quantity: a.quantity
                }))
            };

            try {
                let res;
                if (editingItem && editingItem.id) {
                    res = await fetch(`/api/transformers/square/${editingItem.id}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await fetch('/api/transformers/square', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                }

                if (res.ok) {
                    alert('Đã lưu thành công!');
                    onSaveSuccess();
                    onClose();
                } else {
                    alert('Lỗi khi lưu dữ liệu!');
                }
            } catch (err) {
                console.error(err);
                alert('Có lỗi xảy ra!');
            }
        } else {
            // ROUND TRANSFORMER (BIẾN ÁP TRÒN) API CALL
            const payload = {
                name: newTransformer.name || 'Biến áp Tròn',
                model3dUrl: '',
                customerId: newTransformer.customerId || null,
                coreWeightKg: parseFloat(newTransformer.coreWeight) || 0,
                corePricePerKg: parseFloat(newTransformer.roundPricePerKg) || 0,
                windings: result.windings.map(w => ({
                    windingSpecId: w.specId,
                    weightKg: parseFloat(w.weight) || 0,
                    type: w.type 
                })),
                accessories: result.accessories.map(a => ({
                    accessoryId: a.accessoryId,
                    quantity: a.quantity
                }))
            };

            try {
                let res;
                if (editingItem && editingItem.id) {
                    res = await fetch(`/api/transformers/round/${editingItem.id}`, {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await fetch('/api/transformers/round', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(payload)
                    });
                }

                if (res.ok) {
                    alert('Đã lưu thành công!');
                    onSaveSuccess();
                    onClose();
                } else {
                    alert('Lỗi khi lưu biến áp tròn!');
                }
            } catch (err) {
                console.error(err);
                alert('Có lỗi xảy ra!');
            }
        }
    };

    // --- FORM MODIFIERS ---
    const addWinding = () => setNewTransformer(prev => ({...prev, windings: [...prev.windings, { specId: '', weight: 0.0, type: 'PRIMARY' }]}));
    const removeWinding = (index) => setNewTransformer(prev => ({...prev, windings: prev.windings.filter((_, i) => i !== index)}));
    const updateWinding = (index, field, value) => {
        const updated = [...newTransformer.windings];
        updated[index] = { ...updated[index], [field]: value };
        setNewTransformer(prev => ({ ...prev, windings: updated }));
    };
    const addAccessoryUsage = () => setNewTransformer(prev => ({...prev, accessories: [...prev.accessories, { accessoryId: '', quantity: 1 }]}));
    const removeAccessoryUsage = (index) => setNewTransformer(prev => ({...prev, accessories: prev.accessories.filter((_, i) => i !== index)}));
    const updateAccessoryUsage = (index, field, value) => {
        const updated = [...newTransformer.accessories];
        updated[index] = { ...updated[index], [field]: value };
        setNewTransformer(prev => ({ ...prev, accessories: updated }));
    };

    const resetForm = () => {
        setNewTransformer(defaultTransformerState);
        setLastCalculated(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
                 {/* MODAL HEADER */}
                 <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {editingItem ? 'Chỉnh sửa Biến áp' : 'Thiết Kế Biến Áp Mới'}
                    </h2>
                    <div className="flex items-center gap-2">
                         <button onClick={resetForm} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100" title="Reset">
                              <RotateCcw className="w-5 h-5" />
                         </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* MODAL BODY */}
                <div className="p-6">
                    <form onSubmit={handleCalculateAndSave} className="space-y-6">
                         {/* BASIC INFO */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Tên Biến Áp</label>
                                 <input 
                                     type="text" 
                                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                     value={newTransformer.name}
                                     onChange={e => setNewTransformer({...newTransformer, name: e.target.value})}
                                     placeholder="VD: BA 1000VA - 220V/110V"
                                     required
                                 />
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Loại Biến Áp</label>
                                 <select 
                                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                     value={newTransformer.type}
                                     onChange={e => setNewTransformer({...newTransformer, type: e.target.value})}
                                 >
                                     <option value="VUONG">Biến áp Vuông (EI)</option>
                                     <option value="TRON">Biến áp Tròn (Xuyến)</option>
                                 </select>
                             </div>
                              <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Khách Hàng (Tùy chọn)</label>
                                 <select 
                                     className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                     value={newTransformer.customerId}
                                     onChange={e => setNewTransformer({...newTransformer, customerId: e.target.value})}
                                 >
                                     <option value="">-- Khách lẻ --</option>
                                     {customers.map(c => (
                                         <option key={c.id} value={c.id}>{c.name} - {c.phoneNumber}</option>
                                     ))}
                                 </select>
                             </div>
                         </div>

                         {/* CORE SECTION */}
                         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">1. Thông số Lõi Thép (FE/Core)</h3>
                             {newTransformer.type === 'VUONG' ? (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-sm font-medium text-gray-600 mb-1">Chọn loại Phe (EI)</label>
                                         <select 
                                             className="w-full px-3 py-2 border rounded-lg bg-white"
                                             value={newTransformer.laminationId}
                                             onChange={e => setNewTransformer({...newTransformer, laminationId: e.target.value})}
                                             required
                                         >
                                             <option value="">-- Chọn loại Phe --</option>
                                             {laminations.map(lam => (
                                                 <option key={lam.id} value={lam.id}>
                                                     {lam.name} ({formatMoney(lam.pricePerKg)}/kg)
                                                 </option>
                                             ))}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-sm font-medium text-gray-600 mb-1">Khối Lượng Phe (Kg)</label>
                                         <input 
                                             type="number" step="0.01" 
                                             className="w-full px-3 py-2 border rounded-lg"
                                             value={newTransformer.coreWeight}
                                             onChange={e => setNewTransformer({...newTransformer, coreWeight: e.target.value})}
                                             placeholder="0.0"
                                             required
                                         />
                                     </div>
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-sm font-medium text-gray-600 mb-1">Đơn giá Core (/kg)</label>
                                         <input 
                                             type="number"
                                             className="w-full px-3 py-2 border rounded-lg"
                                             value={newTransformer.roundPricePerKg}
                                             onChange={e => setNewTransformer({...newTransformer, roundPricePerKg: e.target.value})}
                                         />
                                     </div>
                                     <div>
                                         <label className="block text-sm font-medium text-gray-600 mb-1">Khối Lượng Core (Kg)</label>
                                         <input 
                                             type="number" step="0.01"
                                             className="w-full px-3 py-2 border rounded-lg"
                                             value={newTransformer.coreWeight}
                                             onChange={e => setNewTransformer({...newTransformer, coreWeight: e.target.value})}
                                         />
                                     </div>
                                 </div>
                             )}
                         </div>

                         {/* WINDING SECTION */}
                         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <div className="flex justify-between items-center mb-3 border-b pb-2">
                                 <h3 className="font-semibold text-gray-700">2. Dây Quấn (Winding)</h3>
                                 <button type="button" onClick={addWinding} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                                     <Plus className="w-3 h-3" /> Thêm dây
                                 </button>
                             </div>
                             
                             {newTransformer.windings.map((w, idx) => (
                                 <div key={idx} className="flex flex-col md:flex-row gap-3 mb-3 items-end bg-white p-3 rounded shadow-sm">
                                      <div className="flex-1">
                                         <label className="text-xs text-gray-500 block mb-1">Loại Cuộn</label>
                                         <select 
                                             className="w-full px-2 py-1.5 border rounded text-sm"
                                             value={w.type}
                                             onChange={e => updateWinding(idx, 'type', e.target.value)}
                                         >
                                             <option value="PRIMARY">Sơ cấp (Vào)</option>
                                             <option value="SECONDARY">Thứ cấp (Ra)</option>
                                         </select>
                                      </div>
                                      <div className="flex-1">
                                         <label className="text-xs text-gray-500 block mb-1">Cỡ Dây</label>
                                         <select 
                                             className="w-full px-2 py-1.5 border rounded text-sm"
                                             value={w.specId}
                                             onChange={e => updateWinding(idx, 'specId', e.target.value)}
                                         >
                                             <option value="">-- Chọn --</option>
                                             {windingSpecs.map(ws => (
                                                 <option key={ws.id} value={ws.id}>
                                                     {ws.name} ({formatMoney(ws.pricePerKg)}/kg)
                                                 </option>
                                             ))}
                                         </select>
                                      </div>
                                      <div className="w-32">
                                         <label className="text-xs text-gray-500 block mb-1">Trọng Lượng (Kg)</label>
                                         <input 
                                             type="number" step="0.01"
                                             className="w-full px-2 py-1.5 border rounded text-sm"
                                             value={w.weight}
                                             placeholder="Kg"
                                             onChange={e => updateWinding(idx, 'weight', e.target.value)}
                                         />
                                      </div>
                                      <button type="button" onClick={() => removeWinding(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                 </div>
                             ))}
                             {newTransformer.windings.length === 0 && <p className="text-sm text-gray-400 italic text-center py-2">Chưa có cuộn dây nào</p>}
                         </div>

                         {/* ACCESSORY SECTION */}
                         <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <div className="flex justify-between items-center mb-3 border-b pb-2">
                                 <h3 className="font-semibold text-gray-700">3. Phụ Kiện (Accessories)</h3>
                                 <button type="button" onClick={addAccessoryUsage} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                                     <Plus className="w-3 h-3" /> Thêm phụ kiện
                                 </button>
                             </div>

                             {newTransformer.accessories.map((a, idx) => (
                                 <div key={idx} className="flex flex-col md:flex-row gap-3 mb-3 items-end bg-white p-3 rounded shadow-sm">
                                      <div className="flex-1">
                                         <label className="text-xs text-gray-500 block mb-1">Tên Phụ Kiện</label>
                                         <select 
                                             className="w-full px-2 py-1.5 border rounded text-sm"
                                             value={a.accessoryId}
                                             onChange={e => updateAccessoryUsage(idx, 'accessoryId', e.target.value)}
                                         >
                                             <option value="">-- Chọn --</option>
                                             {accessories.map(acc => (
                                                 <option key={acc.id} value={acc.id}>
                                                     {acc.name} ({formatMoney(acc.unitPrice)})
                                                 </option>
                                             ))}
                                         </select>
                                      </div>
                                      <div className="w-24">
                                         <label className="text-xs text-gray-500 block mb-1">SL</label>
                                         <input 
                                             type="number"
                                             className="w-full px-2 py-1.5 border rounded text-sm"
                                             value={a.quantity}
                                             onChange={e => updateAccessoryUsage(idx, 'quantity', e.target.value)}
                                         />
                                      </div>
                                      <button type="button" onClick={() => removeAccessoryUsage(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                 </div>
                             ))}
                             {newTransformer.accessories.length === 0 && <p className="text-sm text-gray-400 italic text-center py-2">Chưa có phụ kiện nào</p>}
                         </div>

                         {/* ACTION BUTTONS & PREVIEW */}
                         <div className="flex flex-col gap-3 pt-4">
                             <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all flex justify-center items-center gap-2">
                                 <Play className="w-5 h-5 fill-current" />
                                 {editingItem ? 'Tính Toán & Cập Nhật' : 'Tính Toán & Lưu Lại'}
                             </button>
                             
                             {lastCalculated && (
                                 <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                     <div className="flex justify-between items-end"> 
                                        <div>
                                            <p className="text-green-800 text-sm font-semibold mb-1">Kết quả ước tính:</p>
                                            <p className="text-3xl font-bold text-green-700">
                                                {formatMoney(lastCalculated?.totalCost)}
                                            </p>
                                        </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TransformerFormModal;

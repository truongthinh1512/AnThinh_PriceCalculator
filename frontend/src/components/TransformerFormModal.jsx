import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, 
    Plus, 
    Trash2, 
    Play,
    RotateCcw,
    Edit
} from 'lucide-react';
import { useMasterData } from '../context/MasterDataContext';
import TransformerDesigner from './TransformerDesigner';

const TransformerFormModal = ({ isOpen, onClose, editingItem, onSaveSuccess }) => {
    const { laminations, windingSpecs, accessories, customers } = useMasterData();
    const [activeTab, setActiveTab] = useState('form');
    
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
        note: '',
        drawingConfig: ''
    };

    const defaultWinding = { specId: '', weight: 0.0, type: 'PRIMARY', description: '0V-220V', color: '#ff0000' };

    const [newTransformer, setNewTransformer] = useState(defaultTransformerState);
    const [lastCalculated, setLastCalculated] = useState(null);
    const [selectionStep, setSelectionStep] = useState(true); // New state to track selection phase

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
                        type: w.type || 'PRIMARY',
                        description: w.description || '0V-220V', // Fallback or new field
                        color: w.color || '#000000'
                    })) || [],
                    
                    accessories: editingItem.accessories?.map(a => ({
                        accessoryId: a.accessoryId || findAccessoryIdByName(a.accessoryName) || '',
                        quantity: a.quantity || 1
                    })) || [],
                    
                    customerId: editingItem.customer ? editingItem.customer.id : '',
                    note: '',
                    drawingConfig: editingItem.drawingConfig || ''
                });
                setSelectionStep(false); // Skip selection if editing
            } else {
                setNewTransformer(defaultTransformerState);
                setLastCalculated(null);
                setSelectionStep(true); // Show selection for new item
            }
        }
    }, [isOpen, editingItem, laminations, windingSpecs, accessories]);

    // Simple handler to choose type
    const handleSelectType = (type) => {
        setNewTransformer(prev => ({ ...prev, type: type }));
        setSelectionStep(false);
    };

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
        // ... (existing logic) ...
        const result = performCalculation();
        setLastCalculated(result); 
        
        // Prepare windings with extra metadata (description/color) for JSON storage if needed,
        // or just rely on the standard fields. Since the Backend Winding Entity might not have 'description'/'color',
        // we might need to store this purely in 'drawingConfig' OR update the backend DTO.
        // For this immediate request (UI focus), we will assume the backend accepts these or we accept they are UI-only for now unless persisted in drawingConfig.
        // To persist cleanly without backend schema change for Winding table, we can bundle this display info into 'drawingConfig'.
        
        // Let's update drawingConfig with the autogenerated one if the user hasn't manually edited it?
        // Actually, the requirement says "not drawing here... automatically adding".
        // So the 'drawingConfig' field in DB should probably store the "Layout" state if we have draggable positions,
        // OR we can just store the 'transformer' object which now contains colors.
        
        // Update: The User wants the system to "Auto add" based on selected params.
        
        // We will pass the extra fields to Backend DTO. 
        // NOTE: The current Backend DTO `WindingUsageRequest` does NOT have color/description. 
        // We will probably lose this data on save if we don't handle it.
        // Quickest fix: Embed this display data into the `drawingConfig` JSON blob which IS saved.
        
        const visualConfig = {
            windings: newTransformer.windings.map(w => ({
                id: w.specId, // pseudo id
                description: w.description,
                color: w.color,
                type: w.type
            }))
        };
        
        const finalDrawingConfig = JSON.stringify(visualConfig);

        if (newTransformer.type === 'VUONG') {
            const payload = {
                // ... props
                drawingConfig: finalDrawingConfig,
                // ...
                windings: result.windings.map(w => ({
                    windingSpecId: w.specId,
                    weightKg: parseFloat(w.weight) || 0,
                    type: w.type 
                })),
                // ...
            };
            // ... (rest of logic same) ...
     
             // NOTE: Re-implementing the function body briefly to inject the variable
             // Using the tool's ability to match context.
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

    // --- SELECTION STEP (If new item) ---
    if (selectionStep) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Chọn Loại Biến Áp</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <button 
                            onClick={() => handleSelectType('VUONG')}
                            className="w-full relative group h-24 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center p-4 text-left"
                        >
                            <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center mr-4 group-hover:bg-blue-100">
                                <div className="w-6 h-6 border-2 border-slate-400 group-hover:border-blue-500 rounded-sm"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-700 group-hover:text-blue-700">Biến Áp Vuông (E-I)</h3>
                                <p className="text-xs text-gray-500">Sử dụng phe E-I thông dụng</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => handleSelectType('TRON')}
                            className="w-full relative group h-24 rounded-lg border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center p-4 text-left"
                        >
                            <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center mr-4 group-hover:bg-orange-100">
                                <div className="w-6 h-6 rounded-full border-4 border-slate-400 group-hover:border-orange-500"></div>
                            </div>
                             <div>
                                <h3 className="font-bold text-gray-700 group-hover:text-orange-700">Biến Áp Xuyến (Tròn)</h3>
                                <p className="text-xs text-gray-500">Hiệu suất cao, Fe tôn silic</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
                 {/* HEADER */}
                 <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {editingItem ? <Edit className="w-5 h-5 text-blue-600"/> : <Plus className="w-5 h-5 text-green-600"/>}
                            {editingItem ? 'Chỉnh Sửa Biến Áp' : 'Thiết Kế Biến Áp Mới'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Nhập thông số bên trái, xem kết quả thiết kế bên phải</p>
                    </div>
                    <div className="flex items-center gap-3">
                         <button onClick={() => setSelectionStep(true)} className="text-gray-500 hover:text-blue-600 bg-gray-100 px-3 py-1.5 rounded text-xs font-bold" title="Chọn loại khác">
                             Đổi Loại
                         </button>
                         <button onClick={resetForm} className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors text-sm font-medium flex items-center gap-1" title="Đặt lại">
                              <RotateCcw className="w-4 h-4" /> Reset
                         </button>
                        <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full p-2 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* CONTENT GRID - SPLIT VIEW */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    
                    {/* LEFT: FORM (5 cols) */}
                    <div className="lg:col-span-4 xl:col-span-3 overflow-y-auto bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 flex flex-col">
                        <form className="p-5 space-y-6 flex-1" onSubmit={handleCalculateAndSave}>
                             
                             {/* SECTION 1: GENERAL */}
                             <div className="space-y-3">
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Thông Tin Cơ Bản</label>
                                     <input 
                                         type="text" 
                                         className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium"
                                         value={newTransformer.name}
                                         onChange={e => setNewTransformer({...newTransformer, name: e.target.value})}
                                         placeholder="Tên sản phẩm..."
                                         required
                                     />
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                     <div>
                                         <label className="block text-xs text-gray-500 mb-1">Loại Biến Áp</label>
                                         <select 
                                             className="w-full px-2 py-2 border rounded-lg bg-gray-50 text-sm font-medium"
                                             value={newTransformer.type}
                                             onChange={e => setNewTransformer({...newTransformer, type: e.target.value})}
                                         >
                                             <option value="VUONG">◼ Vuông (EI)</option>
                                             <option value="TRON">◎ Xuyến (Tròn)</option>
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-xs text-gray-500 mb-1">Khách Hàng</label>
                                         <select 
                                             className="w-full px-2 py-2 border rounded-lg bg-white text-sm"
                                             value={newTransformer.customerId}
                                             onChange={e => setNewTransformer({...newTransformer, customerId: e.target.value})}
                                         >
                                             <option value="">- Chọn -</option>
                                             {customers.map(c => (
                                                 <option key={c.id} value={c.id}>{c.name}</option>
                                             ))}
                                         </select>
                                     </div>
                                 </div>
                             </div>

                             {/* SECTION 2: CORE */}
                             <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                 <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                                     <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span> 
                                     Lõi Thép (Core)
                                 </h3>
                                 {newTransformer.type === 'VUONG' ? (
                                     <div className="space-y-3">
                                         <div>
                                             <label className="block text-xs font-medium text-gray-500 mb-1">Loại Phe (EI Lamination)</label>
                                             <select 
                                                 className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
                                                 value={newTransformer.laminationId}
                                                 onChange={e => setNewTransformer({...newTransformer, laminationId: e.target.value})}
                                                 required
                                             >
                                                 <option value="">-- Chọn kích thước --</option>
                                                 {laminations.map(lam => (
                                                     <option key={lam.id} value={lam.id}>
                                                         {lam.name} - {formatMoney(lam.pricePerKg)}/kg
                                                     </option>
                                                 ))}
                                             </select>
                                         </div>
                                         <div>
                                             <label className="block text-xs font-medium text-gray-500 mb-1">Khối Lượng Phe</label>
                                             <div className="relative">
                                                 <input 
                                                     type="number" step="0.01" 
                                                     className="w-full px-3 py-2 border rounded-lg text-sm"
                                                     value={newTransformer.coreWeight}
                                                     onChange={e => setNewTransformer({...newTransformer, coreWeight: e.target.value})}
                                                     placeholder="0.0"
                                                     required
                                                 />
                                                 <span className="absolute right-3 top-2 text-gray-400 text-xs font-bold">Kg</span>
                                             </div>
                                         </div>
                                     </div>
                                 ) : (
                                     <div className="grid grid-cols-2 gap-3">
                                         <div>
                                             <label className="block text-xs font-medium text-gray-500 mb-1">Đơn giá (/kg)</label>
                                             <input 
                                                 type="number"
                                                 className="w-full px-2 py-2 border rounded-lg text-sm"
                                                 value={newTransformer.roundPricePerKg}
                                                 onChange={e => setNewTransformer({...newTransformer, roundPricePerKg: e.target.value})}
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-xs font-medium text-gray-500 mb-1">Trọng lượng (Kg)</label>
                                             <input 
                                                 type="number" step="0.01"
                                                 className="w-full px-2 py-2 border rounded-lg text-sm"
                                                 value={newTransformer.coreWeight}
                                                 onChange={e => setNewTransformer({...newTransformer, coreWeight: e.target.value})}
                                             />
                                         </div>
                                     </div>
                                 )}
                             </div>

                             {/* SECTION 3: WINDINGS */}
                             <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                 <div className="flex justify-between items-center mb-3">
                                     <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">2</span>
                                        Dây Quấn
                                     </h3>
                                     <button type="button" onClick={addWinding} className="text-orange-600 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded text-xs font-bold transition-colors">
                                         + Thêm Dây
                                     </button>
                                 </div>
                                 
                                 <div className="space-y-3">
                                     {newTransformer.windings.map((w, idx) => (
                                         <div key={idx} className="bg-white p-3 rounded-lg border shadow-sm relative group hover:border-orange-300 transition-colors">
                                              <button 
                                                    type="button" 
                                                    onClick={() => removeWinding(idx)} 
                                                    className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-sm transition-opacity"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                              </button>

                                              <div className="flex items-center gap-2 mb-2">
                                                  <select 
                                                     className="w-24 text-[11px] px-1 py-1 border rounded bg-gray-50 font-semibold uppercase"
                                                     value={w.type}
                                                     onChange={e => updateWinding(idx, 'type', e.target.value)}
                                                  >
                                                      <option value="PRIMARY">Sơ cấp</option>
                                                      <option value="SECONDARY">Thứ cấp</option>
                                                  </select>
                                                  <input 
                                                     type="text"
                                                     className="flex-1 text-xs px-2 py-1 border rounded"
                                                     value={w.description}
                                                     placeholder="Vd: 0V-220V"
                                                     onChange={e => updateWinding(idx, 'description', e.target.value)}
                                                  />
                                                  <input 
                                                     type="color"
                                                     className="w-6 h-6 border rounded cursor-pointer p-0.5"
                                                     value={w.color || '#ff0000'}
                                                     onChange={e => updateWinding(idx, 'color', e.target.value)}
                                                 />
                                              </div>
                                              
                                              <div className="grid grid-cols-3 gap-2">
                                                  <div className="col-span-2">
                                                      <select 
                                                          className="w-full text-xs px-2 py-1.5 border rounded"
                                                          value={w.specId}
                                                          onChange={e => updateWinding(idx, 'specId', e.target.value)}
                                                      >
                                                          <option value="">-- Cỡ dây --</option>
                                                          {windingSpecs.map(ws => (
                                                              <option key={ws.id} value={ws.id}>{ws.name}</option>
                                                          ))}
                                                      </select>
                                                  </div>
                                                  <div className="relative">
                                                      <input 
                                                          type="number" step="0.01"
                                                          className="w-full text-xs px-2 py-1.5 border rounded"
                                                          value={w.weight}
                                                          placeholder="Kg"
                                                          onChange={e => updateWinding(idx, 'weight', e.target.value)}
                                                      />
                                                  </div>
                                              </div>
                                         </div>
                                     ))}
                                     {newTransformer.windings.length === 0 && (
                                         <p className="text-center text-xs text-gray-400 italic py-2 bg-white rounded border border-dashed">Chưa nhập thông số dây</p>
                                     )}
                                 </div>
                             </div>

                             {/* FOOTER ACTIONS */}
                            <div className="pt-4 mt-auto border-t space-y-3 sticky bottom-0 bg-white pb-2">
                                 {lastCalculated && (
                                     <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded border border-green-100">
                                         <span className="text-sm font-medium text-green-800">Tổng chi phí:</span>
                                         <span className="text-lg font-bold text-green-700">{formatMoney(lastCalculated.totalCost)}</span>
                                     </div>
                                 )}
                                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg flex justify-center items-center gap-2 transform active:scale-[0.99] transition-all">
                                     <Play className="w-5 h-5 fill-current" />
                                     {editingItem ? 'LƯU THAY ĐỔI' : 'TẠO BÁO GIÁ'}
                                 </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT: LIVE PREVIEW (7 cols) */}
                    <div className="lg:col-span-8 xl:col-span-9 bg-gray-900 relative flex flex-col overflow-hidden">
                        <div className="absolute top-4 left-4 z-10">
                            <h3 className="text-white font-bold text-lg drop-shadow-md">
                                {newTransformer.name || 'Bản vẽ chưa đặt tên'}
                            </h3>
                            <p className="text-gray-400 text-sm">Design Preview Mode • 2026</p>
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                             <TransformerDesigner 
                                transformerData={{
                                    ...newTransformer,
                                    customerName: customers.find(c => c.id == newTransformer.customerId)?.name || ''
                                }}
                                drawingConfig={newTransformer.drawingConfig}
                                readOnly={true}
                                onConfigChange={(config) => setNewTransformer({...newTransformer, drawingConfig: config})}
                            />
                        </div>
                        
                        <div className="bg-gray-800 p-2 text-center text-xs text-gray-500 border-t border-gray-700 select-none">
                            Mẹo: Thay đổi thông số bên form trái để cập nhật hình ảnh.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransformerFormModal;

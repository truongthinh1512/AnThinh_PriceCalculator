import React, { useState, useMemo, useEffect } from 'react';
import { 
    Calculator as CalculatorIcon, 
    Book, 
    Plus, 
    X, 
    Settings, 
    Search, 
    Menu, 
    Trash2, 
    Save, 
    RotateCcw, 
    Edit, 
    Clock, 
    RefreshCw 
} from 'lucide-react';

function App() {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'catalog'
    const [catalogTab, setCatalogTab] = useState('lamination'); // 'lamination' | 'winding' | 'accessory'

    // Quick Add State
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddItem, setQuickAddItem] = useState({
        type: 'lamination', // 'lamination' | 'winding' | 'accessory'
        name: '',
        price: '',
        unit: 'PER_PIECE', 
        details: '' // coreName for lamination, diameter for winding
    });

    // Master Data
    const [laminations, setLaminations] = useState([]);
    const [windingSpecs, setWindingSpecs] = useState([]);
    const [accessories, setAccessories] = useState([]);

    // API Helpers
    const fetchCatalog = async () => {
        try {
            const [lamRes, windRes, accRes, txRes] = await Promise.all([
                fetch('/api/catalog/ei-laminations'),
                fetch('/api/catalog/winding-specs'),
                fetch('/api/catalog/accessories'),
                fetch('/api/transformers')
            ]);
            
            if (lamRes.ok) setLaminations(await lamRes.json());
            if (windRes.ok) setWindingSpecs(await windRes.json());
            if (accRes.ok) setAccessories(await accRes.json());
            if (txRes.ok) setSavedTransformers(await txRes.json());
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    // Saved Transformers (Database Simulation)
    const [savedTransformers, setSavedTransformers] = useState([]);

    // Transformer Form Data
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    
    // Default State
    const defaultTransformerState = {
        name: '',
        type: 'SQUARE', // SQUARE | ROUND
        
        // Input for Cost
        coreWeight: '', // Kg
        
        // SQUARE Specific
        laminationId: '', // Select from DB
        
        // ROUND Specific
        roundPricePerKg: '', 
        
        // Winding Calculation Params
        turnLength: 15, // cm (Default average length per turn)

        windings: [],
        accessories: []
    };

    const [newTransformer, setNewTransformer] = useState(defaultTransformerState);
    const [lastCalculated, setLastCalculated] = useState(null);

    // Catalog New Item State
    const [newItem, setNewItem] = useState({
        lamination: { name: '', pricePerKg: '', coreName: '', corePrice: '' },
        winding: { name: '', material: 'COPPER', type: 'PRIMARY', diameter: '', pricePerKg: '' },
        accessory: { name: '', type: 'ELECTRIC_WIRE', unitType: 'PER_PIECE', unitPrice: '' }
    });

    // --- COMPUTED / HELPERS ---
    const selectedLamination = useMemo(() => {
        if (!newTransformer.laminationId) return null;
        return laminations.find(l => l.id == newTransformer.laminationId);
    }, [newTransformer.laminationId, laminations]);

    const formatMoney = (amount) => {
        if (!amount) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const sumCost = (arr) => {
        return arr ? arr.reduce((sum, i) => sum + i.cost, 0) : 0;
    };

    // --- LOGIC METHODS ---

    // 1. Core Logic
    const calculateCoreCost = () => {
        const weight = parseFloat(newTransformer.coreWeight) || 0;
        let pricePerKg = 0;
        let name = '';

        if (newTransformer.type === 'SQUARE') {
            if (selectedLamination) {
                pricePerKg = selectedLamination.pricePerKg;
                name = `Phe ${selectedLamination.name}`;
            }
        } else {
            // ROUND
            pricePerKg = parseFloat(newTransformer.roundPricePerKg) || 0;
            name = 'Biến áp Tròn (Xuyến)';
        }

        return {
            totalCost: weight * pricePerKg,
            description: name,
            weight: weight
        };
    };

    // 2. Winding Logic
    const calculateWindingCost = (wUsage) => {
        const spec = windingSpecs.find(s => s.id == wUsage.specId);
        if (!spec) return 0;
        
        const turnLengthM = (parseFloat(newTransformer.turnLength) || 0) / 100; // cm to m
        const totalLengthM = wUsage.turnCount * turnLengthM;
        
        const radius = spec.diameter / 2;
        const area = radius * radius * 3.14159; 
        
        // Copper Density approx 8.96 g/cm3 -> 0.00896 kg/m (for 1mm2 area? No.)
        // Weight (kg) = Volume (m3) * Density (kg/m3)
        // Area (mm2) = r*r*3.14. 
        // 1 m length volume = Area * 10^-6 m3.
        // Density Copper = 8960 kg/m3.
        // Weight per meter (kg) = (Area_mm2 * 10^-6) * 8960 = Area_mm2 * 0.00896
        
        const areaMm2 = (spec.diameter/2)**2 * Math.PI;
        const weightKg = (areaMm2 * totalLengthM) * 0.00896; 
        
        return weightKg * spec.pricePerKg;
    };

    // 3. Accessory Logic
    const calculateAccessoryCost = (accUsage) => {
        const acc = accessories.find(a => a.id == accUsage.accessoryId);
        if (!acc) return 0;
        return acc.unitPrice * accUsage.quantity;
    };

    const performCalculation = () => {
        const coreResult = calculateCoreCost();
        
        const windingsResult = newTransformer.windings.map(w => {
            const spec = windingSpecs.find(s => s.id == w.specId);
            const calc = calculateWindingCost(w); // returns object now or number? It returns number in old code.
            // We need to calculate weight here for API payload
            const turnLengthM = (parseFloat(newTransformer.turnLength) || 0) / 100;
            const totalLengthM = w.turnCount * turnLengthM;
            const areaMm2 = spec ? (spec.diameter/2)**2 * Math.PI : 0;
            const weightKg = (areaMm2 * totalLengthM) * 0.00896;

            return {
                ...w, 
                name: spec ? spec.name : 'Unknown',
                cost: calc,
                calculatedWeight: weightKg 
            };
        });

        const accResult = newTransformer.accessories.map(a => {
            const item = accessories.find(i => i.id == a.accessoryId);
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
            accessories: accResult 
        };
    };

    const handleCalculateAndSave = async (e) => {
        e.preventDefault();
        const result = performCalculation();
        setLastCalculated(result); // Show preview immediately

        if (newTransformer.type === 'SQUARE') {
            const payload = {
                name: newTransformer.name || 'Biến áp Vuông',
                model3dUrl: '',
                eiLaminationId: newTransformer.laminationId,
                laminationWeightKg: parseFloat(newTransformer.coreWeight),
                windings: result.windings.map(w => ({
                    windingSpecId: w.specId,
                    weightKg: w.calculatedWeight
                })),
                accessories: result.accessories.map(a => ({
                    accessoryId: a.accessoryId,
                    quantity: a.quantity
                }))
            };

            try {
                let res;
                if (editingId) {
                    res = await fetch(`/api/transformers/square/${editingId}`, {
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
                    alert(editingId ? 'Đã cập nhật!' : 'Đã lưu thành công!');
                    fetchCatalog(); // Refresh list
                    resetForm(false);
                    setIsEditModalOpen(false);
                } else {
                    alert('Lỗi khi lưu dữ liệu!');
                }
            } catch (err) {
                console.error(err);
                alert('Có lỗi xảy ra!');
            }
        } else {
            alert('Chức năng lưu Biến áp Tròn chưa hỗ trợ API trong bản demo này.');
        }
    };

    const deleteTransformer = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa biến áp này?')) return;
        try {
            const res = await fetch(`/api/transformers/${id}`, { method: 'DELETE' });
            if (res.ok) fetchCatalog();
            else alert('Lỗi khi xóa!');
        } catch(err) { console.error(err); }
    };

    const resetForm = (clearResult = true) => {
        setNewTransformer(defaultTransformerState);
        setEditingId(null);
        if (clearResult) setLastCalculated(null);
    };

    const openEditModal = (item) => {
        setNewTransformer(item.inputData);
        setEditingId(item.id);
        setIsEditModalOpen(true);
    };

    // --- FORM HANDLERS (Winding/Accessory) ---
    const addWinding = () => {
        setNewTransformer(prev => ({
            ...prev,
            windings: [...prev.windings, { specId: '', turnCount: 0, layerCount: 0 }]
        }));
    };
    const removeWinding = (index) => setNewTransformer(prev => ({...prev, windings: prev.windings.filter((_, i) => i !== index)}));
    const updateWinding = (index, field, value) => {
        const updated = [...newTransformer.windings];
        updated[index] = { ...updated[index], [field]: value };
        setNewTransformer(prev => ({ ...prev, windings: updated }));
    };
    const addAccessoryUsage = () => {
        setNewTransformer(prev => ({
            ...prev,
            accessories: [...prev.accessories, { accessoryId: '', quantity: 1 }]
        }));
    };
    const removeAccessoryUsage = (index) => setNewTransformer(prev => ({...prev, accessories: prev.accessories.filter((_, i) => i !== index)}));
    const updateAccessoryUsage = (index, field, value) => {
        const updated = [...newTransformer.accessories];
        updated[index] = { ...updated[index], [field]: value };
        setNewTransformer(prev => ({ ...prev, accessories: updated }));
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
                await fetchCatalog();
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
                await fetchCatalog();
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
                await fetchCatalog();
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
            if (res.ok) await fetchCatalog();
            else alert('Không thể xóa mục này (có thể đang được sử dụng).');
        } catch (err) {
            console.error(err);
        }
    };

    // --- QUICK ADD HANDLER ---
    const handleQuickAddSubmit = () => {
        const now = new Date().toISOString();
        if (quickAddItem.type === 'lamination') {
            setLaminations(prev => [...prev, {
                id: Date.now(),
                name: quickAddItem.name,
                pricePerKg: Number(quickAddItem.price),
                coreName: quickAddItem.details,
                corePrice: 0,
                createdDate: now,
                updatedDate: now
            }]);
        } else if (quickAddItem.type === 'winding') {
            setWindingSpecs(prev => [...prev, {
                id: Date.now(),
                name: quickAddItem.name,
                pricePerKg: Number(quickAddItem.price),
                diameter: parseFloat(quickAddItem.details) || 0,
                material: 'COPPER',
                type: 'PRIMARY',
                createdDate: now,
                updatedDate: now
            }]);
        } else if (quickAddItem.type === 'accessory') {
            setAccessories(prev => [...prev, {
                id: Date.now(),
                name: quickAddItem.name,
                unitPrice: Number(quickAddItem.price),
                unitType: quickAddItem.unit || 'PER_PIECE',
                type: 'ELECTRIC_WIRE',
                createdDate: now,
                updatedDate: now
            }]);
        }
        setShowQuickAdd(false);
        setQuickAddItem({ type: 'lamination', name: '', price: '', unit: 'PER_PIECE', details: '' });
    };

    return (
        <div className="container mx-auto p-4 min-h-screen font-sans text-gray-800 pb-20">
            {/* HEADER (Same as before) */}
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
                    <button onClick={() => setActiveTab('calculator')} className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all duration-200 text-sm font-medium ${activeTab === 'calculator' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <CalculatorIcon className="w-4 h-4" /> Tính Giá
                    </button>
                    <button onClick={() => setActiveTab('catalog')} className={`flex items-center gap-2 px-6 py-2 rounded-md transition-all duration-200 text-sm font-medium ${activeTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Book className="w-4 h-4" /> Danh Mục
                    </button>
                </nav>
                <div>
                    <button onClick={() => setShowQuickAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow transition-colors text-sm font-bold">
                        <Plus className="w-4 h-4" /> Thêm Nhanh
                    </button>
                </div>
            </header>

            {/* QUICK ADD MODAL (Same as before) */}
            {showQuickAdd && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                         <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Thêm Vật Tư Nhanh</h3>
                            <button onClick={() => setShowQuickAdd(false)} className="hover:bg-blue-700 p-1 rounded transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loại Vật Tư</label>
                                <div className="flex bg-gray-100 p-1 rounded">
                                    {['lamination', 'winding', 'accessory'].map(type => (
                                        <button key={type} className={`flex-1 text-xs py-2 rounded ${quickAddItem.type === type ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`} onClick={() => setQuickAddItem(prev => ({ ...prev, type }))}>
                                            {type === 'lamination' ? 'Phe/Lõi' : type === 'winding' ? 'Dây' : 'Phụ Kiện'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Vật Tư</label>
                                <input value={quickAddItem.name} onChange={e => setQuickAddItem(prev => ({ ...prev, name: e.target.value }))} type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 border" placeholder="VD: Phe 32..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá Tiền</label>
                                    <input value={quickAddItem.price} onChange={e => setQuickAddItem(prev => ({ ...prev, price: e.target.value }))} type="number" className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 border" placeholder="VNĐ" />
                                </div>
                                {quickAddItem.type === 'accessory' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Đơn Vị</label>
                                        <select value={quickAddItem.unit} onChange={e => setQuickAddItem(prev => ({ ...prev, unit: e.target.value }))} className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 border">
                                            <option value="PER_PIECE">Cái</option><option value="PER_METER">Mét</option><option value="PER_KG">Kg</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{quickAddItem.type === 'lamination' ? 'Tên Lõi (Khuôn)' : 'Đường kính (mm)'}</label>
                                        <input value={quickAddItem.details} onChange={e => setQuickAddItem(prev => ({ ...prev, details: e.target.value }))} type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2 border" />
                                    </div>
                                )}
                            </div>
                            <button onClick={handleQuickAddSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition-colors mt-2">Lưu Ngay</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CALCULATOR SCCONNECTION SUCCESS */}
                     <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg mb-6 text-sm flex items-center gap-2">
                        <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">ONLINE</span>
                        Đã kết nối cơ sở dữ liệu hệ thống
                     <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-6 text-sm flex items-center gap-2">
                        <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">DEV MODE</span>
                        Dữ liệu đang được lưu tạm thời trên trình duyệt. Chưa kết nối database thực tế.
                    </div>

                    <div className="flex justify-end mb-6">
                        <button onClick={() => { resetForm(); setIsEditModalOpen(true); }} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2">
                           <CalculatorIcon className="w-5 h-5"/> Tạo Tính Toán Mới
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* RESULT & HISTORY (Full Width now, Form is Modal) */}
                        <div className="md:col-span-12 space-y-8">
                            {/* LIVE PREVIEW (Only show if lastCalculated exists) */}
                            {lastCalculated && (
                                <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden animate-in zoom-in-95 duration-300">
                                    <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 flex justify-between items-center text-white">
                                        <div>
                                            <h2 className="font-bold text-2xl flex items-center gap-2"><Save className="w-6 h-6" /> Kết Quả Chi Tiết</h2>
                                            <p className="text-green-100 text-sm mt-1 opacity-90">{lastCalculated.description}</p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                                            <span className="block text-xs uppercase tracking-wider opacity-90">Tổng Chi Phí</span>
                                            <span className="font-mono font-bold text-3xl">{formatMoney(lastCalculated.totalCost)}</span>
                                        </div>
                                    </div>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Vật Tư Chính</h3>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Lõi ({lastCalculated.core.description})</span>
                                                    <span className="font-bold">{formatMoney(lastCalculated.core.totalCost)}</span>
                                                </div>
                                                <div className="pl-4 text-xs text-gray-500">Khối lượng: {lastCalculated.core.weight} kg</div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Thành Phần Khác</h3>
                                            <div className="space-y-3 text-sm">
                                                 <div className="flex justify-between">
                                                    <span className="text-gray-600">Dây quấn ({lastCalculated.windings.length} cuộn)</span>
                                                    <span className="font-bold">{formatMoney(sumCost(lastCalculated.windings))}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Phụ kiện ({lastCalculated.accessories.length} món)</span>
                                                    <span className="font-bold">{formatMoney(sumCost(lastCalculated.accessories))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {/* SAVED LIST */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-500" /> Lịch Sử Tính Toán</h3>
                                    <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{savedTransformers.length} bản ghi</span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {savedTransformers.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 italic">Chưa có lịch sử tính toán nào. Hãy bấm "Tạo Tính Toán Mới"</div>
                                    ) : (
                                        savedTransformers.map(item => (
                                            <div key={item.id} className="p-4 hover:bg-blue-50 transition-colors flex justify-between items-center group">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${item.type === 'SQUARE' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-purple-600 border-purple-200 bg-purple-50'}`}>
                                                            {item.type === 'SQUARE' ? 'Vuông' : 'Tròn'}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex gap-4">
                                                        <span className="font-bold text-gray-700">{formatMoney(item.totalCost)}</span>
                                                        <span className="text-gray-300">|</span>
                                                        <span>Cập nhật: {formatDate(item.updatedDate)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-100">
                                                    <button onClick={() => openEditModal(item)} className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 px-3 py-2 rounded-lg transition-all shadow-sm text-sm font-medium">
                                                        <Edit className="w-4 h-4" /> Sửa
                                                    </button>
                                                    <button onClick={() => deleteTransformer(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex-none p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Settings className="w-6 h-6 text-blue-600" /> 
                                {editingId ? 'Cập Nhật Biến Áp' : 'Tính Toán Biến Áp Mới'}
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm hover:shadow transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        
                        {/* Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                             <form id="transformer-form" onSubmit={handleCalculateAndSave} className="space-y-8">
                                {/* SECTION 1: BASIC INFO */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Tên Dự Án / Biến Áp</label>
                                        <input value={newTransformer.name} onChange={e => setNewTransformer(prev => ({ ...prev, name: e.target.value }))} type="text" required placeholder="VD: Biến áp cách ly 5A..." className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Loại Biến Áp</label>
                                        <div className="flex gap-4">
                                            <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${newTransformer.type === 'SQUARE' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 font-bold' : 'hover:bg-gray-50 border-gray-200'}`}>
                                                <input type="radio" name="type" className="hidden" checked={newTransformer.type === 'SQUARE'} onChange={() => setNewTransformer(prev => ({ ...prev, type: 'SQUARE' }))} />
                                                <div className="w-4 h-4 border rounded-sm bg-current"></div> Vuông (EI)
                                            </label>
                                            <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${newTransformer.type === 'ROUND' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500 font-bold' : 'hover:bg-gray-50 border-gray-200'}`}>
                                                <input type="radio" name="type" className="hidden" checked={newTransformer.type === 'ROUND'} onChange={() => setNewTransformer(prev => ({ ...prev, type: 'ROUND' }))} />
                                                <div className="w-4 h-4 border rounded-full bg-current"></div> Tròn (Xuyến)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: CORE DETAILS */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Search className="w-5 h-5 text-indigo-600" /> Thông Số Lõi (Core)
                                    </h3>
                                    
                                    {newTransformer.type === 'SQUARE' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-1">Chọn Loại Phe</label>
                                                <select value={newTransformer.laminationId} onChange={e => setNewTransformer(prev => ({ ...prev, laminationId: e.target.value }))} required className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border">
                                                    <option value="" disabled>-- Chọn Phe --</option>
                                                    {laminations.map(lam => (<option key={lam.id} value={lam.id}>{lam.name} (Giá: {formatMoney(lam.pricePerKg)}/kg)</option>))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">* Giá theo kg sẽ được lấy tự động từ loại phe</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-1">Tổng Khối Lượng Phe (Kg)</label>
                                                <input type="number" step="0.1" value={newTransformer.coreWeight} onChange={e => setNewTransformer(prev => ({ ...prev, coreWeight: e.target.value }))} required placeholder="0.0" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-1">Giá Lõi / Kg</label>
                                                <div className="relative">
                                                     <input type="number" value={newTransformer.roundPricePerKg} onChange={e => setNewTransformer(prev => ({ ...prev, roundPricePerKg: e.target.value }))} required placeholder="0" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 pl-8 border" />
                                                     <span className="absolute left-3 top-2.5 text-gray-400">₫</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-600 mb-1">Tổng Khối Lượng (Kg)</label>
                                                <input type="number" step="0.1" value={newTransformer.coreWeight} onChange={e => setNewTransformer(prev => ({ ...prev, coreWeight: e.target.value }))} required placeholder="0.0" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 3: WINDINGS */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><RotateCcw className="w-5 h-5 text-orange-600" /> Dây Quấn</h3>
                                        <button type="button" onClick={addWinding} className="bg-white border border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors">
                                            <Plus className="w-4 h-4" /> Thêm Cuộn Dây
                                        </button>
                                    </div>
                                    
                                    <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                        <label className="block text-sm font-bold text-orange-900 mb-1">Chiều dài trung bình 1 vòng dây (cm)</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="number" step="0.1" value={newTransformer.turnLength} onChange={e => setNewTransformer(prev => ({ ...prev, turnLength: e.target.value }))} className="w-32 rounded-lg border-orange-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 border text-center font-bold" />
                                            <span className="text-xs text-orange-700">Thông số này dùng để tính tổng khối lượng đồng dựa trên số vòng dây.</span>
                                        </div>
                                    </div>

                                    {newTransformer.windings.length === 0 && <p className="text-center text-gray-400 italic py-4">Chưa có cuộn dây nào</p>}
                                    
                                    <div className="space-y-3">
                                        {newTransformer.windings.map((w, idx) => (
                                            <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Loại Dây</label>
                                                    <select value={w.specId} onChange={e => updateWinding(idx, 'specId', e.target.value)} required className="w-full text-sm rounded-md border-gray-300 p-2 border bg-gray-50">
                                                        <option value="" disabled>Chọn...</option>
                                                        {windingSpecs.map(spec => (<option key={spec.id} value={spec.id}>{spec.name} ({spec.diameter}mm)</option>))}
                                                    </select>
                                                </div>
                                                <div className="w-32">
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Số Vòng</label>
                                                    <input value={w.turnCount} onChange={e => updateWinding(idx, 'turnCount', e.target.value)} type="number" className="w-full text-sm rounded-md border-gray-300 p-2 border" placeholder="Vòng" />
                                                </div>
                                                <button type="button" onClick={() => removeWinding(idx)} className="mt-6 text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION 4: ACCESSORIES */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Menu className="w-5 h-5 text-gray-600" /> Phụ Kiện</h3>
                                        <button type="button" onClick={addAccessoryUsage} className="bg-white border border-gray-300 hover:border-gray-500 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors">
                                            <Plus className="w-4 h-4" /> Thêm Phụ Kiện
                                        </button>
                                    </div>
                                     <div className="space-y-3">
                                        {newTransformer.accessories.map((a, idx) => (
                                            <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Tên Phụ Kiện</label>
                                                    <select value={a.accessoryId} onChange={e => updateAccessoryUsage(idx, 'accessoryId', e.target.value)} required className="w-full text-sm rounded-md border-gray-300 p-2 border bg-gray-50">
                                                        <option value="" disabled>Chọn...</option>
                                                        {accessories.map(acc => (<option key={acc.id} value={acc.id}>{acc.name} ({formatMoney(acc.unitPrice)})</option>))}
                                                    </select>
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Số Lượng</label>
                                                    <input value={a.quantity} onChange={e => updateAccessoryUsage(idx, 'quantity', e.target.value)} type="number" className="w-full text-sm rounded-md border-gray-300 p-2 border" />
                                                </div>
                                                <button type="button" onClick={() => removeAccessoryUsage(idx)} className="mt-6 text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             </form>
                        </div>

                        {/* Footer */}
                        <div className="flex-none p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-white hover:shadow-md transition-all">Hủy Bỏ</button>
                            <button form="transformer-form" type="submit" className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-2">
                                <Save className="w-5 h-5" /> {editingId ? 'Lưu Thay Đổi' : 'Tính & Lưu Mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CATALOG CONTENT */}
            {activeTab === 'catalog' && (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
                        {/* Sidebar */}
                        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                            {[
                                { id: 'lamination', label: 'Phe & Lõi', icon: Search },
                                { id: 'winding', label: 'Dây Quấn', icon: RotateCcw },
                                { id: 'accessory', label: 'Phụ Kiện', icon: Menu }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setCatalogTab(tab.id)} className={`px-6 py-4 text-sm font-medium transition-colors flex items-center gap-3 border-l-4 ${catalogTab === tab.id ? 'bg-white border-blue-600 text-blue-700 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}>
                                    <tab.icon className="w-4 h-4" /> {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 p-8">
                            {/* Existing Catalog Forms - keeping it brief as not requested to change much, just adding dates to display might be nice */}
                            {/* LAMINATIONS */}
                            {catalogTab === 'lamination' && (
                                <div className="space-y-6">
                                    <form onSubmit={saveLamination} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                        <div className="md:col-span-2"><input value={newItem.lamination.name} onChange={e => setNewItem(prev => ({ ...prev, lamination: { ...prev.lamination, name: e.target.value } }))} type="text" placeholder="Tên Phe" required className="w-full rounded-md border-gray-300 text-sm px-3 py-2 border"/></div>
                                        <input value={newItem.lamination.pricePerKg} onChange={e => setNewItem(prev => ({ ...prev, lamination: { ...prev.lamination, pricePerKg: e.target.value } }))} type="number" placeholder="Giá Phe/Kg" required className="rounded-md border-gray-300 text-sm px-3 py-2 border"/>
                                        <input value={newItem.lamination.coreName} onChange={e => setNewItem(prev => ({ ...prev, lamination: { ...prev.lamination, coreName: e.target.value } }))} type="text" placeholder="Tên Lõi" className="rounded-md border-gray-300 text-sm px-3 py-2 border"/>
                                        <div className="flex gap-2"><input value={newItem.lamination.corePrice} onChange={e => setNewItem(prev => ({ ...prev, lamination: { ...prev.lamination, corePrice: e.target.value } }))} type="number" placeholder="Giá Lõi" required className="flex-1 rounded-md border-gray-300 text-sm px-3 py-2 border"/><button type="submit" className="bg-blue-600 text-white rounded-md w-10 flex items-center justify-center hover:bg-blue-700 shadow"><Plus className="w-5 h-5" /></button></div>
                                    </form>
                                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                                <tr><th className="px-6 py-3">Tên</th><th className="px-6 py-3">Giá Phe</th><th className="px-6 py-3">Tên Lõi</th><th className="px-6 py-3">Giá Lõi</th><th className="px-6 py-3">Ngày Cập Nhật</th><th className="px-6 py-3 w-10"></th></tr>
                                            </thead>
                                            <tbody>
                                                {laminations.map(item => (
                                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td><td className="px-6 py-4">{formatMoney(item.pricePerKg)}</td><td className="px-6 py-4">{item.coreName}</td><td className="px-6 py-4">{formatMoney(item.corePrice)}</td>
                                                        <td className="px-6 py-4 text-xs text-gray-400">{formatDate(item.updatedDate)}</td>
                                                        <td className="px-6 py-4 text-right"><button onClick={() => deleteItem('ei-laminations', item.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* WINDINGS */}
                            {catalogTab === 'winding' && (
                                <div className="space-y-6">
                                    <form onSubmit={saveWinding} className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-orange-50/50 p-6 rounded-xl border border-orange-100">
                                        <div className="md:col-span-2"><input value={newItem.winding.name} onChange={e => setNewItem(prev => ({ ...prev, winding: { ...prev.winding, name: e.target.value } }))} type="text" placeholder="Tên Dây" required className="w-full rounded-md border-gray-300 text-sm px-3 py-2 border"/></div>
                                        <select value={newItem.winding.material} onChange={e => setNewItem(prev => ({ ...prev, winding: { ...prev.winding, material: e.target.value } }))} className="rounded-md border-gray-300 text-sm px-3 py-2 border"><option value="COPPER">Đồng</option><option value="ALUMINUM">Nhôm</option></select>
                                        <input value={newItem.winding.diameter} onChange={e => setNewItem(prev => ({ ...prev, winding: { ...prev.winding, diameter: e.target.value } }))} type="number" step="0.01" placeholder="Phi (mm)" required className="rounded-md border-gray-300 text-sm px-3 py-2 border"/>
                                        <div className="md:col-span-2 flex gap-2"><input value={newItem.winding.pricePerKg} onChange={e => setNewItem(prev => ({ ...prev, winding: { ...prev.winding, pricePerKg: e.target.value } }))} type="number" placeholder="Giá/Kg" required className="flex-1 rounded-md border-gray-300 text-sm px-3 py-2 border"/><button type="submit" className="bg-orange-600 text-white rounded-md w-12 flex items-center justify-center hover:bg-orange-700 shadow"><Plus className="w-5 h-5" /></button></div>
                                    </form>
                                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3">Tên</th><th className="px-6 py-3">Vật liệu</th><th className="px-6 py-3">Đường kính</th><th className="px-6 py-3">Giá/Kg</th><th className="px-6 py-3">Ngày Cập Nhật</th><th className="px-6 py-3 w-10"></th></tr></thead>
                                            <tbody>
                                                {windingSpecs.map(item => (
                                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-medium text-gray-900">{item.name}</td><td className="px-6 py-4">{item.material}</td><td className="px-6 py-4">{item.diameter} mm</td><td className="px-6 py-4">{formatMoney(item.pricePerKg)}</td><td className="px-6 py-4 text-xs text-gray-400">{formatDate(item.updatedDate)}</td><td className="px-6 py-4 text-right"><button onClick={() => deleteItem('winding-specs', item.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {/* ACCESSORIES */}
                            {catalogTab === 'accessory' && (
                                <div className="space-y-6">
                                    <form onSubmit={saveAccessory} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-purple-50/50 p-6 rounded-xl border border-purple-100">
                                        <div className="md:col-span-2"><input value={newItem.accessory.name} onChange={e => setNewItem(prev => ({ ...prev, accessory: { ...prev.accessory, name: e.target.value } }))} type="text" placeholder="Tên" required className="w-full rounded-md border-gray-300 text-sm px-3 py-2 border"/></div>
                                        <select value={newItem.accessory.type} onChange={e => setNewItem(prev => ({ ...prev, accessory: { ...prev.accessory, type: e.target.value } }))} className="rounded-md border-gray-300 text-sm px-3 py-2 border"><option value="ELECTRIC_WIRE">Dây điện</option><option value="JACK">Jack</option><option value="MOUNTING_BASE">Chân đế</option><option value="BOLT">Ốc</option><option value="RUBBER_PAD">Đệm</option></select>
                                        <div className="md:col-span-2 flex gap-2"><select value={newItem.accessory.unitType} onChange={e => setNewItem(prev => ({ ...prev, accessory: { ...prev.accessory, unitType: e.target.value } }))} className="rounded-md border-gray-300 text-sm px-3 py-2 border"><option value="PER_PIECE">Cái</option><option value="PER_METER">Mét</option><option value="PER_KG">Kg</option></select><input value={newItem.accessory.unitPrice} onChange={e => setNewItem(prev => ({ ...prev, accessory: { ...prev.accessory, unitPrice: e.target.value } }))} type="number" placeholder="Đơn giá" required className="flex-1 rounded-md border-gray-300 text-sm px-3 py-2 border"/><button type="submit" className="bg-purple-600 text-white rounded-md w-12 flex items-center justify-center hover:bg-purple-700 shadow"><Plus className="w-5 h-5" /></button></div>
                                    </form>
                                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b"><tr><th className="px-6 py-3">Tên</th><th className="px-6 py-3">Loại</th><th className="px-6 py-3">Giá</th><th className="px-6 py-3">Ngày Cập Nhật</th><th className="px-6 py-3 w-10"></th></tr></thead>
                                            <tbody>
                                                {accessories.map(item => (
                                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors"><td className="px-6 py-4 font-medium text-gray-900">{item.name}</td><td className="px-6 py-4">{item.type}</td><td className="px-6 py-4">{formatMoney(item.unitPrice)} / {item.unitType}</td><td className="px-6 py-4 text-xs text-gray-400">{formatDate(item.updatedDate)}</td><td className="px-6 py-4 text-right"><button onClick={() => deleteItem('accessories', item.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

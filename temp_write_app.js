const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Users\\thinh\\Documents\\tengicungdc\\AnThinh_PriceCalculator\\frontend\\src\\App.vue');

const content = `<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { 
    Calculator, 
    Book, 
    Plus, 
    X, 
    Settings, 
    Search,
    Menu,
    Trash2,
    Save,
    RotateCcw
} from 'lucide-vue-next';

// --- DATA & STATE ---
const activeTab = ref('calculator'); // 'calculator' | 'catalog'
const catalogTab = ref('lamination'); // 'lamination' | 'winding' | 'accessory'

// Quick Add State
const showQuickAdd = ref(false);
const quickAddItem = reactive({
    type: 'lamination', // 'lamination' | 'winding' | 'accessory'
    name: '',
    price: 0,
    unit: '', // for accessory
    details: '' // coreName for lamination, diameter for winding
});

// Master Data (Mock ID for now, usually from DB)
const laminations = reactive([
    { id: 1, name: 'Phe 32', pricePerKg: 45000, coreName: 'Lõi 32x40', corePrice: 15000 },
    { id: 2, name: 'Phe 40', pricePerKg: 48000, coreName: 'Lõi 40x50', corePrice: 22000 },
]);

const windingSpecs = reactive([
    { id: 1, name: 'Đồng Sơ Cấp 0.35', material: 'COPPER', type: 'PRIMARY', diameter: 0.35, pricePerKg: 280000 },
    { id: 2, name: 'Đồng Thứ Cấp 1.2', material: 'COPPER', type: 'SECONDARY', diameter: 1.20, pricePerKg: 280000 },
]);

const accessories = reactive([
    { id: 1, name: 'Dây ra 0.5mm', type: 'ELECTRIC_WIRE', unitType: 'PER_METER', unitPrice: 5000 },
    { id: 2, name: 'Ốc M4', type: 'BOLT', unitType: 'PER_PIECE', unitPrice: 500 },
]);

// New Transformer Form Data
const newTransformer = reactive({
    name: '',
    type: 'ISOLATION', // ISOLATION | AUTOTRANSFORMER
    squareCore: {
        laminationId: '',
        stackHeight: 40,
        tongueWidth: 32
    },
    // Future support for round core
    roundCore: null, 
    windings: [],
    accessories: []
});

const lastCalculated = ref(null);

// --- COMPUTED ---
const selectedLamination = computed(() => {
    if (!newTransformer.squareCore.laminationId) return null;
    return laminations.find(l => l.id === newTransformer.squareCore.laminationId);
});

// --- METHODS ---
function formatMoney(amount) {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// 1. Core Logic
function calculateCoreCost() {
    if (!selectedLamination.value) return 0;
    
    // Simple logic: Weight = Volume * Density. 
    // Here simplified: (Tongue * Stack * Factor) / 1000 * Price
    // Real formula needs accurate weight calculation based on dimensions
    // Let's assume a simplified weight for 32x40 is around 1.2kg
    const w = (newTransformer.squareCore.tongueWidth * newTransformer.squareCore.stackHeight * 0.0075); // Dummy factor
    
    const laminationCost = w * selectedLamination.value.pricePerKg;
    const coreCost = selectedLamination.value.corePrice; // Bobbin cost

    return {
        totalCost: laminationCost + coreCost,
        laminationName: selectedLamination.value.name,
        coreName: selectedLamination.value.coreName
    };
}

// 2. Winding Logic
function addWinding() {
    newTransformer.windings.push({
        specId: '',
        turnCount: 0,
        layerCount: 0 // Optional
    });
}
function removeWinding(index) {
    newTransformer.windings.splice(index, 1); 
}

function calculateWindingCost(wUsage) {
    const spec = windingSpecs.find(s => s.id === wUsage.specId);
    if (!spec) return 0;

    // Weight = Length * Area * Density
    // Length approx = Turns * CorePerimeter
    // Simplified: 
    const perimeter = (newTransformer.squareCore.tongueWidth + newTransformer.squareCore.stackHeight) * 2 * 1.5; // mm * safety factor
    const totalLengthM = (perimeter * wUsage.turnCount) / 1000;
    
    // Area = (d/2)^2 * PI
    const radius = spec.diameter / 2;
    const area = radius * radius * 3.14159; // mm2
    
    // Density Copper ~ 8.96 g/cm3 => 0.00896 kg/mm/m (check units carefully)
    // 1m of 1mm2 copper = ?
    // Volume = Area (mm2) * Length (mm) = Area * Length(m)*1000
    // Weight (kg) = Volume(mm3) * 0.00000896
    
    const weightKg = (area * totalLengthM * 1000) * 0.00000896;
    
    return weightKg * spec.pricePerKg;
}

// 3. Accessory Logic
function addAccessoryUsage() {
    newTransformer.accessories.push({
        accessoryId: '',
        quantity: 1
    });
}
function removeAccessoryUsage(index) {
    newTransformer.accessories.splice(index, 1);
}

function calculateAccessoryCost(accUsage) {
    const acc = accessories.find(a => a.id === accUsage.accessoryId);
    if (!acc) return 0;
    return acc.unitPrice * accUsage.quantity;
}

// MAIN SUBMIT
function handleCalculate() {
    // 1. Calculate Core
    const coreResult = calculateCoreCost();
    
    // 2. Calculate Windings
    const windingsResult = newTransformer.windings.map(w => {
        const spec = windingSpecs.find(s => s.id === w.specId);
        const cost = calculateWindingCost(w);
        return {
            name: spec ? spec.name : 'Unknown',
            cost: cost
        };
    });

    // 3. Calculate Accessories
    const accResult = newTransformer.accessories.map(a => {
        const item = accessories.find(i => i.id === a.accessoryId);
        const cost = calculateAccessoryCost(a);
        return {
            name: item ? item.name : 'Unknown',
            cost: cost
        };
    });

    const totalCore = coreResult.totalCost || 0;
    const totalWinding = windingsResult.reduce((sum, w) => sum + w.cost, 0);
    const totalAcc = accResult.reduce((sum, a) => sum + a.cost, 0);

    lastCalculated.value = {
        name: newTransformer.name || 'Biến áp mới',
        type: newTransformer.type,
        totalCost: totalCore + totalWinding + totalAcc,
        squareCore: coreResult,
        roundCore: null,
        windings: windingsResult,
        accessories: accResult
    };
}

function sumCost(arr) {
    return arr.reduce((sum, i) => sum + i.cost, 0);
}

function resetForm() {
    Object.assign(newTransformer, {
        name: '',
        type: 'ISOLATION',
        squareCore: { laminationId: '', stackHeight: 40, tongueWidth: 32 },
        windings: [],
        accessories: []
    });
    lastCalculated.value = null;
}

// Catalog Management
const newItem = reactive({
    lamination: { name: '', pricePerKg: 0, coreName: '', corePrice: 0 },
    winding: { name: '', material: 'COPPER', type: 'PRIMARY', diameter: 0, pricePerKg: 0 },
    accessory: { name: '', type: 'ELECTRIC_WIRE', unitType: 'PER_PIECE', unitPrice: 0 }
});

function saveLamination() {
    laminations.push({
        id: Date.now(),
        ...newItem.lamination
    });
    newItem.lamination = { name: '', pricePerKg: 0, coreName: '', corePrice: 0 };
}
function saveWinding() {
    windingSpecs.push({
        id: Date.now(),
        ...newItem.winding
    });
    newItem.winding = { name: '', material: 'COPPER', type: 'PRIMARY', diameter: 0, pricePerKg: 0 };
}
function saveAccessory() {
    accessories.push({
        id: Date.now(),
        ...newItem.accessory
    });
    newItem.accessory = { name: '', type: 'ELECTRIC_WIRE', unitType: 'PER_PIECE', unitPrice: 0 };
}

function deleteItem(type, id) {
    if (!confirm('Bạn có chắc muốn xóa?')) return;
    if (type === 'ei-laminations') {
        const idx = laminations.findIndex(i => i.id === id);
        if (idx > -1) laminations.splice(idx, 1);
    }
    else if (type === 'winding-specs') {
        const idx = windingSpecs.findIndex(i => i.id === id);
        if (idx > -1) windingSpecs.splice(idx, 1);
    }
    else if (type === 'accessories') {
        const idx = accessories.findIndex(i => i.id === id);
        if (idx > -1) accessories.splice(idx, 1);
    }
}

// Quick Add Handler
function handleQuickAddSubmit() {
    if (quickAddItem.type === 'lamination') {
        laminations.push({
            id: Date.now(),
            name: quickAddItem.name,
            pricePerKg: quickAddItem.price,
            coreName: quickAddItem.details, // Using details as coreName
            corePrice: 0 // Default or add field
        });
    } else if (quickAddItem.type === 'winding') {
        windingSpecs.push({
            id: Date.now(),
            name: quickAddItem.name,
            pricePerKg: quickAddItem.price,
            diameter: parseFloat(quickAddItem.details) || 0,
            material: 'COPPER',
            type: 'PRIMARY'
        });
    } else if (quickAddItem.type === 'accessory') {
        accessories.push({
            id: Date.now(),
            name: quickAddItem.name,
            unitPrice: quickAddItem.price,
            unitType: quickAddItem.unit || 'PER_PIECE',
            type: 'ELECTRIC_WIRE'
        });
    }
    // Reset and Close
    showQuickAdd.value = false;
    quickAddItem.name = '';
    quickAddItem.price = 0;
    quickAddItem.details = '';
}
</script>

<template>
  <div class="container mx-auto p-4 min-h-screen font-sans text-gray-800">
    
    <!-- HEADER -->
    <header class="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4 bg-white p-4 rounded-lg shadow-sm">
        <div class="flex items-center gap-3">
            <div class="bg-blue-600 p-2 rounded-lg shadow-lg">
                <Calculator class="text-white w-8 h-8" />
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-800 tracking-tight">AnThinh Price</h1>
                <p class="text-xs text-gray-500 font-medium tracking-wide">TRANSFORMER CALCULATOR</p>
            </div>
        </div>
        
        <nav class="flex bg-gray-100 p-1 rounded-lg">
            <button 
                @click="activeTab = 'calculator'"
                class="flex items-center gap-2 px-6 py-2 rounded-md transition-all duration-200 text-sm font-medium"
                :class="activeTab === 'calculator' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            >
                <Calculator class="w-4 h-4" />
                Tính Giá
            </button>
            <button 
                @click="activeTab = 'catalog'"
                class="flex items-center gap-2 px-6 py-2 rounded-md transition-all duration-200 text-sm font-medium"
                :class="activeTab === 'catalog' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            >
                <Book class="w-4 h-4" />
                Danh Mục
            </button>
        </nav>

        <div>
            <button @click="showQuickAdd = true" class="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow transition-colors text-sm font-bold">
                <Plus class="w-4 h-4" />
                Thêm Nhanh
            </button>
        </div>
    </header>

    <!-- QUICK ADD MODAL -->
    <div v-if="showQuickAdd" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="bg-blue-600 p-4 flex justify-between items-center text-white">
                <h3 class="font-bold text-lg flex items-center gap-2">
                    <Plus class="w-5 h-5"/> Thêm Vật Tư Nhanh
                </h3>
                <button @click="showQuickAdd = false" class="hover:bg-blue-700 p-1 rounded transition-colors"><X class="w-5 h-5"/></button>
            </div>
            <div class="p-6 space-y-4">
                <div>
                     <label class="block text-sm font-medium text-gray-700 mb-1">Loại Vật Tư</label>
                     <div class="flex bg-gray-100 p-1 rounded">
                        <button class="flex-1 text-xs py-2 rounded" :class="quickAddItem.type === 'lamination' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'" @click="quickAddItem.type = 'lamination'">Phe/Lõi</button>
                        <button class="flex-1 text-xs py-2 rounded" :class="quickAddItem.type === 'winding' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'" @click="quickAddItem.type = 'winding'">Dây</button>
                        <button class="flex-1 text-xs py-2 rounded" :class="quickAddItem.type === 'accessory' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'" @click="quickAddItem.type = 'accessory'">Phụ Kiện</button>
                     </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên Vật Tư</label>
                    <input v-model="quickAddItem.name" type="text" class="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="VD: Phe 32, Dây 0.35...">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Giá Tiền</label>
                        <input v-model.number="quickAddItem.price" type="number" class="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm" placeholder="VNĐ">
                    </div>
                     <div v-if="quickAddItem.type === 'accessory'">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Đơn Vị</label>
                         <select v-model="quickAddItem.unit" class="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                            <option value="PER_PIECE">Cái</option>
                            <option value="PER_METER">Mét</option>
                            <option value="PER_KG">Kg</option>
                        </select>
                    </div>
                    <div v-else>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ quickAddItem.type === 'lamination' ? 'Tên Lõi (Khuôn)' : 'Đường kính (mm)' }}
                        </label>
                        <input v-model="quickAddItem.details" type="text" class="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                    </div>
                </div>

                <button @click="handleQuickAddSubmit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition-colors mt-2">
                    Lưu Ngay
                </button>
            </div>
        </div>
    </div>

    <!-- CALCULATOR SCREEN -->
    <div v-if="activeTab === 'calculator'" class="animate-in fade-in duration-300">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            <!-- FORM -->
            <div class="md:col-span-5 space-y-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Settings class="w-5 h-5 text-gray-500" />
                        Thông Số Kỹ Thuật
                    </h2>
                    
                    <form @submit.prevent="handleCalculate" class="space-y-5">
                        <!-- Info -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Tên Biến Áp</label>
                                <input v-model="newTransformer.name" type="text" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Loại</label>
                                <select v-model="newTransformer.type" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                                    <option value="ISOLATION">Cách Ly</option>
                                    <option value="AUTOTRANSFORMER">Tự Ngẫu</option>
                                </select>
                            </div>
                        </div>

                        <!-- Core Selection -->
                        <div class="border rounded-lg p-4 bg-gray-50/50">
                            <h3 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Search class="w-4 h-4 text-blue-500"/> Phe & Lõi Thép (EI)
                            </h3>
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">Loại Phe</label>
                                    <select v-model="newTransformer.squareCore.laminationId" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                                        <option value="" disabled>Chọn loại phe...</option>
                                        <option v-for="lam in laminations" :key="lam.id" :value="lam.id">
                                            {{ lam.name }} - {{ lam.coreName }}
                                        </option>
                                    </select>
                                </div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs text-gray-500 mb-1">Dày Phe (mm)</label>
                                        <input v-model.number="newTransformer.squareCore.stackHeight" type="number" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-xs text-gray-500 mb-1">Rộng Lưỡi (mm)</label>
                                        <input v-model.number="newTransformer.squareCore.tongueWidth" type="number" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Windings -->
                        <div class="border rounded-lg p-4 bg-gray-50/50">
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <RotateCcw class="w-4 h-4 text-orange-500"/> Dây Quấn
                                </h3>
                                <button type="button" @click="addWinding" class="text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-1">
                                    <Plus class="w-3 h-3"/> Thêm
                                </button>
                            </div>
                            <div class="space-y-3">
                                <div v-for="(w, idx) in newTransformer.windings" :key="idx" class="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
                                    <select v-model="w.specId" required class="flex-1 min-w-0 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5">
                                        <option value="" disabled>Chọn dây...</option>
                                        <option v-for="spec in windingSpecs" :key="spec.id" :value="spec.id">
                                            {{ spec.name }} ({{ spec.diameter }}mm)
                                        </option>
                                    </select>
                                    <div class="w-20 relative">
                                         <input v-model.number="w.turnCount" type="number" placeholder="Vòng" class="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-2">
                                    </div>
                                    <button type="button" @click="removeWinding(idx)" class="text-gray-400 hover:text-red-500 p-1.5"><X class="w-4 h-4"/></button>
                                </div>
                                <div v-if="newTransformer.windings.length === 0" class="text-center py-4 text-sm text-gray-400 italic bg-white rounded border border-dashed">
                                    Chưa có cuộn dây nào
                                </div>
                            </div>
                        </div>

                        <!-- Accessories -->
                        <div class="border rounded-lg p-4 bg-gray-50/50">
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2">
                                    <Menu class="w-4 h-4 text-purple-500"/> Phụ Kiện
                                </h3>
                                <button type="button" @click="addAccessoryUsage" class="text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-1">
                                    <Plus class="w-3 h-3"/> Thêm
                                </button>
                            </div>
                            <div class="space-y-3">
                                <div v-for="(a, idx) in newTransformer.accessories" :key="idx" class="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
                                    <select v-model="a.accessoryId" required class="flex-1 min-w-0 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5">
                                        <option value="" disabled>Chọn phụ kiện...</option>
                                        <option v-for="acc in accessories" :key="acc.id" :value="acc.id">
                                            {{ acc.name }}
                                        </option>
                                    </select>
                                    <div class="w-20">
                                        <input v-model.number="a.quantity" type="number" step="0.1" placeholder="SL" class="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5 px-2">
                                    </div>
                                    <button type="button" @click="removeAccessoryUsage(idx)" class="text-gray-400 hover:text-red-500 p-1.5"><X class="w-4 h-4"/></button>
                                </div>
                                 <div v-if="newTransformer.accessories.length === 0" class="text-center py-4 text-sm text-gray-400 italic bg-white rounded border border-dashed">
                                    Chưa có phụ kiện
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                            Tính Toán & Lưu Kết Quả
                        </button>
                    </form>
                </div>
            </div>

            <!-- RESULT -->
            <div class="md:col-span-7">
                <div v-if="lastCalculated" class="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden sticky top-8 animate-in zoom-in-95 duration-300">
                    <div class="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 flex justify-between items-center text-white">
                         <div>
                             <h2 class="font-bold text-2xl flex items-center gap-2"><Save class="w-6 h-6"/> Kết Quả Tính Toán</h2>
                             <p class="text-green-100 text-sm mt-1 opacity-90">Đã cập nhật lúc {{ new Date().toLocaleTimeString() }}</p>
                         </div>
                         <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                             <span class="block text-xs uppercase tracking-wider opacity-90">Tổng Chi Phí</span>
                             <span class="font-mono font-bold text-2xl">{{ formatMoney(lastCalculated.totalCost) }}</span>
                         </div>
                    </div>
                    <div class="p-8">
                        <div class="flex items-center gap-3 mb-6">
                            <h3 class="font-bold text-gray-800 text-2xl">{{ lastCalculated.name }}</h3>
                            <span class="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wide">{{ lastCalculated.type }}</span>
                        </div>
                        
                        <div class="space-y-6">
                            <!-- Core cost -->
                            <div v-if="lastCalculated.squareCore" class="flex justify-between items-center border-b border-gray-100 pb-4 group hover:bg-gray-50 p-2 rounded transition-colors">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Settings class="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <span class="text-gray-500 text-xs uppercase font-bold tracking-wider">Phe & Lõi</span>
                                        <div class="font-medium text-gray-800">{{ lastCalculated.squareCore.laminationName }} + {{ lastCalculated.squareCore.coreName }}</div>
                                    </div>
                                </div>
                                <span class="font-bold text-gray-800 text-lg">{{ formatMoney(lastCalculated.squareCore.totalCost) }}</span>
                            </div>

                            <!-- Windings -->
                            <div class="flex justify-between items-center border-b border-gray-100 pb-4 group hover:bg-gray-50 p-2 rounded transition-colors">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <RotateCcw class="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <span class="text-gray-500 text-xs uppercase font-bold tracking-wider">Dây Quấn</span>
                                        <div class="font-medium text-gray-800">{{ lastCalculated.windings.length }} cuộn</div>
                                    </div>
                                </div>
                                <span class="font-bold text-gray-800 text-lg">{{ formatMoney(sumCost(lastCalculated.windings)) }}</span>
                            </div>
                            
                            <!-- Accessories -->
                            <div class="flex justify-between items-center border-b border-gray-100 pb-4 group hover:bg-gray-50 p-2 rounded transition-colors">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                        <Menu class="w-5 h-5"/>
                                    </div>
                                    <div>
                                        <span class="text-gray-500 text-xs uppercase font-bold tracking-wider">Phụ Kiện</span>
                                        <div class="font-medium text-gray-800">{{ lastCalculated.accessories.length }} món</div>
                                    </div>
                                </div>
                                <span class="font-bold text-gray-800 text-lg">{{ formatMoney(sumCost(lastCalculated.accessories)) }}</span>
                            </div>
                        </div>

                         <div class="mt-8 flex justify-end">
                            <button @click="resetForm" class="text-gray-500 hover:text-red-600 underline text-sm flex items-center gap-1 transition-colors">
                                <Trash2 class="w-4 h-4"/> Xóa & Làm lại
                            </button>
                        </div>
                    </div>
                </div>
                
                <div v-else class="h-full flex flex-col items-center justify-center p-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 min-h-[400px]">
                    <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Calculator class="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 class="text-lg font-medium text-gray-500 mb-2">Chưa có kết quả</h3>
                    <p class="text-sm">Nhập thông tin bên trái để tính giá thành sản phẩm</p>
                </div>
            </div>
        </div>
    </div>

    <!-- CATALOG CONTENT -->
    <div v-else class="animate-in fade-in duration-300">
         <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col md:flex-row">
            
            <!-- Sidebar Tabs -->
            <div class="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                 <button 
                    v-for="tab in [{id:'lamination', label:'Phe & Lõi', icon: Search}, {id:'winding', label:'Dây Quấn', icon: RotateCcw}, {id:'accessory', label:'Phụ Kiện', icon: Menu}]"
                    :key="tab.id"
                    @click="catalogTab = tab.id"
                    class="px-6 py-4 text-sm font-medium transition-colors flex items-center gap-3 border-l-4"
                    :class="catalogTab === tab.id ? 'bg-white border-blue-600 text-blue-700 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'"
                 >
                    <component :is="tab.icon" class="w-4 h-4" />
                    {{ tab.label }}
                 </button>
            </div>
            
            <div class="flex-1 p-8">
                 <div class="mb-6 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Quản Lý Danh Mục</h2>
                    <button class="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded transition-colors flex items-center gap-2">
                        <Settings class="w-4 h-4"/> Cấu hình
                    </button>
                 </div>

                 <!-- LAMINATIONS -->
                <div v-if="catalogTab === 'lamination'" class="space-y-6">
                    <form @submit.prevent="saveLamination" class="grid grid-cols-1 md:grid-cols-5 gap-4 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                         <div class="md:col-span-2">
                             <input v-model="newItem.lamination.name" type="text" placeholder="Tên Phe (vd: Phe 32)" required class="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
                         </div>
                         <input v-model.number="newItem.lamination.pricePerKg" type="number" placeholder="Giá Phe/Kg" required class="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
                         <input v-model="newItem.lamination.coreName" type="text" placeholder="Tên Lõi (vd: Lõi 32x40)" class="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
                         <div class="flex gap-2">
                             <input v-model.number="newItem.lamination.corePrice" type="number" placeholder="Giá Lõi/Cái" required class="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500">
                             <button type="submit" class="bg-blue-600 text-white rounded-md w-10 flex items-center justify-center hover:bg-blue-700 shadow"><Plus class="w-5 h-5"/></button>
                         </div>
                    </form>

                    <div class="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <table class="w-full text-sm text-left text-gray-500">
                             <thead class="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th class="px-6 py-3">Tên Phe</th>
                                    <th class="px-6 py-3">Giá Phe/Kg</th>
                                    <th class="px-6 py-3">Tên Lõi</th>
                                    <th class="px-6 py-3">Giá Lõi</th>
                                    <th class="px-6 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in laminations" :key="item.id" class="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td class="px-6 py-4 font-medium text-gray-900">{{ item.name }}</td>
                                    <td class="px-6 py-4">{{ formatMoney(item.pricePerKg) }}</td>
                                    <td class="px-6 py-4">{{ item.coreName }}</td>
                                    <td class="px-6 py-4">{{ formatMoney(item.corePrice) }}</td>
                                    <td class="px-6 py-4 text-right">
                                        <button @click="deleteItem('ei-laminations', item.id)" class="text-gray-400 hover:text-red-600 transition-colors"><Trash2 class="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- WINDINGS -->
                <div v-if="catalogTab === 'winding'" class="space-y-6">
                    <form @submit.prevent="saveWinding" class="grid grid-cols-1 md:grid-cols-6 gap-4 bg-orange-50/50 p-6 rounded-xl border border-orange-100">
                         <div class="md:col-span-2">
                             <input v-model="newItem.winding.name" type="text" placeholder="Tên Dây (vd: Đồng 0.35)" required class="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500">
                         </div>
                         <select v-model="newItem.winding.material" class="rounded-md border-gray-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500">
                            <option value="COPPER">Đồng</option>
                            <option value="ALUMINUM">Nhôm</option>
                         </select>
                         <input v-model.number="newItem.winding.diameter" type="number" step="0.01" placeholder="Phi (mm)" required class="rounded-md border-gray-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500">
                         <div class="md:col-span-2 flex gap-2">
                             <input v-model.number="newItem.winding.pricePerKg" type="number" placeholder="Giá/Kg" required class="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500">
                             <button type="submit" class="bg-orange-600 text-white rounded-md w-12 flex items-center justify-center hover:bg-orange-700 shadow"><Plus class="w-5 h-5"/></button>
                         </div>
                    </form>
                    
                     <div class="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <table class="w-full text-sm text-left text-gray-500">
                             <thead class="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th class="px-6 py-3">Tên</th>
                                    <th class="px-6 py-3">Vật liệu</th>
                                    <th class="px-6 py-3">Đường kính</th>
                                    <th class="px-6 py-3">Giá/Kg</th>
                                    <th class="px-6 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in windingSpecs" :key="item.id" class="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td class="px-6 py-4 font-medium text-gray-900">{{ item.name }}</td>
                                    <td class="px-6 py-4">{{ item.material }}</td>
                                    <td class="px-6 py-4">{{ item.diameter }} mm</td>
                                    <td class="px-6 py-4">{{ formatMoney(item.pricePerKg) }}</td>
                                    <td class="px-6 py-4 text-right">
                                        <button @click="deleteItem('winding-specs', item.id)" class="text-gray-400 hover:text-red-600 transition-colors"><Trash2 class="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ACCESSORIES -->
                <div v-if="catalogTab === 'accessory'" class="space-y-6">
                    <form @submit.prevent="saveAccessory" class="grid grid-cols-1 md:grid-cols-5 gap-4 bg-purple-50/50 p-6 rounded-xl border border-purple-100">
                         <div class="md:col-span-2">
                            <input v-model="newItem.accessory.name" type="text" placeholder="Tên (vd: Dây điện đỏ)" required class="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500">
                         </div>
                         <select v-model="newItem.accessory.type" class="rounded-md border-gray-300 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500">
                            <option value="ELECTRIC_WIRE">Dây điện</option>
                            <option value="JACK">Jack</option>
                            <option value="MOUNTING_BASE">Chân đế</option>
                            <option value="BOLT">Ốc</option>
                            <option value="RUBBER_PAD">Đệm</option>
                         </select>
                         <div class="md:col-span-2 flex gap-2">
                             <select v-model="newItem.accessory.unitType" class="rounded-md border-gray-300 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500">
                                <option value="PER_PIECE">Cái</option>
                                <option value="PER_METER">Mét</option>
                                <option value="PER_KG">Kg</option>
                             </select>
                             <input v-model.number="newItem.accessory.unitPrice" type="number" placeholder="Đơn giá" required class="flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-purple-500 focus:ring-purple-500">
                             <button type="submit" class="bg-purple-600 text-white rounded-md w-12 flex items-center justify-center hover:bg-purple-700 shadow"><Plus class="w-5 h-5"/></button>
                         </div>
                    </form>

                     <div class="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <table class="w-full text-sm text-left text-gray-500">
                             <thead class="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th class="px-6 py-3">Tên</th>
                                    <th class="px-6 py-3">Loại</th>
                                    <th class="px-6 py-3">Giá</th>
                                    <th class="px-6 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in accessories" :key="item.id" class="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td class="px-6 py-4 font-medium text-gray-900">{{ item.name }}</td>
                                    <td class="px-6 py-4">{{ item.type }}</td>
                                    <td class="px-6 py-4">{{ formatMoney(item.unitPrice) }} / {{ item.unitType }}</td>
                                    <td class="px-6 py-4 text-right">
                                        <button @click="deleteItem('accessories', item.id)" class="text-gray-400 hover:text-red-600 transition-colors"><Trash2 class="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
         </div>
    </div>
  </div>
</template>
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('App.vue written successfully');

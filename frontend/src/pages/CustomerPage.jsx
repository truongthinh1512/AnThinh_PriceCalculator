import React, { useState } from 'react';
import { useMasterData } from '../context/MasterDataContext';
import { Trash2, Plus, Users, Search } from 'lucide-react';

const CustomerPage = () => {
    const { customers, refreshData } = useMasterData();
    const [searchTerm, setSearchTerm] = useState('');
    const [newCustomer, setNewCustomer] = useState({ name: '', phoneNumber: '', address: '', note: '' });

    const saveCustomer = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer)
            });
            if (res.ok) {
                await refreshData();
                setNewCustomer({ name: '', phoneNumber: '', address: '', note: '' });
                alert('Khách hàng đã được lưu');
            } else {
                alert('Lỗi khi lưu khách hàng');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteCustomer = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa?')) return;
        try {
            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
            if (res.ok) await refreshData();
            else alert('Không thể xóa mục này.');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[600px]">
             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                 <Users className="w-6 h-6 text-blue-600"/> Quản Lý Khách Hàng
             </h2>

             <div className="flex flex-col md:flex-row gap-6">
                 {/* LEFT: LIST */}
                 <div className="flex-1">
                     <div className="mb-4 relative">
                         <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3"/>
                         <input 
                             type="text" 
                             placeholder="Tìm kiếm khách hàng..." 
                             className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                             value={searchTerm}
                             onChange={e => setSearchTerm(e.target.value)}
                         />
                     </div>
                     
                     <div className="overflow-hidden border rounded-lg">
                         <table className="w-full text-sm text-left">
                             <thead className="text-xs text-gray-700 bg-gray-50 uppercase">
                                 <tr>
                                     <th className="px-4 py-3">Tên Khách Hàng</th>
                                     <th className="px-4 py-3">SĐT</th>
                                     <th className="px-4 py-3 text-right">Thao tác</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100 bg-white">
                                 {customers
                                     .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phoneNumber && c.phoneNumber.includes(searchTerm)))
                                     .map(cust => (
                                     <tr key={cust.id} className="hover:bg-gray-50">
                                         <td className="px-4 py-3">
                                             <div className="font-medium text-gray-900">{cust.name}</div>
                                             <div className="text-xs text-gray-500">{cust.address}</div>
                                         </td>
                                         <td className="px-4 py-3 text-gray-500">{cust.phoneNumber}</td>
                                         <td className="px-4 py-3 text-right">
                                             <button onClick={() => deleteCustomer(cust.id)} className="text-red-500 hover:text-red-700 p-1">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                                 {customers.length === 0 && (
                                     <tr>
                                         <td colSpan="3" className="px-4 py-8 text-center text-gray-400">Chưa có khách hàng nào</td>
                                     </tr>
                                 )}
                             </tbody>
                         </table>
                     </div>
                 </div>

                 {/* RIGHT: FORM */}
                 <div className="w-full md:w-80">
                      <form onSubmit={saveCustomer} className="bg-gray-50 p-5 rounded-lg border sticky top-6">
                         <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                             <Plus className="w-4 h-4"/> Thêm khách hàng mới
                         </h3>
                         <div className="space-y-3">
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Họ và Tên</label>
                                 <input type="text" required className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newCustomer.name} 
                                        onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Số điện thoại</label>
                                 <input type="text" className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newCustomer.phoneNumber} 
                                        onChange={e => setNewCustomer({...newCustomer, phoneNumber: e.target.value})} />
                             </div>
                             <div>
                                 <label className="text-xs font-semibold text-gray-600">Địa chỉ</label>
                                 <input type="text" className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        value={newCustomer.address} 
                                        onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                             </div>
                              <div>
                                 <label className="text-xs font-semibold text-gray-600">Ghi chú</label>
                                 <textarea className="w-full mt-1 px-3 py-2 border rounded text-sm" rows="2"
                                        value={newCustomer.note} 
                                        onChange={e => setNewCustomer({...newCustomer, note: e.target.value})} />
                             </div>
                             <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm hover:bg-blue-700 mt-2">Lưu Khách Hàng</button>
                         </div>
                     </form>
                 </div>
             </div>
        </div>
    );
};

export default CustomerPage;
